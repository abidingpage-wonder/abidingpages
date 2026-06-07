'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Status = 'loading' | 'success' | 'error'

function ConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey')
    const orderId    = searchParams.get('orderId')
    const amount     = searchParams.get('amount')

    if (!paymentKey || !orderId || !amount) {
      setErrorMsg('잘못된 접근입니다.')
      setStatus('error')
      return
    }

    fetch('/api/payments/toss/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setStatus('success')
        } else {
          setErrorMsg(data.error ?? '결제 승인에 실패했습니다.')
          setStatus('error')
        }
      })
      .catch(() => {
        setErrorMsg('네트워크 오류가 발생했습니다.')
        setStatus('error')
      })
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(180deg, #f7f3fb 0%, #ece4f3 100%)',
        gap: 14,
      }}>
        <div style={{ fontSize: 36 }}>✨</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--lav-800)' }}>
          결제를 확인하는 중...
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(180deg, #f7f3fb 0%, #ece4f3 100%)',
        padding: '0 24px', gap: 16, textAlign: 'center',
      }}>
        <div style={{ fontSize: 36 }}>😢</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--lav-800)' }}>
          결제에 실패했어요
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.6 }}>
          {errorMsg}
        </div>
        <button
          onClick={() => router.push('/plan')}
          style={{
            padding: '12px 28px', borderRadius: 999,
            background: 'var(--lav-500)', color: '#fff', border: 'none',
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          다시 시도하기
        </button>
      </div>
    )
  }

  // success
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #f7f3fb 0%, #ece4f3 100%)',
      padding: '0 24px', gap: 10, textAlign: 'center',
    }}>
      {/* 어바이딩 로고 아이콘 */}
      <div style={{
        width: 80, height: 80, borderRadius: 22,
        overflow: 'hidden', marginBottom: 8,
        boxShadow: '0 8px 28px rgba(86,52,140,0.18)',
      }}>
        <img src="/icons/icon-192x192.png" alt="Abiding" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      <div style={{
        fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 500,
        color: 'var(--lav-800)', lineHeight: 1.5, letterSpacing: '-0.02em',
      }}>
        Pro 시작을<br/>환영해요
      </div>
      <div style={{
        marginTop: 6, fontFamily: 'var(--font-sans)', fontSize: 13,
        color: 'var(--ink-500)', lineHeight: 1.7,
      }}>
        이제 아이와의 49일 여정을<br/>끝까지 함께할 수 있어요.
      </div>

      {/* 결제 요약 카드 */}
      <div style={{
        marginTop: 20, padding: '16px 24px', borderRadius: 18,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)',
        border: '0.5px solid rgba(166,133,199,0.2)',
        width: '100%', maxWidth: 300,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-400)', marginBottom: 3 }}>결제 플랜</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--lav-800)' }}>
              Abiding Pro · 100일
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--peach-500)' }}>
            4,900원
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push('/journey')}
        style={{
          marginTop: 20, width: '100%', maxWidth: 300, padding: '14px', borderRadius: 999, border: 'none',
          background: 'linear-gradient(96deg, var(--lav-600), #8b5cb8)', color: '#fff',
          fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 700,
          boxShadow: '0 8px 24px rgba(86,52,140,0.28)', cursor: 'pointer',
        }}
      >
        여정 시작하기
      </button>
      <button
        onClick={() => router.push('/home')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--ink-400)',
          padding: '8px',
        }}
      >
        홈으로 돌아가기
      </button>
    </div>
  )
}

export default function TossConfirmPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(180deg, #f7f3fb 0%, #ece4f3 100%)',
      }}>
        <div style={{ fontSize: 36 }}>✨</div>
      </div>
    }>
      <ConfirmInner />
    </Suspense>
  )
}
