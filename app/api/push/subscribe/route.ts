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

// GET /api/push/subscribe — 현재 구독 설정 조회
export async function GET() {
  try {
    const userId = await resolveUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sub = await prisma.pushSubscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { notifHour: true, notifMinute: true, notifAmpm: true, notifDays: true },
    })

    return NextResponse.json({ subscription: sub ?? null })
  } catch (err) {
    console.error('[GET /api/push/subscribe]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/push/subscribe — 구독 등록 (시간 설정 포함)
export async function POST(req: NextRequest) {
  try {
    const {
      endpoint, p256dh, auth,
      notifHour = 9, notifMinute = 0, notifAmpm = '오전', notifDays = '1111111',
    } = await req.json()

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'subscription_required' }, { status: 400 })
    }

    const userId = await resolveUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh, auth, notifHour, notifMinute, notifAmpm, notifDays },
      update: { userId, p256dh, auth, notifHour, notifMinute, notifAmpm, notifDays },
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
