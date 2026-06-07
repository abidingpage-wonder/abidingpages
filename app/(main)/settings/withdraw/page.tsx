'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const REASONS = [
  '아이와의 여정을 마쳤어요',
  '앱 사용이 불편해요',
  '잠시 쉬고 싶어요',
  '기타',
]

export default function WithdrawPage() {
  const router = useRouter()
  const [reason, setReason]     = useState('')
  const [agreed, setAgreed]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [confirm, setConfirm]   = useState(false) // 최종 확인 모달

  async function handleWithdraw() {
    if (!agreed || loading) return
    setLoading(true)
    try {
      await fetch('/api/users/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const supabase = createClient()
      await supabase.auth.signOut()
      router.replace('/login')
    } catch {
      setLoading(false)
    }
  }

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
          회원 탈퇴
        </span>
        <div style={{ width: 38 }} />
      </div>

      <div style={{ padding: '16px 24px 32px' }}>

        {/* 안내 */}
        <div style={{ textAlign: 'center', padding: '16px 0 28px' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>🌿</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 500, color: 'var(--lav-800)', lineHeight: 1.55 }}>
            아이와 함께한<br />시간이 담겨 있어요
          </div>
          <div style={{ marginTop: 10, fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--ink-500)', lineHeight: 1.7 }}>
            탈퇴하면 모든 편지와 기록이 삭제되며<br />복구할 수 없어요.
          </div>
        </div>

        {/* 탈퇴 이유 */}
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', letterSpacing: '0.08em', marginBottom: 12 }}>
          탈퇴 이유
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {REASONS.map(r => (
            <button
              key={r}
              onClick={() => setReason(r)}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                background: reason === r ? 'rgba(139,107,184,0.1)' : 'rgba(255,255,255,0.7)',
                border: `1px solid ${reason === r ? 'var(--lav-400)' : 'rgba(166,133,199,0.2)'}`,
                transition: 'all .15s',
              }}
            >
              {/* 라디오 */}
              <span style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${reason === r ? 'var(--lav-500)' : 'rgba(166,133,199,0.4)'}`,
                background: reason === r ? 'var(--lav-500)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {reason === r && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'block' }} />}
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: reason === r ? 600 : 400, color: 'var(--lav-800)' }}>
                {r}
              </span>
            </button>
          ))}
        </div>

        {/* 동의 체크박스 */}
        <div
          onClick={() => setAgreed(p => !p)}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
            padding: '14px 16px', borderRadius: 14,
            background: agreed ? 'rgba(198,40,40,0.05)' : 'rgba(255,255,255,0.6)',
            border: `1px solid ${agreed ? 'rgba(198,40,40,0.25)' : 'rgba(166,133,199,0.2)'}`,
            marginBottom: 28,
          }}
        >
          <span style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
            border: `2px solid ${agreed ? '#c0392b' : 'rgba(166,133,199,0.4)'}`,
            background: agreed ? '#c0392b' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}>
            {agreed && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l4 4 10-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--ink-600)', lineHeight: 1.65 }}>
            모든 편지, 답장, 기록이 삭제되며 복구할 수 없다는 것을 확인했어요.
          </span>
        </div>

        {/* 탈퇴 버튼 */}
        <button
          disabled={!agreed || loading}
          onClick={() => setConfirm(true)}
          style={{
            width: '100%', padding: '16px', borderRadius: 999, border: 'none',
            background: agreed ? '#c0392b' : 'rgba(166,133,199,0.25)',
            color: agreed ? '#fff' : 'var(--lav-400)',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700,
            cursor: agreed && !loading ? 'pointer' : 'default', transition: 'all .18s',
          }}
        >
          탈퇴하기
        </button>

        <button
          onClick={() => router.back()}
          style={{
            marginTop: 12, width: '100%', padding: '15px', borderRadius: 999,
            border: '1px solid rgba(166,133,199,0.3)', background: 'transparent',
            color: 'var(--lav-600)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          돌아가기
        </button>
      </div>

      {/* 최종 확인 모달 */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div onClick={() => setConfirm(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(40,20,60,0.5)' }} />
          <div style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            background: '#fff', borderRadius: 24, padding: '28px 24px 20px',
            width: 'calc(100% - 48px)', maxWidth: 320, textAlign: 'center',
          }}>
            <div style={{ fontSize: 30, marginBottom: 12 }}>😢</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--lav-800)', marginBottom: 8 }}>
              정말 탈퇴하시겠어요?
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--ink-500)', lineHeight: 1.65, marginBottom: 24 }}>
              아이와 함께한 모든 기록이 삭제돼요.<br />이 작업은 되돌릴 수 없어요.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirm(false)}
                style={{
                  flex: 1, padding: '13px', borderRadius: 999,
                  border: '1px solid rgba(166,133,199,0.3)', background: 'transparent',
                  color: 'var(--lav-600)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleWithdraw}
                disabled={loading}
                style={{
                  flex: 1, padding: '13px', borderRadius: 999, border: 'none',
                  background: '#c0392b', color: '#fff',
                  fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700,
                  cursor: loading ? 'default' : 'pointer',
                }}
              >
                {loading ? '처리 중…' : '탈퇴 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
