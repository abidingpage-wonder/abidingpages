import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // ── 개발용 인증 우회 ────────────────────────────────────────────────
  // 배포 전 .env.local 에서 DEV_BYPASS_AUTH=false 로 변경 (또는 삭제)
  if (process.env.DEV_BYPASS_AUTH === 'true') {
    return supabaseResponse
  }
  // ────────────────────────────────────────────────────────────────────

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 공개 경로 — 인증 불필요
  // /api 는 각 라우트가 자체 인증을 수행하므로 페이지 리다이렉트 대상에서 제외.
  // (제외하지 않으면 토큰 기반 호출(cron 등)이 /login HTML 로 리다이렉트되어 JSON 대신 HTML 응답을 받음)
  const publicPaths = ['/login', '/auth/callback']
  const isPublic =
    pathname.startsWith('/api') ||
    publicPaths.some((p) => pathname === p || pathname.startsWith('/auth/'))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return supabaseResponse
}

export { proxy }
export default proxy

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|screenshots|manifest.json|sw.js|workbox-.*).*)'],
}
