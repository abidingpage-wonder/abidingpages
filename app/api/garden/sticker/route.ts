import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST /api/garden/sticker — 스티커 전송
export async function POST(req: NextRequest) {
  try {
    const { petId, stickerType } = await req.json()
    if (!petId || !stickerType) {
      return NextResponse.json({ error: 'petId and stickerType required' }, { status: 400 })
    }
    if (!['candle', 'flower', 'heart'].includes(stickerType)) {
      return NextResponse.json({ error: 'invalid stickerType' }, { status: 400 })
    }

    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const devUser = await prisma.user.findFirst()
      if (!devUser) return NextResponse.json({ error: 'No dev user' }, { status: 400 })
      try {
        await prisma.gardenSticker.create({
          data: { fromUserId: devUser.id, toPetId: petId, stickerType },
        })
      } catch {
        // unique constraint — already sent this sticker type
      }
      return NextResponse.json({ ok: true })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    try {
      await prisma.gardenSticker.create({
        data: { fromUserId: dbUser.id, toPetId: petId, stickerType },
      })
    } catch {
      // unique constraint — already sent
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[POST /api/garden/sticker]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
