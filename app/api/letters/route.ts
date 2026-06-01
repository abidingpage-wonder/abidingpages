import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// 3문항 완료 시 다음 주차로 진행
const WEEK_ADVANCE_THRESHOLD = 3
const MAX_WEEK = 7

// ── POST /api/letters ──────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content, questionId, emotionTag } = await req.json()
    if (!content?.trim()) {
      return NextResponse.json({ error: 'content required' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where:  { id: user.id },
      select: { activePetId: true },
    })
    if (!dbUser?.activePetId) return NextResponse.json({ error: 'No active pet' }, { status: 404 })

    const petId = dbUser.activePetId

    // 현재 여정 상태
    const journey = await prisma.journeyProgress.findUnique({
      where:  { petId },
      select: { currentStage: true, currentWeek: true, currentDay: true, totalLetters: true },
    })
    const stage       = journey?.currentStage ?? 1
    const currentWeek = journey?.currentWeek  ?? 1
    const currentDay  = journey?.currentDay   ?? 0

    // 편지 저장
    const letter = await prisma.letter.create({
      data: {
        userId:    user.id,
        petId,
        content:   content.trim(),
        stage,
        week:      currentWeek,
        day:       currentDay + 1,  // 표시용 일차 (1-based)
        imageUrls: [],
        ...(questionId ? { questionId } : {}),
        ...(emotionTag ? { emotionTag } : {}),
      },
    })

    // ── 주차 진행 로직 ──────────────────────────────────────────────────
    // 이번 주 완료한 비쉼표 문항 수 (방금 저장한 편지 포함)
    const weekLetterCount = await prisma.letter.count({
      where: {
        petId,
        week:       currentWeek,
        questionId: { not: null },
      },
    })

    let weekAdvanced     = false
    let journeyCompleted = false

    if (weekLetterCount >= WEEK_ADVANCE_THRESHOLD) {
      if (currentWeek < MAX_WEEK) {
        // 다음 주차로 이동
        await prisma.journeyProgress.upsert({
          where:  { petId },
          update: {
            currentWeek:  currentWeek + 1,
            currentDay:   0,
            currentStage: currentWeek + 1,  // stage = week
            totalLetters: { increment: 1 },
          },
          create: {
            userId:      user.id,
            petId,
            currentWeek: 2,
            currentDay:  0,
            totalLetters: 1,
          },
        })
        weekAdvanced = true
      } else {
        // 7주차 완료
        await prisma.journeyProgress.upsert({
          where:  { petId },
          update: {
            currentDay:   weekLetterCount,
            totalLetters: { increment: 1 },
            completedAt:  new Date(),
          },
          create: {
            userId:      user.id,
            petId,
            currentWeek: MAX_WEEK,
            currentDay:  weekLetterCount,
            totalLetters: 1,
            completedAt: new Date(),
          },
        })
        journeyCompleted = true
      }
    } else {
      // 아직 임계값 미달 — currentDay(완료수)만 업데이트
      await prisma.journeyProgress.upsert({
        where:  { petId },
        update: {
          currentDay:   weekLetterCount,
          totalLetters: { increment: 1 },
        },
        create: {
          userId:      user.id,
          petId,
          currentWeek: 1,
          currentDay:  weekLetterCount,
          totalLetters: 1,
        },
      })
    }

    return NextResponse.json({
      id:              letter.id,
      weekAdvanced,
      journeyCompleted,
      weekLetterCount,
    })
  } catch (err) {
    console.error('[POST /api/letters]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
