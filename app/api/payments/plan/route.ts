import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/payments/plan — 현재 플랜 조회
export async function GET() {
  try {
    // DEV 우회
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      const devUser = await prisma.user.findFirst({
        select: { plan: true, planExpires: true },
      })
      return NextResponse.json({
        plan: devUser?.plan ?? 'free',
        planExpires: devUser?.planExpires ?? null,
      })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true, planExpires: true },
    })

    // planExpires 만료 체크
    const isExpired = dbUser?.planExpires && new Date(dbUser.planExpires) < new Date()
    if (isExpired && dbUser?.plan === 'pro') {
      await prisma.user.update({ where: { id: user.id }, data: { plan: 'free' } })
      return NextResponse.json({ plan: 'free', planExpires: null })
    }

    return NextResponse.json({
      plan: dbUser?.plan ?? 'free',
      planExpires: dbUser?.planExpires ?? null,
    })
  } catch (err) {
    console.error('[GET /api/payments/plan]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
