import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST /api/garden/message — 전광판 메시지 등록 (20자 제한 / 1일 3회 제한)
export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json()
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content_required' }, { status: 400 })
    }
    if (content.trim().length > 20) {
      return NextResponse.json({ error: 'content_too_long' }, { status: 400 })
    }

    let userId: string

    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const devUser = await prisma.user.findFirst()
      if (!devUser) return NextResponse.json({ error: 'No dev user' }, { status: 400 })
      userId = devUser.id
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
      if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      userId = dbUser.id
    }

    // 오늘 3회 제한
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayCount = await prisma.gardenMessage.count({
      where: { userId, createdAt: { gte: todayStart } },
    })
    if (todayCount >= 3) {
      return NextResponse.json({ error: 'daily_limit' }, { status: 429 })
    }

    const msg = await prisma.gardenMessage.create({
      data: { userId, content: content.trim(), isHidden: false },
      select: { id: true, content: true, createdAt: true },
    })

    return NextResponse.json({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      remainingToday: 2 - todayCount,
    })
  } catch (e) {
    console.error('[POST /api/garden/message]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
