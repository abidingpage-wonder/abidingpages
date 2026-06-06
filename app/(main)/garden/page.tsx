'use client'

import { useEffect, useState } from 'react'

const C = {
  bg:       '#1C0F2E',
  primary:  '#8F44D0',
  accent:   '#FEBE98',
  cream:    '#f3e8de',
  ink:      '#3a2a4d',
  inkSub:   '#7a6a8a',
  fSerif:   '"Noto Serif KR", "Cormorant Garamond", serif',
  fSans:    '"Pretendard", "Noto Sans KR", -apple-system, sans-serif',
}

const FLOATS = [
  { t: '너랑 함께한\n모든 순간이 고마워',    x: '6%',  y: '14%', size: 12, op: 0.9  },
  { t: '언제나 내 마음속에 있어 ✦',          x: '52%', y: '12%', size: 12, op: 0.9  },
  { t: '너는 우리의\n작은 천사야 ✦',         x: '7%',  y: '28%', size: 12, op: 0.85 },
  { t: '보고싶어,\n우리 아가 ✦',             x: '72%', y: '25%', size: 12, op: 0.9  },
  { t: '잘 버티고 있는\n네가 대단해',         x: '26%', y: '23%', size: 12, op: 0.78 },
  { t: '고마워,\n내 곁에 있어줘서',          x: '76%', y: '40%', size: 12, op: 0.8  },
  { t: '너는 세상에서\n가장 값진 보물',       x: '5%',  y: '42%', size: 12, op: 0.8  },
  { t: '다시 만나자, 꼭',                    x: '37%', y: '46%', size: 18, op: 0.96, serif: true },
  { t: '너는 나의 가장\n빛나는 추억이야 ♥',  x: '9%',  y: '56%', size: 12, op: 0.85 },
  { t: '오늘도 잘했어 ♥',                   x: '64%', y: '56%', size: 12, op: 0.85 },
] as const

interface PetCard {
  id: string
  name: string
  span: string
  quote: string
  tone: string
  face: string
  heartColor: string
  candle: number
  flower: number
  heart: number
  supports: number
}

const DEMO_CARDS: PetCard[] = [
  { id:'1', name:'클로이', span:'2014.03.12 — 2024.05.20', quote:'언제나 내 마음속에\n따뜻하게 머물러 있어',   tone:'#dcc6ee', face:'🐶', heartColor:'#b787e0', supports:12, candle:5, flower:4, heart:3 },
  { id:'2', name:'별이',   span:'2015.07.01 — 2024.04.08', quote:'너와 함께한 모든 순간이\n내게는 기적이었어',  tone:'#f7d9d2', face:'🐾', heartColor:'#FEBE98', supports:8,  candle:3, flower:3, heart:2 },
  { id:'3', name:'다운이', span:'2013.11.20 — 2024.02.14', quote:'조용히 내 곁을 지켜줘서\n고마워, 사랑해',    tone:'#cfd6ee', face:'🐱', heartColor:'#f4a6a6', supports:6,  candle:2, flower:2, heart:2 },
  { id:'4', name:'콩이',   span:'2016.03.08 — 2023.12.01', quote:'네가 남겨준 사랑으로\n나는 오늘도 행복해',  tone:'#ffe1b8', face:'🐕', heartColor:'#ffd089', supports:9,  candle:4, flower:3, heart:2 },
]

export default function GardenPage() {
  const [cards, setCards] = useState<PetCard[]>(DEMO_CARDS)
  const [messageCount, setMessageCount] = useState(23)
  const [inputText, setInputText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetch('/api/garden')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.pets?.length) setCards(d.pets)
        if (d?.messageCount) setMessageCount(d.messageCount)
      })
      .catch(() => {})
  }, [])

  async function handlePost() {
    if (!inputText.trim() || posting) return
    setPosting(true)
    try {
      await fetch('/api/garden/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputText.trim() }),
      })
      setInputText('')
      setMessageCount(n => n + 1)
    } catch {}
    setPosting(false)
  }

  async function handleSticker(petId: string, type: 'candle' | 'flower' | 'heart') {
    try {
      await fetch('/api/garden/sticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId, stickerType: type }),
      })
      setCards(prev => prev.map(c =>
        c.id !== petId ? c : { ...c, [type]: c[type] + 1, supports: c.supports + 1 }
      ))
    } catch {}
  }

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#F0EBF4', fontFamily: C.fSans, color: '#fff',
    }}>
      <style>{`
        @keyframes gardenTwinkle {
          0%,100% { opacity:1; filter:brightness(1); }
          50%     { opacity:0.78; filter:brightness(1.25); }
        }
      `}</style>

      {/* scroll container */}
      <div className="no-scrollbar" style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>

        {/* TOP BAR */}
        <div style={{
          padding: '14px 18px 8px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'relative', zIndex: 3,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5z"
                    stroke={C.cream} strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: C.fSerif, fontSize: 18, fontWeight: 800, color: C.cream, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>무지개정원</span>
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>커뮤니티</span>
            </div>
          </div>
          <div style={{
            padding: '5px 11px 5px 9px', borderRadius: 999,
            border: `0.8px solid ${C.cream}55`,
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 10.5, color: C.cream, fontWeight: 500,
          }}>
            <HeartBox /> 마음 보관함
          </div>
        </div>

        {/* HERO */}
        <div style={{ position: 'relative', height: 440, overflow: 'hidden' }}>
          <img src="/garden-night.png" alt="" style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'top center',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 40%, rgba(28,15,46,0.55) 100%)',
          }} />

          {/* center title */}
          <div style={{ position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', zIndex: 2 }}>
            <div style={{
              fontFamily: C.fSerif, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em',
              textShadow: '0 0 10px rgba(255,236,210,0.6), 0 0 22px rgba(143,68,208,0.5)',
            }}>오늘도 너를 사랑해</div>
            <div style={{
              marginTop: 12, display: 'inline-flex',
              width: 34, height: 34, borderRadius: 17,
              background: `radial-gradient(circle, ${C.accent} 0%, ${C.accent}88 40%, transparent 75%)`,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="17" height="15" viewBox="0 0 24 22" fill="none">
                <path d="M12 20s-8-5-8-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-8 12-8 12-1 0-2 0-2 0z" fill={C.cream}/>
              </svg>
            </div>
          </div>

          {/* floating messages */}
          {FLOATS.map((f, i) => (
            <div key={i} style={{
              position: 'absolute', left: f.x, top: f.y,
              fontFamily: f.serif ? C.fSerif : C.fSans,
              fontWeight: f.serif ? 700 : 400,
              fontSize: f.size, lineHeight: 1.45, whiteSpace: 'pre-line', textAlign: 'center',
              color: `rgba(255,250,240,${f.op})`,
              letterSpacing: '-0.01em', zIndex: 2,
              textShadow: '0 0 6px rgba(255,236,210,0.75), 0 0 14px rgba(254,190,152,0.55), 0 0 26px rgba(143,68,208,0.5)',
              animation: `gardenTwinkle ${3 + (i % 4) * 0.7}s ease-in-out ${(i % 5) * 0.4}s infinite`,
            }}>{f.t}</div>
          ))}

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
              <circle cx="9" cy="8" r="3.2" stroke={C.accent} strokeWidth="1.5"/>
              <circle cx="16" cy="9" r="2.4" stroke={C.accent} strokeWidth="1.5"/>
              <path d="M3.5 18c0-2.8 2.5-4.5 5.5-4.5s5.5 1.7 5.5 4.5" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 17c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            지금 <span style={{ color: C.accent, fontWeight: 700 }}>{messageCount}명</span>이 마음을 전하고 있어요
          </div>
        </div>

        {/* CARDS PANEL */}
        <div style={{
          marginTop: -18, borderTopLeftRadius: 24, borderTopRightRadius: 24,
          background: '#F0EBF4', padding: '20px 14px 18px',
          position: 'relative', zIndex: 2, minHeight: 340,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
            <LeafSprig flip />
            <div style={{ fontFamily: C.fSerif, fontWeight: 800, fontSize: 16, color: C.ink, letterSpacing: '-0.02em' }}>
              우리 아이들을 기억하는 공간
            </div>
            <LeafSprig />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cards.map(c => <ChildCard key={c.id} c={c} onSticker={handleSticker} />)}
          </div>
        </div>

        <div style={{ height: 150 }} />
      </div>

      {/* BOTTOM INPUT */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 74,
        padding: '10px 12px 8px', zIndex: 5,
        background: 'linear-gradient(180deg, rgba(240,235,244,0) 0%, #F0EBF4 45%)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handlePost()}
          placeholder="오늘의 마음 한 줄을 남겨보세요"
          style={{
            flex: 1, height: 40, borderRadius: 20,
            background: '#fff', border: '0.8px solid rgba(143,68,208,0.2)',
            padding: '0 16px', fontSize: 12, color: '#3a2a4d',
            boxShadow: '0 2px 8px rgba(86,52,140,0.06)', outline: 'none',
            fontFamily: C.fSans,
          }}
        />
        <button
          onClick={handlePost}
          disabled={posting || !inputText.trim()}
          style={{
            height: 40, padding: '0 15px', borderRadius: 20, border: 'none',
            background: C.primary, color: '#fff', fontWeight: 700, fontSize: 12,
            fontFamily: C.fSans, cursor: 'pointer', letterSpacing: '-0.01em', whiteSpace: 'nowrap',
            boxShadow: `0 4px 14px ${C.primary}55`,
            opacity: posting || !inputText.trim() ? 0.6 : 1,
          }}
        >전광판에 올리기</button>
      </div>
    </div>
  )
}

function ChildCard({ c, onSticker }: { c: PetCard; onSticker: (id: string, t: 'candle' | 'flower' | 'heart') => void }) {
  return (
    <div style={{
      borderRadius: 16, background: '#fff', padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 1px 3px rgba(60,40,90,0.08)',
    }}>
      {/* profile bubble */}
      <div style={{
        position: 'relative', width: 64, height: 64, borderRadius: '50%',
        background: `linear-gradient(135deg, ${c.tone}, #fff)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', inset: 3, borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, #fff, ${c.tone})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
        }}>
          <span style={{ filter: 'saturate(0.7)' }}>{c.face}</span>
        </div>
        <svg style={{ position: 'absolute', top: -4, left: -4 }} width="22" height="20" viewBox="0 0 24 22" fill="none">
          <path d="M12 20s-8-5-8-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-8 12-8 12z"
                fill={c.heartColor} stroke="#fff" strokeWidth="1.2"/>
        </svg>
      </div>

      {/* name/date/quote */}
      <div style={{ flex: '0 0 35%', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontFamily: C.fSerif, fontWeight: 800, fontSize: 15, color: C.ink, letterSpacing: '-0.02em' }}>{c.name}</span>
          <LeafSprig small />
        </div>
        <div style={{ marginTop: 2, fontSize: 9, color: C.inkSub, letterSpacing: '0.01em' }}>{c.span}</div>
        <div style={{ marginTop: 5, fontFamily: C.fSerif, fontSize: 10.5, color: C.ink, lineHeight: 1.4, whiteSpace: 'pre-line' }}>
          &ldquo;{c.quote}&rdquo;
        </div>
      </div>

      {/* stickers */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 9.5, color: C.inkSub }}>
          <span style={{ color: C.ink, fontWeight: 600 }}>{c.supports}명</span>이 마음을 전했어요
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          {(['candle', 'flower', 'heart'] as const).map(kind => (
            <StickerBtn key={kind} kind={kind} n={c[kind]} onClick={() => onSticker(c.id, kind)} />
          ))}
        </div>
      </div>

      <div style={{ flexShrink: 0, color: C.inkSub, fontSize: 14, alignSelf: 'flex-start', padding: '2px 0 0 4px' }}>···</div>
    </div>
  )
}

function StickerBtn({ kind, n, onClick }: { kind: 'candle' | 'flower' | 'heart'; n: number; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 3, padding: '3px 6px',
      borderRadius: 8, background: 'transparent', border: 'none',
      cursor: 'pointer', fontFamily: C.fSans,
    }}>
      {kind === 'candle' && (
        <svg width="16" height="18" viewBox="0 0 20 22" fill="none">
          <path d="M10 2.5c0 2 1.6 2.6 1.6 4 0 1-.7 1.7-1.6 1.7s-1.6-.7-1.6-1.7c0-1.4 1.6-2 1.6-4z" fill="#ffb775"/>
          <rect x="7" y="9" width="6" height="11" rx="1.4" fill="#f3e1cc" stroke="#caa985" strokeWidth="0.7"/>
          <rect x="6" y="9.5" width="8" height="1.5" rx="0.6" fill="#fff" opacity="0.7"/>
        </svg>
      )}
      {kind === 'flower' && (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          {[0, 72, 144, 216, 288].map((a, i) => (
            <ellipse key={i} cx="10" cy="5" rx="3" ry="4.2" fill="#f4a8c4" transform={`rotate(${a} 10 10)`}/>
          ))}
          <circle cx="10" cy="10" r="2" fill="#f8d048"/>
        </svg>
      )}
      {kind === 'heart' && (
        <svg width="16" height="14" viewBox="0 0 20 18" fill="none">
          <path d="M10 16s-7-4.4-7-10A4 4 0 0 1 10 4a4 4 0 0 1 7 2c0 5.6-7 10-7 10z"
                fill="none" stroke="#b787e0" strokeWidth="1.4"/>
        </svg>
      )}
      <span style={{ fontSize: 10, fontWeight: 600, color: C.inkSub }}>×{n}</span>
    </button>
  )
}

function LeafSprig({ flip, small }: { flip?: boolean; small?: boolean }) {
  const s = small ? 10 : 14
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none"
         style={{ transform: flip ? 'scaleX(-1)' : 'none', flexShrink: 0 }}>
      <path d="M3 13 C 6 7, 10 5, 14 3" stroke="#b89dd6" strokeWidth="1" fill="none"/>
      <ellipse cx="5"  cy="11" rx="1.7" ry="0.9" fill="#b89dd6" transform="rotate(-30 5 11)"/>
      <ellipse cx="8"  cy="8"  rx="1.7" ry="0.9" fill="#b89dd6" transform="rotate(-30 8 8)"/>
      <ellipse cx="11" cy="5.5" rx="1.7" ry="0.9" fill="#b89dd6" transform="rotate(-30 11 5.5)"/>
    </svg>
  )
}

function HeartBox() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="6" width="17" height="13" rx="2" stroke="#FEBE98" strokeWidth="1.4"/>
      <path d="M12 16s-3.5-2.2-3.5-5A2 2 0 0 1 12 9a2 2 0 0 1 3.5 2c0 2.8-3.5 5-3.5 5z" fill="#FEBE98"/>
    </svg>
  )
}
