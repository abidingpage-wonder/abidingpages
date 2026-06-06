import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST /api/garden/sticker — 스티커 전송 (archive + garden 공용)
export async function POST(req: NextRequest) {
  try {
    const { petId, stickerType } = await req.json()
    if (!petId || !stickerType) {
      return NextResponse.json({ error: 'petId and stickerType required' }, { status: 400 })
    }
    if (!['candle', 'flower', 'heart'].includes(stickerType)) {
      return NextResponse.json({ error: 'invalid stickerType' }, { status: 400 })
    }

    let userId: string

    // DEV 모드: mock petId (mock-으로 시작)는 DB 없이 가상 응답 반환
    if (process.env.DEV_BYPASS_AUTH === 'true' && petId.startsWith('mock-')) {
      const mockBase: Record<string, number> = { candle: 10, flower: 5, heart: 3 }
      mockBase[stickerType] = mockBase[stickerType] + 1
      return NextResponse.json({ ok: true, stickers: mockBase, stickerSenders: 19 })
    }

    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const devUser = await prisma.user.findFirst()
      if (!devUser) return NextResponse.json({ error: 'No dev user' }, { status: 400 })
      userId = devUser.id
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
      if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      userId = dbUser.id
    }

    try {
      await prisma.gardenSticker.create({
        data: { fromUserId: userId, toPetId: petId, stickerType },
      })
    } catch {
      // unique constraint hit — already sent this sticker type; treat as success
    }

    // 현재 집계 반환
    const stickers = await prisma.gardenSticker.groupBy({
      by: ['stickerType'],
      where: { toPetId: petId },
      _count: { stickerType: true },
    })
    const stickerMap: Record<string, number> = { candle: 0, flower: 0, heart: 0 }
    for (const s of stickers) stickerMap[s.stickerType] = s._count.stickerType

    const senders = await prisma.gardenSticker.findMany({
      where: { toPetId: petId },
      distinct: ['fromUserId'],
      select: { fromUserId: true },
    })

    return NextResponse.json({ ok: true, stickers: stickerMap, stickerSenders: senders.length })
  } catch (e) {
    console.error('[POST /api/garden/sticker]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
