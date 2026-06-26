'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { trackLandingCtaClicked } from '@/lib/analytics'

// 기존 <Link> 와 동일하게 동작하되, 클릭 시 landing_cta_clicked 이벤트를 발사하는 래퍼.
// children·style 은 서버에서 prop 으로 전달 → SSR 유지(LCP 영향 없음).
export default function LandingCtaLink({
  href,
  location,
  style,
  children,
}: {
  href: string
  location: string // 'hero' | 'nav_login' | 'nav_write' | 'final_kakao'
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <Link href={href} style={style} onClick={() => trackLandingCtaClicked({ location })}>
      {children}
    </Link>
  )
}
