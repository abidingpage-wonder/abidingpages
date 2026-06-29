'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { detectInApp, inAppLabel, openInExternalBrowser, type InAppKind } from '@/lib/inapp'

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.',
  access_denied: '로그인이 취소됐어요. 다시 시도해 주세요.',
  server_error: '카카오 서버에 일시적 문제가 있어요. 잠시 후 다시 시도해 주세요.',
}

export default function LoginPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inApp, setInApp] = useState<InAppKind | null>(null)
  const [copied, setCopied] = useState(false)

  // URL 의 ?error= 와 인앱 브라우저 여부를 마운트 시 1회 확인 (Suspense 경계 불필요)
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error')
    if (code) setError(ERROR_MESSAGES[code] ?? '로그인 중 문제가 생겼어요. 다시 시도해 주세요.')
    setInApp(detectInApp())
  }, [])

  async function handleKakaoLogin() {
    if (loading) return
    setLoading(true)
    setError(null)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    // 성공 시 카카오로 리다이렉트되어 이 줄에 도달하지 않음. 도달했다면 실패.
    if (oauthError) {
      setError('로그인을 시작하지 못했어요. 다시 시도해 주세요.')
      setLoading(false)
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      className="paper-tex-cool"
      style={{ width: '100%', height: '100dvh', position: 'relative', overflow: 'hidden' }}
    >
      {/* soft floating lights */}
      <div style={{
        position: 'absolute', top: -60, left: -40, width: 280, height: 280,
        background: 'radial-gradient(circle, rgba(250,221,202,0.55), transparent 70%)',
        filter: 'blur(20px)',
      }} />
      <div style={{
        position: 'absolute', bottom: -80, right: -50, width: 320, height: 320,
        background: 'radial-gradient(circle, rgba(166,133,199,0.3), transparent 70%)',
        filter: 'blur(30px)',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '82px 32px 36px',
      }}>
        {/* 로고마크 */}
        <div style={{
          width: 78, height: 78, borderRadius: '50%',
          background: 'rgba(255,255,255,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/logo_heart.svg" alt="Abiding 로고" width={48} height={48} style={{ objectFit: 'contain' }} />
        </div>

        {/* 브랜드 */}
        <div style={{
          marginTop: 16,
          fontFamily: 'var(--font-brand)',
          fontSize: 62,
          color: 'var(--lav-700)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          Abiding
        </div>
        <div style={{
          marginTop: 10,
          fontFamily: 'var(--font-serif)',
          fontSize: 12,
          color: 'var(--lav-600)',
          letterSpacing: '0.34em',
          fontWeight: 400,
        }}>
          반려동물 상실 동행 · 어바이딩
        </div>

        {/* 카피 */}
        <div style={{
          marginTop: 38,
          fontFamily: 'var(--font-serif)',
          fontSize: 17,
          color: 'var(--ink-700)',
          textAlign: 'center',
          lineHeight: 1.85,
          letterSpacing: '-0.01em',
        }}>
          곁에 머무는 마음,<br />그리고 지속되는 사랑의 여정.
        </div>

        <div style={{ flex: 1 }} />

        {/* 인앱 브라우저 안내 — 인스타/스레드 등 webview 에서 OAuth 제한 회피 */}
        {inApp && (
          <div style={{
            width: '100%', marginBottom: 14, padding: '13px 14px', borderRadius: 14,
            background: 'rgba(255,255,255,0.7)', border: '0.5px solid var(--peach-300)',
          }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.5 }}>
              {inAppLabel(inApp)} 인앱 브라우저에서는 로그인이 막힐 수 있어요.
            </div>
            <div style={{ marginTop: 4, fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--ink-500)', lineHeight: 1.6 }}>
              Safari·Chrome 같은 기본 브라우저로 열어주세요.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                onClick={() => openInExternalBrowser()}
                style={{
                  flex: 1, padding: '9px', border: 'none', borderRadius: 10,
                  background: 'var(--lav-600)', color: '#fff',
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                기본 브라우저로 열기
              </button>
              <button
                onClick={handleCopyLink}
                style={{
                  flex: 1, padding: '9px', borderRadius: 10,
                  background: 'transparent', border: '1px solid var(--lav-300)', color: 'var(--lav-700)',
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {copied ? '복사됨!' : '주소 복사'}
              </button>
            </div>
          </div>
        )}

        {/* 오류 안내 배너 */}
        {error && (
          <div role="alert" style={{
            width: '100%', marginBottom: 12, padding: '11px 14px', borderRadius: 12,
            background: 'rgba(234,126,74,0.10)', border: '0.5px solid rgba(234,126,74,0.4)',
            fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--peach-500)',
            textAlign: 'center', lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        <div style={{
          width: '100%',
          fontFamily: 'var(--font-sans)',
          fontSize: 11.5,
          color: 'var(--ink-500)',
          textAlign: 'center',
          marginBottom: 14,
        }}>
          진행 상황을 저장하려면 계정을 만드세요.
        </div>

        {/* 카카오 로그인 버튼 */}
        <button
          onClick={handleKakaoLogin}
          disabled={loading}
          aria-busy={loading}
          style={{
            width: '100%', padding: '14px', border: 'none', borderRadius: 14,
            background: '#FEE500', color: '#191919',
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 10, cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <span style={{
                width: 16, height: 16, borderRadius: '50%',
                border: '2px solid rgba(25,25,25,0.3)', borderTopColor: '#191919',
                display: 'inline-block', animation: 'spin 0.8s linear infinite',
              }} />
              연결 중…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 4C6.5 4 2 7.6 2 12c0 2.8 1.8 5.2 4.5 6.6L5.5 22l4.2-2.5c.8.1 1.5.2 2.3.2 5.5 0 10-3.6 10-8s-4.5-7.7-10-7.7z"
                  fill="#191919"
                />
              </svg>
              카카오로 시작하기
            </>
          )}
        </button>

        <p style={{
          marginTop: 20, fontFamily: 'var(--font-sans)', fontSize: 11,
          color: 'var(--ink-300)', textAlign: 'center', lineHeight: 1.7,
        }}>
          계속 진행하면 서비스 이용약관 및<br />개인정보 처리방침에 동의하는 것으로 간주합니다.
        </p>

        {/* 개발 모드 전용 우회 로그인 */}
        {process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true' && (
          <a
            href="/auth/dev-login"
            style={{
              marginTop: 24, display: 'block', textAlign: 'center',
              fontFamily: 'var(--font-sans)', fontSize: 11,
              color: 'var(--lav-400)', textDecoration: 'underline',
              opacity: 0.6,
            }}
          >
            [개발] 카카오 없이 로그인
          </a>
        )}
      </div>
    </div>
  )
}
