import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ── DEV 목업 질문 풀 (질문 바꾸기 순환용) ─────────────────────────────────
const DEV_QUESTIONS = [
  {
    id:         'dev-q-1',
    content:    '가만히 눈을 감고 아이의 보드라운 털끝이나 말랑한 발바닥의 감촉을 떠올려본다면 어떤 느낌인가요?',
    category:   '감각의 기억',
    hintText:   null as string | null,
    restGuide:  null as string | null,
    isRest:     false,
    week:       1,
    day:        1,
    orderIndex: 1,
    weekGuide:  { keyword: '머무름', title: '익숙한 온기 속에서' },
    fromDb:     false,
  },
  {
    id:         'dev-q-2',
    content:    '아이가 가장 좋아했던 간식이나 장난감이 있었나요? 그것을 주었을 때 아이의 반응이 떠오르나요?',
    category:   '우리가 처음 자석처럼 끌린 날',
    hintText:   '아주 사소한 것도 괜찮아요.' as string | null,
    restGuide:  null as string | null,
    isRest:     false,
    week:       1,
    day:        2,
    orderIndex: 2,
    weekGuide:  { keyword: '머무름', title: '익숙한 온기 속에서' },
    fromDb:     false,
  },
  {
    id:         'dev-q-3',
    content:    '아이와 함께했던 아침 풍경을 떠올려보세요. 눈을 뜨면 아이는 어디에 있었나요?',
    category:   '일상의 조각',
    hintText:   null as string | null,
    restGuide:  null as string | null,
    isRest:     false,
    week:       1,
    day:        3,
    orderIndex: 3,
    weekGuide:  { keyword: '머무름', title: '익숙한 온기 속에서' },
    fromDb:     false,
  },
]

// ── GET /api/questions/today ───────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const excludeId  = searchParams.get('excludeId')
    const questionId = searchParams.get('questionId')  // 특정 질문 직접 조회
    const randomWeek = searchParams.get('randomWeek')  // 해당 week 랜덤 조회 (질문 바꾸기)

    // DEV 우회 — 인증 없이 DB에서 직접 조회
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      // 특정 questionId 직접 조회
      if (questionId) {
        const q = await prisma.question.findUnique({
          where: { id: questionId },
          select: { id: true, content: true, category: true, hintText: true, isRest: true, week: true, day: true, orderIndex: true, restGuide: true },
        })
        if (q) {
          const weekGuide = await prisma.weekGuide.findUnique({ where: { week: q.week }, select: { keyword: true, title: true } })
          return NextResponse.json({ ...q, weekGuide, fromDb: true })
        }
      }

      // 질문 바꾸기: randomWeek 기준 전체 7개에서 랜덤 (현재 포함, 중복 가능)
      if (randomWeek) {
        const targetWeek = parseInt(randomWeek)
        const candidates = await prisma.question.findMany({
          where: { week: targetWeek },
          select: { id: true, content: true, category: true, hintText: true, isRest: true, week: true, day: true, orderIndex: true, restGuide: true },
        })
        const pick = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null
        if (pick) {
          const weekGuide = await prisma.weekGuide.findUnique({ where: { week: pick.week }, select: { keyword: true, title: true } })
          return NextResponse.json({ ...pick, weekGuide, fromDb: true })
        }
        return NextResponse.json(DEV_QUESTIONS[0])
      }

      // 직접 진입: 현재 주차 미완료 질문 순서대로
      const devPet = await prisma.pet.findFirst({ select: { id: true } })
      const devJourney = devPet
        ? await prisma.journeyProgress.findUnique({ where: { petId: devPet.id }, select: { currentWeek: true } })
        : null
      const devWeek = devJourney?.currentWeek ?? 1
      const devAnswered = devPet
        ? (await prisma.letter.findMany({ where: { petId: devPet.id, week: devWeek, questionId: { not: null } }, select: { questionId: true } })).map(l => l.questionId!)
        : []
      const devNext = await prisma.question.findFirst({
        where: {
          week: devWeek,
          ...(devAnswered.length > 0 ? { id: { notIn: devAnswered } } : {}),
        },
        orderBy: { orderIndex: 'asc' },
        select: { id: true, content: true, category: true, hintText: true, isRest: true, week: true, day: true, orderIndex: true, restGuide: true },
      })
      if (devNext) {
        const weekGuide = await prisma.weekGuide.findUnique({ where: { week: devNext.week }, select: { keyword: true, title: true } })
        return NextResponse.json({ ...devNext, weekGuide, fromDb: true, allAnswered: false })
      }
      // 이번 주 질문 모두 완료 → day1 (orderIndex 최소) 기본 반환
      const devFirstQ = await prisma.question.findFirst({
        where: { week: devWeek },
        orderBy: { orderIndex: 'asc' },
        select: { id: true, content: true, category: true, hintText: true, isRest: true, week: true, day: true, orderIndex: true, restGuide: true },
      })
      if (devFirstQ) {
        const weekGuide = await prisma.weekGuide.findUnique({ where: { week: devFirstQ.week }, select: { keyword: true, title: true } })
        return NextResponse.json({ ...devFirstQ, weekGuide, fromDb: true, allAnswered: true })
      }
      return NextResponse.json({ allAnswered: true, week: devWeek })
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

    // questionId 직접 지정 시 해당 질문 바로 반환
    if (questionId) {
      const q = await prisma.question.findUnique({
        where: { id: questionId },
        select: { id: true, content: true, category: true, hintText: true, isRest: true, week: true, day: true, orderIndex: true, restGuide: true },
      })
      if (q) {
        const weekGuide = await prisma.weekGuide.findUnique({ where: { week: q.week }, select: { keyword: true, title: true } })
        const content = q.content.replace(/\{petName\}/g, pet.name)
        return NextResponse.json({ ...q, content, weekGuide, fromDb: true })
      }
    }

    // randomWeek 지정 시 해당 week 전체에서 랜덤 반환 (질문 바꾸기)
    if (randomWeek) {
      const targetWeek = parseInt(randomWeek)
      const candidates = await prisma.question.findMany({
        where: { week: targetWeek },
        select: { id: true, content: true, category: true, hintText: true, isRest: true, week: true, day: true, orderIndex: true, restGuide: true },
      })
      const pick = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null
      if (pick) {
        const weekGuide = await prisma.weekGuide.findUnique({ where: { week: pick.week }, select: { keyword: true, title: true } })
        const content = pick.content.replace(/\{petName\}/g, pet.name)
        return NextResponse.json({ ...pick, content, weekGuide, fromDb: true })
      }
    }

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

    // 미답변 질문 중 orderIndex 가장 작은 것 (쉼표 포함 전체)
    const nextQuestion = await prisma.question.findFirst({
      where: {
        week: currentWeek,
        ...(answeredIds.length > 0 ? { id: { notIn: answeredIds } } : {}),
      },
      orderBy: { orderIndex: 'asc' },
    })

    // 이번 주 주차 안내문
    const weekGuide = await prisma.weekGuide.findUnique({
      where:  { week: currentWeek },
      select: { keyword: true, title: true },
    })

    // 이번 주 질문 모두 완료 → day1 기본 반환 (allAnswered: true 포함)
    if (!nextQuestion) {
      const firstQuestion = await prisma.question.findFirst({
        where: { week: currentWeek },
        orderBy: { orderIndex: 'asc' },
      })
      if (firstQuestion) {
        const firstContent = firstQuestion.content.replace(/\{petName\}/g, pet.name)
        return NextResponse.json({
          id:         firstQuestion.id,
          content:    firstContent,
          category:   firstQuestion.category,
          hintText:   firstQuestion.hintText,
          restGuide:  null,
          isRest:     false,
          week:       currentWeek,
          day:        firstQuestion.day,
          orderIndex: firstQuestion.orderIndex,
          completedCount,
          weekGuide,
          fromDb:     true,
          allAnswered: true,
        })
      }
      return NextResponse.json({ allAnswered: true, week: currentWeek })
    }

    // 미답변 질문 반환 (petName 치환)
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
