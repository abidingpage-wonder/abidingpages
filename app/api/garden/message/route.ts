import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST /api/garden/message — 전광판 메시지 등록
export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json()
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content required' }, { status: 400 })
    }
    if (content.trim().length > 100) {
      return NextResponse.json({ error: 'content too long' }, { status: 400 })
    }

    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const devUser = await prisma.user.findFirst()
      if (!devUser) return NextResponse.json({ error: 'No dev user' }, { status: 400 })
      const msg = await prisma.gardenMessage.create({
        data: { userId: devUser.id, content: content.trim(), isHidden: false },
      })
      return NextResponse.json({ id: msg.id })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const msg = await prisma.gardenMessage.create({
      data: { userId: dbUser.id, content: content.trim(), isHidden: false },
    })
    return NextResponse.json({ id: msg.id })
  } catch (e) {
    console.error('[POST /api/garden/message]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
