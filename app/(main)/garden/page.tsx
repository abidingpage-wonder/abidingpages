'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// ── 상수 ──────────────────────────────────────────────────────────
const MAX_MESSAGES = 15
const GOLDEN_ANGLE = 137.5 // degrees

// placeholder 문구 (메시지 없을 때)
const PLACEHOLDERS = [
  '너랑 함께한\n모든 순간이 고마워',
  '언제나 내 마음속에 있어 ✦',
  '보고싶어, 우리 아가 ✦',
  '다시 만나자, 꼭',
  '오늘도 잘했어 ♥',
]

// ── 타입 ──────────────────────────────────────────────────────────
interface GardenMessage { id: string; content: string; createdAt: string }
interface PetCard {
  id: string; name: string; species: string; breed: string | null
  bornAt: string; diedAt: string | null; profileImageUrl: string | null
  ownerNickname: string | null; firstWord: string | null; togetherDays: number
  commentAllowed: boolean
  candle: number; flower: number; heart: number; stickerSenders: number
  myStickers: string[]
}

// ── 방사형 위치 계산 ───────────────────────────────────────────────
function getRadialPosition(index: number, heroH: number, heroW: number) {
  if (index === 0) return { x: heroW / 2, y: heroH * 0.42 }
  const angleRad = (index * GOLDEN_ANGLE * Math.PI) / 180
  const radius = Math.min(index * 30, heroW * 0.44)
  const cx = heroW / 2
  const cy = heroH * 0.42
  return {
    x: cx + Math.cos(angleRad) * radius,
    y: cy + Math.sin(angleRad) * radius * 0.7, // 세로 압축
  }
}

// ── 유틸 ──────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${y}.${m}.${d}`
}

// ── 스티커 SVG ────────────────────────────────────────────────────
function StickerIcon({ kind }: { kind: 'candle' | 'flower' | 'heart' }) {
  if (kind === 'candle') return (
    <svg width="16" height="18" viewBox="0 0 20 22" fill="none">
      <rect x="6" y="9" width="8" height="10" rx="1" fill="#f3ecdf" stroke="#cab393" strokeWidth="0.6"/>
      <path d="M10 6 Q 8 4 10 1 Q 12 4 10 6 Z" fill="#fbb489"/>
      <ellipse cx="10" cy="19" rx="6" ry="1.4" fill="#cab393" opacity="0.4"/>
    </svg>
  )
  if (kind === 'flower') return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      {[0,1,2,3,4].map(i => {
        const a = (i/5)*Math.PI*2 - Math.PI/2
        return <ellipse key={i} cx={10+Math.cos(a)*4} cy={10+Math.sin(a)*4} rx="3" ry="2" fill="#f5c4dc" transform={`rotate(${i*72} ${10+Math.cos(a)*4} ${10+Math.sin(a)*4})`}/>
      })}
      <circle cx="10" cy="10" r="2" fill="#fbb489"/>
    </svg>
  )
  return (
    <svg width="16" height="14" viewBox="0 0 24 22" fill="none">
      <path d="M12 20s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.5-8 11-8 11z" fill="none" stroke="#b39bcd" strokeWidth="1.4"/>
    </svg>
  )
}

// ── 추모관 카드 (유리돔 제거) ─────────────────────────────────────
function MemorialCard({
  pet, candle, flower, heart, stickerSenders, myStickers, onClick, onSticker,
}: {
  pet: PetCard
  candle: number; flower: number; heart: number; stickerSenders: number
  myStickers: string[]
  onClick: () => void
  onSticker: (type: 'candle' | 'flower' | 'heart') => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px 16px 14px', borderRadius: 20, cursor: 'pointer',
        backgroundColor: '#e8e0f0',
        backgroundImage: [
          'radial-gradient(ellipse at 10% 0%, rgba(255,255,255,0.72), transparent 55%)',
          'radial-gradient(circle at 80% 85%, rgba(140,110,190,0.14), transparent 45%)',
          'repeating-linear-gradient(43deg,  rgba(100,70,160,0.03) 0 1px, transparent 1px 3px)',
          'repeating-linear-gradient(133deg, rgba(100,70,160,0.025) 0 1px, transparent 1px 3px)',
        ].join(', '),
        border: '0.5px solid rgba(166,133,199,0.35)',
        boxShadow: '0 3px 14px rgba(86,52,140,0.1), inset 0 0.5px 0 rgba(255,255,255,0.5)',
      }}
    >
      {/* 상단: 프로필 + 텍스트 */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
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
          {/* 하트 스티커 */}
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
            }}>
              {pet.name}
            </div>
            {pet.ownerNickname && (
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--lav-500)',
              }}>의 {pet.ownerNickname}</div>
            )}
          </div>
          <div style={{
            marginTop: 5, fontFamily: 'var(--font-sans)', fontSize: 11,
            fontWeight: 500, color: 'var(--lav-600)', letterSpacing: '0.04em',
          }}>
            {fmtDate(pet.bornAt)}{pet.diedAt ? ` — ${fmtDate(pet.diedAt)}` : ''}
          </div>
          {pet.firstWord && (
            <div style={{
              marginTop: 6, fontFamily: 'var(--font-handwriting)', fontSize: 14.5,
              lineHeight: 1.4, color: '#d4724a', letterSpacing: '-0.01em',
            }}>
              <span style={{ opacity: 0.7 }}>"</span>{pet.firstWord}
            </div>
          )}
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ height: 0.5, background: 'rgba(166,133,199,0.18)', margin: '14px 0 12px' }}/>

      {/* 스티커 */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
      >
        {(['candle', 'flower', 'heart'] as const).map(kind => {
          const count = kind === 'candle' ? candle : kind === 'flower' ? flower : heart
          const sent = myStickers.includes(kind)
          const icon = kind === 'candle' ? '/icons/candle.webp' : kind === 'flower' ? '/icons/flower.webp' : '/icons/heart-cream.webp'
          return (
            <button
              key={kind}
              onClick={() => onSticker(kind)}
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
        }}>
          · {stickerSenders}명이 마음을 전했어요
        </span>
      </div>
    </div>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────────
export default function GardenPage() {
  const router = useRouter()
  const heroRef = useRef<HTMLDivElement>(null)
  const [heroSize, setHeroSize] = useState({ w: 390, h: 440 })

  const [messages, setMessages] = useState<GardenMessage[]>([])
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [pets, setPets] = useState<PetCard[]>([])
  const [messageCount, setMessageCount] = useState(0)
  const [inputText, setInputText] = useState('')
  const [posting, setPosting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // hero 크기 측정
  useEffect(() => {
    if (!heroRef.current) return
    const ro = new ResizeObserver(entries => {
      const e = entries[0]
      setHeroSize({ w: e.contentRect.width, h: e.contentRect.height })
    })
    ro.observe(heroRef.current)
    return () => ro.disconnect()
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    fetch('/api/garden')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        if (d.pets?.length) setPets(d.pets)
        if (d.messages) setMessages(d.messages)
        if (d.messageCount !== undefined) setMessageCount(d.messageCount)
      })
      .catch(() => {})
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function handlePost() {
    if (!inputText.trim() || posting) return
    setPosting(true)
    try {
      const res = await fetch('/api/garden/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputText.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'daily_limit') showToast('오늘은 3회까지 올릴 수 있어요 🌙')
        else if (data.error === 'content_too_long') showToast('20자 이내로 입력해주세요')
        else showToast('잠시 후 다시 시도해주세요')
        setPosting(false)
        return
      }
      const newMsg: GardenMessage = { id: data.id, content: data.content, createdAt: data.createdAt }
      setInputText('')
      setMessageCount(n => n + 1)

      // 15개 초과면 가장 오래된 것 fade-out 후 제거
      if (messages.length >= MAX_MESSAGES) {
        const oldest = messages[messages.length - 1]
        setRemovingId(oldest.id)
        setTimeout(() => {
          setMessages(prev => [newMsg, ...prev.slice(0, MAX_MESSAGES - 1)])
          setRemovingId(null)
        }, 500)
      } else {
        setMessages(prev => [newMsg, ...prev])
      }
    } catch {
      showToast('잠시 후 다시 시도해주세요')
    }
    setPosting(false)
  }

  async function handleSticker(petId: string, type: 'candle' | 'flower' | 'heart') {
    try {
      const res = await fetch('/api/garden/sticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId, stickerType: type }),
      })
      const data = await res.json()
      if (res.ok) {
        setPets(prev => prev.map(p => {
          if (p.id !== petId) return p
          return {
            ...p,
            candle: data.stickers.candle,
            flower: data.stickers.flower,
            heart: data.stickers.heart,
            stickerSenders: data.stickerSenders,
            myStickers: [...new Set([...p.myStickers, type])],
          }
        }))
      }
    } catch {}
  }

  // 전광판에 표시할 항목 (메시지 없으면 placeholder)
  const displayMessages = messages.length > 0
    ? messages
    : PLACEHOLDERS.map((t, i) => ({ id: `ph${i}`, content: t, createdAt: '' }))

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#F0EBF4', fontFamily: 'var(--font-sans)', color: '#fff',
    }}>
      <style>{`
        @keyframes gardenTwinkle {
          0%,100% { opacity:1; filter:brightness(1); }
          50%     { opacity:0.78; filter:brightness(1.25); }
        }
        @keyframes msgAppear {
          from { transform: translate(-50%, -50%) scale(0.6); opacity:0; }
          to   { transform: translate(-50%, -50%) scale(1);   opacity:1; }
        }
      `}</style>

      <div className="no-scrollbar" style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>

        {/* TOP BAR */}
        <div style={{
          padding: '14px 18px 8px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'relative', zIndex: 3,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5z"
                    stroke="#f3e8de" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800,
                color: '#f3e8de', letterSpacing: '-0.02em', whiteSpace: 'nowrap',
              }}>추모 정원</span>
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>커뮤니티</span>
            </div>
          </div>
          <div style={{
            padding: '5px 11px 5px 9px', borderRadius: 999,
            border: '0.8px solid rgba(243,232,222,0.35)',
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 10.5, color: '#f3e8de', fontWeight: 500,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3.5" y="6" width="17" height="13" rx="2" stroke="#FEBE98" strokeWidth="1.4"/>
              <path d="M12 16s-3.5-2.2-3.5-5A2 2 0 0 1 12 9a2 2 0 0 1 3.5 2c0 2.8-3.5 5-3.5 5z" fill="#FEBE98"/>
            </svg>
            마음 보관함
          </div>
        </div>

        {/* HERO — 방사형 전광판 */}
        <div ref={heroRef} style={{ position: 'relative', height: 440, overflow: 'hidden' }}>
          <img src="/garden-night.png" alt="" style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'top center',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 40%, rgba(28,15,46,0.55) 100%)',
          }} />

          {/* center title */}
          <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0, textAlign: 'center', zIndex: 2 }}>
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: '#fff',
              letterSpacing: '-0.02em',
              textShadow: '0 0 10px rgba(255,236,210,0.6), 0 0 22px rgba(143,68,208,0.5)',
            }}>오늘도 너를 사랑해</div>
          </div>

          {/* 방사형 floating messages */}
          {displayMessages.map((msg, idx) => {
            const { x, y } = getRadialPosition(idx, heroSize.h, heroSize.w)
            const opacity = Math.max(0.38, 1 - idx * 0.048)
            const fontSize = Math.max(10, 14 - idx * 0.3)
            const isRemoving = msg.id === removingId
            const isNewest = idx === 0 && messages.length > 0 && msg.id !== `ph0`

            return (
              <div key={msg.id} style={{
                position: 'absolute',
                left: x, top: y,
                transform: 'translate(-50%, -50%)',
                fontFamily: 'var(--font-sans)',
                fontWeight: idx === 0 ? 600 : 400,
                fontSize, lineHeight: 1.45, whiteSpace: 'pre-line', textAlign: 'center',
                color: `rgba(255,250,240,${isRemoving ? 0 : opacity})`,
                letterSpacing: '-0.01em', zIndex: 2,
                textShadow: '0 0 6px rgba(255,236,210,0.75), 0 0 14px rgba(254,190,152,0.55), 0 0 26px rgba(143,68,208,0.5)',
                transition: isRemoving
                  ? 'opacity 0.5s ease, transform 0.5s ease'
                  : 'left 0.7s cubic-bezier(0.25,0.46,0.45,0.94), top 0.7s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.7s ease, font-size 0.7s ease',
                animation: isNewest
                  ? `msgAppear 0.5s ease forwards, gardenTwinkle ${3 + (idx % 4) * 0.7}s ease-in-out ${0.5 + (idx % 5) * 0.4}s infinite`
                  : `gardenTwinkle ${3 + (idx % 4) * 0.7}s ease-in-out ${(idx % 5) * 0.4}s infinite`,
              }}>{msg.content}</div>
            )
          })}

          {/* count banner */}
          <div style={{
            position: 'absolute', left: '50%', bottom: 14, transform: 'translateX(-50%)',
            padding: '8px 16px', borderRadius: 999, zIndex: 3, whiteSpace: 'nowrap',
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '0.8px solid rgba(254,190,152,0.35)',
            display: 'inline-flex', alignItems: 'center', gap: 7,
            fontSize: 12, color: '#fff', fontWeight: 500, letterSpacing: '-0.01em',
            boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="8" r="3.2" stroke="#FEBE98" strokeWidth="1.5"/>
              <circle cx="16" cy="9" r="2.4" stroke="#FEBE98" strokeWidth="1.5"/>
              <path d="M3.5 18c0-2.8 2.5-4.5 5.5-4.5s5.5 1.7 5.5 4.5" stroke="#FEBE98" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 17c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" stroke="#FEBE98" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            지금{' '}
            <span style={{ color: '#FEBE98', fontWeight: 700 }}>{messageCount}명</span>
            이 마음을 전하고 있어요
          </div>
        </div>

        {/* CARDS PANEL */}
        <div style={{
          marginTop: -18, borderTopLeftRadius: 24, borderTopRightRadius: 24,
          background: '#F0EBF4', padding: '20px 16px 18px',
          position: 'relative', zIndex: 2, minHeight: 340,
        }}>
          {/* 섹션 타이틀 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
            <LeafSprig flip />
            <div style={{
              fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16,
              color: '#3a2a4d', letterSpacing: '-0.02em',
            }}>
              우리 아이들을 기억하는 공간
            </div>
            <LeafSprig />
          </div>

          {pets.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              fontFamily: 'var(--font-sans)', fontSize: 13, color: '#9b8bb0',
            }}>
              아직 공개된 추모관이 없어요
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pets.map(p => (
                <MemorialCard
                  key={p.id}
                  pet={p}
                  candle={p.candle} flower={p.flower} heart={p.heart}
                  stickerSenders={p.stickerSenders}
                  myStickers={p.myStickers}
                  onClick={() => router.push(`/garden/${p.id}`)}
                  onSticker={type => handleSticker(p.id, type)}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ height: 150 }} />
      </div>

      {/* BOTTOM INPUT */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 74,
        padding: '10px 12px 8px', zIndex: 5,
        background: 'linear-gradient(180deg, rgba(240,235,244,0) 0%, #F0EBF4 45%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              value={inputText}
              onChange={e => setInputText(e.target.value.slice(0, 20))}
              onKeyDown={e => e.key === 'Enter' && handlePost()}
              placeholder="오늘의 마음 한 줄을 남겨보세요"
              maxLength={20}
              style={{
                width: '100%', height: 40, borderRadius: 20, boxSizing: 'border-box',
                background: '#fff', border: '0.8px solid rgba(143,68,208,0.2)',
                padding: '0 44px 0 16px', fontSize: 12, color: '#3a2a4d',
                boxShadow: '0 2px 8px rgba(86,52,140,0.06)', outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
            {inputText.length > 0 && (
              <span style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 10, color: inputText.length >= 20 ? '#e07060' : '#9a8caa',
                fontFamily: 'var(--font-sans)', pointerEvents: 'none',
              }}>
                {inputText.length}/20
              </span>
            )}
          </div>
          <button
            onClick={handlePost}
            disabled={posting || !inputText.trim()}
            style={{
              height: 40, padding: '0 15px', borderRadius: 20, border: 'none',
              background: '#8F44D0', color: '#fff', fontWeight: 700, fontSize: 12,
              fontFamily: 'var(--font-sans)', cursor: 'pointer', letterSpacing: '-0.01em',
              whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(143,68,208,0.4)',
              opacity: posting || !inputText.trim() ? 0.55 : 1,
            }}
          >전광판에 올리기</button>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'absolute', bottom: 130, left: '50%', transform: 'translateX(-50%)',
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

function LeafSprig({ flip }: { flip?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
         style={{ transform: flip ? 'scaleX(-1)' : 'none', flexShrink: 0 }}>
      <path d="M3 13 C 6 7, 10 5, 14 3" stroke="#b89dd6" strokeWidth="1" fill="none"/>
      <ellipse cx="5"  cy="11" rx="1.7" ry="0.9" fill="#b89dd6" transform="rotate(-30 5 11)"/>
      <ellipse cx="8"  cy="8"  rx="1.7" ry="0.9" fill="#b89dd6" transform="rotate(-30 8 8)"/>
      <ellipse cx="11" cy="5.5" rx="1.7" ry="0.9" fill="#b89dd6" transform="rotate(-30 11 5.5)"/>
    </svg>
  )
}
