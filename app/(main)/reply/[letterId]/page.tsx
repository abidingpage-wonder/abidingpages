'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { SoftCTAButton } from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { petJosa } from '@/lib/korean'
import { trackReplyViewed, trackReplyViewedDuration } from '@/lib/analytics'

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

const NEG_OPTIONS = [
  '내 마음이 잘 전달되지 않은 것 같아요',
  '좀 더 따뜻한 말이 필요해요',
  '내용이 너무 짧아요',
]

interface ReplyData {
  id: string
  letterId: string
  content: string
  replyType: 'normal' | 'crisis'
  petName: string
  petPhotoUrl: string | null
  ownerNickname: string
  letterContent: string
  week: number
  receivedAt: string
  isRead: boolean
  hasFeedback: boolean
}

export default function ReplyPage() {
  const router = useRouter()
  const { letterId } = useParams<{ letterId: string }>()

  const [reply, setReply]     = useState<ReplyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)   // 답장 생성됐으나 노출 시각 전

  // 피드백 상태
  const [hasFeedback, setHasFeedback]   = useState(false)
  const [fadingOut, setFadingOut]       = useState(false)
  const [rating, setRating]           = useState<'positive' | 'negative' | null>(null)
  const [showNegOpts, setShowNegOpts] = useState(false)
  const [selectedNeg, setSelectedNeg] = useState<string | null>(null)
  const [toast, setToast]             = useState(false)
  const [toastMsg, setToastMsg]       = useState('감사해요 🤍')
  const toastTimer                    = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch(`/api/letters/${letterId}/reply`)
      .then(async r => {
        if (!r.ok) { setReply(null); setLoading(false); return }   // 404/403 등
        const data = await r.json()
        if (data.pending) { setPending(true); setLoading(false); return }  // 노출 시각 전
        setReply(data); setHasFeedback(data.hasFeedback); setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [letterId])

  useEffect(() => {
    if (!reply) return
    const viewStart = Date.now()

    if (!reply.isRead) {
      fetch(`/api/letters/${letterId}/reply`, { method: 'PATCH' })
      trackReplyViewed({ letter_id: letterId, week: reply.week ?? 1 })
    }

    return () => {
      const sec = Math.round((Date.now() - viewStart) / 1000)
      if (sec >= 3) trackReplyViewedDuration({ read_duration_sec: sec })
    }
  }, [reply, letterId])

  // 토스트 표시
  const showToast = useCallback((msg = '감사해요 🤍') => {
    setToastMsg(msg)
    setToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(false), 1500)
  }, [])

  // 피드백 제출
  const submitFeedback = useCallback(async (r: 'positive' | 'negative', reason?: string) => {
    if (!reply) return
    setFadingOut(true)
    setTimeout(() => setHasFeedback(true), 400)
    try {
      await fetch(`/api/replies/${reply.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: r, reason }),
      })
    } catch {
      setFadingOut(false)
      setHasFeedback(false)
    }
  }, [reply])

  const handleRating = useCallback((r: 'positive' | 'negative') => {
    setRating(r)
    if (r === 'positive') {
      submitFeedback('positive')
      setShowNegOpts(false)
      showToast('감사해요 🤍')
    } else {
      setShowNegOpts(true)
    }
  }, [submitFeedback, showToast])

  const handleNegOption = useCallback((opt: string) => {
    setSelectedNeg(opt)
    submitFeedback('negative', opt)
    showToast('소중한 의견 감사해요 🤍')
    setTimeout(() => {
      setShowNegOpts(false)
      setSelectedNeg(null)
    }, 500)
  }, [submitFeedback, showToast])

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#f3eef6',
      }}>
        <Spinner size={32} label="답장을 불러오는 중..." />
      </div>
    )
  }

  if (pending) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14,
        background: '#f3eef6', padding: '0 32px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 30 }}>🌿</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--lav-800)', lineHeight: 1.5 }}>
          답장이 아직 준비 중이에요
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--lav-600)', lineHeight: 1.7 }}>
          아이가 마음을 담아 편지를 쓰고 있어요.<br/>준비되면 알림으로 알려드릴게요.
        </div>
        <button onClick={() => router.push('/')} style={{
          marginTop: 8, padding: '12px 28px', borderRadius: 999,
          background: 'var(--lav-700)', color: '#fff', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
        }}>
          홈으로
        </button>
      </div>
    )
  }

  if (!reply) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: '#f3eef6',
        fontFamily: 'var(--font-sans)', fontSize: 13, color: '#bba089',
      }}>
        <div>답장을 찾을 수 없어요.</div>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a6a45', fontSize: 13 }}>
          돌아가기
        </button>
      </div>
    )
  }

  // ── 위기 안내 답장 — '아이의 답장'과 다른 톤(딥 라벤더), 피드백 없음, 109 연결 ──
  if (reply.replyType === 'crisis') {
    return (
      <div style={{ minHeight: '100dvh', background: '#2a223f', paddingBottom: 40 }}>
        {/* 상단 바 */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center',
          padding: '14px 16px 10px', background: '#2a223f',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px 4px 0', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              마음을 살피는 편지
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {formatDate(reply.receivedAt)} · {formatDateTime(reply.receivedAt)}
            </div>
          </div>
          <div style={{ width: 28 }} />
        </div>

        <div style={{ padding: '24px 22px 0' }}>
          <div style={{ textAlign: 'center', fontSize: 30, marginBottom: 18 }}>🫂</div>
          {/* 안내 본문 */}
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.95,
            color: 'rgba(255,255,255,0.92)', whiteSpace: 'pre-wrap', wordBreak: 'keep-all',
          }}>
            {reply.content}
          </div>

          {/* 액션 */}
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="tel:109" style={{
              width: '100%', padding: '15px 0', borderRadius: 999, textAlign: 'center',
              background: 'linear-gradient(135deg, #faddca, #fbb489)',
              color: '#2a1c44', textDecoration: 'none',
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700,
            }}>
              109 전화 연결
            </a>
            <button onClick={() => router.push('/')} style={{
              width: '100%', padding: '14px 0', borderRadius: 999,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.22)',
              color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
            }}>
              홈으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f3eef6', paddingBottom: 32, position: 'relative' }}>

      {/* ── 토스트 ── */}
      <div style={{
        position: 'fixed', top: 72, left: '50%',
        transform: `translateX(-50%) translateY(${toast ? 0 : -12}px)`,
        opacity: toast ? 1 : 0,
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        zIndex: 100, pointerEvents: 'none',
        background: 'rgba(90,60,30,0.88)',
        color: '#fff', borderRadius: 999,
        padding: '8px 18px',
        fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      }}>
        {toastMsg}
      </div>

      {/* ── 상단 바 ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center',
        padding: '14px 16px 10px',
        background: '#f3eef6',
        borderBottom: '1px solid rgba(140,110,70,0.08)',
      }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px 4px 0', color: '#8a6a45', display: 'flex', alignItems: 'center' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: '#5c4a3a', letterSpacing: '-0.01em' }}>
            {petJosa(reply.petName, '이가')} {reply.ownerNickname}에게
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#bba089', marginTop: 2 }}>
            {formatDate(reply.receivedAt)} · {formatDateTime(reply.receivedAt)}
          </div>
        </div>
        <div style={{
          padding: '5px 12px', borderRadius: 999,
          background: 'rgba(212,184,140,0.85)',
          fontFamily: 'var(--font-sans)', fontSize: 11,
          color: '#fff', fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          아이의 답장
        </div>
      </div>

      {/* ── 편지 이미지 ── */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '150%' }}>
        <Image
          src="/letter-cream-bg.png" alt="편지 봉투" fill
          style={{ objectFit: 'fill', zIndex: 0, filter: 'drop-shadow(4px 6px 12px rgba(120,90,50,0.18))' }}
          priority
        />
        {/* 텍스트 영역 */}
        <div style={{
          position: 'absolute', top: '8%', left: '10%', right: '10%', height: '62%',
          overflowY: 'auto', zIndex: 1, scrollbarWidth: 'none',
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 27.5px, rgba(180,148,100,0.13) 27.5px, rgba(180,148,100,0.13) 28.5px)',
        }}>
          <div className="reply-letter-text" style={{ fontSize: 15, lineHeight: '1.9', color: '#5c4a3a', whiteSpace: 'pre-wrap', wordBreak: 'keep-all', letterSpacing: '0.01em' }}>
            {reply.content}
          </div>
        </div>
        {/* Abiding 로고 */}
        <div style={{ position: 'absolute', bottom: '3%', left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none', userSelect: 'none' }}>
          <span style={{ fontFamily: 'var(--font-brand)', fontSize: 22, color: '#c9a96e', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Abiding</span>
        </div>
      </div>

      {/* ── 피드백 + 액션 버튼 영역 ── */}
      <div style={{ padding: '0 16px' }}>

        {/* 피드백 섹션 — 이미 제출했으면 숨김 */}
        {!hasFeedback && <div style={{ padding: '20px 0 16px', opacity: fadingOut ? 0 : 1, transition: 'opacity 0.4s ease' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#9a7e62', textAlign: 'center', marginBottom: 12 }}>
            오늘 <strong style={{ color: '#7a5c3a' }}>{reply.petName}</strong> 편지 어땠나요?
          </div>

          {/* 따뜻했어요 / 아쉬웠어요 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(['positive', 'negative'] as const).map((r) => {
              const isSelected = rating === r
              const label = r === 'positive' ? '🤍 따뜻했어요' : '💭 아쉬웠어요'
              return (
                <button
                  key={r}
                  onClick={() => handleRating(r)}
                  style={{
                    padding: '10px 0', borderRadius: 999,
                    border: isSelected
                      ? `1.5px solid ${r === 'positive' ? '#c9a96e' : '#b09070'}`
                      : '1px solid rgba(140,110,70,0.25)',
                    background: isSelected
                      ? r === 'positive' ? 'rgba(201,169,110,0.18)' : 'rgba(160,120,80,0.14)'
                      : 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: 13,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? '#6b4020' : '#a08060',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* 아쉬웠어요 옵션 */}
          {showNegOpts && (
            <div style={{ marginTop: 10, borderRadius: 14, border: '1px solid rgba(140,110,70,0.18)', overflow: 'hidden' }}>
              {NEG_OPTIONS.map((opt, i) => {
                const isChosen = selectedNeg === opt
                return (
                  <button
                    key={opt}
                    onClick={() => handleNegOption(opt)}
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: isChosen ? 'rgba(160,120,80,0.08)' : 'transparent',
                      border: 'none',
                      borderTop: i === 0 ? 'none' : '1px solid rgba(140,110,70,0.1)',
                      cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'var(--font-sans)', fontSize: 13,
                      color: isChosen ? '#6b4020' : '#8a6a4a',
                      fontWeight: isChosen ? 600 : 400,
                      display: 'flex', alignItems: 'center', gap: 8,
                      transition: 'all 0.12s',
                    }}
                  >
                    <span style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      border: isChosen ? '5px solid #c9a96e' : '1.5px solid rgba(140,110,70,0.4)',
                      display: 'inline-block', transition: 'border 0.12s',
                    }} />
                    {opt}
                  </button>
                )
              })}
            </div>
          )}
        </div>}

        {/* 구분선 */}
        <div style={{ height: 1, background: 'rgba(140,110,70,0.12)', margin: '0 0 14px' }} />

        {/* 액션 버튼 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 8 }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '13px 0', borderRadius: 999,
              background: 'transparent',
              border: '1px solid rgba(140,110,70,0.3)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
              color: '#8a6a45',
            }}
          >
            닫기
          </button>
          <SoftCTAButton
            onClick={() => router.push('/write')}
            style={{
              padding: '13px 0', borderRadius: 999,
              background: 'linear-gradient(135deg, #d4a96e 0%, #a07840 100%)',
              color: '#fff',
              boxShadow: '0 2px 10px rgba(160,120,64,0.3)',
            }}
          >
            답장쓰기
          </SoftCTAButton>
        </div>
      </div>
    </div>
  )
}
