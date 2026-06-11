import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/archive — 추모관 카드 데이터
export async function GET() {
  try {
    // DEV 목업
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const diedAt = new Date('2024-05-20')
      const daysSince = Math.max(1, Math.floor((Date.now() - diedAt.getTime()) / 86400000) + 1)
      return NextResponse.json({
        pet: {
          id:             'mock-pet-suntan',   // garden mock과 동일 ID
          name:           '순탄이',
          species:        'dog',
          breed:          '말티즈',
          bornAt:         '2014-03-12',
          diedAt:         '2024-05-20',
          profileImageUrl: null,
          ownerNickname:  '엄마',
          togetherDays:   3650,
          firstWord:      '언제나 내 마음속에 따뜻하게 머물러 있어',
        },
        stickers: { candle: 10, flower: 5, heart: 3 },
        myStickers: [],
        stickerSenders: 18,
        daysSince,
      })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { activePetId: true },
    })
    if (!dbUser?.activePetId) return NextResponse.json({ error: 'No pet' }, { status: 404 })

    const pet = await prisma.pet.findUnique({
      where: { id: dbUser.activePetId },
      select: {
        id: true, name: true, species: true, breed: true,
        bornAt: true, diedAt: true, profileImageUrl: true,
        ownerNickname: true, togetherDays: true, firstWord: true,
      },
    })
    if (!pet) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // 스티커 집계 (garden stickers)
    const stickers = await prisma.gardenSticker.groupBy({
      by: ['stickerType'],
      where: { toPetId: dbUser.activePetId },
      _count: { stickerType: true },
    })
    const stickerMap = { candle: 0, flower: 0, heart: 0 } as Record<string, number>
    stickers.forEach(s => { stickerMap[s.stickerType] = s._count.stickerType })

    const stickerSenders = await prisma.gardenSticker.findMany({
      where: { toPetId: dbUser.activePetId },
      distinct: ['fromUserId'],
      select: { fromUserId: true },
    })

    const myStickersRows = await prisma.gardenSticker.findMany({
      where: { fromUserId: user.id, toPetId: dbUser.activePetId },
      select: { stickerType: true },
    })
    const myStickers = myStickersRows.map(r => r.stickerType)

    const daysSince = pet.diedAt
      ? Math.max(1, Math.floor((Date.now() - new Date(pet.diedAt).getTime()) / 86400000) + 1)
      : 1

    return NextResponse.json({
      pet: {
        ...pet,
        bornAt: pet.bornAt.toISOString().split('T')[0],
        diedAt: pet.diedAt?.toISOString().split('T')[0] ?? null,
      },
      stickers: stickerMap,
      myStickers,
      stickerSenders: stickerSenders.length,
      daysSince,
    })
  } catch (err) {
    console.error('[GET /api/archive]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
