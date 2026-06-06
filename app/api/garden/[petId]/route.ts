import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/garden/[petId] — 개별 추모관 상세 (카드 + 댓글 목록)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ petId: string }> }
) {
  try {
    const { petId } = await params

    let userId: string | null = null
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const devUser = await prisma.user.findFirst({ select: { id: true } })
      userId = devUser?.id ?? null
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      userId = user.id
    }

    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      select: {
        id: true, name: true, species: true, breed: true,
        bornAt: true, diedAt: true, profileImageUrl: true,
        ownerNickname: true, firstWord: true, togetherDays: true,
        commentAllowed: true, gardenPublic: true,
        userId: true,
      },
    })
    if (!pet || !pet.gardenPublic) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // 스티커 집계
    const [stickerGroups, stickerSenders, myStickers, comments] = await Promise.all([
      prisma.gardenSticker.groupBy({
        by: ['stickerType'],
        where: { toPetId: petId },
        _count: { stickerType: true },
      }),
      prisma.gardenSticker.findMany({
        where: { toPetId: petId },
        distinct: ['fromUserId'],
        select: { fromUserId: true },
      }),
      userId ? prisma.gardenSticker.findMany({
        where: { fromUserId: userId, toPetId: petId },
        select: { stickerType: true },
      }) : Promise.resolve([]),
      prisma.gardenComment.findMany({
        where: { toPetId: petId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true, content: true, createdAt: true,
          user: {
            select: {
              activePetId: true,
              pets: { select: { id: true, name: true, ownerNickname: true }, take: 5 },
            },
          },
        },
      }),
    ])

    const stickerMap: Record<string, number> = { candle: 0, flower: 0, heart: 0 }
    for (const s of stickerGroups) stickerMap[s.stickerType] = s._count.stickerType

    const formattedComments = comments.map(c => {
      const activePet = c.user.activePetId
        ? c.user.pets.find(p => p.id === c.user.activePetId)
        : c.user.pets[0]
      const authorLabel = activePet
        ? `${activePet.name}${activePet.ownerNickname ? `·${activePet.ownerNickname}` : ''}`
        : '익명'
      return {
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        authorLabel,
      }
    })

    // 생존일 계산
    const daysSince = pet.diedAt
      ? Math.max(1, Math.floor((Date.now() - new Date(pet.diedAt).getTime()) / 86400000) + 1)
      : 1

    return NextResponse.json({
      pet: {
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
      },
      stickers: stickerMap,
      stickerSenders: stickerSenders.length,
      myStickers: myStickers.map(s => s.stickerType),
      comments: formattedComments,
      daysSince,
    })
  } catch (e) {
    console.error('[GET /api/garden/[petId]]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
