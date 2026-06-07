import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST /api/push/subscribe — 구독 등록
export async function POST(req: NextRequest) {
  try {
    const { endpoint, p256dh, auth } = await req.json()

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'subscription_required' }, { status: 400 })
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

    // endpoint 기준 upsert (같은 기기 재구독 허용)
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh, auth },
      update: { userId, p256dh, auth },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/push/subscribe]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/push/subscribe — 구독 해제
export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json()
    if (!endpoint) return NextResponse.json({ error: 'endpoint_required' }, { status: 400 })

    await prisma.pushSubscription.deleteMany({ where: { endpoint } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/push/subscribe]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
