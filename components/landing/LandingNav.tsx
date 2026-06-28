'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import LandingCtaLink from './LandingCtaLink'

// 카카오 로그인 / PWA 진입점
const APP_LINK = '/login'

const navLink: CSSProperties = {
  fontFamily: 'var(--f-sans)',
  fontSize: 13.5,
  fontWeight: 500,
  color: 'var(--ink-500)',
  textDecoration: 'none',
  letterSpacing: '-0.01em',
}

// 모바일 드롭다운 안의 큰 링크
const menuLink: CSSProperties = {
  ...navLink,
  fontSize: 15,
  padding: '13px 4px',
}

// 데스크탑은 인라인 메뉴(.lp-nav-desktop), 모바일은 햄버거(.lp-nav-burger) → 드롭다운.
// 표시/숨김은 LandingPage 의 LANDING_CSS 미디어쿼리에서 제어.
export default function LandingNav() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(247,243,251,0.72)',
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        borderBottom: '0.5px solid rgba(86,52,140,0.10)',
      }}
    >
      <div className="lp-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 66 }}>
        {/* 브랜드 */}
        <span style={{ fontFamily: 'var(--f-brand)', fontSize: 28, fontWeight: 400, color: 'var(--lav-700)', lineHeight: 1, letterSpacing: '-0.02em' }}>
          Abiding
        </span>

        {/* 데스크탑 인라인 메뉴 */}
        <nav className="lp-nav-desktop" style={{ alignItems: 'center', gap: 26 }}>
          <a href="#how" style={navLink}>이용 흐름</a>
          <a href="#journey" style={navLink}>49일 여정</a>
          <a href="#founder" style={navLink}>만든이</a>
          <span style={{ width: 1, height: 16, background: 'rgba(86,52,140,0.14)' }} />
          <LandingCtaLink href={APP_LINK} location="nav_login" style={{ ...navLink, color: 'var(--lav-600)', fontWeight: 600 }}>로그인</LandingCtaLink>
          <LandingCtaLink href={APP_LINK} location="nav_write" style={{ padding: '9px 18px', borderRadius: 999, background: 'var(--lav-600)', color: '#fff', fontFamily: 'var(--f-sans)', fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 14px rgba(86,52,140,0.22)' }}>
            편지 쓰러 가기
          </LandingCtaLink>
        </nav>

        {/* 모바일 햄버거 버튼 */}
        <button
          type="button"
          className="lp-nav-burger"
          aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{ alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', padding: 8, margin: -8, cursor: 'pointer', color: 'var(--lav-700)' }}
        >
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          )}
        </button>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {open && (
        <div style={{ borderTop: '0.5px solid rgba(86,52,140,0.10)', background: 'rgba(247,243,251,0.97)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="lp-wrap" style={{ display: 'flex', flexDirection: 'column', padding: '6px 20px 18px', gap: 2 }}>
            <a href="#how" onClick={close} style={menuLink}>이용 흐름</a>
            <a href="#journey" onClick={close} style={menuLink}>49일 여정</a>
            <a href="#founder" onClick={close} style={menuLink}>만든이</a>
            <LandingCtaLink href={APP_LINK} location="nav_login" style={{ ...menuLink, color: 'var(--lav-600)', fontWeight: 600 }}>로그인</LandingCtaLink>
            <LandingCtaLink href={APP_LINK} location="nav_write" style={{ marginTop: 8, padding: '14px', borderRadius: 14, background: 'var(--lav-600)', color: '#fff', fontFamily: 'var(--f-sans)', fontSize: 15, fontWeight: 600, textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 14px rgba(86,52,140,0.22)' }}>
              편지 쓰러 가기
            </LandingCtaLink>
          </div>
        </div>
      )}
    </header>
  )
}
