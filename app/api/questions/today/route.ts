import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// ── DEV 목업 ──────────────────────────────────────────────────────────────
const DEV_QUESTION = {
  id:         null as string | null,
  content:    '가만히 눈을 감고 아이의 보드라운 털끝이나 말랑한 발바닥의 감촉을 떠올려본다면 어떤 느낌인가요?',
  category:   '감각의 기억',
  hintText:   null as string | null,
  restGuide:  null as string | null,
  isRest:     false,
  week:       1,
  day:        3,
  orderIndex: 3,
  weekGuide:  { keyword: '머무름', title: '익숙한 온기 속에서' },
  fromDb:     false,
}

// ── GET /api/questions/today ───────────────────────────────────────────────
export async function GET() {
  try {
    // DEV 우회
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return NextResponse.json(DEV_QUESTION)
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 유저 → 활성 펫 조회
    const dbUser = await prisma.user.findUnique({
      where:  { id: user.id },
      select: { activePetId: true },
    })
    if (!dbUser?.activePetId) return NextResponse.json({ error: 'No active pet' }, { status: 404 })

    const pet = await prisma.pet.findUnique({
      where:  { id: dbUser.activePetId },
      select: { id: true, name: true },
    })
    if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

    // 현재 여정 진행 상태
    const journey = await prisma.journeyProgress.findUnique({
      where:  { petId: pet.id },
      select: { currentWeek: true, currentDay: true },
    })
    const currentWeek = journey?.currentWeek ?? 1
    const completedCount = journey?.currentDay ?? 0  // 이번 주 완료한 비쉼표 문항 수

    // 이번 주 이미 답변한 questionId 목록
    const answeredLetters = await prisma.letter.findMany({
      where:  { petId: pet.id, week: currentWeek, questionId: { not: null } },
      select: { questionId: true },
    })
    const answeredIds = answeredLetters.map(l => l.questionId!)

    // 미답변 비쉼표 질문 중 orderIndex 가장 작은 것
    const nextQuestion = await prisma.question.findFirst({
      where: {
        week:   currentWeek,
        isRest: false,
        ...(answeredIds.length > 0 ? { id: { notIn: answeredIds } } : {}),
      },
      orderBy: { orderIndex: 'asc' },
    })

    // 이번 주 주차 안내문
    const weekGuide = await prisma.weekGuide.findUnique({
      where:  { week: currentWeek },
      select: { keyword: true, title: true },
    })

    // 미답변 일반 질문 없음 → 쉼표 질문 반환
    if (!nextQuestion) {
      const restQuestion = await prisma.question.findFirst({
        where:   { week: currentWeek, isRest: true },
        orderBy: { orderIndex: 'asc' },
      })
      return NextResponse.json({
        id:        restQuestion?.id ?? null,
        content:   restQuestion?.content ?? null,
        category:  restQuestion?.category ?? null,
        hintText:  restQuestion?.hintText ?? null,
        restGuide: restQuestion?.restGuide ?? null,
        isRest:    true,
        week:      currentWeek,
        day:       restQuestion?.day ?? 7,
        orderIndex: restQuestion?.orderIndex ?? null,
        weekGuide,
        fromDb:    !!restQuestion,
      })
    }

    // 일반 질문 반환 (petName 치환)
    const content = nextQuestion.content.replace(/\{petName\}/g, pet.name)

    return NextResponse.json({
      id:        nextQuestion.id,
      content,
      category:  nextQuestion.category,
      hintText:  nextQuestion.hintText,
      restGuide: null,
      isRest:    false,
      week:      currentWeek,
      day:       nextQuestion.day,
      orderIndex: nextQuestion.orderIndex,
      completedCount,
      weekGuide,
      fromDb:    true,
    })
  } catch (err) {
    console.error('[GET /api/questions/today]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
