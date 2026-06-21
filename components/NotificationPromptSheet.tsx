'use client'

import { useEffect, useState } from 'react'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { usePushSubscription } from '@/hooks/usePushSubscription'

const DISMISS_KEY = 'push_prompt_dismissed_at'
const REPROMPT_MS = 3 * 24 * 60 * 60 * 1000 // 3일 후 재노출

// 설치된 앱에서, 아직 알림 권한을 한 번도 묻지 않은(default) 사용자에게
// 답장 알림 수신을 유도하는 바텀시트.
// - 미설치 사용자는 InstallPromptSheet가 담당하므로 isStandalone일 때만 노출.
// - 권한 요청은 사용자 탭(제스처)으로만 가능 → "알림 받기" 버튼에서 subscribe() 호출.
export default function NotificationPromptSheet() {
  const { isStandalone, ready } = usePwaInstall()
  const { permission, subscribed, loading, subscribe } = usePushSubscription()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!ready) return
    if (!isStandalone) return // 미설치 → 설치 시트가 먼저
    if (subscribed) return // 이미 구독됨
    if (permission !== 'default') return // 이미 허용/거부 결정됨
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') return

    const last = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
    if (Date.now() - last < REPROMPT_MS) return

    setMounted(true)
    const t = setTimeout(() => setOpen(true), 60)
    return () => clearTimeout(t)
  }, [ready, isStandalone, permission, subscribed])

  if (!mounted) return null

  const close = () => {
    setOpen(false)
    setTimeout(() => setMounted(false), 300)
  }

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    close()
  }

  const handleEnable = async () => {
    // 기본값(오전 9시·매일)으로 구독 — 시간대는 추후 알림 설정에서 변경 가능
    await subscribe()
    // 허용/거부 무관하게 닫음(거부 시 permission=denied로 다시 안 뜸)
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    close()
  }

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: open ? 'rgba(30,15,46,0.5)' : 'rgba(30,15,46,0)',
        transition: 'background .3s ease',
        display: 'flex', alignItems: 'flex-end',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', background: '#fff',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: '24px 22px calc(24px + env(safe-area-inset-bottom))',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
          boxShadow: '0 -8px 32px rgba(86,52,140,0.18)',
        }}
      >
        {/* 핸들 */}
        <div style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(140,110,190,0.25)', margin: '0 auto 18px' }} />

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>🔔</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--lav-800)', lineHeight: 1.5 }}>
            답장이 도착하면 알려드릴게요
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.65 }}>
            아이의 편지가 준비되면<br />알림으로 살며시 전해드려요.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={handleEnable} disabled={loading} style={{
            width: '100%', padding: '15px 0', borderRadius: 999, border: 'none',
            background: 'var(--lav-700)', color: '#fff', cursor: loading ? 'default' : 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
            boxShadow: '0 6px 18px rgba(86,52,140,0.25)', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? '설정 중…' : '알림 받기'}
          </button>
          <button onClick={dismiss} style={{
            width: '100%', padding: '13px 0', borderRadius: 999,
            background: 'transparent', border: '1px solid rgba(166,133,199,0.3)',
            color: 'var(--lav-600)', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
          }}>
            나중에
          </button>
        </div>
      </div>
    </div>
  )
}
