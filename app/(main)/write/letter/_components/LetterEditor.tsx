'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePhotoUpload } from '@/hooks/usePhotoUpload'

const EMOTION_EMOJI: Record<string, string> = {
  missing: '🌙', sad: '💧', numb: '🌫️', guilt: '🥀',
  anger:   '🌊', anxiety: '🍃', lonely: '🕯️', tired: '☁️',
  calm:    '🌿', grateful: '🌅', unknown: '•',
}

const NIGHT_BG = 'linear-gradient(180deg, #1c0f2e 0%, #2a1c44 38%, #574a7e 72%, #8d80ab 100%)'

interface Question {
  id:           string | null
  content:      string
  category:     string | null
  hintText:     string | null
  isRest?:      boolean
  week:         number
  day:          number
  weekGuide:    { keyword: string; title: string } | null
  allAnswered?: boolean
}

interface QuestionListItem {
  id: string
  day: number
  content: string
  category: string | null
  isRest: boolean
  writeCount: number
}

interface Props {
  petName:            string
  week:               number
  day:                number
  emotionTag:         string | null
  initialQuestionId?: string | null
  journeyCompleted?:  boolean
  freeEntry?:         boolean   // 자유롭게 쓰기 진입 시 질문 카드 닫힘
  weekChoicePending?: boolean   // 이번 주 3개 이상 완료 → 진입 시 이어서하기/다음 단계 선택
}

type ModalType = 'week_choice' | 'journey' | null

export default function LetterEditor({ petName, week, day, emotionTag, initialQuestionId, journeyCompleted: initJourneyCompleted, freeEntry, weekChoicePending }: Props) {
  const router      = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [question,  setQuestion]  = useState<Question | null>(null)
  const [loadingQ,  setLoadingQ]  = useState(true)
  const [content,   setContent]   = useState(`우리 ${petName}에게,\n\n`)
  const [sending,   setSending]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  // 진입 시 3개 이상 완료 상태면 이어서하기/다음 단계 선택 오버레이 표시
  const [modal,     setModal]     = useState<ModalType>(
    weekChoicePending && !freeEntry && !initialQuestionId && !initJourneyCompleted ? 'week_choice' : null
  )
  const [toast,     setToast]     = useState<string | null>(null)
  const [advancingWeek, setAdvancingWeek] = useState(false)
  const [journeyDone, setJourneyDone] = useState(initJourneyCompleted ?? false)

  // 질문 카드 표시: 자유 진입/49일 완주 후 = 기본 닫힘, 그 외 = 기본 열림
  const [showQuestion, setShowQuestion] = useState(!journeyDone && !freeEntry)

  // 질문 선택 토글
  const [showQuestionList, setShowQuestionList] = useState(false)
  const [weekQuestions, setWeekQuestions]       = useState<QuestionListItem[] | null>(null)
  const [loadingList, setLoadingList]           = useState(false)

  const freeMode   = !showQuestion || !!question?.allAnswered
  const isDirectEntry = !initialQuestionId

  const { fileInputRef, photos, openPicker, handleFileChange, removePhoto, uploadAll, resetPhotos } = usePhotoUpload(3)

  // 전송 성공 후 페이지에 머무는 경우(모달 등) 에디터 초기화 — 재전송으로 인한 중복 생성 방지
  function resetEditor() {
    setContent(`우리 ${petName}에게,\n\n`)
    resetPhotos()
  }

  // ── 질문 로드 ─────────────────────────────────────────────────────
  async function fetchQuestion(questionId?: string, randomWeek?: number) {
    setLoadingQ(true)
    try {
      const params = new URLSearchParams()
      if (questionId)         params.set('questionId', questionId)
      if (randomWeek != null) params.set('randomWeek', String(randomWeek))
      const query = params.toString()
      const res = await fetch(`/api/questions/today${query ? `?${query}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setQuestion(data)
    } catch {
      setQuestion(null)
    } finally {
      setLoadingQ(false)
    }
  }

  async function fetchWeekQuestions() {
    if (weekQuestions) return
    setLoadingList(true)
    try {
      const res = await fetch(`/api/journey/stage?week=${question?.week ?? week}`, { cache: 'no-store' })
      const data = await res.json()
      setWeekQuestions(data.questions ?? [])
    } catch {
      setWeekQuestions([])
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchQuestion(initialQuestionId ?? undefined)
  }, [initialQuestionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // allAnswered 시 자유모드로 전환
  useEffect(() => {
    if (question?.allAnswered && isDirectEntry) {
      setShowQuestion(false)
    }
  }, [question, isDirectEntry])

  // textarea 자동 높이
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

  // 토스트 자동 닫기
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const isRestDay  = !freeMode && !!question?.isRest
  const isLongWeek = [2, 4, 7].includes(question?.week ?? week)

  // ── 편지 전송 ─────────────────────────────────────────────────────
  async function sendLetter(overrideContent?: string, overrideType?: string) {
    if (sending) return
    setSending(true)
    setError(null)
    try {
      let imageUrls: string[] = []
      try { imageUrls = await uploadAll() } catch { /* ignore */ }

      const res = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content:    overrideContent ?? content.trim(),
          questionId: (!freeMode && question?.id) ? question.id : null,
          emotionTag: emotionTag ?? undefined,
          imageUrls,
          ...(overrideType ? { letterType: overrideType } : {}),
        }),
      })
      if (!res.ok) throw new Error()
      const result = await res.json()
      const { id: letterId, weekAllDone, journeyCompleted: jc, currentWeek: cw, isNewAnswer } = result

      // 캐시 초기화 (다음 토글 시 최신 writeCount 반영)
      setWeekQuestions(null)

      // 재작성(여정 진입)이거나 새 답변이 아닌 경우 → 바로 sent 페이지로
      if (!isNewAnswer) {
        router.push(`/write/sent?letterId=${letterId}`)
        return
      }

      // 49일 완주
      if (jc) {
        setJourneyDone(true)
        resetEditor()
        setSending(false)
        setModal('journey')
        return
      }

      // 그 외에는 모달 없이 항상 완료 페이지로 (6개 완료 시 다음 주차 자동 진행 안내)
      router.push(`/write/sent?letterId=${letterId}${weekAllDone ? `&weekDone=${cw}` : ''}`)
    } catch {
      setError('편지를 보내지 못했어요. 다시 시도해주세요.')
      setSending(false)
    }
  }

  async function handleSend() {
    const trimmed = content.trim()
    if (!trimmed || trimmed === `우리 ${petName}에게,`) return
    await sendLetter(trimmed)
  }

  async function handleCommaDay() {
    const type = isLongWeek ? 'long' : 'comma_auto'
    await sendLetter('', type)
  }

  // 진입 선택: 다음 단계 넘어가기 → 주차 진행 후 다음 주차 질문 로드
  async function handleChoiceAdvance() {
    setAdvancingWeek(true)
    try {
      await fetch('/api/journey/advance', { method: 'POST' })
      setModal(null)
      setToast(`${week}주차 질문은 여정 > ${week}주차에서 언제든 다시 쓸 수 있어요 🌿`)
      await fetchQuestion()
    } finally {
      setAdvancingWeek(false)
    }
  }

  // 진입 선택: 이어서하기 → 현재 주차 질문 그대로 진행
  function handleChoiceContinue() {
    setModal(null)
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
              {question?.week ?? week}주차 · {question?.weekGuide?.keyword ?? `DAY ${day}`}
            </span>
          </div>
        </div>
        <div style={{ width: 30 }} />
      </div>

      {/* ── 질문 카드 ── */}
      {showQuestion && !question?.allAnswered ? (
        <div style={{ padding: '0 16px', marginBottom: 14 }}>
          <div style={{
            borderRadius: 20, padding: '18px 20px 16px',
            background: 'rgba(255,255,255,0.09)', border: '0.5px solid rgba(255,255,255,0.18)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, color: 'rgba(251,180,137,0.9)', letterSpacing: '0.14em' }}>
                  오늘의 질문
                </div>
                {!loadingQ && question?.category && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 999,
                    background: 'rgba(145,105,189,0.8)',
                    fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, color: '#fff', letterSpacing: '0.03em',
                  }}>{question.category}</span>
                )}
              </div>
            </div>

            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15.5, fontWeight: 600, color: '#fff', lineHeight: 1.7, letterSpacing: '-0.01em', minHeight: 48 }}>
              {loadingQ
                ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.35)' }}>
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.18)',
                      borderTopColor: 'rgba(255,255,255,0.7)',
                      animation: 'spin 0.7s linear infinite',
                      display: 'inline-block',
                    }}/>
                    질문을 불러오는 중...
                  </span>
                )
                : (question?.content ?? '오늘 하루 어떠셨나요?')
              }
            </div>

            {!loadingQ && question?.hintText && (
              <div style={{ marginTop: 8, fontFamily: 'var(--font-handwriting)', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                {question.hintText}
              </div>
            )}

            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {/* 질문 선택하기 토글 버튼 */}
              <button
                onClick={() => { fetchWeekQuestions(); setShowQuestionList(v => !v) }}
                disabled={loadingQ}
                style={{
                  height: 34, borderRadius: 999, padding: '0 14px',
                  background: showQuestionList ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)',
                  border: showQuestionList ? '0.5px solid rgba(255,255,255,0.4)' : '0.5px solid rgba(255,255,255,0.22)',
                  color: 'rgba(255,255,255,0.85)', cursor: loadingQ ? 'default' : 'pointer',
                  opacity: loadingQ ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1.5 3h9M1.5 6h6M1.5 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                질문 선택하기
                <svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  style={{ transform: showQuestionList ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                >
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {/* 자유롭게 쓰기 */}
              <button
                onClick={() => { setShowQuestion(false); setShowQuestionList(false) }}
                style={{
                  height: 34, borderRadius: 999, padding: '0 12px',
                  background: 'none', border: '0.5px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontFamily: 'var(--font-sans)', fontSize: 12,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                  <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                자유롭게 쓰기
              </button>
            </div>
          </div>

          {/* ── 질문 선택 토글 목록 ── */}
          {showQuestionList && (
            <div style={{
              margin: '8px 16px 0',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.88)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
              overflow: 'hidden',
              animation: 'slideDown 0.2s ease',
            }}>
              <style>{`
                @keyframes slideDown {
                  from { opacity: 0; transform: translateY(-6px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
              `}</style>
              {loadingList ? (
                <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, color: '#9a8ab0' }}>
                  불러오는 중...
                </div>
              ) : (weekQuestions ?? []).map((q) => {
                const isSelected = question?.id === q.id
                return (
                  <div
                    key={q.id}
                    onClick={() => { fetchQuestion(q.id); setShowQuestionList(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px',
                      background: isSelected ? 'rgba(139,107,184,0.1)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--lav-500)' : '3px solid transparent',
                      borderBottom: '0.5px solid rgba(166,133,199,0.12)',
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                  >
                    {/* DAY 뱃지 */}
                    <span style={{
                      flexShrink: 0,
                      padding: '2px 7px', borderRadius: 999,
                      background: q.isRest ? 'rgba(166,133,199,0.12)' : isSelected ? 'var(--lav-500)' : 'rgba(139,107,184,0.15)',
                      fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600,
                      color: q.isRest ? '#9a8ab0' : isSelected ? '#fff' : 'var(--lav-600)',
                      letterSpacing: '0.04em',
                    }}>
                      {q.isRest ? '쉼표' : `DAY ${q.day}`}
                    </span>
                    {/* 질문 내용 */}
                    <span style={{
                      flex: 1, minWidth: 0,
                      fontFamily: 'var(--font-sans)', fontSize: 12.5,
                      color: q.isRest ? '#9a8ab0' : '#3a2d5a',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {q.content}
                    </span>
                    {/* 작성 횟수 */}
                    {q.writeCount > 0 && (
                      <span style={{
                        flexShrink: 0,
                        fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600,
                        color: '#c47a3a',
                      }}>
                        ✓ {q.writeCount}회
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* 질문 접힌 상태 — 복귀/펼치기 버튼 */
        <div style={{ padding: '0 20px', marginBottom: 10 }}>
          {question?.allAnswered && isDirectEntry ? (
            /* 이번 주 질문 모두 완료 안내 */
            <div style={{
              borderRadius: 14, padding: '12px 16px',
              background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)',
              fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6,
              textAlign: 'center',
            }}>
              이번 주 질문을 모두 작성했어요.<br/>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11.5 }}>여정 탭에서 원하는 질문을 골라 쓸 수 있어요.</span>
            </div>
          ) : (
            <button
              onClick={() => setShowQuestion(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sans)', fontSize: 12 }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {journeyDone ? '오늘의 질문 보기' : '질문 카드로 돌아가기'}
            </button>
          )}
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
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
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
          <div style={{ marginBottom: 10, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, color: '#fbb489' }}>{error}</div>
        )}
        {isRestDay ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* 편지 내용을 쓰면 '오늘은 쉼표'는 비활성화 — 내용 있는 편지는 일반 편지로 전송 */}
            <button onClick={handleCommaDay} disabled={sending || !letterIsEmpty} style={{
              width: '100%', padding: '15px 0', borderRadius: 999,
              background: 'transparent',
              border: (sending || !letterIsEmpty) ? '1.5px solid rgba(255,255,255,0.14)' : '1.5px solid rgba(255,255,255,0.35)',
              color: (sending || !letterIsEmpty) ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.75)',
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
              cursor: (sending || !letterIsEmpty) ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
            }}>
              {sending ? '보내는 중...' : '오늘은 쉼표 🌿'}
            </button>
            <button onClick={handleSend} disabled={letterIsEmpty || sending} style={{
              width: '100%', padding: '16px 0', borderRadius: 999,
              background: letterIsEmpty ? 'rgba(255,255,255,0.12)' : 'linear-gradient(135deg, #faddca, #fbb489)',
              color: letterIsEmpty ? 'rgba(255,255,255,0.6)' : '#2a1c44',
              border: letterIsEmpty ? '1px solid rgba(255,255,255,0.25)' : 'none',
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
              boxShadow: letterIsEmpty ? 'none' : '0 8px 28px rgba(251,180,137,0.35)',
              cursor: letterIsEmpty ? 'default' : 'pointer', transition: 'all 0.2s ease',
            }}>
              {sending ? '보내는 중...' : '편지 보내기'}
            </button>
          </div>
        ) : (
          <button onClick={handleSend} disabled={letterIsEmpty || sending} style={{
            width: '100%', padding: '16px 0', borderRadius: 999,
            background: letterIsEmpty ? 'rgba(255,255,255,0.12)' : 'linear-gradient(135deg, #faddca, #fbb489)',
            color: letterIsEmpty ? 'rgba(255,255,255,0.6)' : '#2a1c44',
            border: letterIsEmpty ? '1px solid rgba(255,255,255,0.25)' : 'none',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
            boxShadow: letterIsEmpty ? 'none' : '0 8px 28px rgba(251,180,137,0.35)',
            cursor: letterIsEmpty ? 'default' : 'pointer', transition: 'all 0.2s ease',
          }}>
            {sending ? '보내는 중...' : '편지 보내기'}
          </button>
        )}
      </div>

      {/* ── 토스트 ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(44,28,72,0.95)', backdropFilter: 'blur(12px)',
          border: '0.5px solid rgba(255,255,255,0.15)',
          borderRadius: 14, padding: '12px 20px',
          fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.9)',
          maxWidth: 320, textAlign: 'center', lineHeight: 1.5,
          zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}

      {/* ── 모달 오버레이 ── */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px',
        }}>
          <div style={{
            width: '100%', maxWidth: 340, borderRadius: 24,
            background: 'linear-gradient(160deg, #2a1c44 0%, #1c0f2e 100%)',
            border: '0.5px solid rgba(255,255,255,0.15)',
            padding: '28px 24px 24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>

            {/* week_choice 모달 (3개 이상 완료 후 재진입 시 선택) */}
            {modal === 'week_choice' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: '#fff', lineHeight: 1.5, marginBottom: 8 }}>
                    {week}주차 질문을 3개 완료했어요
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                    이번 주를 이어서 쓸 수도 있고,<br/>다음 단계로 넘어갈 수도 있어요.
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={handleChoiceContinue} style={{
                    width: '100%', padding: '14px 0', borderRadius: 999,
                    background: 'linear-gradient(135deg, #faddca, #fbb489)',
                    border: 'none', color: '#2a1c44',
                    fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                    이어서하기
                  </button>
                  <button onClick={handleChoiceAdvance} disabled={advancingWeek} style={{
                    width: '100%', padding: '14px 0', borderRadius: 999,
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
                    cursor: advancingWeek ? 'default' : 'pointer',
                  }}>
                    {advancingWeek ? '넘어가는 중...' : '다음 단계 넘어가기'}
                  </button>
                </div>
              </>
            )}

            {/* journey 모달 (49일 완주) */}
            {modal === 'journey' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🌈</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: '#fff', lineHeight: 1.5, marginBottom: 10 }}>
                    49일의 여정을 완주했어요
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                    {petName}와 함께 걸어온 49일,<br/>
                    정말 잘 해내셨어요.<br/><br/>
                    아이는 이제 엄마 마음속<br/>
                    가장 따뜻한 방에 영원히 함께해요 🐾
                  </div>
                  <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, textAlign: 'left' }}>
                    · 여정 탭에서 원하는 질문으로 언제든 편지를 쓸 수 있어요<br/>
                    · 앞으로는 자유롭게 편지쓰기가 기본으로 설정돼요
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setModal(null); setJourneyDone(true); setShowQuestion(false) }} style={{
                    flex: 1, padding: '14px 0', borderRadius: 999,
                    background: 'linear-gradient(135deg, #faddca, #fbb489)',
                    border: 'none', color: '#2a1c44',
                    fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}>편지 쓰기</button>
                  <button onClick={() => router.push('/archive')} style={{
                    flex: 1, padding: '14px 0', borderRadius: 999,
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  }}>보관함 보기</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
