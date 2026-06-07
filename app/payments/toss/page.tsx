'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadTossPayments } from '@tosspayments/payment-sdk'

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? ''
const AMOUNT     = 4900
const ORDER_NAME = 'Abiding Pro · 100일'

export default function TossPaymentPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!CLIENT_KEY) {
      setError('결제 키가 설정되지 않았습니다. 관리자에게 문의해주세요.')
      setLoading(false)
      return
    }

    async function initPayment() {
      try {
        // 주문 ID 생성: 중복 방지용 타임스탬프 기반
        const orderId = `abiding-pro-${Date.now()}`

        const tossPayments = await loadTossPayments(CLIENT_KEY)
        await tossPayments.requestPayment('카드', {
          amount: AMOUNT,
          orderId,
          orderName: ORDER_NAME,
          customerName: '구매자',
          successUrl: `${window.location.origin}/payments/toss/confirm`,
          failUrl: `${window.location.origin}/payments/toss/fail`,
        })
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string }
        // 사용자 취소는 에러로 표시하지 않고 뒤로가기
        if (e?.code === 'USER_CANCEL') {
          router.back()
          return
        }
        setError(e?.message ?? '결제 중 오류가 발생했습니다.')
        setLoading(false)
      }
    }

    initPayment()
  }, [router])

  if (error) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(180deg, #f7f3fb 0%, #ece4f3 100%)',
        padding: '0 24px', gap: 16, textAlign: 'center',
      }}>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--lav-800)' }}>
          결제를 진행할 수 없어요
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.6 }}>
          {error}
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
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #f7f3fb 0%, #ece4f3 100%)',
      gap: 14,
    }}>
      {loading && (
        <>
          <div style={{ fontSize: 36 }}>💳</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--lav-800)' }}>
            결제창을 불러오는 중...
          </div>
        </>
      )}
    </div>
  )
}
