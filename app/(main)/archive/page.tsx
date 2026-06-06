'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// ── 타입 ─────────────────────────────────────────────────────────
interface ArchiveData {
  pet: {
    id: string
    name: string
    species: string
    breed: string | null
    bornAt: string
    diedAt: string | null
    profileImageUrl: string | null
    ownerNickname: string | null
    togetherDays: number
    firstWord: string | null
  }
  stickers: { candle: number; flower: number; heart: number }
  stickerSenders: number
  daysSince: number
}

// ── 유리돔 촛불 SVG ───────────────────────────────────────────────
function GlassDome() {
  return (
    <svg viewBox="0 0 60 80" style={{ width: '100%', height: 'auto' }}>
      <defs>
        <radialGradient id="flameGrad" cx="40%" cy="30%">
          <stop offset="0" stopColor="#fff8dc"/>
          <stop offset="0.4" stopColor="#fbb489"/>
          <stop offset="1" stopColor="#ea7e4a"/>
        </radialGradient>
        <linearGradient id="domeGrad" x1="0" x2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.5)"/>
          <stop offset="0.5" stopColor="rgba(255,255,255,0.15)"/>
          <stop offset="1" stopColor="rgba(255,255,255,0.4)"/>
        </linearGradient>
      </defs>
      {/* dome */}
      <path d="M30 6 Q 30 4 32 4 Q 34 4 34 6 L 34 10 Q 50 12 50 32 L 50 66 L 10 66 L 10 32 Q 10 12 26 10 L 26 6 Q 26 4 28 4 Q 30 4 30 6 Z"
        fill="url(#domeGrad)" stroke="rgba(166,133,199,0.55)" strokeWidth="0.6"/>
      {/* base */}
      <ellipse cx="30" cy="68" rx="22" ry="3" fill="#a685c7" opacity="0.35"/>
      <rect x="9" y="64" width="42" height="6" rx="2" fill="#d2bee0"/>
      {/* candle */}
      <rect x="26" y="46" width="8" height="16" rx="1" fill="#fff"/>
      <ellipse cx="30" cy="62" rx="4.2" ry="0.8" fill="#cab393" opacity="0.5"/>
      <line x1="30" y1="46" x2="30" y2="42" stroke="#7a6b4d" strokeWidth="0.5"/>
      <path d="M30 44 Q 28 40 30 36 Q 32 40 30 44 Z" fill="url(#flameGrad)"/>
      <ellipse cx="30" cy="38" rx="3" ry="3.5" fill="#fbb489" opacity="0.3"/>
      {/* lavender */}
      <g transform="translate(40, 28)">
        <line x1="0" y1="0" x2="-2" y2="28" stroke="#7a6b4d" strokeWidth="0.5"/>
        {[0,1,2,3,4].map(i => <ellipse key={i} cx={-2+i*-0.4} cy={i*5} rx="1.6" ry="2" fill="#a685c7" opacity={0.85}/>)}
      </g>
      <g transform="translate(45, 33)">
        <line x1="0" y1="0" x2="-1" y2="22" stroke="#7a6b4d" strokeWidth="0.5"/>
        {[0,1,2,3].map(i => <ellipse key={i} cx={-i*0.3} cy={i*4} rx="1.4" ry="1.8" fill="#bca4d6" opacity={0.7}/>)}
      </g>
      {/* chrysanthemum */}
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

// ── 스티커 아이콘 ────────────────────────────────────────────────
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

// ── 날짜 포맷 ────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${y}.${m}.${d}`
}

// ── 메인 페이지 ──────────────────────────────────────────────────
export default function ArchivePage() {
  const [data, setData]         = useState<ArchiveData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'timeline' | 'photos'>('timeline')
  const [letterCount, setLetterCount] = useState<number | null>(null)
  const [photoCount, setPhotoCount]   = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/archive')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSticker(type: 'candle' | 'flower' | 'heart') {
    if (!data?.pet?.id) return
    try {
      const res = await fetch('/api/garden/sticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId: data.pet.id, stickerType: type }),
      })
      const d = await res.json()
      if (res.ok) {
        setData(prev => prev ? {
          ...prev,
          stickers: d.stickers,
          stickerSenders: d.stickerSenders,
        } : prev)
      }
    } catch {}
  }

  useEffect(() => {
    fetch('/api/archive/timeline')
      .then(r => r.json())
      .then(d => {
        let letters = 0, photos = 0
        for (const week of d.items ?? []) {
          for (const entry of week.entries ?? []) {
            if (entry.type === 'letter') letters++
            photos += (entry.imageUrls ?? []).length
          }
        }
        setLetterCount(letters)
        setPhotoCount(photos)
      })
      .catch(() => {})
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-300)',
      }}>
        불러오는 중...
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-300)',
      }}>
        보관함 정보를 찾을 수 없어요.
      </div>
    )
  }

  const { pet, stickers, stickerSenders, daysSince } = data

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)', paddingBottom: 32 }}>

      {/* ── 상단 타이틀 ── */}
      <div style={{
        padding: '14px 16px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600,
          color: 'var(--lav-800)', letterSpacing: '-0.02em',
        }}>
          마음 보관함
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 11px 5px 8px', borderRadius: 999,
          background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(166,133,199,0.35)',
          fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600,
          color: 'var(--lav-700)',
        }}>
          <span style={{ fontSize: 11 }}>📖</span>
          아이와의 추억
        </div>
      </div>

      {/* ── 추모관 카드 ── */}
      <div style={{ padding: '14px 16px 0' }}>
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
                  <span style={{ color: '#d4724a', opacity: 0.7 }}>"</span>
                  <span style={{ flex: 1 }}>{pet.firstWord}</span>
                </div>
              )}
            </div>

            {/* 유리돔 */}
            <div style={{
              flexShrink: 0, width: 58, alignSelf: 'flex-end',
              position: 'relative',
            }}>
              {/* 촛불 빛 */}
              <div style={{
                position: 'absolute',
                bottom: '30%', left: '50%',
                transform: 'translateX(-50%)',
                width: 48, height: 48,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(251,180,137,0.55) 0%, rgba(251,180,137,0.2) 45%, transparent 70%)',
                filter: 'blur(6px)',
                pointerEvents: 'none',
                zIndex: 0,
              }}/>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <GlassDome/>
              </div>
            </div>
          </div>

          {/* 구분선 */}
          <div style={{ height: 0.5, background: 'rgba(166,133,199,0.18)', margin: '14px 0 12px' }}/>

          {/* 스티커 + 통계 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              {/* 스티커 칩 + N명 텍스트 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {([
                  { key: 'candle',      icon: '/icons/candle.webp',      count: stickers.candle },
                  { key: 'flower',      icon: '/icons/flower.webp',      count: stickers.flower },
                  { key: 'heart-cream', icon: '/icons/heart-cream.webp', count: stickers.heart  },
                ] as const).filter(s => s.count > 0).map(s => (
                  <button
                    key={s.key}
                    onClick={() => handleSticker(s.key === 'heart-cream' ? 'heart' : s.key as 'candle' | 'flower')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '5px 10px 5px 7px', borderRadius: 20,
                      background: 'rgba(255,255,255,0.4)',
                      border: '0.5px solid rgba(166,133,199,0.2)',
                      boxShadow: '0 1px 4px rgba(86,52,140,0.04)',
                      cursor: 'pointer',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.icon} alt="" width={20} height={20} style={{ objectFit: 'contain' }}/>
                    <span style={{
                      fontFamily: 'var(--font-sans)', fontSize: 11.5,
                      fontWeight: 600, color: 'var(--lav-700)',
                    }}>{s.count}</span>
                  </button>
                ))}
                <span style={{
                  fontFamily: 'var(--font-sans)', fontSize: 11.5,
                  color: '#9b8bb0', whiteSpace: 'nowrap',
                }}>
                  · {stickerSenders}명이 마음을 전했어요
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 탭 ── */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          display: 'flex', padding: '5px 4px',
          background: 'rgba(255,255,255,0.5)', borderRadius: 14,
          border: '0.5px solid rgba(166,133,199,0.18)',
        }}>
          {([
            { k: 'timeline', label: '타임라인', count: letterCount },
            { k: 'photos',   label: '추억사진', count: photoCount  },
          ] as const).map(t => {
            const on = tab === t.k
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 10,
                  background: on ? '#fff' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 12.5,
                  fontWeight: on ? 600 : 500,
                  color: on ? 'var(--lav-700)' : 'var(--ink-500)',
                  boxShadow: on ? '0 1px 3px rgba(86,52,140,0.08)' : 'none',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}
              >
                {t.label}
                {t.count !== null && (
                  <span style={{ fontSize: 10.5, fontWeight: 500, color: '#8b6bb8' }}>
                    {t.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 탭 콘텐츠 ── */}
      {tab === 'timeline' ? (
        <TimelineTab petName={pet.name}/>
      ) : (
        <PhotosTab/>
      )}
    </div>
  )
}

// ── 상수 ─────────────────────────────────────────────────────────
const EMOTION_EMOJI: Record<string, string> = {
  missing: '🌙', sad: '💧', numb: '🌫️', guilt: '🥀',
  anger: '🌊', anxiety: '🍃', lonely: '🕯️', tired: '☁️',
  calm: '🌿', grateful: '🌅', unknown: '•',
}
const EMOTION_LABEL: Record<string, string> = {
  missing: '문득 찾아오는 부재', sad: '깊은 슬픔', numb: '멍함',
  guilt: '죄책감', anger: '분노', anxiety: '불안',
  lonely: '외로움', tired: '지침', calm: '차분함',
  grateful: '고마움', unknown: '모르겠음',
}

// ── 타입 ─────────────────────────────────────────────────────────
interface TimelineEntry {
  type: 'letter' | 'reply'
  id: string
  letterId: string
  date: string
  time: string
  content: string
  imageUrls: string[]
  emotionTag?: string | null
  category?: string | null
}
interface TimelineWeek {
  week: number
  weekKeyword: string
  entries: TimelineEntry[]
}

// ── 아이콘 크기 상수 ─────────────────────────────────────────────
const ICON_SIZE = 28

// ── 라벤더 하트 아이콘 ────────────────────────────────────────────
function HeartIconLav() {
  return (
    <div style={{
      width: ICON_SIZE, height: ICON_SIZE, borderRadius: '50%',
      background: 'linear-gradient(145deg, #ede4f3, #d8c8e8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 6px rgba(86,52,140,0.15)',
      flexShrink: 0,
    }}>
      <svg width="14" height="13" viewBox="0 0 24 22" fill="none">
        <path d="M12 20s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.5-8 11-8 11z" fill="#a685c7"/>
      </svg>
    </div>
  )
}

// ── 피치 하트 아이콘 ─────────────────────────────────────────────
function HeartIconPeach() {
  return (
    <div style={{
      width: ICON_SIZE, height: ICON_SIZE, borderRadius: '50%',
      background: 'linear-gradient(145deg, #faddca, #f5c4a7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 6px rgba(249,156,105,0.22)',
      flexShrink: 0,
    }}>
      <svg width="14" height="13" viewBox="0 0 24 22" fill="none">
        <path d="M12 20s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.5-8 11-8 11z" fill="#f99c69"/>
      </svg>
    </div>
  )
}

// ── 카드 본문 (아이콘 없음, 왼쪽 컬럼에서 관리) ─────────────────
// ── 카드 공통 질감 스타일 ────────────────────────────────────────
const LETTER_CARD_STYLE: React.CSSProperties = {
  padding: '13px 15px', cursor: 'pointer',
  borderRadius: 16,
  backgroundColor: '#f3f0f9',
  backgroundImage: [
    'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.7), transparent 50%)',
    'radial-gradient(circle at 80% 85%, rgba(166,133,199,0.08), transparent 45%)',
    'repeating-linear-gradient(43deg,  rgba(100,70,160,0.018) 0 1px, transparent 1px 3px)',
    'repeating-linear-gradient(133deg, rgba(100,70,160,0.014) 0 1px, transparent 1px 3px)',
  ].join(', '),
  boxShadow: '0 2px 10px rgba(86,52,140,0.08), inset 0 0.5px 0 rgba(255,255,255,0.9)',
  border: '0.5px solid rgba(166,133,199,0.2)',
}

const REPLY_CARD_STYLE: React.CSSProperties = {
  padding: '13px 15px', cursor: 'pointer',
  borderRadius: 16,
  backgroundColor: '#fffbf5',
  backgroundImage: [
    'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.6), transparent 50%)',
    'radial-gradient(circle at 78% 82%, rgba(220,185,130,0.07), transparent 45%)',
    'repeating-linear-gradient(43deg,  rgba(160,120,60,0.016) 0 1px, transparent 1px 3px)',
    'repeating-linear-gradient(133deg, rgba(160,120,60,0.012) 0 1px, transparent 1px 3px)',
  ].join(', '),
  boxShadow: '0 2px 10px rgba(140,100,50,0.06), inset 0 0.5px 0 rgba(255,255,255,0.95)',
  border: '0.5px solid rgba(210,175,120,0.2)',
}

function LetterCardBody({ entry, onClick }: { entry: TimelineEntry; onClick: () => void }) {
  const firstLine = entry.content.split('\n')[0]
  return (
    <div onClick={onClick} style={LETTER_CARD_STYLE}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{
            padding: '2px 8px', borderRadius: 999,
            background: 'rgba(166,133,199,0.15)',
            fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
            color: 'var(--lav-600)', whiteSpace: 'nowrap',
          }}>내가 보낸 편지</span>
          {entry.category && (
            <span style={{
              padding: '2px 8px', borderRadius: 999,
              background: 'rgba(166,133,199,0.08)',
              fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500,
              color: 'var(--lav-500)', whiteSpace: 'nowrap',
            }}>{entry.category}</span>
          )}
          {entry.emotionTag && (
            <span style={{ fontSize: 13 }}>{EMOTION_EMOJI[entry.emotionTag]}</span>
          )}
        </div>
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: 10.5,
          color: 'var(--ink-300)', whiteSpace: 'nowrap', flexShrink: 0,
        }}>{entry.date} {entry.time}</span>
      </div>
      {/* 본문 */}
      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: 13.5, lineHeight: 1.6,
        color: '#4a3570', letterSpacing: '-0.01em',
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>
        {firstLine}
      </div>
      {/* 사진 */}
      {entry.imageUrls.length > 0 && (
        <div style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden' }}>
          <Image
            src={entry.imageUrls[0]} alt=""
            width={400} height={140}
            style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}
    </div>
  )
}

function ReplyCardBody({ entry, onClick }: { entry: TimelineEntry; onClick: () => void }) {
  const firstLine = entry.content.split('\n')[0]
  return (
    <div onClick={onClick} style={REPLY_CARD_STYLE}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{
          padding: '2px 8px', borderRadius: 999,
          background: 'rgba(249,156,105,0.12)',
          fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
          color: '#d4783a',
        }}>아이의 답장</span>
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: 10.5,
          color: 'var(--ink-300)', whiteSpace: 'nowrap',
        }}>{entry.date} {entry.time}</span>
      </div>
      {/* 본문 */}
      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: 13.5, lineHeight: 1.6,
        color: '#6b4a28', letterSpacing: '-0.01em',
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>
        {firstLine}
      </div>
    </div>
  )
}

// ── 타임라인 탭 ──────────────────────────────────────────────────
function TimelineTab({ petName }: { petName: string }) {
  const router = useRouter()
  const [weeks, setWeeks]     = useState<TimelineWeek[]>([])
  const [isPro, setIsPro]     = useState(true)  // 로딩 전엔 잠금 표시 안 함
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/archive/timeline')
      .then(r => r.json())
      .then(d => { setWeeks(d.items ?? []); setIsPro(d.isPro ?? false); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-300)' }}>
        불러오는 중...
      </div>
    )
  }

  if (weeks.length === 0) {
    return (
      <div style={{
        margin: '20px 14px 0', padding: '36px 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.35)', borderRadius: 16,
        border: '0.5px solid rgba(166,133,199,0.18)',
      }}>
        <div style={{ fontSize: 28 }}>🌙</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-300)', textAlign: 'center', lineHeight: 1.6 }}>
          {petName}와 나눈 편지들이<br/>여기에 쌓여요.
        </div>
      </div>
    )
  }

  // 편지-답장 쌍으로 그룹핑 (letter 다음에 오는 reply를 묶음)
  type Pair = { letter: TimelineEntry; reply?: TimelineEntry }
  function pairEntries(entries: TimelineEntry[]): Pair[] {
    const pairs: Pair[] = []
    let i = 0
    while (i < entries.length) {
      const cur = entries[i]
      if (cur.type === 'letter') {
        const next = entries[i + 1]
        if (next?.type === 'reply' && next.letterId === cur.letterId) {
          pairs.push({ letter: cur, reply: next })
          i += 2
        } else {
          pairs.push({ letter: cur })
          i++
        }
      } else {
        // 단독 reply (드문 케이스)
        pairs.push({ letter: cur as unknown as TimelineEntry })
        i++
      }
    }
    return pairs
  }

  // 모든 주차의 쌍을 flat하게 렌더 (최신순)
  const allPairs: { letter: TimelineEntry; reply?: TimelineEntry }[] = []
  for (const week of weeks) {
    const pairs = pairEntries(week.entries)
    allPairs.push(...pairs)
  }
  allPairs.reverse()

  // Free 유저: 편지 3개까지만 공개
  const FREE_LIMIT = 3
  const visiblePairs = isPro ? allPairs : allPairs.slice(0, FREE_LIMIT)
  const isLocked     = !isPro && allPairs.length > FREE_LIMIT

  return (
    <div style={{ padding: '0 16px', marginTop: 14, paddingBottom: 64 }}>
      {visiblePairs.map((pair, pi) => (
        <div key={pi} style={{
          display: 'grid',
          gridTemplateColumns: `${ICON_SIZE}px 1fr`,
          columnGap: 10,
          rowGap: 10,
          marginBottom: 20,
        }}>
          {/* ── 편지 아이콘 (row 1, col 1) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <HeartIconLav/>
            {pair.reply && (
              /* 선: marginBottom으로 rowGap 넘어 연결 */
              <div style={{
                flex: 1, width: 1.5,
                background: 'rgba(166,133,199,0.3)',
                minHeight: 8,
                marginBottom: -8,
              }}/>
            )}
          </div>

          {/* ── 편지 카드 (row 1, col 2) ── */}
          <div style={{ minWidth: 0 }}>
            <LetterCardBody entry={pair.letter} onClick={() => router.push(`/letter/${pair.letter.letterId}`)}/>
          </div>

          {/* ── 답장 아이콘 (row 2, col 1) ── */}
          {pair.reply && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <HeartIconPeach/>
            </div>
          )}

          {/* ── 답장 카드 (row 2, col 2) ── */}
          {pair.reply && (
            <div style={{ minWidth: 0 }}>
              <ReplyCardBody entry={pair.reply} onClick={() => router.push(`/reply/${pair.reply!.letterId}`)}/>
            </div>
          )}
        </div>
      ))}
      {/* Free 유저 버튼 */}
      {isLocked && (
        <button style={{
          display: 'block',
          width: 'fit-content',
          minWidth: 200,
          margin: '8px auto 0',
          padding: '14px 32px', borderRadius: 999,
          background: 'linear-gradient(135deg, var(--lav-500), var(--lav-700))',
          border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
          color: '#fff',
          boxShadow: '0 4px 14px rgba(86,52,140,0.3)',
        }}>
          ✨ 여정 이어가기
        </button>
      )}
    </div>
  )
}

// ── 추억사진 탭 ─────────────────────────────────────────────────
interface PhotoItem {
  url: string
  date: string
  time: string
  emotionTag?: string | null
  isPhotoCard?: boolean
  week?: number
}

function PhotosTab() {
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  // 스와이프 트래킹
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    fetch('/api/archive/timeline')
      .then(r => r.json())
      .then(d => {
        const items: PhotoItem[] = []
        for (const week of d.items ?? []) {
          for (const entry of week.entries ?? []) {
            for (const url of entry.imageUrls ?? []) {
              items.push({ url, date: entry.date, time: entry.time, emotionTag: entry.emotionTag })
            }
          }
        }
        items.reverse()
        // 포토카드 추가
        for (const card of d.photoCards ?? []) {
          const dt = new Date(card.createdAt)
          const y = dt.getFullYear(), m = String(dt.getMonth()+1).padStart(2,'0'), day = String(dt.getDate()).padStart(2,'0')
          items.push({
            url: card.imageUrl,
            date: `${y}.${m}.${day}`,
            time: `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`,
            isPhotoCard: true,
            week: card.stage,
          })
        }
        setPhotos(items)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{
        padding: '40px 0', textAlign: 'center',
        fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-300)',
      }}>
        불러오는 중...
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div style={{
        margin: '20px 14px 0', padding: '40px 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.35)', borderRadius: 16,
        border: '0.5px solid rgba(166,133,199,0.18)',
      }}>
        <div style={{ fontSize: 28 }}>🌸</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-300)', textAlign: 'center', lineHeight: 1.6 }}>
          편지에 담은 추억 사진들이<br />여기에 모여요.
        </div>
      </div>
    )
  }

  const current = viewerIndex !== null ? photos[viewerIndex] : null

  return (
    <>
      <div style={{ marginTop: 14 }}>
        {/* 3열 그리드 */}
        <div style={{
          padding: '0 16px 64px',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
        }}>
          {photos.map((p, i) => (
            <div
              key={i}
              onClick={() => setViewerIndex(i)}
              style={{
                position: 'relative', aspectRatio: '1/1',
                borderRadius: 10, overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(86,52,140,0.1)',
                background: '#fdfafc', cursor: 'pointer',
              }}
            >
              <img
                src={p.url} alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {p.isPhotoCard && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
                  padding: '14px 5px 4px',
                  display: 'flex', justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 700,
                    color: '#fff', letterSpacing: '0.04em',
                  }}>✨ {p.week}주차 포토카드</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 풀스크린 뷰어 */}
      {viewerIndex !== null && current && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            if (touchStartX.current === null) return
            const dx = e.changedTouches[0].clientX - touchStartX.current
            if (Math.abs(dx) > 40) {
              setViewerIndex(prev => {
                if (prev === null) return prev
                if (dx < 0) return Math.min(prev + 1, photos.length - 1)
                return Math.max(prev - 1, 0)
              })
            }
            touchStartX.current = null
          }}
        >
          {/* X 버튼 */}
          <button
            onClick={() => setViewerIndex(null)}
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 18, lineHeight: 1,
            }}
          >
            ✕
          </button>

          {/* 좌우 화살표 (데스크탑) */}
          <style>{`
            .viewer-arrow { display: none; }
            @media (min-width: 768px) { .viewer-arrow { display: flex; } }
          `}</style>
          {viewerIndex > 0 && (
            <button
              className="viewer-arrow"
              onClick={() => setViewerIndex(v => v !== null ? v - 1 : v)}
              style={{
                position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
                alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 20,
              }}
            >
              ‹
            </button>
          )}
          {viewerIndex < photos.length - 1 && (
            <button
              className="viewer-arrow"
              onClick={() => setViewerIndex(v => v !== null ? v + 1 : v)}
              style={{
                position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
                alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 20,
              }}
            >
              ›
            </button>
          )}

          {/* 사진 */}
          <img
            src={current.url} alt=""
            style={{
              maxWidth: '100%', maxHeight: '75dvh',
              objectFit: 'contain', borderRadius: 8,
            }}
          />

          {/* 날짜 / 포토카드 배지 */}
          <div style={{
            position: 'absolute', bottom: 48,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            {current.isPhotoCard && (
              <span style={{
                padding: '3px 10px', borderRadius: 999,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
                fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, color: '#fff',
              }}>✨ {current.week}주차 포토카드</span>
            )}
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              {current.isPhotoCard ? `${current.date} 완성` : `${current.date}에 쓴 편지`}
            </span>
          </div>

          {/* 인디케이터 */}
          {photos.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 24,
              display: 'flex', gap: 5,
            }}>
              {photos.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setViewerIndex(i)}
                  style={{
                    width: i === viewerIndex ? 16 : 6,
                    height: 6, borderRadius: 3,
                    background: i === viewerIndex ? '#fff' : 'rgba(255,255,255,0.35)',
                    transition: 'all 0.2s', cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
