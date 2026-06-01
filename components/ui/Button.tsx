'use client'

import { ButtonHTMLAttributes } from 'react'

interface SoftCTAButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  fullWidth?: boolean
}

/** 권유형 Soft CTA 버튼 — 피치 그라데이션, 둥근 모서리 */
export function SoftCTAButton({
  children,
  icon,
  fullWidth = true,
  style,
  ...props
}: SoftCTAButtonProps) {
  return (
    <button
      {...props}
      style={{
        width: fullWidth ? '100%' : undefined,
        padding: '15px 24px',
        borderRadius: 14,
        background: 'linear-gradient(135deg, #fcc49a 0%, #f99c69 100%)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: 600,
        color: '#6b3e1e',
        letterSpacing: '-0.01em',
        boxShadow: '0 2px 12px rgba(249,156,105,0.28)',
        ...style,
      }}
    >
      {icon && <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>}
      {children}
    </button>
  )
}
