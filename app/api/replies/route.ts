import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generatePetReply } from '@/lib/ai/reply'
import type { LetterType } from '@/lib/ai/prompt'

// ── DEV 목업 답장 ──────────────────────────────────────────────────────────
const DEV_REPLY_CONTENT = `엄마, 나 아직 여기 있어. 엄마가 오늘 나 부를 뻔했던 거 알아. 나도 그 자리에서 귀 쫑긋하고 있었어.

엄마 손이 무언가를 집으려다 멈추는 거 봤어. 내가 항상 거기 있었잖아. 지금도 엄마 발 옆에 딱 붙어서 기다리고 있는 것 같은데.

엄마, 지금 느껴지는 이 먹먹함 그대로 있어도 돼. 억지로 괜찮은 척 안 해도 되거든. 나는 엄마가 울어도 웃어도 다 괜찮아. 오늘 밥은 먹었어?

순탄이 올림`

// ── POST /api/replies — AI 답장 생성 ──────────────────────────────────────
export async function POST(req: Request) {
  try {
    // DEV 우회
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return NextResponse.json({
        id:       'dev-reply-id',
        content:  DEV_REPLY_CONTENT,
        letterId: 'dev-letter-id',
      })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { letterId } = await req.json()
    if (!letterId) return NextResponse.json({ error: 'letterId required' }, { status: 400 })

    // 편지 + 펫 전체 정보 조회
    const letter = await prisma.letter.findUnique({
      where:   { id: letterId },
      include: {
        pet: {
          select: {
            name:           true,
            species:        true,
            personalityTags: true,
            favoriteThings: true,
            ownerNickname:  true,
            farewellType:   true,
            firstWord:      true,
          },
        },
        question: { select: { isRest: true } },
      },
    })

    if (!letter)                 return NextResponse.json({ error: 'Letter not found' }, { status: 404 })
    if (letter.userId !== user.id) return NextResponse.json({ error: 'Forbidden' },      { status: 403 })

    // 이미 답장이 있으면 기존 답장 반환
    const existing = await prisma.reply.findUnique({ where: { letterId } })
    if (existing) {
      return NextResponse.json({ id: existing.id, content: existing.content, letterId })
    }

    // 편지 유형 결정
    const isRest    = letter.question?.isRest ?? false
    const letterType: LetterType = isRest ? 'comma_auto' : 'normal'

    // 여정 진행 상태 (주차 정보)
    const journey = await prisma.journeyProgress.findUnique({
      where:  { petId: letter.petId },
      select: { currentWeek: true },
    })
    const week = journey?.currentWeek ?? letter.week

    // AI 답장 생성
    const content = await generatePetReply({
      pet:          letter.pet,
      letterContent: letter.content,
      emotionTag:   letter.emotionTag,
      week,
      isRest,
      letterType,
    })

    // DB 저장
    const reply = await prisma.reply.create({
      data: {
        letterId,
        userId: user.id,
        petId:  letter.petId,
        content,
      },
    })

    return NextResponse.json({ id: reply.id, content: reply.content, letterId })
  } catch (err) {
    console.error('[POST /api/replies]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
