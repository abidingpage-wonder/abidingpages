'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function FailInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('code') ?? ''
  const errorMsg  = searchParams.get('message') ?? '결제 중 오류가 발생했습니다.'

  const isCancel = errorCode === 'PAY_PROCESS_CANCELED'

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #f7f3fb 0%, #ece4f3 100%)',
      padding: '0 24px', gap: 16, textAlign: 'center',
    }}>
      <div style={{ fontSize: 40 }}>{isCancel ? '🌿' : '😢'}</div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--lav-800)' }}>
        {isCancel ? '결제를 취소했어요' : '결제에 실패했어요'}
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.6 }}>
        {isCancel ? '언제든 다시 시작할 수 있어요.' : errorMsg}
      </div>
      <button
        onClick={() => router.push('/plan')}
        style={{
          marginTop: 8, padding: '12px 28px', borderRadius: 999,
          background: 'var(--lav-500)', color: '#fff', border: 'none',
          fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}
      >
        플랜 화면으로 돌아가기
      </button>
      <button
        onClick={() => router.push('/home')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--ink-400)', padding: '8px',
        }}
      >
        홈으로
      </button>
    </div>
  )
}

export default function TossFailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: 'linear-gradient(180deg, #f7f3fb 0%, #ece4f3 100%)' }}/>}>
      <FailInner />
    </Suspense>
  )
}
