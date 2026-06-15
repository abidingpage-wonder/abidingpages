'use client'

interface SpinnerProps {
  size?: number
  /** 다크 배경(밤하늘 등) 위에서는 흰색 트랙 사용 */
  dark?: boolean
  label?: string
}

/** 회전 스피너 — globals.css의 @keyframes spin 사용 */
export default function Spinner({ size = 28, dark = false, label }: SpinnerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `${Math.max(2, Math.round(size / 11))}px solid ${dark ? 'rgba(255,255,255,0.18)' : 'rgba(166,133,199,0.2)'}`,
        borderTopColor: dark ? 'rgba(255,255,255,0.85)' : 'var(--lav-500)',
        animation: 'spin 0.7s linear infinite',
      }}/>
      {label && (
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 12.5,
          color: dark ? 'rgba(255,255,255,0.55)' : 'var(--ink-300)',
          letterSpacing: '-0.01em',
        }}>
          {label}
        </span>
      )}
    </div>
  )
}

/** 페이지 전체 중앙 스피너 */
export function FullPageSpinner({ dark = false, label, minHeight = '60dvh' }: SpinnerProps & { minHeight?: string | number }) {
  return (
    <div style={{
      minHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Spinner size={32} dark={dark} label={label} />
    </div>
  )
}
