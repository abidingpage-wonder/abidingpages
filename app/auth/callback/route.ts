import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const supabaseUser = data.user

      // users 테이블에 없으면 INSERT, 있으면 그대로
      const existing = await prisma.user.findUnique({
        where: {
          provider_providerId: {
            provider: supabaseUser.app_metadata.provider ?? 'kakao',
            providerId: supabaseUser.id,
          },
        },
      })

      const provider = supabaseUser.app_metadata.provider ?? 'kakao'

      if (!existing) {
        await prisma.user.create({
          data: {
            id: supabaseUser.id,
            email: supabaseUser.email ?? null,
            provider,
            providerId: supabaseUser.id,
            plan: 'free',
          },
        })
        // 신규 유저 → 온보딩으로 (login 이벤트 파라미터 전달)
        return NextResponse.redirect(`${origin}/onboarding?_lp=${provider}&_ln=1`)
      }

      // 기존 유저 → 온보딩 완료 여부 확인
      const pet = await prisma.pet.findFirst({
        where: { userId: existing.id },
      })

      const dest = pet ? next : '/onboarding'
      return NextResponse.redirect(`${origin}${dest}?_lp=${provider}&_ln=0`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
