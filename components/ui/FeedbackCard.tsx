'use client'

import { useEffect, useState, useCallback } from 'react'

interface FeedbackContext {
  replyId: string
  petName: string
  timestamp: number
}

const STORAGE_KEY = 'pendingFeedback'
const DONE_KEY    = 'doneFeedbacks'   // JSON array of replyIds

/** sessionStorage에서 피드백 컨텍스트 읽기 */
function readContext(): FeedbackContext | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const ctx = JSON.parse(raw) as FeedbackContext
    // 10분 초과 시 만료
    if (Date.now() - ctx.timestamp > 10 * 60 * 1000) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return ctx
  } catch { return null }
}

function isDone(replyId: string): boolean {
  try {
    const done: string[] = JSON.parse(sessionStorage.getItem(DONE_KEY) ?? '[]')
    return done.includes(replyId)
  } catch { return false }
}

function markDone(replyId: string) {
  try {
    const done: string[] = JSON.parse(sessionStorage.getItem(DONE_KEY) ?? '[]')
    if (!done.includes(replyId)) {
      sessionStorage.setItem(DONE_KEY, JSON.stringify([...done, replyId]))
    }
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {}
}

const NEG_OPTIONS = [
  '내 마음이 잘 전달되지 않은 것 같아요',
  '좀 더 따뜻한 말이 필요해요',
  '내용이 너무 짧아요',
]

export default function FeedbackCard() {
  const [ctx, setCtx]               = useState<FeedbackContext | null>(null)
  const [visible, setVisible]       = useState(false)   // 카드 마운트 여부
  const [show, setShow]             = useState(false)   // 슬라이드업 트리거
  const [showNeg, setShowNeg]       = useState(false)
  const [reasons, setReasons]       = useState<string[]>([])
  const [custom, setCustom]         = useState('')

  // 마운트 후 5초 뒤 슬라이드업
  useEffect(() => {
    const context = readContext()
    if (!context || isDone(context.replyId)) return

    setCtx(context)
    setVisible(true)
    const timer = setTimeout(() => setShow(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = useCallback((done = false) => {
    setShow(false)
    if (done && ctx) markDone(ctx.replyId)
    setTimeout(() => setVisible(false), 400)
  }, [ctx])

  const submitFeedback = useCallback(async (
    rating: 'positive' | 'negative',
    negReasons?: string[],
    negCustom?: string,
  ) => {
    if (!ctx) return
    try {
      await fetch(`/api/replies/${ctx.replyId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, reasons: negReasons, custom: negCustom }),
      })
    } catch {}
    dismiss(true)
  }, [ctx, dismiss])

  const toggleReason = useCallback((r: string) => {
    setReasons(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
  }, [])

  if (!visible || !ctx) return null

  return (
    <>
      <style>{`
        @keyframes feedbackSlideUp {
          from { transform: translateY(120%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes feedbackSlideDown {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(120%); opacity: 0; }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          bottom: 90,        /* BottomNav(80px) 위 */
          left: 0, right: 0,
          margin: '0 auto',
          width: 'calc(100% - 32px)',
          maxWidth: 390,
          background: '#faf6f0',
          borderRadius: 16,
          padding: '18px 16px 14px',
          zIndex: 200,
          boxShadow: '0 4px 24px rgba(120,90,50,0.14)',
          animation: show
            ? 'feedbackSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards'
            : 'feedbackSlideDown 0.35s ease forwards',
        }}
      >
        {/* 타이틀 */}
        <div style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14, fontWeight: 600,
          color: '#5c4a3a', letterSpacing: '-0.01em',
          marginBottom: 12,
        }}>
          오늘 {ctx.petName}의 편지, 어땠나요?
        </div>

        {/* 버튼 행 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => submitFeedback('positive')}
            style={{
              flex: 1, padding: '10px 0',
              borderRadius: 10,
              background: 'transparent',
              border: '1px solid #c9a96e',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 13, fontWeight: 500,
              color: '#8b6b4a',
              letterSpacing: '-0.01em',
            }}
          >
            🤍 따뜻했어요
          </button>
          <button
            onClick={() => setShowNeg(v => !v)}
            style={{
              flex: 1, padding: '10px 0',
              borderRadius: 10,
              background: showNeg ? 'rgba(201,169,110,0.12)' : 'transparent',
              border: '1px solid #c9a96e',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 13, fontWeight: 500,
              color: '#8b6b4a',
              letterSpacing: '-0.01em',
            }}
          >
            💭 아쉬웠어요
          </button>
        </div>

        {/* 건너뛰기 — 패널 닫혀 있을 때만 버튼 아래 표시 */}
        {!showNeg && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button
              onClick={() => dismiss(true)}
              style={{
                background: 'none', border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: 11, color: '#8b6b4a',
                opacity: 0.4,
              }}
            >
              건너뛰기
            </button>
          </div>
        )}

        {/* 부정 상세 옵션 */}
        {showNeg && (
          <div style={{
            marginTop: 10,
            background: 'rgba(201,169,110,0.07)',
            borderRadius: 10,
            padding: '12px 12px 8px',
            display: 'flex', flexDirection: 'column', gap: 9,
          }}>
            {NEG_OPTIONS.map(r => (
              <label
                key={r}
                onClick={() => toggleReason(r)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12, color: '#7a5c3e',
                  letterSpacing: '-0.01em',
                  userSelect: 'none',
                }}
              >
                <span style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `1.5px solid ${reasons.includes(r) ? '#c9a96e' : '#d4bfa0'}`,
                  background: reasons.includes(r) ? '#c9a96e' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {reasons.includes(r) && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3 5.5L8 1" stroke="#fff" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                {r}
              </label>
            ))}

            <input
              type="text"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              placeholder="직접 입력 (선택)"
              maxLength={80}
              style={{
                marginTop: 2,
                width: '100%', padding: '8px 10px',
                borderRadius: 7, border: '1px solid #d4bfa0',
                background: 'transparent',
                fontFamily: 'var(--font-sans)',
                fontSize: 12, color: '#7a5c3e', outline: 'none',
              }}
            />

            <button
              onClick={() => submitFeedback('negative', reasons, custom || undefined)}
              style={{
                marginTop: 2, padding: '10px 0',
                borderRadius: 8, background: '#c9a96e',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: 13, fontWeight: 600, color: '#fff',
              }}
            >
              보내기
            </button>

            {/* 건너뛰기 — 패널 열렸을 때 보내기 아래 */}
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <button
                onClick={() => dismiss(true)}
                style={{
                  background: 'none', border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11, color: '#8b6b4a',
                  opacity: 0.4,
                }}
              >
                건너뛰기
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
