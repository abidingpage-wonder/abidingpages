import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/journey/stage?week=N
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const week = parseInt(searchParams.get('week') ?? '1')

  // DEV 우회: 인증은 건너뛰고 실제 DB 데이터 사용
  if (process.env.DEV_BYPASS_AUTH === 'true') {
    const devPet = await prisma.pet.findFirst({ select: { id: true, name: true } })
    const [questions, letters, guide, photoCard] = await Promise.all([
      prisma.question.findMany({
        where: { week },
        orderBy: { day: 'asc' },
        select: { id: true, day: true, content: true, category: true, isRest: true },
      }),
      devPet
        ? prisma.letter.findMany({ where: { petId: devPet.id, week }, select: { questionId: true, id: true } })
        : Promise.resolve([]),
      prisma.weekGuide.findUnique({ where: { week } }),
      devPet
        ? prisma.photoCard.findFirst({ where: { petId: devPet.id, stage: week }, select: { imageUrl: true, stage: true } })
        : Promise.resolve(null),
    ])

    const doneIds = new Set(letters.map(l => l.questionId))
    const letterByQ = Object.fromEntries(letters.map(l => [l.questionId, l.id]))
    const writeCountByQ = letters.reduce<Record<string, number>>((acc, l) => {
      if (l.questionId) acc[l.questionId] = (acc[l.questionId] ?? 0) + 1
      return acc
    }, {})

    const questionsWithStatus = questions.map(q => ({
      ...q,
      done: doneIds.has(q.id),
      letterId: letterByQ[q.id] ?? null,
      writeCount: writeCountByQ[q.id] ?? 0,
    }))
    return NextResponse.json({ questions: questionsWithStatus, guide, photoCard, petName: devPet?.name ?? '' })
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

    const pet = await prisma.pet.findUnique({
      where: { id: dbUser.activePetId },
      select: { id: true, name: true },
    })
    if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

    const [questions, letters, guide, photoCard] = await Promise.all([
      prisma.question.findMany({
        where: { week },
        orderBy: { day: 'asc' },
        select: { id: true, day: true, content: true, category: true, isRest: true },
      }),
      prisma.letter.findMany({
        where: { petId: pet.id, week },
        select: { questionId: true, id: true },
      }),
      prisma.weekGuide.findUnique({ where: { week } }),
      prisma.photoCard.findFirst({
        where: { petId: pet.id, stage: week },
        select: { imageUrl: true, stage: true },
      }),
    ])

    const doneIds = new Set(letters.map(l => l.questionId))
    const letterByQ = Object.fromEntries(letters.map(l => [l.questionId, l.id]))
    const writeCountByQ = letters.reduce<Record<string, number>>((acc, l) => {
      if (l.questionId) acc[l.questionId] = (acc[l.questionId] ?? 0) + 1
      return acc
    }, {})

    const questionsWithStatus = questions.map(q => ({
      ...q,
      done: doneIds.has(q.id),
      letterId: letterByQ[q.id] ?? null,
      writeCount: writeCountByQ[q.id] ?? 0,
    }))

    return NextResponse.json({ questions: questionsWithStatus, guide, photoCard, petName: pet.name })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
