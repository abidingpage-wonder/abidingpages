import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const WEEK_UNLOCK_THRESHOLD = 3  // 고유 비쉼표 질문 3개 완료 시 다음 주차 잠금 해제 가능
const WEEK_TOTAL_NON_REST   = 6  // 주당 비쉼표 질문 수 (7일 중 쉼표 1개 제외)
const MAX_WEEK              = 7

// ── POST /api/letters ──────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { content, questionId, emotionTag, imageUrls, letterType: rawLetterType } = await req.json()
    const isCommaAuto = rawLetterType === 'comma_auto' || rawLetterType === 'long'
    if (!isCommaAuto && !content?.trim()) {
      return NextResponse.json({ error: 'content required' }, { status: 400 })
    }
    const letterType = rawLetterType ?? 'normal'

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

      const prevUniqueCount = await getUniqueNonRestCount(devPet.id, currentWeek)

      const letter = await prisma.letter.create({
        data: {
          userId: devPet.userId, petId: devPet.id,
          content: (content ?? '').trim(), stage, week: currentWeek, day: currentDay + 1,
          letterType, imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
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

    const prevUniqueCount = await getUniqueNonRestCount(petId, currentWeek)

    const letter = await prisma.letter.create({
      data: {
        userId: user.id, petId,
        content: (content ?? '').trim(), stage, week: currentWeek, day: currentDay + 1,
        letterType, imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
        ...(questionId ? { questionId } : {}),
        ...(emotionTag ? { emotionTag } : {}),
      },
    })

    return NextResponse.json(await calcProgress(petId, user.id, currentWeek, currentDay, letter.id, prevUniqueCount))

  } catch (err) {
    console.error('[POST /api/letters]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── 이번 주 고유 비쉼표 완료 수 조회 ──────────────────────────────────────
async function getUniqueNonRestCount(petId: string, week: number): Promise<number> {
  const letters = await prisma.letter.findMany({
    where: { petId, week, questionId: { not: null } },
    select: { questionId: true },
  })
  const restIds = new Set(
    (await prisma.question.findMany({ where: { week, isRest: true }, select: { id: true } })).map(q => q.id)
  )
  return new Set(letters.map(l => l.questionId!).filter(id => !restIds.has(id))).size
}

// ── 공통 진행률 계산 (저장 후) ────────────────────────────────────────────
async function calcProgress(petId: string, userId: string, currentWeek: number, currentDay: number, letterId: string, prevUniqueCount: number) {
  const uniqueCount = await getUniqueNonRestCount(petId, currentWeek)
  const isNewAnswer = uniqueCount > prevUniqueCount  // 이번 편지로 새 질문이 추가됐는지

  const weekUnlockable   = uniqueCount >= WEEK_UNLOCK_THRESHOLD && currentWeek < MAX_WEEK
  const weekAllDone      = uniqueCount >= WEEK_TOTAL_NON_REST
  const journeyCompleted = currentWeek === MAX_WEEK && weekAllDone

  await prisma.journeyProgress.upsert({
    where:  { petId },
    update: { currentDay: uniqueCount, totalLetters: { increment: 1 } },
    create: { userId, petId, currentWeek: 1, currentDay: uniqueCount, totalLetters: 1 },
  })

  // 비쉼표 질문 3개 완료 시 포토카드 생성 (처음 한 번만)
  if (uniqueCount === WEEK_UNLOCK_THRESHOLD && isNewAnswer) {
    const existing = await prisma.photoCard.findFirst({ where: { petId, stage: currentWeek } })
    if (!existing) {
      await prisma.photoCard.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          petId,
          stage: currentWeek,
          imageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/abiding-pages/photo-cards/week-${currentWeek}.png`,
          createdAt: new Date(),
        },
      })
    }
  }

  return { id: letterId, uniqueCount, weekUnlockable, weekAllDone, journeyCompleted, currentWeek, isNewAnswer }
}
