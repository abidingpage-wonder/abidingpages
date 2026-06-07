import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

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

    const [payments, planInfo] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: { paidAt: 'desc' },
        select: { id: true, orderId: true, amount: true, plan: true, status: true, paidAt: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, planExpires: true },
      }),
    ])

    return NextResponse.json({ payments, plan: planInfo?.plan ?? 'free', planExpires: planInfo?.planExpires ?? null })
  } catch (err) {
    console.error('[GET /api/payments/history]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
