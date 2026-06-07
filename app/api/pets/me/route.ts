import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/pets/me — activePet 정보 조회 (단축 경로)
export async function GET() {
  try {
    let userId: string

    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const u = await prisma.user.findFirst({ select: { id: true } })
      if (!u) return NextResponse.json({ error: 'No dev user' }, { status: 400 })
      userId = u.id
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      userId = user.id
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { activePetId: true },
    })
    if (!dbUser?.activePetId) return NextResponse.json({ error: 'No active pet' }, { status: 404 })

    const pet = await prisma.pet.findUnique({
      where: { id: dbUser.activePetId },
      select: {
        id: true, name: true, species: true,
        bornAt: true, diedAt: true,
        personalityTags: true, favoriteThings: true,
        farewellType: true, ownerNickname: true,
        firstWord: true, gardenPublic: true, commentAllowed: true,
        profileImageUrl: true,
      },
    })

    if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    return NextResponse.json({ pet })
  } catch (err) {
    console.error('[GET /api/pets/me]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
