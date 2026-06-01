'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const NIGHT_BG = 'linear-gradient(180deg, #1c0f2e 0%, #2a1c44 38%, #574a7e 72%, #8d80ab 100%)'

function SentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const letterId = searchParams.get('letterId')

  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState<'sending' | 'done'>('sending')

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!letterId) {
      // letterId 없으면 3초 후 홈으로
      const t = setTimeout(() => router.replace('/home'), 3000)
      return () => clearTimeout(t)
    }

    // AI 답장 생성 요청
    fetch('/api/replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ letterId }),
    })
      .then(() => setStatus('done'))
      .catch(() => setStatus('done'))
      .finally(() => {
        // 답장 생성 완료 후 2초 뒤 홈으로
        setTimeout(() => router.replace('/home'), 2000)
      })
  }, [letterId, router])

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

      {/* 별 파티클 */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 3 === 0 ? 3 : 2,
            height: i % 3 === 0 ? 3 : 2,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
            top: `${10 + (i * 17) % 70}%`,
            left: `${5 + (i * 23) % 90}%`,
            opacity: 0.4 + (i % 5) * 0.12,
          }} />
        ))}
      </div>

      {/* 봉투 아이콘 */}
      <div style={{
        width: 88, height: 88,
        borderRadius: '50%',
        background: status === 'done'
          ? 'rgba(251,180,137,0.22)'
          : 'rgba(255,255,255,0.08)',
        border: `1px solid ${status === 'done' ? 'rgba(251,180,137,0.45)' : 'rgba(255,255,255,0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28,
        fontSize: 38,
        transition: 'all 0.5s ease',
      }}>
        {status === 'done' ? '✉️' : '📝'}
      </div>

      <div style={{
        fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600,
        color: '#fff', letterSpacing: '-0.02em',
        marginBottom: 10, textAlign: 'center',
        transition: 'opacity 0.4s ease',
      }}>
        {status === 'done' ? '편지를 보냈어요' : '편지를 전달하는 중...'}
      </div>

      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: 14,
        color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, textAlign: 'center',
        maxWidth: 260,
      }}>
        {status === 'done'
          ? <>오늘의 마음을 잘 전달했어요.<br />잠시 후 답장이 도착할 거예요.</>
          : <>하늘로 편지를 전달하고 있어요.<br />잠시만 기다려주세요.</>
        }
      </div>

      {/* 로딩 도트 */}
      {status === 'sending' && (
        <div style={{
          marginTop: 28,
          display: 'flex', gap: 6,
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'rgba(255,255,255,0.4)',
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>

      {status === 'done' && (
        <div style={{
          marginTop: 36,
          fontFamily: 'var(--font-sans)', fontSize: 12,
          color: 'rgba(255,255,255,0.3)',
        }}>
          홈으로 돌아가는 중...
        </div>
      )}
    </div>
  )
}

export default function LetterSentPage() {
  return (
    <div style={{
      minHeight: '100%',
      position: 'relative',
    }}>
      <div style={{
        position: 'fixed', inset: 0,
        background: NIGHT_BG,
        zIndex: -1,
      }} />
      <Suspense>
        <SentContent />
      </Suspense>
    </div>
  )
}
