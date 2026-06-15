import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { WEEK_TOTAL_NON_REST } from '@/lib/journey'

// 비쉼표 질문 6개를 모두 답한 주차 목록 (여정 카드 완료 표시용)
async function computeCompletedWeeks(petId: string): Promise<number[]> {
  const [letters, restQ] = await Promise.all([
    prisma.letter.findMany({ where: { petId, questionId: { not: null } }, select: { week: true, questionId: true } }),
    prisma.question.findMany({ where: { isRest: true }, select: { id: true } }),
  ])
  const restIds = new Set(restQ.map(q => q.id))
  const byWeek = new Map<number, Set<string>>()
  for (const l of letters) {
    if (!l.questionId || restIds.has(l.questionId)) continue
    if (!byWeek.has(l.week)) byWeek.set(l.week, new Set())
    byWeek.get(l.week)!.add(l.questionId)
  }
  const out: number[] = []
  for (const [week, set] of byWeek) if (set.size >= WEEK_TOTAL_NON_REST) out.push(week)
  return out.sort((a, b) => a - b)
}

// ── 헬퍼: 편지 날짜(KST) 기준 최장 연속 일수 ──────────────────────
function calcLongestStreak(letterDates: Date[]): number {
  if (letterDates.length === 0) return 0
  const toKSTDay = (d: Date) => {
    const k = new Date(d.getTime() + 9 * 60 * 60 * 1000)
    return `${k.getUTCFullYear()}-${String(k.getUTCMonth()+1).padStart(2,'0')}-${String(k.getUTCDate()).padStart(2,'0')}`
  }
  const days = [...new Set(letterDates.map(toKSTDay))].sort()
  let longest = 1, current = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]).getTime()
    const curr = new Date(days[i]).getTime()
    if (curr - prev === 86400000) { current++; longest = Math.max(longest, current) }
    else current = 1
  }
  return longest
}

// 주차 키워드/테마 (여정 카드용)
async function fetchWeekGuides() {
  const guides = await prisma.weekGuide.findMany({
    orderBy: { week: 'asc' },
    select: { week: true, keyword: true, title: true },
  })
  return guides
}

// GET /api/journey — 여정 진행 현황
export async function GET() {
  // DEV 우회 — 진행 상태(currentWeek/완료주차)는 실제 DB 반영, 통계는 mock
  if (process.env.DEV_BYPASS_AUTH === 'true') {
    const weekGuides = await fetchWeekGuides()
    const devPet = await prisma.pet.findFirst({ select: { id: true } })
    const progress = devPet
      ? await prisma.journeyProgress.findUnique({ where: { petId: devPet.id }, select: { currentStage: true, currentWeek: true, currentDay: true } })
      : null
    const completedWeeks = devPet ? await computeCompletedWeeks(devPet.id) : []
    return NextResponse.json({
      currentStage: progress?.currentStage ?? 1,
      currentWeek: progress?.currentWeek ?? 1,
      currentDay: progress?.currentDay ?? 2,
      letterCount: 3,        // 보낸 편지 전체 (mock)
      totalDays: 3,          // progress bar용 (mock)
      emotionCount: 3,       // 날짜 중복 제거 (mock)
      longestStreak: 3,      // 최장 연속 일수 (mock)
      nextStageAvailable: false,
      weekGuides,
      completedWeeks,
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

    const petId = dbUser.activePetId

    const [progress, emotionDays, letters, weekGuides, completedWeeks] = await Promise.all([
      prisma.journeyProgress.findUnique({ where: { petId } }),
      // 감정기록: 날짜 중복 제거 (loggedAt이 Date 타입이므로 groupBy로 distinct)
      prisma.emotionLog.groupBy({ by: ['loggedAt'], where: { petId } }),
      // 편지 날짜 목록 (최장 연속 계산용)
      prisma.letter.findMany({ where: { petId, userId: user.id }, select: { createdAt: true } }),
      fetchWeekGuides(),
      computeCompletedWeeks(petId),
    ])

    const emotionCount = emotionDays.length
    const letterCount = letters.length
    const longestStreak = calcLongestStreak(letters.map(l => l.createdAt))
    const totalDays = Math.min(progress?.totalLetters ?? 0, 49)

    return NextResponse.json({
      currentStage: progress?.currentStage ?? 1,
      currentWeek: progress?.currentWeek ?? 1,
      currentDay: progress?.currentDay ?? 0,
      letterCount,
      totalDays,
      emotionCount,
      longestStreak,
      nextStageAvailable: progress?.nextStageAvailable ?? false,
      weekGuides,
      completedWeeks,
    }, { headers: { 'Cache-Control': 'private, max-age=60' } })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
