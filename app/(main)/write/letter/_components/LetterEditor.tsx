'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ── 감정 태그 → 라벨 ───────────────────────────────────────────────
const EMOTION_LABELS: Record<string, string> = {
  missing: '그리움', sad: '슬픔', numb: '멍함', guilt: '죄책감',
  anger: '분노', anxiety: '불안', lonely: '외로움', tired: '지침',
  calm: '차분함', grateful: '고마움', unknown: '모르겠음',
}

// ── 나이트스카이 배경 ───────────────────────────────────────────────
// 디자인 파일: #1c0f2e → #2a1c44 → #574a7e → #8d80ab
const NIGHT_BG = 'linear-gradient(180deg, #1c0f2e 0%, #2a1c44 38%, #574a7e 72%, #8d80ab 100%)'

interface Question {
  id: string | null
  content: string
  hintText: string | null
  week: number
  day: number
}

interface Props {
  petName: string
  week: number
  day: number
  emotionTag: string | null
}

export default function LetterEditor({ petName, week, day, emotionTag }: Props) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [question, setQuestion] = useState<Question | null>(null)
  const [loadingQ, setLoadingQ] = useState(true)
  const [freeMode, setFreeMode] = useState(false)
  const [content, setContent]   = useState(`우리 ${petName}에게,\n\n`)
  const [sending, setSending]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function fetchQuestion() {
    setLoadingQ(true)
    try {
      const res = await fetch('/api/questions/today')
      if (!res.ok) throw new Error()
      setQuestion(await res.json())
    } catch {
      setQuestion(null)
    } finally {
      setLoadingQ(false)
    }
  }

  useEffect(() => { fetchQuestion() }, [])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  useEffect(() => {
    if (!loadingQ && textareaRef.current) {
      const el = textareaRef.current
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }, [loadingQ])

  async function handleSend() {
    const trimmed = content.trim()
    if (!trimmed || trimmed === `우리 ${petName}에게,`) return
    if (sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          questionId: (!freeMode && question?.id) ? question.id : null,
          emotionTag: emotionTag ?? undefined,
        }),
      })
      if (!res.ok) throw new Error()
      router.push('/write/sent')
    } catch {
      setError('편지를 보내지 못했어요. 다시 시도해주세요.')
      setSending(false)
    }
  }

  const emotionLabel = emotionTag ? EMOTION_LABELS[emotionTag] : null
  const letterIsEmpty = content.trim() === '' || content.trim() === `우리 ${petName}에게,`

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      position: 'relative',
      padding: '0 0 36px',
    }}>
      {/* 전체 뷰포트 배경 */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: NIGHT_BG,
        zIndex: -1,
      }} />

      {/* ── 헤더 ── */}
      <div style={{
        padding: '16px 20px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 4,
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 17L8 11L14 5" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* 수신자 + 메타 */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600,
            color: '#fff', letterSpacing: '-0.01em',
          }}>
            {petName}에게
          </div>
          <div style={{
            marginTop: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {emotionLabel && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 10px',
                borderRadius: 999,
                background: 'rgba(251,180,137,0.2)',
                border: '0.5px solid rgba(251,180,137,0.5)',
                fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
                color: '#fbb489',
                letterSpacing: '0.03em',
              }}>
                {emotionLabel}
              </span>
            )}
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: 11,
              color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em',
            }}>
              {week}주차 · DAY {day}
            </span>
          </div>
        </div>

        <div style={{ width: 30 }} />
      </div>

      {/* ── 질문 카드 ── */}
      {!freeMode && (
        <div style={{ padding: '0 16px', marginBottom: 14 }}>
          <div style={{
            borderRadius: 20,
            padding: '18px 20px 16px',
            background: 'rgba(255,255,255,0.09)',
            border: '0.5px solid rgba(255,255,255,0.18)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}>
            {/* 카드 라벨 */}
            <div style={{
              fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
              color: 'rgba(251,180,137,0.9)', letterSpacing: '0.14em',
              marginBottom: 10,
            }}>
              오늘의 질문
            </div>

            {/* 질문 본문 */}
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: 15.5, fontWeight: 600,
              color: '#fff', lineHeight: 1.7,
              letterSpacing: '-0.01em',
              minHeight: 48,
            }}>
              {loadingQ
                ? <span style={{ color: 'rgba(255,255,255,0.35)' }}>질문을 불러오는 중...</span>
                : (question?.content ?? '오늘 하루 어떠셨나요?')
              }
            </div>

            {/* 힌트 */}
            {!loadingQ && question?.hintText && (
              <div style={{
                marginTop: 8,
                fontFamily: 'var(--font-handwriting)', fontSize: 13,
                color: 'rgba(255,255,255,0.45)', lineHeight: 1.5,
              }}>
                {question.hintText}
              </div>
            )}

            {/* 하단 버튼 행 */}
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={fetchQuestion}
                disabled={loadingQ}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)',
                  border: '0.5px solid rgba(255,255,255,0.22)',
                  color: 'rgba(255,255,255,0.85)',
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                  cursor: loadingQ ? 'default' : 'pointer',
                  opacity: loadingQ ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M11 2.5A5.5 5.5 0 1 0 12 6.5" stroke="currentColor"
                    strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M9 2.5H11V0.5" stroke="currentColor"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                질문 바꾸기
              </button>

              <button
                onClick={() => setFreeMode(true)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 999,
                  background: 'none',
                  border: '0.5px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.55)',
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                자유롭게 쓰기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 자유 모드 복귀 버튼 */}
      {freeMode && (
        <div style={{ padding: '0 20px', marginBottom: 10 }}>
          <button
            onClick={() => setFreeMode(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'var(--font-sans)', fontSize: 12,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 10L4 6L8 2" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            질문 카드로 돌아가기
          </button>
        </div>
      )}

      {/* ── 편지지 ── */}
      <div style={{ flex: 1, padding: '0 16px' }}>
        <div style={{
          borderRadius: 20,
          border: '0.5px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
          padding: '20px 20px 28px',
          position: 'relative',
          // 반투명 유리 느낌
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          {/* 편지지 줄 — 디자인 파일과 동일한 흰색 반투명 */}
          <div style={{
            position: 'absolute', inset: '56px 20px 20px',
            backgroundImage: 'linear-gradient(0deg, transparent 0px, transparent 27px, rgba(255,255,255,0.06) 27px, rgba(255,255,255,0.06) 28px)',
            backgroundSize: '100% 28px',
            pointerEvents: 'none',
          }} />

          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            placeholder={`우리 ${petName}에게,\n\n오늘의 마음을 담아 편지를 써보세요.`}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              fontFamily: 'var(--font-handwriting)',
              fontSize: 16,
              lineHeight: '28px',
              color: '#fff',
              caretColor: '#fbb489',
              minHeight: 200,
              position: 'relative',
              zIndex: 1,
            }}
          />
        </div>
      </div>

      {/* ── 하단 CTA ── */}
      <div style={{ padding: '18px 16px 0' }}>
        {error && (
          <div style={{
            marginBottom: 10, textAlign: 'center',
            fontFamily: 'var(--font-sans)', fontSize: 12,
            color: '#fbb489',
          }}>
            {error}
          </div>
        )}
        <button
          onClick={handleSend}
          disabled={letterIsEmpty || sending}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 999,
            background: letterIsEmpty
              ? 'rgba(255,255,255,0.12)'
              : 'linear-gradient(135deg, #faddca, #fbb489)',
            color: letterIsEmpty ? 'rgba(255,255,255,0.6)' : '#2a1c44',
            border: letterIsEmpty ? '1px solid rgba(255,255,255,0.25)' : 'none',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700,
            letterSpacing: '-0.01em',
            boxShadow: letterIsEmpty ? 'none' : '0 8px 28px rgba(251,180,137,0.35)',
            cursor: letterIsEmpty ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {sending ? '보내는 중...' : '편지 보내기'}
        </button>
      </div>
    </div>
  )
}
