import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const TOSS_SECRET_KEY  = process.env.TOSS_SECRET_KEY ?? ''
const TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm'
const PLAN_DAYS        = 100
const EXPECTED_AMOUNT  = 4900

// POST /api/payments/toss/confirm
export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await req.json()

    // ── 금액 위변조 검증 ──────────────────────────────────────────
    if (amount !== EXPECTED_AMOUNT) {
      return NextResponse.json({ error: '결제 금액이 올바르지 않습니다.' }, { status: 400 })
    }

    // ── 인증 ─────────────────────────────────────────────────────
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

    // ── 토스페이먼츠 결제 승인 요청 ──────────────────────────────
    const basicToken = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')
    const tossRes = await fetch(TOSS_CONFIRM_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })

    const tossData = await tossRes.json()

    if (!tossRes.ok) {
      console.error('[Toss confirm error]', tossData)
      return NextResponse.json({ error: tossData.message ?? '결제 승인 실패' }, { status: 400 })
    }

    // ── DB 업데이트 (트랜잭션) ────────────────────────────────────
    const planExpires = new Date(Date.now() + PLAN_DAYS * 24 * 60 * 60 * 1000)

    await prisma.$transaction([
      prisma.payment.create({
        data: {
          userId,
          orderId,
          amount,
          plan: 'pro',
          status: 'success',
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { plan: 'pro', planExpires },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/payments/toss/confirm]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
