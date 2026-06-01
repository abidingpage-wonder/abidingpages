'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const NIGHT_BG = 'linear-gradient(180deg, #1c0f2e 0%, #2a1c44 38%, #574a7e 72%, #8d80ab 100%)'

interface ReplyData {
  id: string
  content: string
  petName: string
  letterContent: string
  receivedAt: string
  isRead: boolean
}

export default function ReplyPage() {
  const router = useRouter()
  const { replyId } = useParams<{ replyId: string }>()

  const [reply, setReply]       = useState<ReplyData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [visible, setVisible]   = useState(false)
  const [showLetter, setShowLetter] = useState(false)

  useEffect(() => {
    fetch(`/api/replies/${replyId}`)
      .then(r => r.json())
      .then(data => {
        setReply(data)
        setLoading(false)
        setTimeout(() => setVisible(true), 80)
      })
      .catch(() => setLoading(false))
  }, [replyId])

  // 읽음 처리
  useEffect(() => {
    if (!reply || reply.isRead) return
    fetch(`/api/replies/${replyId}`, { method: 'PATCH' })
  }, [reply, replyId])

  function formatDate(iso: string) {
    const d = new Date(iso)
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ position: 'fixed', inset: 0, background: NIGHT_BG, zIndex: -1 }} />
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 13,
          color: 'rgba(255,255,255,0.4)',
        }}>
          답장을 불러오는 중...
        </div>
      </div>
    )
  }

  if (!reply) {
    return (
      <div style={{
        minHeight: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ position: 'fixed', inset: 0, background: NIGHT_BG, zIndex: -1 }} />
        <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sans)', fontSize: 14 }}>
          답장을 찾을 수 없어요.
        </div>
        <button onClick={() => router.back()} style={{
          marginTop: 20, background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer',
        }}>
          돌아가기
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', position: 'relative', paddingBottom: 40 }}>
      {/* 전체 배경 */}
      <div style={{ position: 'fixed', inset: 0, background: NIGHT_BG, zIndex: -1 }} />

      {/* 별 장식 */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(16)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 4 === 0 ? 3 : 2,
            height: i % 4 === 0 ? 3 : 2,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.7)',
            top: `${5 + (i * 19) % 75}%`,
            left: `${3 + (i * 29) % 94}%`,
            opacity: 0.3 + (i % 5) * 0.1,
          }} />
        ))}
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>

        {/* ── 헤더 ── */}
        <div style={{
          padding: '16px 20px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button
            onClick={() => router.replace('/home')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, color: 'rgba(255,255,255,0.6)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M14 17L8 11L14 5" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
              color: 'rgba(251,180,137,0.85)', letterSpacing: '0.14em',
              marginBottom: 3,
            }}>
              답장이 도착했어요
            </div>
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600,
              color: '#fff',
            }}>
              {reply.petName}에게서
            </div>
          </div>

          <div style={{ width: 30 }} />
        </div>

        {/* ── 날짜 ── */}
        <div style={{
          textAlign: 'center', marginBottom: 20,
          fontFamily: 'var(--font-sans)', fontSize: 11,
          color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em',
        }}>
          {formatDate(reply.receivedAt)}
        </div>

        {/* ── 답장 봉투 열림 애니메이션 아이콘 ── */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 24,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(251,180,137,0.18)',
            border: '1px solid rgba(251,180,137,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>
            🌙
          </div>
        </div>

        {/* ── 답장 편지지 ── */}
        <div style={{ padding: '0 16px', marginBottom: 16 }}>
          <div style={{
            borderRadius: 20,
            padding: '24px 22px 28px',
            background: 'rgba(255,255,255,0.08)',
            border: '0.5px solid rgba(255,255,255,0.15)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            position: 'relative',
          }}>
            {/* 줄선 */}
            <div style={{
              position: 'absolute', inset: '24px 22px 20px',
              backgroundImage: 'linear-gradient(0deg, transparent 0px, transparent 27px, rgba(255,255,255,0.05) 27px, rgba(255,255,255,0.05) 28px)',
              backgroundSize: '100% 28px',
              pointerEvents: 'none',
            }} />

            <div style={{
              fontFamily: 'var(--font-handwriting)',
              fontSize: 16.5,
              lineHeight: '28px',
              color: '#fff',
              whiteSpace: 'pre-wrap',
              wordBreak: 'keep-all',
              position: 'relative', zIndex: 1,
            }}>
              {reply.content}
            </div>
          </div>
        </div>

        {/* ── 보낸 편지 보기 (토글) ── */}
        <div style={{ padding: '0 16px', marginBottom: 24 }}>
          <button
            onClick={() => setShowLetter(v => !v)}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.06)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.55)',
              fontFamily: 'var(--font-sans)', fontSize: 13,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span>내가 보낸 편지 보기</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              style={{ transform: showLetter ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {showLetter && (
            <div style={{
              marginTop: 8,
              borderRadius: 14,
              padding: '18px 20px',
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              fontFamily: 'var(--font-handwriting)', fontSize: 15,
              lineHeight: '26px',
              color: 'rgba(255,255,255,0.55)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'keep-all',
            }}>
              {reply.letterContent}
            </div>
          )}
        </div>

        {/* ── 하단 CTA ── */}
        <div style={{ padding: '0 16px' }}>
          <button
            onClick={() => router.replace('/home')}
            style={{
              width: '100%',
              padding: '16px 0',
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(135deg, #faddca, #fbb489)',
              color: '#2a1c44',
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700,
              letterSpacing: '-0.01em',
              boxShadow: '0 8px 28px rgba(251,180,137,0.3)',
              cursor: 'pointer',
            }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}
