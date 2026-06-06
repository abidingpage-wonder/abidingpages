import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ petId: string; commentId: string }> }

// PATCH /api/garden/[petId]/comment/[commentId] — 댓글 수정
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { petId, commentId } = await params
    const { content } = await req.json()
    if (!content?.trim()) return NextResponse.json({ error: 'content_required' }, { status: 400 })
    if (content.trim().length > 50) return NextResponse.json({ error: 'content_too_long' }, { status: 400 })

    // DEV mock
    if (process.env.DEV_BYPASS_AUTH === 'true' && petId.startsWith('mock-')) {
      return NextResponse.json({ id: commentId, content: content.trim() })
    }

    let userId: string
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const devUser = await prisma.user.findFirst({ select: { id: true } })
      if (!devUser) return NextResponse.json({ error: 'No dev user' }, { status: 400 })
      userId = devUser.id
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      userId = user.id
    }

    const comment = await prisma.gardenComment.findUnique({ where: { id: commentId } })
    if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (comment.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const updated = await prisma.gardenComment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      select: { id: true, content: true, createdAt: true },
    })
    return NextResponse.json({ id: updated.id, content: updated.content })
  } catch (e) {
    console.error('[PATCH /api/garden/comment]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE /api/garden/[petId]/comment/[commentId] — 댓글 삭제
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { petId, commentId } = await params

    // DEV mock
    if (process.env.DEV_BYPASS_AUTH === 'true' && petId.startsWith('mock-')) {
      return NextResponse.json({ ok: true })
    }

    let userId: string
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const devUser = await prisma.user.findFirst({ select: { id: true } })
      if (!devUser) return NextResponse.json({ error: 'No dev user' }, { status: 400 })
      userId = devUser.id
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      userId = user.id
    }

    const comment = await prisma.gardenComment.findUnique({ where: { id: commentId } })
    if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (comment.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.gardenComment.delete({ where: { id: commentId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[DELETE /api/garden/comment]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
