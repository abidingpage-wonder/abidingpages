import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export type HomeStatus = 'A' | 'B' | 'C'

export interface HomeStatusResponse {
  status: HomeStatus
  pet: {
    id: string
    name: string
    profileImageUrl: string | null
    ownerNickname: string | null
    species: string
    diedAt: string // ISO date string (YYYY-MM-DD)
  }
  journey: {
    currentStage: number
    currentWeek: number
    currentDay: number
    totalLetters: number
    totalMinutes: number
    emotionCount: number
  }
  dayCount: number // 별이 된 날부터 오늘까지 (1-based)
  // 상태 A: 읽지 않은 답장
  unreadReply?: {
    letterId: string
    replyId: string
    preview: string   // 답장 본문 앞 60자
    receivedAt: string
  }
  // 상태 C: 오늘 보낸 편지
  todayLetter?: {
    letterId: string
    sentAt: string
  }
}

function calcDayCount(diedAt: Date): number {
  const died = new Date(diedAt)
  died.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffMs = today.getTime() - died.getTime()
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1)
}

function todayRange(): { start: Date; end: Date } {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export async function GET() {
  try {
    // 1. 인증
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 유저 + 활성 펫 조회
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { activePetId: true },
    })

    if (!dbUser?.activePetId) {
      return NextResponse.json({ error: 'No active pet' }, { status: 404 })
    }

    const pet = await prisma.pet.findUnique({
      where: { id: dbUser.activePetId },
      select: {
        id: true,
        name: true,
        profileImageUrl: true,
        ownerNickname: true,
        species: true,
        diedAt: true,
      },
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    // 3. 여정 진행 상태
    const journey = await prisma.journeyProgress.findUnique({
      where: { petId: pet.id },
      select: {
        currentStage: true,
        currentWeek: true,
        currentDay: true,
        totalLetters: true,
      },
    })

    const emotionCount = await prisma.emotionLog.count({ where: { petId: pet.id } })
    const journeyData = journey
      ? { ...journey, totalMinutes: 0, emotionCount }
      : { currentStage: 1, currentWeek: 1, currentDay: 1, totalLetters: 0, totalMinutes: 0, emotionCount: 0 }

    const dayCount = calcDayCount(pet.diedAt)
    const { start, end } = todayRange()

    // 4. 읽지 않은 답장 확인 (상태 A)
    const unreadReply = await prisma.reply.findFirst({
      where: {
        petId: pet.id,
        isRead: false,
      },
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        letterId: true,
        content: true,
        generatedAt: true,
      },
    })

    if (unreadReply) {
      const response: HomeStatusResponse = {
        status: 'A',
        pet: {
          id: pet.id,
          name: pet.name,
          profileImageUrl: pet.profileImageUrl,
          ownerNickname: pet.ownerNickname,
          species: pet.species,
          diedAt: pet.diedAt.toISOString().split('T')[0],
        },
        journey: journeyData,
        dayCount,
        unreadReply: {
          letterId: unreadReply.letterId,
          replyId: unreadReply.id,
          preview: unreadReply.content.slice(0, 60),
          receivedAt: unreadReply.generatedAt.toISOString(),
        },
      }
      return NextResponse.json(response)
    }

    // 5. 오늘 편지 확인
    const todayLetter = await prisma.letter.findFirst({
      where: {
        petId: pet.id,
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        reply: { select: { id: true, isRead: true } },
      },
    })

    // 6. 오늘 편지 O + 답장 없음 or 생성중 → 상태 C
    if (todayLetter && !todayLetter.reply) {
      const response: HomeStatusResponse = {
        status: 'C',
        pet: {
          id: pet.id,
          name: pet.name,
          profileImageUrl: pet.profileImageUrl,
          ownerNickname: pet.ownerNickname,
          species: pet.species,
          diedAt: pet.diedAt.toISOString().split('T')[0],
        },
        journey: journeyData,
        dayCount,
        todayLetter: {
          letterId: todayLetter.id,
          sentAt: todayLetter.createdAt.toISOString(),
        },
      }
      return NextResponse.json(response)
    }

    // 7. 오늘 편지 없음 → 상태 B
    const response: HomeStatusResponse = {
      status: 'B',
      pet: {
        id: pet.id,
        name: pet.name,
        profileImageUrl: pet.profileImageUrl,
        ownerNickname: pet.ownerNickname,
        species: pet.species,
        diedAt: pet.diedAt.toISOString().split('T')[0],
      },
      journey: journeyData,
      dayCount,
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[GET /api/home/status]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
