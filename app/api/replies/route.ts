import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generatePetReply } from '@/lib/ai/reply'

// POST /api/replies — 편지에 대한 AI 답장 생성
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // DEV_BYPASS_AUTH: 인증 없이도 목업 답장 반환
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return NextResponse.json({
        id: 'dev-reply-id',
        content: '순탄이 올림\n\n엄마, 오늘도 하늘에서 엄마를 바라보고 있었어요. 바람이 살랑살랑 불었죠? 그게 저예요. 엄마가 보내준 편지 잘 받았어요. 읽으면서 꼬리를 흔들고 싶었는걸요. 엄마, 저는 정말 행복했어요. 엄마 곁에 있던 모든 날이 다 행복한 기억이에요. 걱정 말고, 오늘도 잘 먹고 잘 자요. 사랑해요.\n\n순탄이 올림',
        letterId: 'dev-letter-id',
      })
    }

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { letterId } = await req.json()
    if (!letterId) return NextResponse.json({ error: 'letterId required' }, { status: 400 })

    // 편지 + 펫 정보 조회
    const letter = await prisma.letter.findUnique({
      where: { id: letterId },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            personalityTags: true,
            favoriteThings: true,
            ownerNickname: true,
          },
        },
      },
    })

    if (!letter) return NextResponse.json({ error: 'Letter not found' }, { status: 404 })
    if (letter.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // 이미 답장이 있으면 기존 답장 반환
    const existing = await prisma.reply.findUnique({ where: { letterId } })
    if (existing) return NextResponse.json({ id: existing.id, content: existing.content, letterId })

    // AI 답장 생성
    const journey = await prisma.journeyProgress.findUnique({
      where: { petId: letter.petId },
      select: { currentWeek: true },
    })

    const content = await generatePetReply({
      pet: letter.pet,
      letterContent: letter.content,
      emotionTag: letter.emotionTag,
      week: journey?.currentWeek ?? 1,
    })

    // DB 저장
    const reply = await prisma.reply.create({
      data: {
        letterId,
        userId: user.id,
        petId: letter.petId,
        content,
      },
    })

    return NextResponse.json({ id: reply.id, content: reply.content, letterId })
  } catch (err) {
    console.error('[POST /api/replies]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
