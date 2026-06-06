import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const MAX_WEEK = 7

// POST /api/journey/advance — 다음 주차로 이동
export async function POST() {
  try {
    // DEV 우회
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const devPet = await prisma.pet.findFirst({ select: { id: true, userId: true } })
      if (!devPet) return NextResponse.json({ error: 'No pet' }, { status: 404 })

      const journey = await prisma.journeyProgress.findUnique({
        where: { petId: devPet.id }, select: { currentWeek: true },
      })
      const currentWeek = journey?.currentWeek ?? 1
      if (currentWeek >= MAX_WEEK) return NextResponse.json({ currentWeek })

      await prisma.journeyProgress.upsert({
        where:  { petId: devPet.id },
        update: { currentWeek: currentWeek + 1, currentDay: 0, currentStage: currentWeek + 1 },
        create: { userId: devPet.userId, petId: devPet.id, currentWeek: 2, currentDay: 0 },
      })
      return NextResponse.json({ currentWeek: currentWeek + 1 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }, select: { activePetId: true },
    })
    if (!dbUser?.activePetId) return NextResponse.json({ error: 'No active pet' }, { status: 404 })

    const petId = dbUser.activePetId
    const journey = await prisma.journeyProgress.findUnique({
      where: { petId }, select: { currentWeek: true },
    })
    const currentWeek = journey?.currentWeek ?? 1
    if (currentWeek >= MAX_WEEK) return NextResponse.json({ currentWeek })

    await prisma.journeyProgress.upsert({
      where:  { petId },
      update: { currentWeek: currentWeek + 1, currentDay: 0, currentStage: currentWeek + 1 },
      create: { userId: user.id, petId, currentWeek: 2, currentDay: 0 },
    })
    return NextResponse.json({ currentWeek: currentWeek + 1 })

  } catch (err) {
    console.error('[POST /api/journey/advance]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
