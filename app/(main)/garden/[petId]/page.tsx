'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// ── 타입 ──────────────────────────────────────────────────────────
interface PetDetail {
  id: string; name: string; species: string; breed: string | null
  bornAt: string; diedAt: string | null; profileImageUrl: string | null
  ownerNickname: string | null; firstWord: string | null; togetherDays: number
  commentAllowed: boolean
}
interface PageData {
  pet: PetDetail
  stickers: { candle: number; flower: number; heart: number }
  stickerSenders: number
  myStickers: string[]
  comments: Comment[]
  daysSince: number
}
interface Comment {
  id: string; content: string; createdAt: string; authorLabel: string
}

// ── 유틸 ──────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${y}.${m}.${d}`
}
function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}시간 전`
  return `${Math.floor(hrs / 24)}일 전`
}

// ── GlassDome (archive 동일) ──────────────────────────────────────
function GlassDome() {
  return (
    <svg viewBox="0 0 60 80" style={{ width: '100%', height: 'auto' }}>
      <defs>
        <radialGradient id="flameGrad2" cx="40%" cy="30%">
          <stop offset="0" stopColor="#fff8dc"/>
          <stop offset="0.4" stopColor="#fbb489"/>
          <stop offset="1" stopColor="#ea7e4a"/>
        </radialGradient>
        <linearGradient id="domeGrad2" x1="0" x2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.5)"/>
          <stop offset="0.5" stopColor="rgba(255,255,255,0.15)"/>
          <stop offset="1" stopColor="rgba(255,255,255,0.4)"/>
        </linearGradient>
      </defs>
      <path d="M30 6 Q 30 4 32 4 Q 34 4 34 6 L 34 10 Q 50 12 50 32 L 50 66 L 10 66 L 10 32 Q 10 12 26 10 L 26 6 Q 26 4 28 4 Q 30 4 30 6 Z"
        fill="url(#domeGrad2)" stroke="rgba(166,133,199,0.55)" strokeWidth="0.6"/>
      <ellipse cx="30" cy="68" rx="22" ry="3" fill="#a685c7" opacity="0.35"/>
      <rect x="9" y="64" width="42" height="6" rx="2" fill="#d2bee0"/>
      <rect x="26" y="46" width="8" height="16" rx="1" fill="#fff"/>
      <ellipse cx="30" cy="62" rx="4.2" ry="0.8" fill="#cab393" opacity="0.5"/>
      <line x1="30" y1="46" x2="30" y2="42" stroke="#7a6b4d" strokeWidth="0.5"/>
      <path d="M30 44 Q 28 40 30 36 Q 32 40 30 44 Z" fill="url(#flameGrad2)"/>
      <ellipse cx="30" cy="38" rx="3" ry="3.5" fill="#fbb489" opacity="0.3"/>
      <g transform="translate(40, 28)">
        <line x1="0" y1="0" x2="-2" y2="28" stroke="#7a6b4d" strokeWidth="0.5"/>
        {[0,1,2,3,4].map(i => <ellipse key={i} cx={-2+i*-0.4} cy={i*5} rx="1.6" ry="2" fill="#a685c7" opacity={0.85}/>)}
      </g>
      <g transform="translate(45, 33)">
        <line x1="0" y1="0" x2="-1" y2="22" stroke="#7a6b4d" strokeWidth="0.5"/>
        {[0,1,2,3].map(i => <ellipse key={i} cx={-i*0.3} cy={i*4} rx="1.4" ry="1.8" fill="#bca4d6" opacity={0.7}/>)}
      </g>
      <g transform="translate(43, 55)">
        {[0,1,2,3,4,5].map(i => {
          const a = (i/6)*Math.PI*2
          return <ellipse key={i} cx={Math.cos(a)*3} cy={Math.sin(a)*3} rx="2.4" ry="1.6" fill="#fff" transform={`rotate(${i*60} ${Math.cos(a)*3} ${Math.sin(a)*3})`}/>
        })}
        <circle r="2" fill="#fff5da"/>
        <circle r="1" fill="#e2b87a"/>
      </g>
    </svg>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────────
export default function GardenDetailPage({ params }: { params: Promise<{ petId: string }> }) {
  const router = useRouter()
  const [petId, setPetId] = useState<string | null>(null)
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState('')
  const [posting, setPosting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // params 언래핑
  useEffect(() => {
    params.then(p => setPetId(p.petId))
  }, [params])

  useEffect(() => {
    if (!petId) return
    fetch(`/api/garden/${petId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [petId])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleSticker(type: 'candle' | 'flower' | 'heart') {
    if (!petId || !data) return
    try {
      const res = await fetch('/api/garden/sticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId, stickerType: type }),
      })
      const d = await res.json()
      if (res.ok) {
        setData(prev => prev ? {
          ...prev,
          stickers: d.stickers,
          stickerSenders: d.stickerSenders,
          myStickers: [...new Set([...prev.myStickers, type])],
        } : prev)
      }
    } catch {}
  }

  async function handleComment() {
    if (!petId || !inputText.trim() || posting) return
    setPosting(true)
    try {
      const res = await fetch(`/api/garden/${petId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputText.trim() }),
      })
      const d = await res.json()
      if (!res.ok) {
        if (d.error === 'comments_disabled') showToast('댓글이 비공개 상태입니다')
        else showToast('잠시 후 다시 시도해주세요')
        setPosting(false)
        return
      }
      setInputText('')
      setData(prev => prev ? {
        ...prev,
        comments: [d, ...prev.comments],
      } : prev)
    } catch {
      showToast('잠시 후 다시 시도해주세요')
    }
    setPosting(false)
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-300)',
        background: 'var(--bg-app)',
      }}>불러오는 중...</div>
    )
  }

  if (!data) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 12, background: 'var(--bg-app)',
      }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-300)' }}>
          추모관을 찾을 수 없어요
        </div>
        <button onClick={() => router.back()} style={{
          fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--lav-600)',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>돌아가기</button>
      </div>
    )
  }

  const { pet, stickers, stickerSenders, myStickers, comments, daysSince } = data

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)', paddingBottom: 120 }}>

      {/* 헤더 */}
      <div style={{
        padding: '14px 16px 8px', display: 'flex', alignItems: 'center', gap: 8,
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-app)',
        borderBottom: '0.5px solid rgba(166,133,199,0.12)',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(86,52,140,0.08)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="var(--lav-700)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--lav-800)' }}>
          추모 정원
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* 추모관 카드 */}
        <div style={{
          padding: '16px 16px 14px', borderRadius: 20,
          backgroundColor: '#e8e0f0',
          backgroundImage: [
            'radial-gradient(ellipse at 10% 0%, rgba(255,255,255,0.72), transparent 55%)',
            'radial-gradient(circle at 80% 85%, rgba(140,110,190,0.14), transparent 45%)',
            'repeating-linear-gradient(43deg,  rgba(100,70,160,0.03) 0 1px, transparent 1px 3px)',
            'repeating-linear-gradient(133deg, rgba(100,70,160,0.025) 0 1px, transparent 1px 3px)',
          ].join(', '),
          border: '0.5px solid rgba(166,133,199,0.35)',
          boxShadow: '0 3px 14px rgba(86,52,140,0.1), inset 0 0.5px 0 rgba(255,255,255,0.5)',
        }}>
          {/* 상단 행: 프로필 + 텍스트 + 유리돔 */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>

            {/* 원형 프로필 */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 74, height: 74, borderRadius: '50%',
                background: '#fff', padding: 1.5,
                boxShadow: '0 4px 10px rgba(86,52,140,0.18)',
                overflow: 'hidden',
              }}>
                {pet.profileImageUrl ? (
                  <Image
                    src={pet.profileImageUrl} alt={pet.name}
                    width={68} height={68}
                    style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: 'linear-gradient(145deg, #ece4f3, #d8c8d8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28,
                  }}>
                    {pet.species === 'dog' ? '🐶' : pet.species === 'cat' ? '🐱' : '🐾'}
                  </div>
                )}
              </div>
              <svg width="22" height="20" viewBox="0 0 24 22" fill="none"
                style={{ position: 'absolute', top: -4, left: -4, transform: 'rotate(-12deg)' }}>
                <path d="M12 20s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.5-8 11-8 11z" fill="#bca4d6"/>
              </svg>
            </div>

            {/* 텍스트 */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{
                  fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600,
                  color: 'var(--lav-800)', lineHeight: 1, letterSpacing: '-0.02em',
                }}>{pet.name}</div>
              </div>
              <div style={{
                marginTop: 5, fontFamily: 'var(--font-sans)', fontSize: 11,
                fontWeight: 500, color: 'var(--lav-600)', letterSpacing: '0.04em',
              }}>
                {fmtDate(pet.bornAt)}{pet.diedAt ? ` — ${fmtDate(pet.diedAt)}` : ''}
              </div>
              <div style={{
                marginTop: 4, fontFamily: 'var(--font-sans)', fontSize: 11,
                color: 'var(--lav-600)', letterSpacing: '-0.01em',
              }}>
                {daysSince}일째 {pet.name}를 기억하는 중
              </div>
              {pet.firstWord && (
                <div style={{
                  marginTop: 6, fontFamily: 'var(--font-handwriting)', fontSize: 14.5,
                  lineHeight: 1.4, color: '#d4724a', letterSpacing: '-0.01em',
                  display: 'flex', gap: 4,
                }}>
                  <span style={{ opacity: 0.7 }}>"</span>
                  <span style={{ flex: 1 }}>{pet.firstWord}</span>
                </div>
              )}
            </div>

            {/* 유리돔 */}
            <div style={{ flexShrink: 0, width: 58, alignSelf: 'flex-end', position: 'relative' }}>
              <div style={{
                position: 'absolute', bottom: '30%', left: '50%',
                transform: 'translateX(-50%)',
                width: 48, height: 48, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(251,180,137,0.55) 0%, rgba(251,180,137,0.2) 45%, transparent 70%)',
                filter: 'blur(6px)',
                pointerEvents: 'none', zIndex: 0,
              }}/>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <GlassDome />
              </div>
            </div>
          </div>

          {/* 구분선 */}
          <div style={{ height: 0.5, background: 'rgba(166,133,199,0.18)', margin: '14px 0 12px' }}/>

          {/* 스티커 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {(['candle', 'flower', 'heart'] as const).map(kind => {
              const count = stickers[kind]
              const sent = myStickers.includes(kind)
              const icon = kind === 'candle' ? '/icons/candle.webp' : kind === 'flower' ? '/icons/flower.webp' : '/icons/heart-cream.webp'
              return (
                <button
                  key={kind}
                  onClick={() => handleSticker(kind)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '5px 10px 5px 7px', borderRadius: 20,
                    background: sent ? 'rgba(166,133,199,0.18)' : 'rgba(255,255,255,0.4)',
                    border: sent ? '0.5px solid rgba(166,133,199,0.45)' : '0.5px solid rgba(166,133,199,0.2)',
                    boxShadow: '0 1px 4px rgba(86,52,140,0.04)',
                    cursor: 'pointer',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon} alt="" width={20} height={20} style={{ objectFit: 'contain' }}/>
                  <span style={{
                    fontFamily: 'var(--font-sans)', fontSize: 11.5,
                    fontWeight: 600, color: 'var(--lav-700)',
                  }}>{count}</span>
                </button>
              )
            })}
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: 11.5,
              color: '#9b8bb0', whiteSpace: 'nowrap',
            }}>· {stickerSenders}명이 마음을 전했어요</span>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    stroke="var(--lav-600)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600,
              color: 'var(--lav-800)', letterSpacing: '-0.01em',
            }}>
              응원 한마디
            </div>
            <div style={{
              marginLeft: 2, fontFamily: 'var(--font-sans)', fontSize: 11,
              color: 'var(--lav-500)', background: 'rgba(166,133,199,0.15)',
              padding: '2px 8px', borderRadius: 10,
            }}>{comments.length}</div>
          </div>

          {/* 댓글 목록 */}
          {comments.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '28px 0',
              fontFamily: 'var(--font-sans)', fontSize: 13, color: '#b0a0c0', lineHeight: 1.6,
            }}>
              아직 응원 댓글이 없어요<br/>
              <span style={{ fontSize: 12, color: '#c4b4d4' }}>첫 번째로 마음을 전해보세요 ✦</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {comments.map((c, i) => (
                <div key={c.id} style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.6)' : 'transparent',
                  border: i % 2 === 0 ? '0.5px solid rgba(166,133,199,0.12)' : 'none',
                  marginBottom: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{
                      fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                      color: 'var(--lav-700)', letterSpacing: '-0.01em',
                    }}>{c.authorLabel}</div>
                    <div style={{
                      fontFamily: 'var(--font-sans)', fontSize: 10.5, color: '#b0a0c0',
                    }}>{fmtRelative(c.createdAt)}</div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-700)',
                    lineHeight: 1.6, letterSpacing: '-0.01em',
                  }}>{c.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 하단 고정 입력 */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 74, zIndex: 10,
        padding: '10px 14px 8px',
        background: 'linear-gradient(180deg, rgba(243,238,246,0) 0%, var(--bg-app) 40%)',
      }}>
        {pet.commentAllowed ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value.slice(0, 50))}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                placeholder={`${pet.name}에게 응원 한마디를 남겨보세요`}
                maxLength={50}
                style={{
                  width: '100%', height: 42, borderRadius: 21, boxSizing: 'border-box',
                  background: '#fff', border: '0.8px solid rgba(143,68,208,0.2)',
                  padding: '0 50px 0 16px', fontSize: 12.5, color: 'var(--ink-700)',
                  boxShadow: '0 2px 8px rgba(86,52,140,0.06)', outline: 'none',
                  fontFamily: 'var(--font-sans)',
                }}
              />
              {inputText.length > 0 && (
                <span style={{
                  position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 10, color: inputText.length >= 50 ? '#e07060' : '#9a8caa',
                  fontFamily: 'var(--font-sans)', pointerEvents: 'none',
                }}>{inputText.length}/50</span>
              )}
            </div>
            <button
              onClick={handleComment}
              disabled={posting || !inputText.trim()}
              style={{
                width: 42, height: 42, borderRadius: '50%', border: 'none',
                background: 'var(--lav-600)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(86,52,140,0.25)',
                opacity: posting || !inputText.trim() ? 0.5 : 1,
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '11px 0',
            fontFamily: 'var(--font-sans)', fontSize: 12.5, color: '#b0a0c0',
          }}>댓글이 비공개 상태입니다</div>
        )}
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 130, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(28,15,46,0.88)', color: '#fff', borderRadius: 20,
          padding: '9px 18px', fontSize: 12.5, fontFamily: 'var(--font-sans)',
          whiteSpace: 'nowrap', zIndex: 20,
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        }}>{toast}</div>
      )}
    </div>
  )
}
