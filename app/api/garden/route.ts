import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/garden — 공개 펫 목록 + 스티커 집계 + 최신 전광판 메시지 15개
export async function GET() {
  try {
    const isDevBypass = process.env.DEV_BYPASS_AUTH === 'true'

    let userId: string | null = null
    if (!isDevBypass) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      userId = user.id
    } else {
      const devUser = await prisma.user.findFirst({ select: { id: true } })
      userId = devUser?.id ?? null
    }

    const [pets, messages] = await Promise.all([
      prisma.pet.findMany({
        where: { gardenPublic: true },
        select: {
          id: true, name: true, species: true, breed: true,
          bornAt: true, diedAt: true, profileImageUrl: true,
          ownerNickname: true, firstWord: true, togetherDays: true,
          commentAllowed: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.gardenMessage.findMany({
        where: { isHidden: false },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { id: true, content: true, createdAt: true },
      }),
    ])

    const petCards = await Promise.all(pets.map(async (pet) => {
      const stickers = await prisma.gardenSticker.groupBy({
        by: ['stickerType'],
        where: { toPetId: pet.id },
        _count: { stickerType: true },
      })
      const stickerMap: Record<string, number> = {}
      for (const s of stickers) stickerMap[s.stickerType] = s._count.stickerType

      const stickerSenders = await prisma.gardenSticker.findMany({
        where: { toPetId: pet.id },
        distinct: ['fromUserId'],
        select: { fromUserId: true },
      })

      // 로그인 유저가 이 펫에 보낸 스티커 종류
      let myStickers: string[] = []
      if (userId) {
        const mine = await prisma.gardenSticker.findMany({
          where: { fromUserId: userId, toPetId: pet.id },
          select: { stickerType: true },
        })
        myStickers = mine.map(s => s.stickerType)
      }

      return {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        bornAt: pet.bornAt.toISOString().split('T')[0],
        diedAt: pet.diedAt?.toISOString().split('T')[0] ?? null,
        profileImageUrl: pet.profileImageUrl,
        ownerNickname: pet.ownerNickname,
        firstWord: pet.firstWord,
        togetherDays: pet.togetherDays,
        commentAllowed: pet.commentAllowed,
        candle: stickerMap['candle'] ?? 0,
        flower: stickerMap['flower'] ?? 0,
        heart: stickerMap['heart'] ?? 0,
        stickerSenders: stickerSenders.length,
        myStickers,
      }
    }))

    return NextResponse.json({
      pets: petCards,
      messages: messages.map(m => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      messageCount: await prisma.gardenMessage.count({ where: { isHidden: false } }),
    })
  } catch (e) {
    console.error('[GET /api/garden]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
