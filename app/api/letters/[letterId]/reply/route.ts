import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/letters/[letterId]/reply — letterId로 답장 조회
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ letterId: string }> }
) {
  try {
    const { letterId } = await params

    // DEV 목업
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return NextResponse.json({
        id: 'r1',
        letterId,
        content: '엄마, 나 아직 여기 있어. 엄마가 오늘 나 부를 뻔했던 거 알아. 나도 그 자리에서 귀 쫑긋하고 있었어.\n\n엄마 손이 무언가를 집으려다 멈추는 거 봤어. 내가 항상 거기 있었잖아. 지금도 엄마 발 옆에 딱 붙어서 기다리고 있는 것 같은데.\n\n엄마, 지금 느껴지는 이 먹먹함 그대로 있어도 돼. 억지로 괜찮은 척 안 해도 되거든. 나는 엄마가 울어도 웃어도 다 괜찮아. 오늘 밥은 먹었어?\n\n순탄이 올림',
        petName: '순탄이',
        petPhotoUrl: null,
        ownerNickname: '엄마',
        letterContent: '우리 순탄이에게,\n\n오늘도 네가 너무 보고 싶었어. 아침에 일어나서 무심코 밥그릇을 꺼내려 했어. 네가 없다는 게 아직도 낯설어.',
        receivedAt: new Date().toISOString(),
        isRead: false,
        hasFeedback: false,
      })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const reply = await prisma.reply.findUnique({
      where: { letterId },
      include: { letter: { select: { content: true, week: true } } },
    })

    if (!reply) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (reply.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // 노출 시각 도래 전에는 미존재 처리 (visibleAt null = 레거시, 즉시 노출)
    if (reply.visibleAt && reply.visibleAt > new Date()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const [pet, feedback] = await Promise.all([
      prisma.pet.findUnique({
        where: { id: reply.petId },
        select: { name: true, profileImageUrl: true, ownerNickname: true },
      }),
      prisma.replyFeedback.findUnique({ where: { replyId: reply.id } }),
    ])

    return NextResponse.json({
      id: reply.id,
      letterId,
      content: reply.content,
      petName: pet?.name ?? '',
      petPhotoUrl: pet?.profileImageUrl ?? null,
      ownerNickname: pet?.ownerNickname ?? '보호자님',
      letterContent: reply.letter.content,
      week: reply.letter.week,
      receivedAt: reply.generatedAt.toISOString(),
      isRead: reply.isRead,
      hasFeedback: !!feedback,
    })
  } catch (err) {
    console.error('[GET /api/letters/[letterId]/reply]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/letters/[letterId]/reply — 읽음 처리
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ letterId: string }> }
) {
  try {
    const { letterId } = await params

    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return NextResponse.json({ ok: true })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const reply = await prisma.reply.findUnique({ where: { letterId } })
    if (!reply) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (reply.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (reply.visibleAt && reply.visibleAt > new Date()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.reply.update({
      where: { letterId },
      data: { isRead: true, readAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/letters/[letterId]/reply]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
