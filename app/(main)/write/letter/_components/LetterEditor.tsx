'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ── 감정 태그 → 라벨 ───────────────────────────────────────────────
const EMOTION_LABELS: Record<string, string> = {
  missing: '그리움', sad: '슬픔', numb: '멍함', guilt: '죄책감',
  anger: '분노', anxiety: '불안', lonely: '외로움', tired: '지침',
  calm: '차분함', grateful: '고마움', unknown: '모르겠음',
}

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

  const [question, setQuestion]     = useState<Question | null>(null)
  const [loadingQ, setLoadingQ]     = useState(true)
  const [freeMode, setFreeMode]     = useState(false)
  const [content, setContent]       = useState(`우리 ${petName}에게,\n\n`)
  const [sending, setSending]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // 질문 불러오기
  async function fetchQuestion() {
    setLoadingQ(true)
    try {
      const res = await fetch('/api/questions/today')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setQuestion(data)
    } catch {
      setQuestion(null)
    } finally {
      setLoadingQ(false)
    }
  }

  useEffect(() => { fetchQuestion() }, [])

  // 텍스트에어리어 자동 높이
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  // 커서를 편지 본문 끝으로
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
      padding: '0 0 32px',
    }}>

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
            color: 'var(--lav-500)',
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
            color: 'var(--lav-900)', letterSpacing: '-0.01em',
          }}>
            {petName}에게
          </div>
          <div style={{
            marginTop: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {emotionLabel && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 10px',
                borderRadius: 999,
                background: 'rgba(251,180,137,0.18)',
                border: '0.5px solid rgba(251,180,137,0.45)',
                fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
                color: 'var(--peach-500)',
                letterSpacing: '0.03em',
              }}>
                {emotionLabel}
              </span>
            )}
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: 11,
              color: 'var(--ink-300)', letterSpacing: '0.08em',
            }}>
              {week}주차 · DAY {day}
            </span>
          </div>
        </div>

        {/* 오른쪽 여백 균형 */}
        <div style={{ width: 30 }} />
      </div>

      {/* ── 질문 카드 ── */}
      {!freeMode && (
        <div style={{ padding: '0 16px', marginBottom: 14 }}>
          <div style={{
            borderRadius: 20,
            padding: '18px 20px 16px',
            background: 'rgba(243,236,223,0.92)',
            border: '0.5px solid rgba(184,160,120,0.25)',
            boxShadow: '0 2px 12px rgba(86,52,140,0.07)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}>
            {/* 카드 라벨 */}
            <div style={{
              fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
              color: 'var(--lav-500)', letterSpacing: '0.14em',
              marginBottom: 10,
            }}>
              오늘의 질문
            </div>

            {/* 질문 본문 */}
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: 15.5, fontWeight: 600,
              color: 'var(--ink-900)', lineHeight: 1.65,
              letterSpacing: '-0.01em',
              minHeight: 48,
            }}>
              {loadingQ
                ? <span style={{ color: 'var(--ink-300)' }}>질문을 불러오는 중...</span>
                : (question?.content ?? '오늘 하루 어떠셨나요?')
              }
            </div>

            {/* 힌트 */}
            {!loadingQ && question?.hintText && (
              <div style={{
                marginTop: 8,
                fontFamily: 'var(--font-handwriting)', fontSize: 12.5,
                color: 'var(--ink-300)', lineHeight: 1.5,
              }}>
                {question.hintText}
              </div>
            )}

            {/* 하단 버튼 행 */}
            <div style={{
              marginTop: 14,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <button
                onClick={fetchQuestion}
                disabled={loadingQ}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px',
                  borderRadius: 999,
                  background: 'rgba(140,100,190,0.09)',
                  border: '0.5px solid rgba(140,100,190,0.25)',
                  color: 'var(--lav-600)',
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                  cursor: loadingQ ? 'default' : 'pointer',
                  opacity: loadingQ ? 0.5 : 1,
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
                  border: '0.5px solid rgba(140,100,190,0.2)',
                  color: 'var(--lav-400)',
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

      {/* 자유 모드 토글 복귀 */}
      {freeMode && (
        <div style={{ padding: '0 20px', marginBottom: 10 }}>
          <button
            onClick={() => setFreeMode(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--lav-400)',
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
        <div
          className="paper-tex"
          style={{
            borderRadius: 20,
            border: '0.5px solid rgba(184,160,120,0.2)',
            boxShadow: '0 4px 20px rgba(86,52,140,0.08)',
            padding: '20px 20px 24px',
            position: 'relative',
          }}
        >
          {/* 편지지 줄 */}
          <div style={{
            position: 'absolute', inset: '56px 20px 20px',
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(184,160,120,0.15) 31px, rgba(184,160,120,0.15) 32px)',
            backgroundSize: '100% 32px',
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
              lineHeight: '32px',
              color: 'var(--ink-700)',
              caretColor: 'var(--lav-600)',
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
            color: 'var(--peach-500)',
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
            border: 'none',
            background: letterIsEmpty
              ? 'rgba(180,160,210,0.25)'
              : 'linear-gradient(96deg, var(--lav-600), #8b5cb8)',
            color: letterIsEmpty ? 'var(--lav-400)' : '#fff',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
            letterSpacing: '-0.01em',
            boxShadow: letterIsEmpty ? 'none' : '0 8px 24px rgba(86,52,140,0.28)',
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
