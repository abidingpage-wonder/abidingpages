import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/journey — 여정 진행 현황
export async function GET() {
  // DEV 우회
  if (process.env.DEV_BYPASS_AUTH === 'true') {
    return NextResponse.json({
      currentStage: 1,
      currentWeek: 1,
      currentDay: 2,         // 이번 주 완료 문항 수
      totalLetters: 3,
      totalMinutes: 50,
      totalDays: 3,          // 전체 진행일 (progress bar용)
      emotionCount: 3,       // 감정 기록 수
      nextStageAvailable: false,
    })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { activePetId: true },
    })
    if (!dbUser?.activePetId) return NextResponse.json({ error: 'No active pet' }, { status: 404 })

    const progress = await prisma.journeyProgress.findUnique({
      where: { petId: dbUser.activePetId },
    })

    // 감정 기록 수
    const emotionCount = await prisma.letter.count({
      where: { petId: dbUser.activePetId, emotionTag: { not: null } },
    })

    // 전체 진행일 = 총 편지 수 (1편지 = 1일)
    const totalDays = Math.min(progress?.totalLetters ?? 0, 49)

    return NextResponse.json({
      currentStage: progress?.currentStage ?? 1,
      currentWeek: progress?.currentWeek ?? 1,
      currentDay: progress?.currentDay ?? 0,
      totalLetters: progress?.totalLetters ?? 0,
      totalMinutes: progress?.totalMinutes ?? 0,
      totalDays,
      emotionCount,
      nextStageAvailable: progress?.nextStageAvailable ?? false,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
