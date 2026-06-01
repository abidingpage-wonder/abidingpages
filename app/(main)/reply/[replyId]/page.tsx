'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { SoftCTAButton } from '@/components/ui/Button'

interface ReplyData {
  id: string
  content: string
  petName: string
  petPhotoUrl: string | null
  ownerNickname: string
  letterContent: string
  receivedAt: string
  isRead: boolean
}

export default function ReplyPage() {
  const router = useRouter()
  const { replyId } = useParams<{ replyId: string }>()

  const [reply, setReply]   = useState<ReplyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    fetch(`/api/replies/${replyId}`)
      .then(r => r.json())
      .then(data => {
        setReply(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [replyId])

  useEffect(() => {
    if (!reply || reply.isRead) return
    fetch(`/api/replies/${replyId}`, { method: 'PATCH' })
  }, [reply, replyId])

  /** 피드백 컨텍스트를 sessionStorage에 남기고 이동 */
  const saveFeedbackContext = useCallback((petName: string) => {
    if (typeof window === 'undefined') return
    sessionStorage.setItem('pendingFeedback', JSON.stringify({
      replyId,
      petName,
      timestamp: Date.now(),
    }))
  }, [replyId])

  const handleClose = useCallback(() => {
    if (reply) saveFeedbackContext(reply.petName)
    setClosing(true)
    setTimeout(() => router.replace('/home'), 420)
  }, [router, reply, saveFeedbackContext])

  const handleWriteLetter = useCallback(() => {
    if (reply) saveFeedbackContext(reply.petName)
    setClosing(true)
    setTimeout(() => router.replace('/write'), 420)
  }, [router, reply, saveFeedbackContext])

  function formatDateTime(iso: string) {
    const d = new Date(iso)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
  }

  return (
    <>
      <style>{`
        @font-face {
          font-family: 'YoonChildfundManSeh';
          src: url('/fonts/YoonChildfundkoreaManSeh.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes dimIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dimOut { from { opacity: 1; } to { opacity: 0; } }
        .reply-scroll::-webkit-scrollbar { display: none; }
        .reply-letter-text {
          font-family: 'YoonChildfundManSeh', 'Nanum Pen Script', cursive !important;
        }
      `}</style>

      {/* ── 딤 레이어 ── */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 50,
          animation: closing ? 'dimOut 0.4s ease forwards' : 'dimIn 0.3s ease forwards',
        }}
      />

      {/* ── 바텀 시트 ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          height: '95dvh',
          background: '#f5f0e8',
          borderRadius: '20px 20px 0 0',
          zIndex: 51,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: closing
            ? 'fadeOut 0.4s ease forwards'
            : 'slideUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
        }}
      >
        {/* ── 헤더 ── */}
        <div style={{
          flexShrink: 0,
          padding: '14px 16px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* 드래그 핸들 */}
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: 'rgba(140,110,70,0.2)',
              marginBottom: 6,
            }} />
            {reply && (
              <>
                <div style={{
                  fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700,
                  color: '#5c4a3a', letterSpacing: '-0.01em',
                }}>
                  {reply.petName}가 {reply.ownerNickname}에게
                </div>
                <div style={{
                  fontFamily: 'var(--font-sans)', fontSize: 11, color: '#bba089',
                }}>
                  {formatDate(reply.receivedAt)} · {formatDateTime(reply.receivedAt)}
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {reply && (
              <div style={{
                padding: '5px 12px', borderRadius: 999,
                background: 'rgba(212,184,140,0.85)',
                fontFamily: 'var(--font-sans)', fontSize: 11,
                color: '#fff', fontWeight: 600, whiteSpace: 'nowrap',
              }}>
                아이의 답장
              </div>
            )}
          </div>
        </div>

        {/* ── 스크롤 영역 ── */}
        <div
          className="reply-scroll"
          style={{ flex: 1, overflowY: 'auto' }}
        >
          {/* 로딩 */}
          {loading && (
            <div style={{
              height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-sans)', fontSize: 13, color: '#bba089',
            }}>
              답장을 불러오는 중...
            </div>
          )}

          {/* 에러 */}
          {!loading && !reply && (
            <div style={{
              height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-sans)', fontSize: 13, color: '#bba089',
            }}>
              답장을 찾을 수 없어요.
            </div>
          )}

          {/* 편지 이미지 + 텍스트 */}
          {!loading && reply && (
            <div style={{ position: 'relative', width: '100%', paddingBottom: '150%' }}>

              {/* ── 별 장식 ── */}
              <svg
                viewBox="0 0 100 150"
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  zIndex: 2, pointerEvents: 'none',
                }}
              >
                <g transform="translate(14, 3)" opacity="0.55">
                  <path d="M0 -2 C0.28 -0.56 0.56 -0.28 2 0 C0.56 0.28 0.28 0.56 0 2 C-0.28 0.56 -0.56 0.28 -2 0 C-0.56 -0.28 -0.28 -0.56 0 -2 Z" fill="#c9a96e"/>
                </g>
                <g transform="translate(84, 5)">
                  <path d="M0 -1.2 L0.36 -0.37 L1.14 -0.37 L0.56 0.14 L0.76 0.94 L0 0.48 L-0.76 0.94 L-0.56 0.14 L-1.14 -0.37 L-0.36 -0.37 Z"
                    fill="none" stroke="#c9a96e" strokeWidth="0.32" opacity="0.5"/>
                </g>
                <g transform="translate(50, 4)" opacity="0.42">
                  <path d="M0 -1.8 C0.25 -0.5 0.5 -0.25 1.8 0 C0.5 0.25 0.25 0.5 0 1.8 C-0.25 0.5 -0.5 0.25 -1.8 0 C-0.5 -0.25 -0.25 -0.5 0 -1.8 Z" fill="#c9a96e"/>
                </g>
                <ellipse cx="5" cy="74" rx="1" ry="1.5" fill="#c9a96e" opacity="0.28" transform="rotate(-18, 5, 74)"/>
                <ellipse cx="97" cy="68" rx="0.9" ry="1.4" fill="#c9a96e" opacity="0.26" transform="rotate(12, 97, 68)"/>
                <g transform="translate(6, 102)">
                  <path d="M0 -1.5 L0.45 -0.46 L1.43 -0.46 L0.7 0.18 L0.95 1.17 L0 0.6 L-0.95 1.17 L-0.7 0.18 L-1.43 -0.46 L-0.45 -0.46 Z"
                    fill="none" stroke="#c9a96e" strokeWidth="0.35" opacity="0.5"/>
                </g>
                <g transform="translate(5, 128)" opacity="0.48">
                  <path d="M0 -2.2 C0.3 -0.6 0.6 -0.3 2.2 0 C0.6 0.3 0.3 0.6 0 2.2 C-0.3 0.6 -0.6 0.3 -2.2 0 C-0.6 -0.3 -0.3 -0.6 0 -2.2 Z" fill="#c9a96e"/>
                </g>
                <g transform="translate(95, 110)" opacity="0.5">
                  <path d="M0 -2.4 C0.33 -0.67 0.67 -0.33 2.4 0 C0.67 0.33 0.33 0.67 0 2.4 C-0.33 0.67 -0.67 0.33 -2.4 0 C-0.67 -0.33 -0.33 -0.67 0 -2.4 Z" fill="#c9a96e"/>
                </g>
                <g transform="translate(93, 135)">
                  <path d="M0 -1.1 L0.33 -0.34 L1.05 -0.34 L0.51 0.13 L0.69 0.89 L0 0.46 L-0.69 0.89 L-0.51 0.13 L-1.05 -0.34 L-0.33 -0.34 Z"
                    fill="none" stroke="#c9a96e" strokeWidth="0.32" opacity="0.4"/>
                </g>
              </svg>

              {/* 봉투+편지지 배경 이미지 */}
              <Image
                src="/letter-cream-bg.png"
                alt="편지 봉투"
                fill
                style={{
                  objectFit: 'fill',
                  zIndex: 0,
                  filter: 'drop-shadow(4px 6px 12px rgba(120,90,50,0.18))',
                }}
                priority
              />

              {/* 편지 텍스트 오버레이 */}
              <div style={{
                position: 'absolute',
                top: '8%', left: '10%', right: '10%',
                height: '62%',
                overflow: 'hidden',
                zIndex: 1,
                backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 27.5px, rgba(180,148,100,0.13) 27.5px, rgba(180,148,100,0.13) 28.5px)',
              }}>
                <div
                  className="reply-letter-text"
                  style={{
                    fontSize: 15,
                    lineHeight: '1.9',
                    color: '#5c4a3a',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'keep-all',
                    letterSpacing: '0.01em',
                  }}
                >
                  {reply.content}
                </div>
              </div>

              {/* Abiding 로고 */}
              <div style={{
                position: 'absolute',
                bottom: '3%', left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10, pointerEvents: 'none', userSelect: 'none',
              }}>
                <span style={{
                  fontFamily: 'var(--font-brand)', fontSize: 22,
                  color: '#c9a96e', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                }}>
                  Abiding
                </span>
              </div>
            </div>
          )}

          {/* ── 봉투 아래 버튼 영역 ── */}
          {!loading && reply && (
            <div style={{
              padding: '16px 16px 24px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}>
              {/* 닫기 */}
              <button
                onClick={handleClose}
                style={{
                  padding: '13px 0',
                  borderRadius: 12,
                  background: 'transparent',
                  border: '1px solid rgba(140,110,70,0.3)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14, fontWeight: 500,
                  color: '#8a6a45',
                }}
              >
                닫기
              </button>
              {/* 답장쓰기 — SoftCTA */}
              <SoftCTAButton
                onClick={handleWriteLetter}
                style={{
                  padding: '13px 0',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #d4a96e 0%, #a07840 100%)',
                  color: '#fff',
                  boxShadow: '0 2px 10px rgba(160,120,64,0.3)',
                }}
              >
                답장쓰기
              </SoftCTAButton>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
