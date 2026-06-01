import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// 시드 질문 — DB에 질문이 없을 때 폴백
const SEED_QUESTIONS: Record<number, string[]> = {
  1: [
    '오늘 하루 {petName}이 가장 생각난 순간은 언제였나요?',
    '{petName}과 함께했던 아침 풍경이 기억나시나요?',
    '{petName}의 냄새, 체온, 감촉이 지금도 느껴지나요?',
    '{petName}을 처음 만났던 날을 기억하시나요?',
    '오늘 {petName}에게 가장 하고 싶은 말은 무엇인가요?',
    '{petName}이 가장 좋아하던 것들을 떠올려볼게요. 무엇이 생각나나요?',
  ],
  2: [
    '{petName}에게 미안한 마음이 드는 순간이 있나요?',
    '{petName}과 함께 더 해주지 못해 아쉬운 것이 있나요?',
    '지금 마음속에 어떤 감정들이 물결치고 있나요?',
    '오늘 눈물이 났던 순간이 있었나요?',
    '{petName}이 곁에 있다면 지금 무슨 말을 해줄 것 같나요?',
    '가장 힘들었던 하루를 {petName}과 함께 보냈던 기억이 있나요?',
  ],
  3: [
    '{petName}의 가장 특별했던 습관은 무엇이었나요?',
    '{petName}이 나를 위로해주었던 기억이 있나요?',
    '{petName}이 없는 일상에서 가장 달라진 것은 무엇인가요?',
    '{petName}을 마지막으로 안았던 날을 떠올려볼게요.',
    '{petName}이 남겨준 가장 소중한 것은 무엇인가요?',
    '{petName}과 함께했던 계절 중 가장 기억에 남는 계절은?',
  ],
  4: [
    '{petName}을 기억하는 나만의 방법이 있나요?',
    '{petName}이 내 삶에 가르쳐준 것이 있다면 무엇인가요?',
    '{petName}이 행복했을 것 같은 순간들을 떠올려보세요.',
    '{petName}에게 감사한 것들을 적어볼게요.',
    '{petName}과 나눴던 대화 중 가장 기억에 남는 것은?',
    '{petName}을 통해 알게 된 나 자신의 모습이 있나요?',
  ],
  5: [
    '지금의 나에게 {petName}은 어떤 존재로 남아있나요?',
    '{petName}을 그리워하면서도 괜찮아질 수 있다고 느끼나요?',
    '{petName}이 바라는 내 모습은 어떤 모습일까요?',
    '앞으로도 {petName}을 기억할 나만의 방식을 만들어볼게요.',
    '{petName}에게 마지막으로 편지를 쓴다면 무슨 말을 할까요?',
    '{petName}과 함께였기에 내가 더 나은 사람이 되었나요?',
  ],
}

function getSeedQuestion(week: number, day: number, petName: string): string {
  const stage = Math.min(5, Math.ceil(week / 1.5)) || 1
  const questions = SEED_QUESTIONS[stage] ?? SEED_QUESTIONS[1]
  const q = questions[(day - 1) % questions.length]
  return q.replace(/\{petName\}/g, petName)
}

export async function GET() {
  try {
    // DEV_BYPASS_AUTH=true 이면 목업 질문 반환
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return NextResponse.json({
        id: null,
        content: getSeedQuestion(1, 3, '순탄이'),
        hintText: '떠오르는 대로 자유롭게 써보세요.',
        week: 1,
        day: 3,
        stage: 1,
        petName: '순탄이',
        fromDb: false,
      })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { activePetId: true },
    })
    if (!dbUser?.activePetId) return NextResponse.json({ error: 'No active pet' }, { status: 404 })

    const pet = await prisma.pet.findUnique({
      where: { id: dbUser.activePetId },
      select: { id: true, name: true },
    })
    if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

    const journey = await prisma.journeyProgress.findUnique({
      where: { petId: pet.id },
      select: { currentStage: true, currentWeek: true, currentDay: true },
    })

    const week = journey?.currentWeek ?? 1
    const day  = journey?.currentDay  ?? 1
    const stage = journey?.currentStage ?? 1

    // DB에서 해당 week/day 질문 조회
    const dbQuestion = await prisma.question.findFirst({
      where: { week, day, isComma: false },
      select: { id: true, content: true, hintText: true },
    })

    if (dbQuestion) {
      return NextResponse.json({
        id: dbQuestion.id,
        content: dbQuestion.content.replace(/\{petName\}/g, pet.name),
        hintText: dbQuestion.hintText,
        week,
        day,
        stage,
        petName: pet.name,
        fromDb: true,
      })
    }

    // 폴백: 시드 질문
    return NextResponse.json({
      id: null,
      content: getSeedQuestion(week, day, pet.name),
      hintText: null,
      week,
      day,
      stage,
      petName: pet.name,
      fromDb: false,
    })
  } catch (err) {
    console.error('[GET /api/questions/today]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
