import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST /api/garden/[petId]/comment — 응원 댓글 등록
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ petId: string }> }
) {
  try {
    const { petId } = await params
    const { content } = await req.json()

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content_required' }, { status: 400 })
    }
    if (content.trim().length > 50) {
      return NextResponse.json({ error: 'content_too_long' }, { status: 400 })
    }

    // 댓글 허용 여부 확인
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      select: { commentAllowed: true, gardenPublic: true },
    })
    if (!pet || !pet.gardenPublic) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (!pet.commentAllowed) {
      return NextResponse.json({ error: 'comments_disabled' }, { status: 403 })
    }

    let userId: string
    let activePetId: string | null = null

    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const devUser = await prisma.user.findFirst({
        select: { id: true, activePetId: true },
      })
      if (!devUser) return NextResponse.json({ error: 'No dev user' }, { status: 400 })
      userId = devUser.id
      activePetId = devUser.activePetId
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, activePetId: true },
      })
      if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      userId = dbUser.id
      activePetId = dbUser.activePetId
    }

    // 작성자 레이블: {내 펫 이름}·{ownerNickname}
    let authorLabel = '익명'
    if (activePetId) {
      const myPet = await prisma.pet.findUnique({
        where: { id: activePetId },
        select: { name: true, ownerNickname: true },
      })
      if (myPet) {
        authorLabel = myPet.ownerNickname
          ? `${myPet.name}·${myPet.ownerNickname}`
          : myPet.name
      }
    }

    const comment = await prisma.gardenComment.create({
      data: { userId, toPetId: petId, content: content.trim() },
      select: { id: true, content: true, createdAt: true },
    })

    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      authorLabel,
    })
  } catch (e) {
    console.error('[POST /api/garden/[petId]/comment]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
