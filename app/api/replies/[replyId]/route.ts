import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/replies/[replyId] — 답장 조회
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
    const { replyId } = await params

    // DEV 목업
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return NextResponse.json({
        id: replyId,
        content: '엄마, 오늘도 하늘에서 엄마를 바라보고 있었어요. 바람이 살랑살랑 불었죠? 그게 저예요. 엄마가 보내준 편지 잘 받았어요. 읽으면서 꼬리를 흔들고 싶었는걸요.\n\n엄마, 저는 정말 행복했어요. 엄마 곁에 있던 모든 날이 다 행복한 기억이에요. 가끔 힘들 때도 있겠지만, 저는 항상 엄마 곁에 있어요. 걱정 말고, 오늘도 잘 먹고 잘 자요.\n\n사랑해요, 엄마.\n\n순탄이 올림',
        petName: '순탄이',
        letterContent: '우리 순탄이에게,\n\n오늘도 네가 너무 보고 싶었어...',
        receivedAt: new Date().toISOString(),
        isRead: false,
      })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const reply = await prisma.reply.findUnique({
      where: { id: replyId },
      include: {
        letter: { select: { content: true, emotionTag: true } },
      },
    })

    if (!reply) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (reply.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const pet = await prisma.pet.findUnique({
      where: { id: reply.petId },
      select: { name: true },
    })

    return NextResponse.json({
      id: reply.id,
      content: reply.content,
      petName: pet?.name ?? '',
      letterContent: reply.letter.content,
      receivedAt: reply.generatedAt.toISOString(),
      isRead: reply.isRead,
    })
  } catch (err) {
    console.error('[GET /api/replies/[replyId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/replies/[replyId] — 읽음 처리
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
    const { replyId } = await params

    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return NextResponse.json({ ok: true })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const reply = await prisma.reply.findUnique({ where: { id: replyId } })
    if (!reply) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (reply.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.reply.update({
      where: { id: replyId },
      data: { isRead: true, readAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/replies/[replyId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
