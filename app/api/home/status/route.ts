import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export type HomeStatus = 'A' | 'B' | 'C'

function calcLongestStreak(letterDates: Date[]): number {
  if (letterDates.length === 0) return 0
  const toKSTDay = (d: Date) => {
    const k = new Date(d.getTime() + 9 * 60 * 60 * 1000)
    return `${k.getUTCFullYear()}-${String(k.getUTCMonth()+1).padStart(2,'0')}-${String(k.getUTCDate()).padStart(2,'0')}`
  }
  const days = [...new Set(letterDates.map(toKSTDay))].sort()
  let longest = 1, current = 1
  for (let i = 1; i < days.length; i++) {
    if (new Date(days[i]).getTime() - new Date(days[i-1]).getTime() === 86400000) {
      current++; longest = Math.max(longest, current)
    } else current = 1
  }
  return longest
}

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
    totalLetters: number        // 전체 편지 수 (자유 포함)
    totalQuestionsDone: number  // 완료한 질문 수 (여정 진행률 N/49일)
    letterCount: number         // 보낸 편지 전체
    emotionCount: number        // 날짜 중복 제거
    longestStreak: number       // 최장 연속 일수
  }
  dayCount: number // 별이 된 날부터 오늘까지 (1-based)
  // 상태 A: 읽지 않은 답장
  unreadReply?: {
    letterId: string
    replyId: string
    preview: string   // 답장 본문 앞 60자
    receivedAt: string
    replyType: 'normal' | 'crisis'   // crisis = 위기 안내 답장
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
    const [journey, emotionDays, letters, questionLetters] = await Promise.all([
      prisma.journeyProgress.findUnique({
        where: { petId: pet.id },
        select: { currentStage: true, currentWeek: true, currentDay: true, totalLetters: true },
      }),
      prisma.emotionLog.groupBy({ by: ['loggedAt'], where: { petId: pet.id } }),
      prisma.letter.findMany({ where: { petId: pet.id, userId: user.id }, select: { createdAt: true } }),
      prisma.letter.findMany({ where: { petId: pet.id, questionId: { not: null }, letterStatus: 'normal' }, select: { questionId: true } }),
    ])

    const emotionCount = emotionDays.length
    const letterCount = letters.length
    const longestStreak = calcLongestStreak(letters.map(l => l.createdAt))
    const totalQuestionsDone = Math.min(
      new Set(questionLetters.map(l => l.questionId!)).size, 49
    )

    const journeyData = journey
      ? { ...journey, letterCount, emotionCount, longestStreak, totalQuestionsDone }
      : { currentStage: 1, currentWeek: 1, currentDay: 1, totalLetters: 0, totalQuestionsDone: 0, letterCount: 0, emotionCount: 0, longestStreak: 0 }

    const dayCount = calcDayCount(pet.diedAt)
    const { start, end } = todayRange()

    // 4. 읽지 않은 답장 확인 (상태 A) — 노출 시각 도래한 답장만
    const unreadReply = await prisma.reply.findFirst({
      where: {
        petId: pet.id,
        isRead: false,
        OR: [{ visibleAt: null }, { visibleAt: { lte: new Date() } }],
      },
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        letterId: true,
        content: true,
        generatedAt: true,
        replyType: true,
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
          replyType: unreadReply.replyType as 'normal' | 'crisis',
        },
      }
      return NextResponse.json(response)
    }

    // 5. 오늘 편지 확인
    const todayLetter = await prisma.letter.findFirst({
      where: {
        petId: pet.id,
        createdAt: { gte: start, lte: end },
        letterStatus: 'normal',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        reply: { select: { id: true, isRead: true, visibleAt: true } },
      },
    })

    // 6. 오늘 편지 O + 답장 없음 or 생성중/노출 대기 → 상태 C
    const replyVisible = todayLetter?.reply &&
      (!todayLetter.reply.visibleAt || todayLetter.reply.visibleAt <= new Date())
    if (todayLetter && !replyVisible) {
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
