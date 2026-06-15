'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  {
    key: 'home',
    label: '홈',
    href: '/home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H15v-6H9v6H4a1 1 0 01-1-1V10.5z"
          fill={active ? 'var(--lav-600)' : 'none'}
          stroke={active ? 'var(--lav-600)' : 'var(--ink-300)'}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'garden',
    label: '정원',
    href: '/garden',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3" fill={active ? 'var(--lav-600)' : 'none'} stroke={active ? 'var(--lav-600)' : 'var(--ink-300)'} strokeWidth="1.6"/>
        <circle cx="7" cy="13" r="2.5" fill={active ? 'var(--lav-400)' : 'none'} stroke={active ? 'var(--lav-500)' : 'var(--ink-300)'} strokeWidth="1.5"/>
        <circle cx="17" cy="13" r="2.5" fill={active ? 'var(--lav-400)' : 'none'} stroke={active ? 'var(--lav-500)' : 'var(--ink-300)'} strokeWidth="1.5"/>
        <circle cx="12" cy="17" r="2.5" fill={active ? 'var(--lav-400)' : 'none'} stroke={active ? 'var(--lav-500)' : 'var(--ink-300)'} strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    key: 'write',
    label: '편지',
    href: '/write',
    center: true,
    icon: (_active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="#fff" strokeWidth="1.7"/>
        <path d="M3.5 7.5L12 13.5L20.5 7.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'journey',
    label: '여정',
    href: '/journey',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 16 C6 12, 9 14, 12 10 S18 6, 21 8"
          stroke={active ? 'var(--lav-600)' : 'var(--ink-300)'}
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="6" cy="14" r="1.5" fill={active ? 'var(--lav-600)' : 'var(--ink-200)'}/>
        <circle cx="12" cy="10" r="1.5" fill={active ? 'var(--lav-600)' : 'var(--ink-200)'}/>
        <circle cx="18" cy="7" r="1.5" fill={active ? 'var(--lav-600)' : 'var(--ink-200)'}/>
      </svg>
    ),
  },
  {
    key: 'archive',
    label: '보관함',
    href: '/archive',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect
          x="3" y="6" width="18" height="14" rx="2"
          fill={active ? 'var(--lav-100)' : 'none'}
          stroke={active ? 'var(--lav-600)' : 'var(--ink-300)'}
          strokeWidth="1.6"
        />
        <path d="M3 10h18" stroke={active ? 'var(--lav-500)' : 'var(--ink-300)'} strokeWidth="1.4"/>
        <path d="M9 4h6" stroke={active ? 'var(--lav-600)' : 'var(--ink-300)'} strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M9 14.5h6" stroke={active ? 'var(--lav-500)' : 'var(--ink-200)'} strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 12,
        borderRadius: 26,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 24px rgba(86,52,140,0.12), 0 0 0 0.5px rgba(86,52,140,0.08)',
        display: 'flex',
        alignItems: 'center',
        padding: '6px 4px',
        zIndex: 100,
      }}
    >
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href)

        // 가운데 강조 버튼: +편지 (감정선택 → 편지쓰기 진입)
        if ('center' in tab && tab.center) {
          return (
            <Link
              key={tab.key}
              href={tab.href}
              prefetch={false}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '6px 0',
                textDecoration: 'none',
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                marginTop: -20,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #bca4d6, var(--lav-600))',
                boxShadow: '0 6px 18px rgba(139,107,184,0.4), 0 0 0 4px rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {tab.icon(active)}
              </div>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 10.5,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--lav-600)' : 'var(--ink-300)',
                letterSpacing: '-0.01em',
              }}>
                {tab.label}
              </span>
            </Link>
          )
        }

        return (
          <Link
            key={tab.key}
            href={tab.href}
            prefetch={false}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '6px 0',
              textDecoration: 'none',
            }}
          >
            <div style={{
              width: 42,
              height: 32,
              borderRadius: 14,
              background: active ? 'rgba(111,79,158,0.1)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background .2s',
            }}>
              {tab.icon(active)}
            </div>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 10.5,
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--lav-600)' : 'var(--ink-300)',
              letterSpacing: '-0.01em',
              transition: 'color .2s',
            }}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
