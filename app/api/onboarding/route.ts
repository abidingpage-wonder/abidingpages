import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseServer } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      petName,
      species,
      breed,
      bornDate,
      passedDate,
      photoUrl,
      personalityTags,
      favoriteTags,
      firstWord,
      farewellType,
      ownerNickname,
      gardenPublic,
      commentAllowed,
    } = body

    // 필수 필드 검증
    if (!petName || !bornDate || !passedDate || !farewellType || !ownerNickname) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    // 함께한 날 계산 (처음 만난 날 ~ 별이 된 날)
    const bornAt = new Date(bornDate)
    const passedAt = new Date(passedDate)
    const diffMs = passedAt.getTime() - bornAt.getTime()
    const togetherDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

    // pets INSERT
    const pet = await prisma.pet.create({
      data: {
        userId: user.id,
        name: petName,
        species: species || 'other',
        breed: breed || null,
        bornAt,
        diedAt: passedAt,
        profileImageUrl: photoUrl || null,
        personalityTags: personalityTags ?? [],
        favoriteThings: favoriteTags ?? [],
        firstWord: firstWord || null,
        farewellType,
        ownerNickname,
        togetherDays,
        gardenPublic: gardenPublic ?? true,
        commentAllowed: commentAllowed ?? true,
      },
    })

    // journey_progress 초기화
    await prisma.journeyProgress.create({
      data: {
        petId: pet.id,
        userId: user.id,
        currentStage: 1,
        currentWeek: 1,
        currentDay: 1,
      },
    })

    // users 테이블 onboardingDone 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingDone: true,
        activePetId: pet.id,
      },
    })

    return NextResponse.json({ success: true, petId: pet.id })
  } catch (err) {
    console.error('[onboarding POST]', err)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
