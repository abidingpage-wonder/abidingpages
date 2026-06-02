'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePhotoUpload } from '@/hooks/usePhotoUpload'

// ── 감정 태그 → 이모지 (감정선택 화면과 동일) ─────────────────────
const EMOTION_EMOJI: Record<string, string> = {
  missing: '🌙', sad: '💧', numb: '🌫️', guilt: '🥀',
  anger:   '🌊', anxiety: '🍃', lonely: '🕯️', tired: '☁️',
  calm:    '🌿', grateful: '🌅', unknown: '•',
}

const NIGHT_BG = 'linear-gradient(180deg, #1c0f2e 0%, #2a1c44 38%, #574a7e 72%, #8d80ab 100%)'

interface Question {
  id:        string | null
  content:   string
  category:  string | null
  hintText:  string | null
  week:      number
  day:       number
  weekGuide: { keyword: string; title: string } | null
}

interface Props {
  petName:    string
  week:       number
  day:        number
  emotionTag: string | null
}

export default function LetterEditor({ petName, week, day, emotionTag }: Props) {
  const router      = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [question, setQuestion] = useState<Question | null>(null)
  const [loadingQ, setLoadingQ] = useState(true)
  const [freeMode, setFreeMode] = useState(false)
  const [content,  setContent]  = useState(`우리 ${petName}에게,\n\n`)
  const [sending,  setSending]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const { fileInputRef, photos, openPicker, handleFileChange, removePhoto, uploadAll } = usePhotoUpload(3)

  // ── 질문 로드 ────────────────────────────────────────────────────
  async function fetchQuestion(excludeId?: string) {
    setLoadingQ(true)
    try {
      const params = excludeId ? `?excludeId=${encodeURIComponent(excludeId)}` : ''
      const res    = await fetch(`/api/questions/today${params}`)
      if (!res.ok) throw new Error()
      setQuestion(await res.json())
    } catch {
      setQuestion(null)
    } finally {
      setLoadingQ(false)
    }
  }

  useEffect(() => { fetchQuestion() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // textarea 자동 높이 조정
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

  // ── 편지 전송 ────────────────────────────────────────────────────
  async function handleSend() {
    const trimmed = content.trim()
    if (!trimmed || trimmed === `우리 ${petName}에게,`) return
    if (sending) return
    setSending(true)
    setError(null)
    try {
      let imageUrls: string[] = []
      try { imageUrls = await uploadAll() } catch { /* 사진 실패해도 편지 전송 */ }

      const res = await fetch('/api/letters', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          content:    trimmed,
          questionId: (!freeMode && question?.id) ? question.id : null,
          emotionTag: emotionTag ?? undefined,
          imageUrls,
        }),
      })
      if (!res.ok) throw new Error()
      const { id: letterId } = await res.json()
      router.push(`/write/sent?letterId=${letterId}`)
    } catch {
      setError('편지를 보내지 못했어요. 다시 시도해주세요.')
      setSending(false)
    }
  }

  const emotionEmoji  = emotionTag ? EMOTION_EMOJI[emotionTag] : null
  const letterIsEmpty = content.trim() === '' || content.trim() === `우리 ${petName}에게,`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: NIGHT_BG, padding: '0 0 36px' }}>

      {/* ── 헤더 ── */}
      <div style={{ padding: '16px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.7)' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 17L8 11L14 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
            {petName}에게
          </div>
          <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {emotionEmoji && <span style={{ fontSize: 16, lineHeight: 1 }}>{emotionEmoji}</span>}
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em' }}>
              {week}주차 · {question?.weekGuide?.keyword ?? `DAY ${day}`}
            </span>
          </div>
        </div>
        <div style={{ width: 30 }} />
      </div>

      {/* ── 질문 카드 ── */}
      {!freeMode && (
        <div style={{ padding: '0 16px', marginBottom: 14 }}>
          <div style={{
            borderRadius: 20, padding: '18px 20px 16px',
            background: 'rgba(255,255,255,0.09)', border: '0.5px solid rgba(255,255,255,0.18)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          }}>
            {/* 라벨 행 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, color: 'rgba(251,180,137,0.9)', letterSpacing: '0.14em' }}>
                  오늘의 질문
                </div>
                {!loadingQ && question?.category && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '2px 9px', borderRadius: 999,
                    background: 'rgba(145,105,189,0.8)',
                    fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, color: '#fff', letterSpacing: '0.03em',
                  }}>
                    {question.category}
                  </span>
                )}
              </div>
            </div>

            {/* 질문 본문 */}
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15.5, fontWeight: 600, color: '#fff', lineHeight: 1.7, letterSpacing: '-0.01em', minHeight: 48 }}>
              {loadingQ
                ? <span style={{ color: 'rgba(255,255,255,0.35)' }}>질문을 불러오는 중...</span>
                : (question?.content ?? '오늘 하루 어떠셨나요?')
              }
            </div>

            {/* 힌트 */}
            {!loadingQ && question?.hintText && (
              <div style={{ marginTop: 8, fontFamily: 'var(--font-handwriting)', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                {question.hintText}
              </div>
            )}

            {/* 버튼 행 */}
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <button
                onClick={() => fetchQuestion(question?.id ?? undefined)}
                disabled={loadingQ}
                title="질문 바꾸기"
                style={{
                  width: 34, height: 34, borderRadius: '50%', padding: 0,
                  background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.22)',
                  color: 'rgba(255,255,255,0.85)', cursor: loadingQ ? 'default' : 'pointer',
                  opacity: loadingQ ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 13 13" fill="none">
                  <path d="M11 2.5A5.5 5.5 0 1 0 12 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M9 2.5H11V0.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                onClick={() => setFreeMode(true)}
                title="자유롭게 쓰기"
                style={{
                  width: 34, height: 34, borderRadius: '50%', padding: 0,
                  background: 'none', border: '0.5px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 자유 모드 복귀 */}
      {freeMode && (
        <div style={{ padding: '0 20px', marginBottom: 10 }}>
          <button onClick={() => setFreeMode(false)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sans)', fontSize: 12 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 10L4 6L8 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            질문 카드로 돌아가기
          </button>
        </div>
      )}

      {/* ── 편지지 ── */}
      <div style={{ padding: '0 16px' }}>
        <div style={{
          borderRadius: 20, border: '0.5px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.3)', padding: '20px 20px 28px',
          position: 'relative', background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            placeholder={`우리 ${petName}에게,\n\n오늘의 마음을 담아 편지를 써보세요.`}
            style={{
              width: '100%', border: 'none', outline: 'none', resize: 'none', overflow: 'hidden',
              fontFamily: 'var(--font-handwriting)', fontSize: 16, lineHeight: '28px',
              color: '#fff', caretColor: '#fbb489', minHeight: 200,
              background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(255,255,255,0.07) 27px, rgba(255,255,255,0.07) 28px)',
              backgroundAttachment: 'local',
            }}
          />
        </div>
      </div>

      {/* ── 사진 첨부 ── */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
            추억 사진 첨부 <span style={{ fontWeight: 400, fontSize: 11 }}>(선택 · 최대 3장)</span>
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: photos.length >= 3 ? 'rgba(251,180,137,0.8)' : 'rgba(255,255,255,0.3)' }}>
            {photos.length}/3
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => {
            const photo = photos[i]
            if (photo) return (
              <div key={i} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 14, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.2)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.preview} alt={`첨부 ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2L8 8M8 2L2 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )
            const isNext = i === photos.length
            return (
              <button key={`slot-${i}`} onClick={isNext ? openPicker : undefined} style={{
                aspectRatio: '1/1', borderRadius: 14, width: '100%', padding: 0,
                border: isNext ? '1px dashed rgba(255,255,255,0.38)' : '1px dashed rgba(255,255,255,0.1)',
                background: isNext ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                cursor: isNext ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {isNext && (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="4" width="20" height="16" rx="3.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4"/>
                      <circle cx="8" cy="10" r="2" fill="rgba(255,255,255,0.45)"/>
                      <path d="M2 17l5-5 3.5 3.5 4.5-6 7 7.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 8v5M14.5 10.5h5" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>사진 추가</span>
                  </>
                )}
              </button>
            )
          })}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      {/* ── 전송 버튼 ── */}
      <div style={{ padding: '18px 16px 0' }}>
        {error && (
          <div style={{ marginBottom: 10, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, color: '#fbb489' }}>
            {error}
          </div>
        )}
        <button
          onClick={handleSend}
          disabled={letterIsEmpty || sending}
          style={{
            width: '100%', padding: '16px 0', borderRadius: 999,
            background: letterIsEmpty ? 'rgba(255,255,255,0.12)' : 'linear-gradient(135deg, #faddca, #fbb489)',
            color: letterIsEmpty ? 'rgba(255,255,255,0.6)' : '#2a1c44',
            border: letterIsEmpty ? '1px solid rgba(255,255,255,0.25)' : 'none',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
            boxShadow: letterIsEmpty ? 'none' : '0 8px 28px rgba(251,180,137,0.35)',
            cursor: letterIsEmpty ? 'default' : 'pointer', transition: 'all 0.2s ease',
          }}
        >
          {sending ? '보내는 중...' : '편지 보내기'}
        </button>
      </div>
    </div>
  )
}
