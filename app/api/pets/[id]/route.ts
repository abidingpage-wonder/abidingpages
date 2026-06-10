import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function resolveUserId(): Promise<string | null> {
  if (process.env.DEV_BYPASS_AUTH === 'true') {
    const u = await prisma.user.findFirst({ select: { id: true } })
    return u?.id ?? null
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// GET /api/pets/[id] — activePet 정보 조회
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await resolveUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const pet = await prisma.pet.findFirst({
      where: { id, userId },
      select: {
        id: true, name: true, species: true,
        bornAt: true, diedAt: true,
        personalityTags: true, favoriteThings: true,
        farewellType: true, ownerNickname: true,
        firstWord: true, gardenPublic: true, commentAllowed: true,
        profileImageUrl: true,
      },
    })

    if (!pet) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ pet })
  } catch (err) {
    console.error('[GET /api/pets/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/pets/[id] — 아이 정보 수정
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await resolveUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      name, species, bornAt, diedAt,
      personalityTags, favoriteThings,
      farewellType, ownerNickname, firstWord,
      gardenPublic, commentAllowed, profileImageUrl,
    } = body

    // 소유권 확인
    const existing = await prisma.pet.findFirst({ where: { id, userId }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await prisma.pet.update({
      where: { id },
      data: {
        ...(name              !== undefined && { name }),
        ...(species           !== undefined && { species }),
        ...(bornAt            !== undefined && { bornAt: new Date(bornAt) }),
        ...(diedAt            !== undefined && { diedAt: new Date(diedAt) }),
        ...(personalityTags   !== undefined && { personalityTags }),
        ...(favoriteThings    !== undefined && { favoriteThings }),
        ...(farewellType      !== undefined && { farewellType }),
        ...(ownerNickname     !== undefined && { ownerNickname }),
        ...(firstWord         !== undefined && { firstWord }),
        ...(gardenPublic      !== undefined && { gardenPublic }),
        ...(commentAllowed    !== undefined && { commentAllowed }),
        ...(profileImageUrl   !== undefined && { profileImageUrl }),
      },
      select: { id: true, name: true },
    })

    return NextResponse.json({ ok: true, pet: updated })
  } catch (err) {
    console.error('[PATCH /api/pets/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
