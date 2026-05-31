'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ── 감정 데이터 ──────────────────────────────────────────────────────
interface Emotion {
  tag: string
  label: string
  emoji: string
  sub: string
  skip?: boolean
}

const EMOTIONS: Emotion[] = [
  { tag: 'missing',   label: '그리움',   emoji: '🌙',  sub: '보고 싶어요' },
  { tag: 'sad',       label: '슬픔',     emoji: '💧',  sub: '많이 울었어요' },
  { tag: 'numb',      label: '멍함',     emoji: '🌫️', sub: '멍하고 무거워요' },
  { tag: 'guilt',     label: '죄책감',   emoji: '🥀',  sub: '미안하고 죄스러워요' },
  { tag: 'anger',     label: '분노',     emoji: '🌊',  sub: '억울하고 화가나요' },
  { tag: 'anxiety',   label: '불안',     emoji: '🍃',  sub: '무섭고 불안해요' },
  { tag: 'lonely',    label: '외로움',   emoji: '🕯️', sub: '외롭고 쓸쓸해요' },
  { tag: 'tired',     label: '지침',     emoji: '☁️',  sub: '지치고 힘들어요' },
  { tag: 'calm',      label: '차분함',   emoji: '🌿',  sub: '조금 괜찮아요' },
  { tag: 'grateful',  label: '고마움',   emoji: '🌅',  sub: '고맙고 따뜻해요' },
  { tag: 'unknown',   label: '모르겠음', emoji: '•',   sub: '모르겠어요' },
  { tag: 'skip',      label: '건너뛰기', emoji: '→',   sub: '나중에 할게요', skip: true },
]

export default function EmotionSelectPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleNext() {
    if (!selected || loading) return
    setLoading(true)
    try {
      if (selected !== 'skip') {
        await fetch('/api/emotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emotionTag: selected }),
        })
      }
    } catch { /* 저장 실패해도 진행 */ }
    router.push(`/write/letter?emotion=${selected}`)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 18px 32px',
      minHeight: '100%',
    }}>

      {/* 헤더 */}
      <div style={{ marginBottom: 22 }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
          color: 'var(--lav-500)', letterSpacing: '0.14em', marginBottom: 10,
        }}>
          감정기록
        </div>
        <div style={{
          fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600,
          color: 'var(--lav-900)', lineHeight: 1.45, letterSpacing: '-0.02em',
        }}>
          오늘은 어떤 감정인가요?
        </div>
        <div style={{
          marginTop: 8,
          fontFamily: 'var(--font-sans)', fontSize: 13,
          color: 'var(--ink-500)', lineHeight: 1.6,
        }}>
          오늘 가장 닿아있는 감정을 골라주세요.
        </div>
      </div>

      {/* 감정 그리드 — 3열 × 4행 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
      }}>
        {EMOTIONS.map((e) => {
          const isSel = selected === e.tag
          return (
            <button
              key={e.tag}
              onClick={() => setSelected(isSel ? null : e.tag)}
              style={{
                borderRadius: 20,
                padding: '18px 8px 16px',
                background: isSel
                  ? 'rgba(255,255,255,0.82)'
                  : 'rgba(255,255,255,0.55)',
                border: e.skip
                  ? `1.5px dashed ${isSel ? 'var(--peach-300)' : 'rgba(140,100,190,0.3)'}`
                  : isSel
                    ? '1.5px solid var(--peach-300)'
                    : '0.5px solid rgba(180,160,210,0.2)',
                boxShadow: isSel
                  ? '0 6px 20px rgba(251,180,137,0.22)'
                  : '0 2px 8px rgba(86,52,140,0.06)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                position: 'relative',
              }}
            >
              {/* 선택 체크 */}
              {isSel && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--peach-300)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.6"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}

              {/* 이모지 원형 배경 */}
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: e.skip
                  ? 'rgba(140,100,190,0.08)'
                  : 'rgba(200,185,220,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: e.tag === 'unknown' ? 20 : e.tag === 'skip' ? 22 : 26,
                lineHeight: 1,
                color: e.tag === 'skip'
                  ? (isSel ? 'var(--peach-300)' : 'var(--lav-500)')
                  : 'inherit',
                fontFamily: e.tag === 'unknown' || e.tag === 'skip' ? 'var(--font-sans)' : 'inherit',
                fontWeight: e.tag === 'skip' ? 600 : 400,
              }}>
                {e.emoji}
              </div>

              {/* 라벨 */}
              <div style={{
                fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600,
                color: isSel
                  ? (e.skip ? 'var(--lav-600)' : 'var(--peach-500)')
                  : 'var(--lav-800)',
                lineHeight: 1.2,
                textAlign: 'center',
              }}>
                {e.label}
              </div>

              {/* 한줄 설명 — 손글씨 폰트 */}
              <div style={{
                fontFamily: 'var(--font-handwriting)', fontSize: 11.5,
                color: isSel
                  ? (e.skip ? 'var(--lav-500)' : 'var(--peach-400)')
                  : 'var(--ink-500)',
                opacity: isSel ? 1 : 0.75,
                lineHeight: 1.3,
                textAlign: 'center',
              }}>
                {e.sub}
              </div>
            </button>
          )
        })}
      </div>

      {/* CTA */}
      <div style={{ marginTop: 22 }}>
        <button
          onClick={handleNext}
          disabled={!selected || loading}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 999,
            border: 'none',
            background: selected
              ? 'linear-gradient(96deg, var(--lav-600), #8b5cb8)'
              : 'rgba(180,160,210,0.25)',
            color: selected ? '#fff' : 'var(--lav-400)',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
            letterSpacing: '-0.01em',
            boxShadow: selected ? '0 8px 24px rgba(86,52,140,0.28)' : 'none',
            cursor: selected ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
          }}
        >
          {loading ? '잠시만요...' : '편지 쓰러 가기'}
        </button>
      </div>
    </div>
  )
}
