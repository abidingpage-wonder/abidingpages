import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/garden — 공개 펫 목록 + 스티커 집계 + 최신 전광판 메시지 15개
export async function GET() {
  try {
    const isDevBypass = process.env.DEV_BYPASS_AUTH === 'true'

    // ── DEV 목업 ────────────────────────────────────────────────────
    if (isDevBypass) {
      // DB에서 실제 데이터 시도, 없으면 완전 목업 반환
      try {
        const [dbPets, dbMessages] = await Promise.all([
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

        // unique poster 수
        const uniquePosters = await prisma.gardenMessage.groupBy({
          by: ['userId'],
          where: { isHidden: false },
        })

        let petCards = await buildPetCards(dbPets, null)

        // 실제 DB 펫이 없으면 순탄이 mock 카드 추가
        if (petCards.length === 0) {
          petCards = [MOCK_SUNTAN_CARD]
        }

        return NextResponse.json({
          pets: petCards,
          messages: dbMessages.map(m => ({
            id: m.id, content: m.content,
            createdAt: m.createdAt.toISOString(),
          })),
          messageCount: uniquePosters.length,
        })
      } catch {
        // DB 연결 불가 시 완전 목업
        return NextResponse.json({
          pets: [MOCK_SUNTAN_CARD],
          messages: MOCK_MESSAGES,
          messageCount: 3,
        })
      }
    }

    // ── 인증 ────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [pets, messages, uniquePosters] = await Promise.all([
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
      prisma.gardenMessage.groupBy({
        by: ['userId'],
        where: { isHidden: false },
      }),
    ])

    const petCards = await buildPetCards(pets, user.id)

    return NextResponse.json({
      pets: petCards,
      messages: messages.map(m => ({
        id: m.id, content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      messageCount: uniquePosters.length,
    }, { headers: { 'Cache-Control': 'private, max-age=30' } })
  } catch (e) {
    console.error('[GET /api/garden]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ── 헬퍼: 펫 목록 → 카드 배열 (배치 3쿼리, N+1 제거) ────────────
async function buildPetCards(
  pets: Array<{
    id: string; name: string; species: string; breed: string | null
    bornAt: Date; diedAt: Date | null; profileImageUrl: string | null
    ownerNickname: string | null; firstWord: string | null; togetherDays: number
    commentAllowed: boolean; createdAt: Date
  }>,
  userId: string | null
) {
  if (pets.length === 0) return []

  const petIds = pets.map(p => p.id)

  // 기존: 펫마다 3쿼리 × 30펫 = 90쿼리 → 배치 3쿼리로 통합
  const [allGroups, allSenders, myStickers] = await Promise.all([
    // 1) 전체 펫의 stickerType별 count
    prisma.gardenSticker.groupBy({
      by: ['toPetId', 'stickerType'],
      where: { toPetId: { in: petIds } },
      _count: { stickerType: true },
    }),
    // 2) 전체 펫의 unique sender (toPetId별 distinct fromUserId)
    prisma.gardenSticker.findMany({
      where: { toPetId: { in: petIds } },
      select: { toPetId: true, fromUserId: true },
      distinct: ['toPetId', 'fromUserId'],
    }),
    // 3) 현재 유저가 남긴 스티커 일괄 조회
    userId
      ? prisma.gardenSticker.findMany({
          where: { fromUserId: userId, toPetId: { in: petIds } },
          select: { toPetId: true, stickerType: true },
        })
      : Promise.resolve([]),
  ])

  // petId별 Map으로 집계
  const countMap = new Map<string, Record<string, number>>()
  for (const g of allGroups) {
    if (!countMap.has(g.toPetId)) countMap.set(g.toPetId, {})
    countMap.get(g.toPetId)![g.stickerType] = g._count.stickerType
  }

  const senderCountMap = new Map<string, number>()
  for (const s of allSenders) {
    senderCountMap.set(s.toPetId, (senderCountMap.get(s.toPetId) ?? 0) + 1)
  }

  const myMap = new Map<string, string[]>()
  for (const s of myStickers) {
    if (!myMap.has(s.toPetId)) myMap.set(s.toPetId, [])
    myMap.get(s.toPetId)!.push(s.stickerType)
  }

  return pets.map(pet => {
    const counts = countMap.get(pet.id) ?? {}
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
      candle: counts['candle'] ?? 0,
      flower: counts['flower'] ?? 0,
      heart:  counts['heart']  ?? 0,
      stickerSenders: senderCountMap.get(pet.id) ?? 0,
      myStickers: myMap.get(pet.id) ?? [],
    }
  })
}

// ── DEV 목업 상수 ──────────────────────────────────────────────────
const MOCK_SUNTAN_CARD = {
  id: 'mock-pet-suntan',
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
  candle: 10,
  flower: 5,
  heart: 3,
  stickerSenders: 18,
  myStickers: [],
}

const MOCK_MESSAGES = [
  { id: 'm1', content: '순탄아, 보고 싶어 ✦',       createdAt: new Date(Date.now() - 60000).toISOString() },
  { id: 'm2', content: '오늘도 잘 지내고 있어?',     createdAt: new Date(Date.now() - 120000).toISOString() },
  { id: 'm3', content: '너를 기억할게 ♥',            createdAt: new Date(Date.now() - 180000).toISOString() },
  { id: 'm4', content: '사랑해, 우리 아가',           createdAt: new Date(Date.now() - 240000).toISOString() },
  { id: 'm5', content: '다시 만나자, 꼭',             createdAt: new Date(Date.now() - 300000).toISOString() },
]
