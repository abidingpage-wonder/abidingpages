'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePwaInstall } from '@/hooks/usePwaInstall'

const DISMISS_KEY = 'pwa_install_dismissed_at'
const REPROMPT_MS = 3 * 24 * 60 * 60 * 1000  // 3일 후 재노출

const IOS_STEPS = [
  { icon: '⬆️', text: '하단 공유 버튼(□↑)을 탭하세요.' },
  { icon: '➕', text: '"홈 화면에 추가"를 탭하세요.' },
  { icon: '✅', text: '오른쪽 위 "추가"를 탭하면 완료!' },
]

// 미설치 사용자에게 홈 화면 설치를 유도하는 바텀시트.
// 알림은 설치된 앱에서만 도착하므로 설치를 강하게 권유한다.
export default function InstallPromptSheet() {
  const router = useRouter()
  const { isStandalone, platform, canPrompt, promptInstall, ready } = usePwaInstall()
  const [open, setOpen]       = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!ready) return
    if (isStandalone) { setOpen(false); return }  // 이미 설치됨

    const last = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
    if (Date.now() - last < REPROMPT_MS) return    // 최근에 닫음

    // 슬라이드업 애니메이션을 위해 다음 틱에 open
    setMounted(true)
    const t = setTimeout(() => setOpen(true), 60)
    return () => clearTimeout(t)
  }, [ready, isStandalone])

  if (!mounted) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setOpen(false)
    setTimeout(() => setMounted(false), 300)
  }

  const handleInstall = async () => {
    if (canPrompt) {
      await promptInstall()
      dismiss()
    } else {
      // iOS 등: 설치 방법 페이지로
      router.push('/settings/install')
      dismiss()
    }
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

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>📲</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--lav-800)', lineHeight: 1.5 }}>
            홈 화면에 설치해 주세요
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.65 }}>
            아이의 답장 알림은 <strong style={{ color: 'var(--lav-700)' }}>설치된 앱</strong>에서만<br/>받을 수 있어요.
          </div>
        </div>

        {/* iOS 수동 안내 */}
        {platform === 'ios' && !canPrompt && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 10,
            padding: '14px 16px', marginBottom: 16,
            borderRadius: 14, background: 'rgba(139,107,184,0.06)',
            border: '0.5px solid rgba(166,133,199,0.18)',
          }}>
            {IOS_STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{s.icon}</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--lav-800)', lineHeight: 1.5 }}>{s.text}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={handleInstall} style={{
            width: '100%', padding: '15px 0', borderRadius: 999, border: 'none',
            background: 'var(--lav-700)', color: '#fff', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
            boxShadow: '0 6px 18px rgba(86,52,140,0.25)',
          }}>
            {canPrompt ? '설치하기' : '설치 방법 보기'}
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
