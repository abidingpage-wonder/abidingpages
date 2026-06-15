import { NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUniqueNonRestCount, WEEK_UNLOCK_THRESHOLD, WEEK_TOTAL_NON_REST, MAX_WEEK } from '@/lib/journey'

const DEDUPE_WINDOW_MS = 60_000  // 동일 내용 재전송 무시 윈도우 (더블탭/모달 후 재전송 방지)

// 최근 60초 내 동일 내용·동일 질문 편지 조회 (있으면 중복 전송으로 간주)
async function findRecentDuplicate(petId: string, content: string, questionId: string | null) {
  return prisma.letter.findFirst({
    where: {
      petId,
      content,
      questionId,
      createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
    },
    select: { id: true },
  })
}

// 중복 시 진행도 변경 없이 현재 상태 플래그만 반환
async function progressSnapshot(petId: string, currentWeek: number, letterId: string) {
  const uniqueCount = await getUniqueNonRestCount(petId, currentWeek)
  return {
    id: letterId,
    uniqueCount,
    weekUnlockable:   uniqueCount >= WEEK_UNLOCK_THRESHOLD && currentWeek < MAX_WEEK,
    weekAllDone:      uniqueCount >= WEEK_TOTAL_NON_REST,
    journeyCompleted: currentWeek === MAX_WEEK && uniqueCount >= WEEK_TOTAL_NON_REST,
    currentWeek,
    isNewAnswer: false,
  }
}

// ── POST /api/letters ──────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { content, questionId, emotionTag, imageUrls, letterType: rawLetterType } = await req.json()
    const isCommaAuto = rawLetterType === 'comma_auto' || rawLetterType === 'long'
    if (!isCommaAuto && !content?.trim()) {
      return NextResponse.json({ error: 'content required' }, { status: 400 })
    }
    // letterType: schema에 정의됐으나 DB 마이그레이션 전 — 추후 적용 예정
    // const letterType = rawLetterType ?? 'normal'

    // ── DEV 우회 ─────────────────────────────────────────────────────
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const devPet = await prisma.pet.findFirst({ select: { id: true, userId: true } })
      if (!devPet) return NextResponse.json({ id: 'dev-letter-id', uniqueCount: 1, weekUnlockable: false, weekAllDone: false, journeyCompleted: false, currentWeek: 1, isNewAnswer: true })

      const devJourney = await prisma.journeyProgress.findUnique({
        where: { petId: devPet.id },
        select: { currentStage: true, currentWeek: true, currentDay: true, totalLetters: true },
      })
      const stage       = devJourney?.currentStage ?? 1
      const currentWeek = devJourney?.currentWeek  ?? 1
      const currentDay  = devJourney?.currentDay   ?? 0

      const devContent = (content ?? '').trim()
      const devDup = await findRecentDuplicate(devPet.id, devContent, questionId ?? null)
      if (devDup) return NextResponse.json(await progressSnapshot(devPet.id, currentWeek, devDup.id))

      const prevUniqueCount = await getUniqueNonRestCount(devPet.id, currentWeek)

      const letter = await prisma.letter.create({
        data: {
          userId: devPet.userId, petId: devPet.id,
          content: devContent, stage, week: currentWeek, day: currentDay + 1,
          imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
          ...(questionId ? { questionId } : {}),
          ...(emotionTag ? { emotionTag } : {}),
        },
      })

      return NextResponse.json(await calcProgress(devPet.id, devPet.userId, currentWeek, currentDay, letter.id, prevUniqueCount))
    }

    // ── 인증 경로 ─────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }, select: { activePetId: true },
    })
    if (!dbUser?.activePetId) return NextResponse.json({ error: 'No active pet' }, { status: 404 })

    const petId = dbUser.activePetId
    const journey = await prisma.journeyProgress.findUnique({
      where: { petId }, select: { currentStage: true, currentWeek: true, currentDay: true, totalLetters: true },
    })
    const stage       = journey?.currentStage ?? 1
    const currentWeek = journey?.currentWeek  ?? 1
    const currentDay  = journey?.currentDay   ?? 0

    const trimmedContent = (content ?? '').trim()
    const dup = await findRecentDuplicate(petId, trimmedContent, questionId ?? null)
    if (dup) return NextResponse.json(await progressSnapshot(petId, currentWeek, dup.id))

    const prevUniqueCount = await getUniqueNonRestCount(petId, currentWeek)

    const letter = await prisma.letter.create({
      data: {
        userId: user.id, petId,
        content: trimmedContent, stage, week: currentWeek, day: currentDay + 1,
        imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
        ...(questionId ? { questionId } : {}),
        ...(emotionTag ? { emotionTag } : {}),
      },
    })

    // AI 답장 생성 — 응답 반환 후 백그라운드에서 트리거 (모달/페이지 이동과 무관하게 항상 실행)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const accessToken = session.access_token
      after(async () => {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-reply`, {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'apikey':        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            },
            body: JSON.stringify({ letterId: letter.id }),
          })
        } catch (e) {
          console.error('[POST /api/letters] generate-reply trigger failed:', e)
        }
      })
    }

    return NextResponse.json(await calcProgress(petId, user.id, currentWeek, currentDay, letter.id, prevUniqueCount))

  } catch (err) {
    console.error('[POST /api/letters]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── 공통 진행률 계산 (저장 후) ────────────────────────────────────────────
async function calcProgress(petId: string, userId: string, currentWeek: number, currentDay: number, letterId: string, prevUniqueCount: number) {
  const uniqueCount = await getUniqueNonRestCount(petId, currentWeek)
  const isNewAnswer = uniqueCount > prevUniqueCount  // 이번 편지로 새 질문이 추가됐는지

  const weekUnlockable   = uniqueCount >= WEEK_UNLOCK_THRESHOLD && currentWeek < MAX_WEEK
  const weekAllDone      = uniqueCount >= WEEK_TOTAL_NON_REST
  const journeyCompleted = currentWeek === MAX_WEEK && weekAllDone

  if (weekAllDone && currentWeek < MAX_WEEK) {
    // 이번 주 6개 모두 완료 → 다음 주차로 자동 진행
    await prisma.journeyProgress.upsert({
      where:  { petId },
      update: { currentWeek: currentWeek + 1, currentStage: { increment: 1 }, currentDay: 0, totalLetters: { increment: 1 } },
      create: { userId, petId, currentWeek: currentWeek + 1, currentStage: 2, currentDay: 0, totalLetters: 1 },
    })
  } else {
    await prisma.journeyProgress.upsert({
      where:  { petId },
      update: {
        currentDay: uniqueCount,
        totalLetters: { increment: 1 },
        ...(journeyCompleted ? { completedAt: new Date() } : {}),
      },
      create: { userId, petId, currentWeek: 1, currentDay: uniqueCount, totalLetters: 1 },
    })
  }

  return { id: letterId, uniqueCount, weekUnlockable, weekAllDone, journeyCompleted, currentWeek, isNewAnswer }
}
