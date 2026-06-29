'use client'

import { useEffect, useState } from 'react'
import LandingCtaLink from './LandingCtaLink'

// 모바일 전용 하단 고정 CTA. 외부 콜드 트래픽(인스타/스레드)에게 항상 명확한 행동을
// 제공해 텍스트 데드클릭/이탈을 줄인다. Hero 를 지나 스크롤하면 노출.
// 표시 여부(모바일 only)는 LANDING_CSS 의 .lp-sticky-cta 미디어쿼리에서 제어.
export default function LandingStickyCta() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className="lp-sticky-cta"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        padding: '14px 16px calc(14px + env(safe-area-inset-bottom))',
        background: 'linear-gradient(180deg, rgba(243,238,246,0) 0%, rgba(243,238,246,0.94) 34%)',
        transform: show ? 'translateY(0)' : 'translateY(130%)',
        transition: 'transform 0.28s ease',
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      <LandingCtaLink
        href="/login"
        location="sticky"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
          padding: '15px',
          borderRadius: 999,
          background: '#FEE500',
          color: '#3c1e1e',
          textDecoration: 'none',
          fontFamily: 'var(--f-sans)',
          fontSize: 15,
          fontWeight: 700,
          boxShadow: '0 6px 20px rgba(86,52,140,0.20)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 4C7 4 3 7.2 3 11.1c0 2.5 1.7 4.7 4.2 6L6.4 20c-.1.4.3.7.6.5l3.3-2.2c.5.06 1.1.1 1.7.1 5 0 9-3.2 9-7.1S17 4 12 4z" fill="#3c1e1e" />
        </svg>
        카카오로 시작하기
      </LandingCtaLink>
    </div>
  )
}
