'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LetterSentPage() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // 애니메이션 in
    const t = setTimeout(() => setVisible(true), 80)
    // 3초 후 홈으로
    const t2 = setTimeout(() => router.replace('/home'), 3200)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [router])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
      padding: '32px 24px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.55s ease, transform 0.55s ease',
    }}>
      {/* 봉투 아이콘 */}
      <div style={{
        width: 80, height: 80,
        borderRadius: '50%',
        background: 'rgba(251,180,137,0.16)',
        border: '1px solid rgba(251,180,137,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        fontSize: 36,
      }}>
        ✉️
      </div>

      <div style={{
        fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600,
        color: 'var(--lav-900)', letterSpacing: '-0.02em',
        marginBottom: 10, textAlign: 'center',
      }}>
        편지를 보냈어요
      </div>

      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: 14,
        color: 'var(--ink-500)', lineHeight: 1.7, textAlign: 'center',
        maxWidth: 260,
      }}>
        오늘의 마음을 잘 전달했어요.<br/>
        잠시 후 답장이 도착할 거예요.
      </div>

      <div style={{
        marginTop: 40,
        fontFamily: 'var(--font-sans)', fontSize: 12,
        color: 'var(--ink-300)',
      }}>
        홈으로 돌아가는 중...
      </div>
    </div>
  )
}
