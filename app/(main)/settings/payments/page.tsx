'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Payment {
  id: string
  orderId: string
  amount: number
  plan: string
  status: string
  paidAt: string
}

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments]     = useState<Payment[]>([])
  const [plan, setPlan]             = useState('free')
  const [planExpires, setPlanExpires] = useState<string | null>(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    fetch('/api/payments/history')
      .then(r => r.json())
      .then(d => {
        setPayments(d.payments ?? [])
        setPlan(d.plan ?? 'free')
        setPlanExpires(d.planExpires ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const isPro = plan === 'pro'
  const expiresLabel = planExpires
    ? new Date(planExpires).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)', paddingBottom: 48 }}>

      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px 10px', position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-app)',
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="var(--lav-700)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#6b6080' }}>
          결제 내역
        </span>
        <div style={{ width: 38 }} />
      </div>

      <div style={{ padding: '8px 20px 32px' }}>

        {/* 현재 플랜 카드 */}
        <div style={{
          padding: '16px 18px', borderRadius: 18, marginBottom: 24,
          background: isPro ? 'linear-gradient(160deg, #2a223f 0%, #524080 100%)' : 'rgba(255,255,255,0.78)',
          border: isPro ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid rgba(166,133,199,0.16)',
          boxShadow: isPro ? '0 4px 20px rgba(86,52,140,0.25)' : '0 2px 12px rgba(86,52,140,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, color: isPro ? 'rgba(255,255,255,0.5)' : 'var(--ink-400)', letterSpacing: '0.08em', marginBottom: 4 }}>
                현재 플랜
              </div>
              <div style={{ fontFamily: 'var(--font-brand)', fontSize: 26, color: isPro ? '#faddca' : 'var(--lav-600)', lineHeight: 1 }}>
                {isPro ? 'Pro' : 'Free'}
              </div>
              {expiresLabel && (
                <div style={{ marginTop: 4, fontFamily: 'var(--font-sans)', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                  {expiresLabel}까지
                </div>
              )}
            </div>
            {!isPro && (
              <button
                onClick={() => router.push('/plan')}
                style={{
                  padding: '9px 16px', borderRadius: 999, border: 'none',
                  background: 'var(--peach-400)', color: '#fff',
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(249,156,105,0.3)',
                }}
              >
                Pro 시작
              </button>
            )}
          </div>
        </div>

        {/* 결제 내역 리스트 */}
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', letterSpacing: '0.08em', marginBottom: 12 }}>
          결제 내역
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-400)' }}>
            불러오는 중…
          </div>
        ) : payments.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            borderRadius: 16, background: 'rgba(255,255,255,0.6)',
            border: '0.5px solid rgba(166,133,199,0.16)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>💳</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--lav-700)', fontWeight: 600 }}>
              아직 결제 내역이 없어요
            </div>
            <div style={{ marginTop: 6, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-400)' }}>
              Pro 플랜을 시작하면 여기에 기록돼요
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {payments.map(p => (
              <div key={p.id} style={{
                padding: '14px 16px', borderRadius: 14,
                background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
                border: '0.5px solid rgba(166,133,199,0.16)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--lav-800)' }}>
                    Abiding Pro · 100일
                  </div>
                  <div style={{ marginTop: 2, fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--ink-400)' }}>
                    {new Date(p.paidAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'var(--lav-800)' }}>
                    {p.amount.toLocaleString()}원
                  </div>
                  <div style={{
                    marginTop: 2, fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600,
                    color: p.status === 'success' ? '#2e7d32' : '#c62828',
                    background: p.status === 'success' ? 'rgba(46,125,50,0.1)' : 'rgba(198,40,40,0.1)',
                    padding: '2px 8px', borderRadius: 999,
                  }}>
                    {p.status === 'success' ? '결제 완료' : '실패'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 하단 액션 */}
        {isPro ? (
          <button
            onClick={() => { window.location.href = 'mailto:abiding.pages26@gmail.com?subject=결제 취소 문의' }}
            style={{
              marginTop: 28, width: '100%', padding: '15px', borderRadius: 999,
              border: '1px solid rgba(166,133,199,0.3)', background: 'transparent',
              color: 'var(--lav-600)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            결제 취소 문의하기
          </button>
        ) : (
          <button
            onClick={() => router.push('/plan')}
            style={{
              marginTop: 28, width: '100%', padding: '16px', borderRadius: 999, border: 'none',
              background: 'var(--lav-600)', color: '#fff',
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700,
              boxShadow: '0 6px 18px rgba(86,52,140,0.25)', cursor: 'pointer',
            }}
          >
            Pro 시작하기
          </button>
        )}
      </div>
    </div>
  )
}
