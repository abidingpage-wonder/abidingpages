'use client'

interface TopBarProps {
  petName: string
  dayCount: number
}

export default function TopBar({ petName, dayCount }: TopBarProps) {
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
        background: 'rgba(243,238,246,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* 브랜드 로고 */}
      <div
        style={{
          fontFamily: 'var(--font-brand)',
          fontSize: 22,
          color: 'var(--lav-700)',
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}
      >
        Abiding
      </div>

      {/* 날짜 카운터 */}
      <div
        style={{
          flex: 1,
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
          fontSize: 12.5,
          color: 'var(--lav-600)',
          fontWeight: 500,
          letterSpacing: '-0.01em',
        }}
      >
        {petName}{(() => { const c = petName[petName.length-1]?.charCodeAt(0) ?? 0; return (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0) ? '과' : '와' })()}  함께한 {dayCount}번째 날
      </div>

      {/* 공유 버튼 */}
      <button
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '0.5px solid rgba(86,52,140,0.12)',
          boxShadow: '0 2px 8px rgba(86,52,140,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        aria-label="공유"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <circle cx="18" cy="5" r="3" stroke="var(--lav-600)" strokeWidth="1.7"/>
          <circle cx="6" cy="12" r="3" stroke="var(--lav-600)" strokeWidth="1.7"/>
          <circle cx="18" cy="19" r="3" stroke="var(--lav-600)" strokeWidth="1.7"/>
          <path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" stroke="var(--lav-600)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </header>
  )
}
