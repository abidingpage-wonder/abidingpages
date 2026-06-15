'use client'

import { usePathname, useRouter } from 'next/navigation'

interface TopBarProps {
  petName: string
  dayCount: number
}

export default function TopBar({ petName, dayCount }: TopBarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  // 정원 페이지: hero 위에 투명하게 오버레이
  const isGarden = pathname.startsWith('/garden')
  // 여정/보관함: 하단바에서 내정보가 빠지므로 헤더에서 내정보 진입 제공
  const showProfile = pathname.startsWith('/journey') || pathname.startsWith('/archive')

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px 10px',
        minHeight: 64,
        background: isGarden ? 'transparent' : 'rgba(243,238,246,0.92)',
        backdropFilter: isGarden ? 'none' : 'blur(16px)',
        WebkitBackdropFilter: isGarden ? 'none' : 'blur(16px)',
        transition: 'background 0.3s ease',
      }}
    >
      {/* 브랜드 로고 */}
      <div
        style={{
          fontFamily: 'var(--font-brand)',
          fontSize: 22,
          color: isGarden ? 'rgba(243,232,222,0.9)' : 'var(--lav-700)',
          letterSpacing: '0.02em',
          lineHeight: 1,
          transition: 'color 0.3s ease',
        }}
      >
        Abiding
      </div>

      <div style={{ flex: 1 }} />

      {/* 우측 버튼: 여정/보관함 = 내정보, 그 외 = 공유 */}
      <button
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: isGarden ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: isGarden ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(86,52,140,0.12)',
          boxShadow: '0 2px 8px rgba(86,52,140,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background 0.3s ease',
        }}
        aria-label={showProfile ? '내정보' : '공유'}
        onClick={() => router.push(showProfile ? '/profile' : '/share')}
      >
        {showProfile ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="var(--lav-600)" strokeWidth="1.7"/>
            <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="var(--lav-600)" strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <circle cx="18" cy="5" r="3" stroke={isGarden ? 'rgba(243,232,222,0.85)' : 'var(--lav-600)'} strokeWidth="1.7"/>
            <circle cx="6" cy="12" r="3" stroke={isGarden ? 'rgba(243,232,222,0.85)' : 'var(--lav-600)'} strokeWidth="1.7"/>
            <circle cx="18" cy="19" r="3" stroke={isGarden ? 'rgba(243,232,222,0.85)' : 'var(--lav-600)'} strokeWidth="1.7"/>
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" stroke={isGarden ? 'rgba(243,232,222,0.85)' : 'var(--lav-600)'} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </header>
  )
}
