'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Image from 'next/image'

const NIGHT_BG  = 'linear-gradient(180deg, #1c0f2e 0%, #2a1c44 38%, #574a7e 72%, #8d80ab 100%)'
const PEACH_TOP = 'linear-gradient(180deg, rgba(251,180,137,0.18) 0%, rgba(251,180,137,0.06) 18%, transparent 100%)'

function SentContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const letterId     = searchParams.get('letterId')

  const [visible, setVisible]           = useState(false)
  const [notifGranted, setNotifGranted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  // 알림 권한 초기 확인
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotifGranted(Notification.permission === 'granted')
    }
  }, [])

  // AI 답장 생성 요청
  useEffect(() => {
    if (!letterId) return
    fetch('/api/replies', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ letterId }),
    }).catch(() => {})
  }, [letterId])

  async function handleRequestNotif() {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setNotifGranted(result === 'granted')
  }

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      minHeight:      '100%',
      padding:        '80px 24px 48px',
      position:       'relative',
      opacity:        visible ? 1 : 0,
      transform:      visible ? 'translateY(0)' : 'translateY(20px)',
      transition:     'opacity 0.65s ease, transform 0.65s ease',
    }}>

      {/* 별 파티클 */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(14)].map((_, i) => (
          <div key={i} style={{
            position:     'absolute',
            width:        i % 3 === 0 ? 3 : 2,
            height:       i % 3 === 0 ? 3 : 2,
            borderRadius: '50%',
            background:   'rgba(255,255,255,0.7)',
            top:          `${8 + (i * 19) % 72}%`,
            left:         `${4 + (i * 27) % 92}%`,
            opacity:      0.3 + (i % 5) * 0.1,
            animation:    `twinkle ${3 + (i % 4)}s ease-in-out ${(i * 0.35) % 4}s infinite`,
          }} />
        ))}
      </div>

      {/* 봉투 일러스트 */}
      <div style={{
        marginBottom: 36,
        filter:    'drop-shadow(0 8px 32px rgba(251,180,137,0.25))',
        animation: 'floatUp 3s ease-in-out infinite',
        width:     '50vw',
        maxWidth:  200,
      }}>
        <Image
          src="/letter-sent.svg"
          alt="편지 봉투"
          width={200}
          height={200}
          style={{ width: '100%', height: 'auto' }}
          priority
        />
      </div>

      {/* 메인 텍스트 */}
      <div style={{
        fontFamily:    'var(--font-serif)',
        fontSize:      22,
        fontWeight:    600,
        color:         '#fff',
        letterSpacing: '-0.02em',
        textAlign:     'center',
        lineHeight:    1.55,
        marginBottom:  16,
      }}>
        편지를 보냈어요.<br />
        <span style={{ fontWeight: 400, fontSize: 19 }}>
          내일, 아이의 답장이 도착할 거예요.
        </span>
      </div>

      {/* 서브 텍스트 — 펜글씨체 */}
      <div style={{
        fontFamily:    'var(--font-handwriting)',
        fontSize:      15,
        color:         'rgba(251,180,137,0.75)',
        letterSpacing: '0.01em',
        marginTop:     4,
      }}>
        편지가 별빛을 따라 날아가는 중...
      </div>

      {/* ── 버튼 영역 ── */}
      <div style={{
        marginTop:     56,
        width:         '100%',
        maxWidth:      360,
        display:       'flex',
        flexDirection: 'column',
        gap:           12,
      }}>
        {/* 알림 미설정일 때만 표시 */}
        {!notifGranted && (
          <button
            onClick={handleRequestNotif}
            style={{
              width:          '100%',
              padding:        '15px 0',
              borderRadius:   999,
              border:         'none',
              background:     'linear-gradient(135deg, #faddca, #fbb489)',
              color:          '#2a1c44',
              fontFamily:     'var(--font-sans)',
              fontSize:       15,
              fontWeight:     700,
              letterSpacing:  '-0.01em',
              boxShadow:      '0 8px 28px rgba(251,180,137,0.35)',
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            7,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5C5.24 1.5 3 3.74 3 6.5V10l-1 1.5h12L13 10V6.5C13 3.74 10.76 1.5 8 1.5Z"
                stroke="#2a1c44" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" stroke="#2a1c44" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            도착 알림 받기
          </button>
        )}

        {/* 항상 표시 */}
        <button
          onClick={() => router.replace('/archive')}
          style={{
            width:               '100%',
            padding:             '15px 0',
            borderRadius:        999,
            border:              '1px solid rgba(255,255,255,0.25)',
            background:          'rgba(255,255,255,0.08)',
            color:               'rgba(255,255,255,0.85)',
            fontFamily:          'var(--font-sans)',
            fontSize:            15,
            fontWeight:          600,
            letterSpacing:       '-0.01em',
            cursor:              'pointer',
            backdropFilter:      'blur(8px)',
            WebkitBackdropFilter:'blur(8px)',
          }}
        >
          마음 보관함으로
        </button>
      </div>

      <style>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%       { opacity: 0.08; transform: scale(0.6); }
        }
      `}</style>
    </div>
  )
}

export default function LetterSentPage() {
  return (
    <div style={{ minHeight: '100%', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, background: NIGHT_BG, zIndex: -1 }} />
      <div style={{ position: 'fixed', inset: 0, background: PEACH_TOP, zIndex: -1 }} />
      <Suspense>
        <SentContent />
      </Suspense>
    </div>
  )
}
