import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST /api/users/withdraw — 회원 탈퇴 (soft delete)
export async function POST(req: NextRequest) {
  try {
    const { reason } = await req.json()

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

    // soft delete: deletedAt 설정
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    })

    // 콘솔 로그 (추후 분석용)
    console.log(`[withdraw] userId=${userId}, reason=${reason ?? 'none'}`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/users/withdraw]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
