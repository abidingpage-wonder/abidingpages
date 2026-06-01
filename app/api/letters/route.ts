import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

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
      where: { id: user.id },
      select: { activePetId: true },
    })
    if (!dbUser?.activePetId) return NextResponse.json({ error: 'No active pet' }, { status: 404 })

    const journey = await prisma.journeyProgress.findUnique({
      where: { petId: dbUser.activePetId },
      select: { currentStage: true, currentWeek: true, currentDay: true, totalLetters: true },
    })

    const stage = journey?.currentStage ?? 1
    const week  = journey?.currentWeek  ?? 1
    const day   = journey?.currentDay   ?? 1

    const letter = await prisma.letter.create({
      data: {
        userId:    user.id,
        petId:     dbUser.activePetId,
        content:   content.trim(),
        stage,
        week,
        day,
        imageUrls: [],
        ...(questionId ? { questionId } : {}),
        ...(emotionTag ? { emotionTag } : {}),
      },
    })

    // totalLetters 증가
    await prisma.journeyProgress.upsert({
      where: { petId: dbUser.activePetId },
      update: { totalLetters: { increment: 1 } },
      create: {
        userId:       user.id,
        petId:        dbUser.activePetId,
        currentStage: 1,
        currentWeek:  1,
        currentDay:   1,
        totalLetters: 1,
      },
    })

    return NextResponse.json({ id: letter.id })
  } catch (err) {
    console.error('[POST /api/letters]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
