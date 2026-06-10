'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PlanInfo {
  plan: string
  planExpires: string | null
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
      color: 'var(--ink-400)', letterSpacing: '0.08em',
      marginTop: 20, marginBottom: 8, paddingLeft: 4,
    }}>
      {children}
    </div>
  )
}

function MenuItem({
  icon, label, sub, onClick, accent, danger, hideArrow,
}: {
  icon: string; label: string; sub?: string
  onClick?: () => void; accent?: boolean; danger?: boolean; hideArrow?: boolean
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 16px', borderRadius: 14, marginBottom: 6,
        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
        border: '0.5px solid rgba(166,133,199,0.16)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: accent
          ? 'linear-gradient(135deg, #faddca, #f5c4a7)'
          : danger ? 'rgba(220,50,50,0.08)' : 'var(--lav-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600,
          color: accent ? 'var(--peach-600)' : danger ? '#c0392b' : 'var(--lav-800)',
        }}>
          {label}
        </div>
        {sub && (
          <div style={{ marginTop: 1, fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-400)' }}>
            {sub}
          </div>
        )}
      </div>
      {onClick && !hideArrow && (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M9 5l7 7-7 7" stroke="var(--lav-400)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [planInfo, setPlanInfo] = useState<PlanInfo>({ plan: 'free', planExpires: null })

  useEffect(() => {
    fetch('/api/payments/plan')
      .then(r => r.json())
      .then(d => setPlanInfo({ plan: d.plan ?? 'free', planExpires: d.planExpires ?? null }))
      .catch(() => {})
  }, [])

  const isPro = planInfo.plan === 'pro'
  const expiresLabel = planInfo.planExpires
    ? `${new Date(planInfo.planExpires).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}까지`
    : null

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)', position: 'relative' }}>

      {/* 헤더 그라데이션 */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 200, zIndex: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, #ece4f3 0%, transparent 100%)',
      }}/>

      <div style={{ position: 'relative', zIndex: 1, padding: '8px 20px 48px' }}>

        {/* 타이틀 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 500, color: 'var(--lav-800)' }}>
            내 정보
          </div>
        </div>

        {/* 현재 플랜 카드 */}
        <div style={{
          padding: '16px 18px', borderRadius: 18, marginBottom: 4,
          background: isPro
            ? 'linear-gradient(160deg, #2a223f 0%, #524080 100%)'
            : 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(12px)',
          border: isPro ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid rgba(166,133,199,0.16)',
          boxShadow: isPro ? '0 4px 20px rgba(86,52,140,0.25)' : '0 2px 12px rgba(86,52,140,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, color: isPro ? 'rgba(255,255,255,0.5)' : 'var(--ink-400)', letterSpacing: '0.08em', marginBottom: 4 }}>
                현재 플랜
              </div>
              <div style={{ fontFamily: 'var(--font-brand)', fontSize: 28, color: isPro ? '#faddca' : 'var(--lav-600)', lineHeight: 1 }}>
                {isPro ? 'Pro' : 'Free'}
              </div>
              {expiresLabel && (
                <div style={{ marginTop: 4, fontFamily: 'var(--font-sans)', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  {expiresLabel}
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

        {/* 아이의 정보 */}
        <SectionLabel>아이의 정보</SectionLabel>
        <MenuItem
          icon="🐾" label="아이 정보 수정"
          onClick={() => router.push('/settings/pet')}
        />

        {/* 알림 & 앱 */}
        <SectionLabel>알림 & 앱</SectionLabel>
        <MenuItem
          icon="🔔" label="알림 설정"
          onClick={() => router.push('/settings/notifications')}
        />
        <MenuItem
          icon="📱" label="홈화면에 추가"
          sub="앱처럼 설치하기"
          onClick={() => router.push('/settings/install')}
        />

        {/* 결제 & 플랜 */}
        <SectionLabel>결제 & 플랜</SectionLabel>
        <MenuItem
          icon="💳" label="결제 내역"
          onClick={() => router.push('/settings/payments')}
        />

        {/* 계정 */}
        <SectionLabel>계정</SectionLabel>
        <MenuItem
          icon="📄" label="이용약관 · 개인정보"
          onClick={() => window.open('#', '_blank')}
        />
        <MenuItem
          icon="💬" label="문의하기"
          sub="abiding.pages26@gmail.com"
          onClick={() => { window.location.href = 'mailto:abiding.pages26@gmail.com' }}
        />
        <MenuItem
          icon="🚪" label="로그아웃"
          onClick={handleLogout}
          hideArrow
        />

      </div>
    </div>
  )
}
