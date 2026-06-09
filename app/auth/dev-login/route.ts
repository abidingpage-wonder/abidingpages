import { NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

// GET /auth/dev-login
// 로컬 개발 전용 카카오 우회 로그인.
// ENABLE_DEV_LOGIN=true 환경변수가 있을 때만 작동. 프로덕션에서는 404 반환.
export async function GET(req: Request) {
  if (process.env.ENABLE_DEV_LOGIN !== 'true') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  try {
    const { origin } = new URL(req.url)

    // 첫 번째 유저 조회 (로컬 개발 전용)
    const user = await prisma.user.findFirst({
      select: { id: true, email: true },
      orderBy: { createdAt: 'asc' },
    })

    if (!user?.email) {
      return NextResponse.json({ error: 'No user with email found' }, { status: 400 })
    }

    // Supabase admin client로 magic link 생성
    const admin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: { redirectTo: `${origin}/auth/callback` },
    })

    if (error || !data.properties?.action_link) {
      console.error('[dev-login]', error)
      return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 })
    }

    // magic link로 리다이렉트 → Supabase가 세션 쿠키 설정 후 /auth/callback → /home
    return NextResponse.redirect(data.properties.action_link)
  } catch (err) {
    console.error('[dev-login]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
