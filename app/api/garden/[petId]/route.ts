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

    // DEV 모드: mock petId 처리
    if (process.env.DEV_BYPASS_AUTH === 'true' && petId.startsWith('mock-')) {
      return NextResponse.json({
        pet: {
          id: petId,
          name: '순탄이',
          species: 'dog',
          breed: '말티즈',
          bornAt: '2014-03-12',
          diedAt: '2024-05-20',
          profileImageUrl: null,
          ownerNickname: '엄마',
          firstWord: '언제나 내 마음속에 따뜻하게 머물러 있어',
          togetherDays: 3650,
          commentAllowed: true,
        },
        stickers: { candle: 10, flower: 5, heart: 3 },
        stickerSenders: 18,
        myStickers: [],
        comments: [
          { id: 'c1', content: '순탄아, 보고 싶어. 잘 지내고 있지?', createdAt: new Date(Date.now() - 86400000).toISOString(), authorLabel: '하늘이·엄마', isOwner: true },
          { id: 'c2', content: '따뜻한 곳에서 잘 쉬고 있기를 바라요 🕯️', createdAt: new Date(Date.now() - 172800000).toISOString(), authorLabel: '별이·아빠', isOwner: false },
        ],
        daysSince: Math.floor((Date.now() - new Date('2024-05-20').getTime()) / 86400000) + 1,
      })
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
          id: true, content: true, createdAt: true, userId: true,
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
        isOwner: userId ? c.userId === userId : false,
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
