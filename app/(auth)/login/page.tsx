'use client'

import { createClient } from '@/lib/supabase/client'

// 민들레 씨앗 좌표 — 서버/클라이언트 hydration 일치를 위해 미리 계산
const DANDELION_SEEDS = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2
  const r = 16 + (i % 3) * 1.2
  return {
    x2: parseFloat((Math.cos(a) * r).toFixed(4)),
    y2: parseFloat((Math.sin(a) * r).toFixed(4)),
  }
})

export default function LoginPage() {
  const supabase = createClient()

  async function handleKakaoLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
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
        {/* 로고마크 — 민들레 */}
        <svg width="78" height="78" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="rgba(255,255,255,0.55)" />
          <g transform="translate(50,46)">
            {DANDELION_SEEDS.map((s, i) => (
              <g key={i}>
                <line x1="0" y1="0" x2={s.x2} y2={s.y2} stroke="#bca4d6" strokeWidth="0.6" />
                <circle cx={s.x2} cy={s.y2} r="1" fill="#a685c7" opacity="0.7" />
              </g>
            ))}
            <circle cx="0" cy="0" r="2.5" fill="#8b6bb8" />
          </g>
        </svg>

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
          style={{
            width: '100%', padding: '14px', border: 'none', borderRadius: 14,
            background: '#FEE500', color: '#191919',
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 10, cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 4C6.5 4 2 7.6 2 12c0 2.8 1.8 5.2 4.5 6.6L5.5 22l4.2-2.5c.8.1 1.5.2 2.3.2 5.5 0 10-3.6 10-8s-4.5-7.7-10-7.7z"
              fill="#191919"
            />
          </svg>
          카카오로 시작하기
        </button>

        <p style={{
          marginTop: 20, fontFamily: 'var(--font-sans)', fontSize: 11,
          color: 'var(--ink-300)', textAlign: 'center', lineHeight: 1.7,
        }}>
          계속 진행하면 서비스 이용약관 및<br />개인정보 처리방침에 동의하는 것으로 간주합니다.
        </p>
      </div>
    </div>
  )
}
