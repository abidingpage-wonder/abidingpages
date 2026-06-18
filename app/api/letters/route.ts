import { NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUniqueCount, getNonRestCount, WEEK_UNLOCK_THRESHOLD, WEEK_TOTAL, MAX_WEEK } from '@/lib/journey'
import { detectCrisis } from '@/lib/ai/crisisDetector'

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

// AI 답장 생성(generate-reply) 백그라운드 트리거.
// crisis 편지도 호출 — Edge Function이 위기 안내 답장을 생성한다.
function triggerGenerateReply(accessToken: string, letterId: string) {
  after(async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-reply`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey':        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ letterId }),
      })
    } catch (e) {
      console.error('[POST /api/letters] generate-reply trigger failed:', e)
    }
  })
}

// 편지의 week/day/stage 결정: questionId가 있으면 그 질문의 실제 주차 기준, 없으면(자유글) 현재 주차 기준
async function resolveLetterLocation(
  questionId: string | null,
  currentWeek: number,
  currentDay: number,
  currentStage: number,
) {
  if (questionId) {
    const q = await prisma.question.findUnique({
      where: { id: questionId },
      select: { week: true, day: true },
    })
    if (q) return { week: q.week, day: q.day, stage: q.week }
  }
  return { week: currentWeek, day: currentDay + 1, stage: currentStage }
}

// 중복 시 진행도 변경 없이 현재 상태 플래그만 반환
async function progressSnapshot(petId: string, currentWeek: number, letterId: string) {
  const uniqueCount = await getUniqueCount(petId, currentWeek)
  return {
    id: letterId,
    uniqueCount,
    weekAllDone:      uniqueCount >= WEEK_TOTAL,
    journeyCompleted: currentWeek === MAX_WEEK && uniqueCount >= WEEK_TOTAL,
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

      // 동일 questionId 이미 정상 제출 → 재작성 불가
      if (questionId) {
        const existing = await prisma.letter.findFirst({
          where: { petId: devPet.id, questionId, letterStatus: 'normal' },
          select: { id: true },
        })
        if (existing) return NextResponse.json({ error: 'already_answered' }, { status: 409 })
      }

      // 제출 시점 Crisis 감지 — 편지 생성 전에 확인해 letterStatus를 정확히 세팅
      const devCrisis = detectCrisis(devContent)

      const prevUniqueCount = await getUniqueCount(devPet.id, currentWeek)
      const devLoc = await resolveLetterLocation(questionId ?? null, currentWeek, currentDay, stage)

      const letter = await prisma.letter.create({
        data: {
          userId: devPet.userId, petId: devPet.id,
          content: devContent, stage: devLoc.stage, week: devLoc.week, day: devLoc.day,
          imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
          letterStatus: devCrisis.isCrisis ? 'crisis_held' : 'normal',
          ...(questionId ? { questionId } : {}),
          ...(emotionTag ? { emotionTag } : {}),
        },
      })

      if (devCrisis.isCrisis) {
        try {
          await prisma.replySafetyEvent.create({
            data: { letterId: letter.id, userId: devPet.userId, petId: devPet.id, eventType: 'crisis_detected', detail: devCrisis.reason },
          })
        } catch (e) { console.error('[POST /api/letters dev] safety event log failed:', e) }
        // crisis 편지는 여정 진행률 미반영 — 현재 상태 스냅샷으로 반환
        return NextResponse.json({ status: 'crisis_detected', ...await progressSnapshot(devPet.id, currentWeek, letter.id) })
      }

      const devProgress = await calcProgress(devPet.id, devPet.userId, currentWeek, currentDay, letter.id, prevUniqueCount)
      return NextResponse.json(devProgress)
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

    // 동일 questionId 이미 정상 제출 → 재작성 불가
    if (questionId) {
      const existing = await prisma.letter.findFirst({
        where: { petId, questionId, letterStatus: 'normal' },
        select: { id: true },
      })
      if (existing) return NextResponse.json({ error: 'already_answered' }, { status: 409 })
    }

    // ── 제출 시점 Crisis 감지 — 편지 생성 전에 확인해 letterStatus를 정확히 세팅
    const crisis = detectCrisis(trimmedContent)

    const prevUniqueCount = await getUniqueCount(petId, currentWeek)
    const loc = await resolveLetterLocation(questionId ?? null, currentWeek, currentDay, stage)

    const letter = await prisma.letter.create({
      data: {
        userId: user.id, petId,
        content: trimmedContent, stage: loc.stage, week: loc.week, day: loc.day,
        imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
        letterStatus: crisis.isCrisis ? 'crisis_held' : 'normal',
        ...(questionId ? { questionId } : {}),
        ...(emotionTag ? { emotionTag } : {}),
      },
    })

    if (crisis.isCrisis) {
      try {
        await prisma.replySafetyEvent.create({
          data: { letterId: letter.id, userId: user.id, petId, eventType: 'crisis_detected', detail: crisis.reason },
        })
      } catch (e) { console.error('[POST /api/letters] safety event log failed:', e) }
      // crisis 편지: 여정 진행률 미반영. 단, 위기 안내 답장은 생성(generate-reply가 처리).
      const { data: { session } } = await supabase.auth.getSession()
      if (session) triggerGenerateReply(session.access_token, letter.id)
      return NextResponse.json({ status: 'crisis_detected', ...await progressSnapshot(petId, currentWeek, letter.id) })
    }

    const progress = await calcProgress(petId, user.id, currentWeek, currentDay, letter.id, prevUniqueCount)

    // AI 답장 생성 — 응답 반환 후 백그라운드에서 트리거 (모달/페이지 이동과 무관하게 항상 실행)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) triggerGenerateReply(session.access_token, letter.id)

    return NextResponse.json(progress)

  } catch (err) {
    console.error('[POST /api/letters]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── 공통 진행률 계산 (저장 후) ────────────────────────────────────────────
async function calcProgress(petId: string, userId: string, currentWeek: number, currentDay: number, letterId: string, prevUniqueCount: number) {
  const [uniqueCount, nonRestCount] = await Promise.all([
    getUniqueCount(petId, currentWeek),    // 쉼표 포함 전체 (0~7)
    getNonRestCount(petId, currentWeek),   // 비쉼표만 (0~6)
  ])
  const isNewAnswer = uniqueCount > prevUniqueCount

  const weekAllDone      = uniqueCount >= WEEK_TOTAL   // 7개 (쉼표 포함) 완료
  const journeyCompleted = currentWeek === MAX_WEEK && weekAllDone

  // 비쉼표 3번째 달성 시 → 다음 주차 잠금 해제
  const justUnlockedNext = isNewAnswer && nonRestCount === WEEK_UNLOCK_THRESHOLD && currentWeek < MAX_WEEK

  if (weekAllDone && currentWeek < MAX_WEEK) {
    // 7개 모두 완료 → 다음 주차로 자동 진행
    await prisma.journeyProgress.upsert({
      where:  { petId },
      update: { currentWeek: currentWeek + 1, currentStage: { increment: 1 }, currentDay: 0, weekUnlocked: false, totalLetters: { increment: 1 } },
      create: { userId, petId, currentWeek: currentWeek + 1, currentStage: 2, currentDay: 0, weekUnlocked: false, totalLetters: 1 },
    })
  } else {
    await prisma.journeyProgress.upsert({
      where:  { petId },
      update: {
        currentDay: uniqueCount,
        totalLetters: { increment: 1 },
        ...(justUnlockedNext ? { weekUnlocked: true } : {}),
        ...(journeyCompleted ? { completedAt: new Date() } : {}),
      },
      create: { userId, petId, currentWeek: 1, currentDay: uniqueCount, weekUnlocked: justUnlockedNext, totalLetters: 1 },
    })
  }

  return { id: letterId, uniqueCount, weekAllDone, journeyCompleted, currentWeek, isNewAnswer }
}
