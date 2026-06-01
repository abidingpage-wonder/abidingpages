import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST /api/replies/[replyId]/feedback — 피드백 저장
export async function POST(
  req: Request,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
    const { replyId } = await params
    const { rating } = await req.json() as { rating: 'positive' | 'negative' }

    if (!rating || !['positive', 'negative'].includes(rating)) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
    }

    // DEV 목업
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return NextResponse.json({ ok: true })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 답장 조회 (소유권 확인)
    const reply = await prisma.reply.findUnique({ where: { id: replyId } })
    if (!reply) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (reply.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // 편지(week, emotionTag) + 펫(farewellType) 병렬 조회
    const [letter, pet] = await Promise.all([
      prisma.letter.findUnique({
        where: { id: reply.letterId },
        select: { week: true, emotionTag: true },
      }),
      prisma.pet.findUnique({
        where: { id: reply.petId },
        select: { farewellType: true },
      }),
    ])

    const week  = letter?.week ?? 1
    const stage = week

    await prisma.replyFeedback.upsert({
      where: { replyId },
      create: {
        replyId,
        userId:       user.id,
        petId:        reply.petId,
        rating,
        week,
        stage,
        letterType:   'normal',        // 실제 구분은 향후 Letter.letterType 필드 추가 시 반영
        farewellType: pet?.farewellType ?? null,
        emotionTag:   letter?.emotionTag ?? null,
      },
      update: { rating },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/replies/[replyId]/feedback]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
