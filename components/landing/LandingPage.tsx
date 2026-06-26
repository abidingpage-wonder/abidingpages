// Abiding · Landing v2 — Claude Design "Landing Page v2.html" 포팅
// 디자인 원본: abiding-design-v2/project/{landing-v2,landing-v2-app,landing-1,abiding-shared}.jsx
// 서버 컴포넌트(인터랙션은 CSS 애니메이션 + <Link> 네비게이션뿐). CTA는 기존 카카오 로그인 진입점(/login)으로 연결.

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

// VOICES(후기) 섹션 — 베타 이후 공개 예정. 그 전까지 숨김.
const SHOW_VOICES = false

// 카카오 로그인 / PWA 진입점
const APP_LINK = '/login'

// ─── 디자인 토큰: 폰트 변수 + 레이아웃/키프레임 (원본 HTML <style> 블록 이식) ───
// --lav-*, --peach-*, --paper-*, --ink-* 색상 토큰은 globals.css(:root)에서 이미 전역 정의됨.
// 여기서는 디자인이 쓰는 --f-* 폰트 별칭과 .lp-* 레이아웃만 .lp-root 범위로 한정.
const LANDING_CSS = `
.lp-root {
  --f-brand: "Allura", "Dancing Script", cursive;
  --f-hand:  "Nanum Pen Script", "Caveat", cursive;
  --f-serif: "Noto Serif KR", "Nanum Myeongjo", serif;
  --f-sans:  "Pretendard", "Noto Sans KR", -apple-system, system-ui, sans-serif;
  --f-myeongjo: "Nanum Myeongjo", "Noto Serif KR", serif;

  font-family: var(--f-sans);
  color: var(--ink-700);
  overflow-x: hidden;
  scroll-behavior: smooth;
  background-color: #f3eef6;
  background-image:
    radial-gradient(circle at 12% 6%, rgba(250,221,202,0.40), transparent 32%),
    radial-gradient(circle at 88% 4%, rgba(166,133,199,0.16), transparent 38%),
    radial-gradient(circle at 50% 70%, rgba(255,255,255,0.5), transparent 60%),
    repeating-linear-gradient(43deg, rgba(80,60,128,0.022) 0 1px, transparent 1px 2px),
    repeating-linear-gradient(133deg, rgba(80,60,128,0.018) 0 1px, transparent 1px 2px);
  -webkit-font-smoothing: antialiased;
}
.lp-root ::selection { background: rgba(249,156,105,0.32); }

/* 모바일 PWA용 globals.css 의 html{max-width:430px} 제약을 랜딩에서만 해제 */
html:has(.lp-root) { max-width: 100%; }

.lp-wrap { max-width: 1140px; margin: 0 auto; padding: 0 40px; }
.lp-cards4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.lp-stats  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
.lp-flow   { display: flex; gap: 40px; justify-content: center; align-items: flex-start; flex-wrap: wrap; }
.lp-journey { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; position: relative; }
.lp-founder { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 48px; align-items: center; }
.lp-sec-title { font-size: 34px; }

@media (max-width: 920px) {
  .lp-wrap { padding: 0 28px; }
  .lp-cards4 { grid-template-columns: 1fr 1fr; }
  .lp-stats  { grid-template-columns: 1fr; gap: 18px; }
  .lp-journey { grid-template-columns: 1fr; gap: 14px; }
  .lp-founder { grid-template-columns: 1fr; gap: 28px; max-width: 480px; margin: 0 auto; }
  .lp-sec-title { font-size: 27px; }
}
@media (max-width: 540px) {
  .lp-wrap { padding: 0 20px; }
  .lp-cards4 { grid-template-columns: 1fr; max-width: 360px; margin: 0 auto; }
}

@keyframes lp-twinkle { 0%,100% { opacity: .25 } 50% { opacity: 1 } }
@keyframes lp-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }
@keyframes lp-rise { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: none } }
`

// ═══════════════════════════════════════════════════════════════════
// 공용 아톰
// ═══════════════════════════════════════════════════════════════════
function AbidingMark({ size = 22, color = 'var(--lav-700)' }: { size?: number; color?: string }) {
  return (
    <span style={{ fontFamily: 'var(--f-brand)', fontSize: size, fontWeight: 400, color, lineHeight: 1, letterSpacing: '-0.02em' }}>
      Abiding
    </span>
  )
}

function Paw({ size = 16, color = 'currentColor', opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity }}>
      <ellipse cx="6.5" cy="9" rx="2.1" ry="2.8" fill={color} />
      <ellipse cx="17.5" cy="9" rx="2.1" ry="2.8" fill={color} />
      <ellipse cx="9.5" cy="5" rx="1.8" ry="2.4" fill={color} />
      <ellipse cx="14.5" cy="5" rx="1.8" ry="2.4" fill={color} />
      <path d="M12 11c-3.4 0-5.8 2.2-5.8 4.7 0 2 1.5 3.3 3.2 3.3 1 0 1.6-.4 2.6-.4s1.6.4 2.6.4c1.7 0 3.2-1.3 3.2-3.3 0-2.5-2.4-4.7-5.8-4.7z" fill={color} />
    </svg>
  )
}

function LavenderSprig({ w = 24, h = 60, color = '#a685c7' }: { w?: number; h?: number; color?: string }) {
  return (
    <svg width={w} height={h} viewBox="0 0 24 60" style={{ opacity: 0.78 }}>
      <path d="M12 60 L12 22" stroke="#7a6b4d" strokeWidth="0.7" fill="none" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} transform={`translate(12, ${20 - i * 3})`}>
          <ellipse cx="0" cy="0" rx="3.5" ry="2.6" fill={color} opacity={0.85 - i * 0.08} />
        </g>
      ))}
      <ellipse cx="12" cy="-2" rx="2" ry="3" fill={color} opacity="0.5" />
    </svg>
  )
}

function StarField({ count = 60, opacity = 1 }: { count?: number; opacity?: number }) {
  const stars = Array.from({ length: count }).map((_, i) => ({
    x: (i * 53 + 11) % 100,
    y: (i * 37 + 7) % 100,
    r: (i % 4) * 0.5 + 0.5,
    d: (i % 6) * 0.5 + 1.5,
    delay: (i % 9) * 0.4,
  }))
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity }}>
      {stars.map((s, i) => (
        <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#fff" style={{ animation: `lp-twinkle ${s.d}s ease-in-out ${s.delay}s infinite` }} />
      ))}
    </svg>
  )
}

function Eyebrow({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <div style={{ fontFamily: 'var(--f-sans)', fontSize: 12, fontWeight: 600, letterSpacing: '0.26em', textTransform: 'uppercase', color: light ? 'rgba(255,236,210,0.75)' : 'var(--lav-500)' }}>
      {children}
    </div>
  )
}

function SectionTitle({ children, light, style }: { children: ReactNode; light?: boolean; style?: CSSProperties }) {
  return (
    <h2
      className="lp-sec-title"
      style={{ margin: '14px 0 0', fontFamily: 'var(--f-serif)', fontWeight: 500, lineHeight: 1.35, letterSpacing: '-0.02em', color: light ? '#fff' : 'var(--lav-800)', textWrap: 'pretty', whiteSpace: 'pre-line', ...style }}
    >
      {children}
    </h2>
  )
}

const ctaBase: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
  borderRadius: 999, border: 'none', cursor: 'pointer',
  fontFamily: 'var(--f-sans)', fontWeight: 700, letterSpacing: '-0.01em', textDecoration: 'none',
}

function PrimaryCTA({ children, kakao, large }: { children: ReactNode; kakao?: boolean; large?: boolean }) {
  const sizing: CSSProperties = { padding: large ? '17px 36px' : '14px 28px', fontSize: large ? 16 : 14.5 }
  if (kakao) {
    return (
      <Link href={APP_LINK} style={{ ...ctaBase, ...sizing, background: '#FEE500', color: '#3c1e1e', boxShadow: '0 8px 24px rgba(254,229,0,0.35)' }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
          <path d="M12 4C7 4 3 7.2 3 11.1c0 2.5 1.7 4.7 4.2 6L6.4 20c-.1.4.3.7.6.5l3.3-2.2c.5.06 1.1.1 1.7.1 5 0 9-3.2 9-7.1S17 4 12 4z" fill="#3c1e1e" />
        </svg>
        {children}
      </Link>
    )
  }
  return (
    <Link href={APP_LINK} style={{ ...ctaBase, ...sizing, background: 'var(--lav-600)', color: '#fff', boxShadow: '0 8px 24px rgba(86,52,140,0.30)' }}>
      {children}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h13M13 6l6 6-6 6" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}

function HeroEnvelope() {
  return (
    <svg width="190" height="150" viewBox="0 0 190 150" fill="none">
      <defs>
        <linearGradient id="heGlow" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fbf2e0" />
          <stop offset="100%" stopColor="#ecdcc0" />
        </linearGradient>
        <linearGradient id="heBody" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#e6d5f0" />
          <stop offset="100%" stopColor="#c4a9dd" />
        </linearGradient>
      </defs>
      <g transform="translate(53,2) rotate(-5)">
        <rect width="84" height="86" rx="3" fill="url(#heGlow)" stroke="rgba(200,170,130,0.5)" strokeWidth="0.6" />
        {[16, 28, 40, 52, 64].map((y) => (
          <line key={y} x1="11" y1={y} x2="73" y2={y} stroke="rgba(120,90,55,0.16)" strokeWidth="0.6" />
        ))}
      </g>
      <g transform="translate(20,58)">
        <rect width="150" height="86" rx="7" fill="url(#heBody)" stroke="rgba(86,52,140,0.25)" strokeWidth="0.6" />
        <path d="M0 2 L75 54 L150 2" stroke="rgba(86,52,140,0.28)" strokeWidth="0.8" fill="none" />
      </g>
      <g transform="translate(95,60)">
        <circle r="16" fill="#7a4b8f" />
        <circle r="16" fill="none" stroke="#5a3270" strokeWidth="0.9" />
        <ellipse cx="0" cy="2.5" rx="4.5" ry="3.4" fill="#f5e3c8" />
        <circle cx="-4.5" cy="-3.4" r="1.8" fill="#f5e3c8" />
        <circle cx="0" cy="-5.6" r="1.8" fill="#f5e3c8" />
        <circle cx="4.5" cy="-3.4" r="1.8" fill="#f5e3c8" />
        <circle cx="6.8" cy="0" r="1.6" fill="#f5e3c8" />
      </g>
      <g fill="#fbd9a8">
        <path d="M24 30 l1.2 -4.5 l1.2 4.5 l4.5 1.2 l-4.5 1.2 l-1.2 4.5 l-1.2 -4.5 l-4.5 -1.2 z" />
        <path d="M168 70 l1 -3.5 l1 3.5 l3.5 1 l-3.5 1 l-1 3.5 l-1 -3.5 l-3.5 -1 z" />
      </g>
    </svg>
  )
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{ width: 246, height: 506, borderRadius: 38, padding: 9, flexShrink: 0, background: 'linear-gradient(160deg, #3a2d52, #221634)', boxShadow: '0 24px 50px rgba(48,28,80,0.30), inset 0 0 0 1px rgba(255,255,255,0.06)' }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 30, overflow: 'hidden', position: 'relative', background: '#f7f3fb' }}>
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 84, height: 20, borderRadius: 999, background: 'rgba(20,10,35,0.85)', zIndex: 20 }} />
        {children}
      </div>
    </div>
  )
}

// ── 미니 목업 화면 ──────────────────────────────────────────────────
function MockEmotion() {
  const tiles = [
    { k: '그리움', t: '보고 싶어요', emoji: '🌙', c: '#9d83b8' },
    { k: '슬픔', t: '많이 울었어요', emoji: '💧', c: '#7a96c2' },
    { k: '멍함', t: '멍하고 무거워요', emoji: '🌫️', c: '#a8b9d9' },
    { k: '외로움', t: '쓸쓸해요', emoji: '🕯️', c: '#bca4d6' },
    { k: '차분함', t: '조금 괜찮아요', emoji: '🌿', c: '#a8c997', active: true },
    { k: '고마움', t: '따뜻해요', emoji: '🌅', c: '#f5c4a7' },
  ]
  return (
    <div className="paper-tex-cool" style={{ width: '100%', height: '100%', padding: '40px 14px 14px' }}>
      <div style={{ textAlign: 'center', fontFamily: 'var(--f-serif)', fontSize: 16, fontWeight: 500, color: 'var(--lav-800)' }}>기분이 어떠신가요?</div>
      <div style={{ textAlign: 'center', marginTop: 4, fontFamily: 'var(--f-sans)', fontSize: 10.5, color: 'var(--ink-500)' }}>오늘 가장 닿아있는 것을 골라주세요.</div>
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
        {tiles.map((e, i) => (
          <div key={i} style={{ position: 'relative', padding: '11px 6px', borderRadius: 14, minHeight: 78, background: e.active ? '#fff' : 'rgba(255,255,255,0.6)', border: e.active ? '1.5px solid var(--peach-400)' : '0.5px solid rgba(166,133,199,0.18)', boxShadow: e.active ? '0 4px 12px rgba(249,156,105,0.18)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: e.c + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, marginBottom: 5 }}>{e.emoji}</div>
            <div style={{ fontFamily: 'var(--f-serif)', fontSize: 11.5, fontWeight: 600, color: e.active ? 'var(--peach-500)' : 'var(--lav-800)' }}>{e.k}</div>
            <div style={{ marginTop: 2, fontFamily: 'var(--f-hand)', fontSize: 10.5, color: 'var(--ink-500)' }}>{e.t}</div>
          </div>
        ))}
      </div>
      <button style={{ marginTop: 12, width: '100%', padding: '12px', border: 'none', borderRadius: 14, background: 'var(--lav-600)', color: '#fff', fontFamily: 'var(--f-sans)', fontSize: 12.5, fontWeight: 600 }}>이 마음으로 편지쓰기</button>
    </div>
  )
}

function MockWrite() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #1c0f2e 0%, #2a1c44 38%, #574a7e 72%, #8d80ab 100%)', color: '#fff' }}>
      <StarField count={26} opacity={0.6} />
      <div style={{ position: 'relative', padding: '40px 16px 14px' }}>
        <div style={{ textAlign: 'center', fontFamily: 'var(--f-serif)', fontSize: 15, fontWeight: 500 }}>순탄이에게</div>
        <div style={{ marginTop: 14, padding: '13px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '0.5px dashed rgba(254,190,152,0.4)' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ padding: '2px 9px', borderRadius: 999, background: '#8F44D0', fontFamily: 'var(--f-sans)', fontSize: 9, fontWeight: 600 }}>1주차 · DAY 3</span>
            <span style={{ fontFamily: 'var(--f-sans)', fontSize: 9.5, color: '#FEBE98', fontWeight: 600 }}>오늘의 질문</span>
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--f-serif)', fontSize: 13, lineHeight: 1.5 }}>“오늘 가장 또렷이 떠오르는 아이의 모습은요?”</div>
        </div>
        <div style={{ marginTop: 14, padding: '14px 15px', minHeight: 150, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.12)' }}>
          <div style={{ fontFamily: "'Nanum Pen Script', cursive", fontSize: 17, lineHeight: 1.85, color: 'rgba(255,247,236,0.92)' }}>
            우리 순탄이,<br />오늘 창가에 햇살이 들었어.<br />그 자리에 누워있던 네가<br />자꾸만 떠올라서…
            <span style={{ display: 'inline-block', width: 1.5, height: 18, background: '#FEBE98', verticalAlign: 'middle', marginLeft: 2 }} />
          </div>
        </div>
        <button style={{ marginTop: 14, width: '100%', padding: '13px', borderRadius: 999, border: 'none', background: '#fff', color: '#3a1f5e', fontFamily: 'var(--f-sans)', fontSize: 13, fontWeight: 700 }}>편지 보내기</button>
      </div>
    </div>
  )
}

function MockReply() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#F5F0E8' }}>
      <div style={{ position: 'relative', padding: '40px 0 0' }}>
        <div style={{ textAlign: 'center', fontFamily: 'var(--f-sans)', fontSize: 11, fontWeight: 600, color: '#8a6a45' }}>순탄이가 엄마에게 · ☀️ 09:18</div>
        <div style={{ position: 'relative', height: 96, marginTop: 6 }}>
          <svg viewBox="0 0 246 96" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {['#f5b6a6', '#f6d09b', '#e8d9a1', '#bca4d6'].map((c, i) => (
              <path key={i} d={`M 70 78 Q 123 ${22 + i * 7} 176 78`} stroke={c} strokeWidth="2.4" fill="none" opacity="0.7" strokeLinecap="round" />
            ))}
          </svg>
          <div style={{ position: 'absolute', left: '50%', top: 22, transform: 'translateX(-50%)', width: 62, height: 62, borderRadius: '50%', background: '#fff', padding: 4, boxShadow: '0 6px 16px rgba(120,80,40,0.2)' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #f7e8d0, #d8b988)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Paw size={22} color="rgba(150,110,70,0.6)" />
            </div>
          </div>
        </div>
        <div style={{ margin: '8px 16px 0', padding: '18px 18px 22px', borderRadius: 12, background: '#fffaf0', border: '0.5px solid rgba(200,170,130,0.4)', boxShadow: '0 8px 20px rgba(120,80,40,0.12)' }}>
          <div style={{ fontFamily: "'Nanum Pen Script', cursive", fontSize: 16, lineHeight: 2.0, color: '#5c4a3a' }}>
            사랑하는 엄마,<br />오늘도 나를 생각해줘서 고마워.<br />나는 여기서 잘 지내고 있어.<br />언제나 엄마 곁에 있을게.<br />사랑해, 또 만나자! <Paw size={11} color="#a88860" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Nav
// ═══════════════════════════════════════════════════════════════════
const navLinkV2: CSSProperties = {
  fontFamily: 'var(--f-sans)', fontSize: 13.5, fontWeight: 500,
  color: 'var(--ink-500)', textDecoration: 'none', letterSpacing: '-0.01em',
}

function LandingNavV2() {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(247,243,251,0.72)', backdropFilter: 'blur(16px) saturate(160%)', WebkitBackdropFilter: 'blur(16px) saturate(160%)', borderBottom: '0.5px solid rgba(86,52,140,0.10)' }}>
      <div className="lp-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 66 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <AbidingMark size={28} />
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          <a href="#how" style={navLinkV2}>이용 흐름</a>
          <a href="#journey" style={navLinkV2}>49일 여정</a>
          <a href="#founder" style={navLinkV2}>만든이</a>
          <span style={{ width: 1, height: 16, background: 'rgba(86,52,140,0.14)' }} />
          <Link href={APP_LINK} style={{ ...navLinkV2, color: 'var(--lav-600)', fontWeight: 600 }}>로그인</Link>
          <Link href={APP_LINK} style={{ padding: '9px 18px', borderRadius: 999, background: 'var(--lav-600)', color: '#fff', fontFamily: 'var(--f-sans)', fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 14px rgba(86,52,140,0.22)' }}>
            편지 쓰러 가기
          </Link>
        </nav>
      </div>
    </header>
  )
}

// ═══════════════════════════════════════════════════════════════════
// S1 — HERO
// ═══════════════════════════════════════════════════════════════════
function HeroSectionV2() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', minHeight: '92vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '90px 24px 110px', background: 'linear-gradient(180deg, #1c0f2e 0%, #271640 32%, #3c2a5e 62%, #6b5894 88%, #9a86bd 100%)', color: '#fff' }}>
      <StarField count={80} />
      <div style={{ position: 'absolute', top: '-10%', left: '-8%', width: 420, height: 420, background: 'radial-gradient(circle, rgba(143,68,208,0.35), transparent 70%)', filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', bottom: '-12%', right: '-6%', width: 460, height: 460, background: 'radial-gradient(circle, rgba(250,180,137,0.22), transparent 70%)', filter: 'blur(50px)' }} />
      <div style={{ position: 'relative', maxWidth: 760, zIndex: 2 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.18)', fontFamily: 'var(--f-sans)', fontSize: 12, letterSpacing: '0.16em', color: 'rgba(255,236,210,0.9)', fontWeight: 500, animation: 'lp-rise .7s ease both' }}>
          반려동물 상실 동행 · 어바이딩
        </div>

        <h1 style={{ margin: '26px 0 0', fontFamily: 'var(--f-serif)', fontWeight: 500, fontSize: 'clamp(27px, 4.4vw, 44px)', lineHeight: 1.42, letterSpacing: '-0.02em', textWrap: 'balance', textShadow: '0 2px 30px rgba(20,8,40,0.4)', animation: 'lp-rise .7s ease .08s both' }}>
          사랑하는 아이를 잃고 슬퍼할 곳이<br />필요한 당신에게
        </h1>

        <p style={{ margin: '24px auto 0', maxWidth: 500, fontFamily: 'var(--f-sans)', fontSize: 15.5, lineHeight: 1.8, color: 'rgba(255,255,255,0.82)', animation: 'lp-rise .7s ease .16s both' }}>
          혼자 견디지 않아도 되는 49일.<br />
          편지를 쓰고 답장을 받으며, 진심으로 슬픔을 공감해주는 사람들이 머무는 곳.
        </p>

        <div style={{ margin: '40px auto 36px', position: 'relative', width: 200, height: 150, animation: 'lp-rise .7s ease .24s both' }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(250,221,202,0.30), transparent 65%)', filter: 'blur(8px)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'lp-float 6s ease-in-out infinite' }}>
            <HeroEnvelope />
          </div>
        </div>

        <div style={{ animation: 'lp-rise .7s ease .32s both' }}>
          <PrimaryCTA large>편지 쓰러가기</PrimaryCTA>
          <div style={{ marginTop: 16, fontFamily: 'var(--f-sans)', fontSize: 13, color: 'rgba(255,255,255,0.62)' }}>지금 베타로 운영 중이에요.</div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// S2 — Stats
// ═══════════════════════════════════════════════════════════════════
function StatsSection() {
  const stats = [
    { big: '약 12만', unit: '가구', line: '매년 가족 같은 반려동물을\n잃고 슬픔에 잠깁니다.' },
    { big: '6개월', unit: '이상', line: '펫로스 슬픔은 평균\n6개월~1년 이상 이어집니다.' },
    { big: '3명 중 1명', unit: '', line: '‘그만한 일로’ 같은 조언은\n상처를 더 악화시킵니다.' },
  ]
  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: '104px 24px 96px', background: 'linear-gradient(180deg, #9a86bd 0%, #8973ac 18%, #6e5891 100%)', color: '#fff' }}>
      <StarField count={40} opacity={0.5} />
      <div className="lp-wrap" style={{ position: 'relative' }}>
        <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 56px' }}>
          <Eyebrow light>You are not alone</Eyebrow>
          <SectionTitle light>{'가장 보편적이지만,\n가장 외면당하기 쉬운 슬픔'}</SectionTitle>
        </div>

        <div className="lp-stats">
          {stats.map((s, i) => (
            <div key={i} style={{ position: 'relative', textAlign: 'center', padding: '8px 26px', borderLeft: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.18)' }}>
              <div style={{ fontFamily: 'var(--f-serif)', fontWeight: 500, lineHeight: 1, fontSize: s.big.length > 5 ? 34 : 48, color: '#FEBE98', letterSpacing: '-0.02em' }}>
                {s.big}
                {s.unit && <span style={{ fontSize: 19, color: 'rgba(255,236,210,0.85)', marginLeft: 6 }}>{s.unit}</span>}
              </div>
              <p style={{ margin: '18px 0 0', fontFamily: 'var(--f-sans)', fontSize: 14.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-line' }}>{s.line}</p>
            </div>
          ))}
        </div>

        <div style={{ margin: '60px auto 0', maxWidth: 680, textAlign: 'center', paddingTop: 36, borderTop: '0.5px solid rgba(255,255,255,0.16)' }}>
          <p style={{ margin: 0, fontFamily: 'var(--f-serif)', fontSize: 20, fontWeight: 400, lineHeight: 1.72, color: '#fff', letterSpacing: '-0.02em', textWrap: 'pretty' }}>
            어바이딩은 이 슬픔에 충분히 공감하며,<br />
            <span style={{ color: '#FEBE98' }}>안전한 공간에서 혼자 외롭지 않게</span> 충분히 슬퍼하며,<br />
            사랑하는 아이를 기억하길 바랍니다.
          </p>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// S3 — 핵심 경험 4개
// ═══════════════════════════════════════════════════════════════════
function FourValueSection() {
  const cards = [
    { img: '/landing/icon-book.png', title: '편지쓰기', body: '질문을 따라가다 보면 마음이 저절로 풀려나와요.' },
    { img: '/landing/icon-envelope-cream.png', title: '아이의 답장', body: '다음 날, 아이가 보낸 답장이 기다리고 있어요.' },
    { img: '/landing/icon-lavender.png', title: '49일의 여정', body: '슬픔의 들판에서 영원의 별빛까지, 천천히 함께 걸어요.' },
    { img: '/landing/icon-flower.png', title: '추모의 정원', body: '같은 슬픔을 지나는 사람들이 곁에 있어요.' },
  ]
  return (
    <section style={{ position: 'relative', padding: '100px 24px 110px' }}>
      <div className="lp-wrap">
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 52px' }}>
          <Eyebrow>Everything in one place</Eyebrow>
          <SectionTitle>{'머무를 곳이 필요한 슬픔을 위한,\n작은 동행의 도구들'}</SectionTitle>
        </div>
        <div className="lp-cards4">
          {cards.map((c, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(10px)', borderRadius: 22, padding: '30px 24px 28px', border: '0.5px solid rgba(166,133,199,0.2)', boxShadow: '0 10px 30px rgba(86,52,140,0.08)', textAlign: 'center' }}>
              <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt="" style={{ maxWidth: 72, maxHeight: 72, objectFit: 'contain', filter: 'drop-shadow(0 6px 14px rgba(86,52,140,0.16))' }} />
              </div>
              <div style={{ marginTop: 14, fontFamily: 'var(--f-serif)', fontSize: 18, fontWeight: 600, color: 'var(--lav-800)' }}>{c.title}</div>
              <p style={{ margin: '10px 0 0', fontFamily: 'var(--f-sans)', fontSize: 13, lineHeight: 1.7, color: 'var(--ink-500)', textWrap: 'pretty' }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// S4 — How it works
// ═══════════════════════════════════════════════════════════════════
function HowItWorksSectionV2() {
  const cuts = [
    { el: <MockEmotion />, cap: '오늘의 감정을 들여다봐요.' },
    { el: <MockWrite />, cap: '질문에 따라, 아이에게 편지를 적어요.' },
    { el: <MockReply />, cap: '다음 날, 아이의 답장이 도착해요.' },
  ]
  return (
    <section id="how" style={{ position: 'relative', padding: '96px 24px 110px', background: 'linear-gradient(180deg, rgba(237,228,243,0) 0%, rgba(237,228,243,0.55) 50%, rgba(237,228,243,0) 100%)' }}>
      <div className="lp-wrap">
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 54px' }}>
          <Eyebrow>How it works</Eyebrow>
          <SectionTitle>마음을 건네는 세 걸음</SectionTitle>
        </div>
        <div className="lp-flow">
          {cuts.map((c, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 246 }}>
              <PhoneFrame>{c.el}</PhoneFrame>
              <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--lav-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-sans)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontFamily: 'var(--f-sans)', fontSize: 14, color: 'var(--ink-700)', fontWeight: 500, letterSpacing: '-0.01em' }}>{c.cap}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// S5 — 49일 여정
// ═══════════════════════════════════════════════════════════════════
function JourneySectionV2() {
  const stages = [
    { no: '1주', name: '슬픔의 들판', copy: '울어도 괜찮아요,\n지금은 머물러도 돼요' },
    { no: '2-3주', name: '고백의 숲', copy: '차마 못 한 말,\n여기선 천천히 꺼내도 돼요' },
    { no: '4주', name: '사랑의 언덕', copy: '함께한 모든 순간이,\n사랑이었다는 걸 알아가요' },
    { no: '5-6주', name: '일상의 오솔길', copy: '아이가 바라보는 시선으로,\n다시 걸어보는 연습' },
    { no: '7주', name: '영원의 별빛', copy: '언제나 곁에,\n사라지지 않는 사랑으로' },
  ]
  return (
    <section id="journey" style={{ position: 'relative', overflow: 'hidden', padding: '104px 24px 96px', background: 'linear-gradient(180deg, #1c0f2e 0%, #2a1c44 45%, #46356b 80%, #6b5894 100%)', color: '#fff' }}>
      <StarField count={70} />
      <div style={{ position: 'absolute', top: '-8%', right: '-6%', width: 380, height: 380, background: 'radial-gradient(circle, rgba(250,180,137,0.18), transparent 70%)', filter: 'blur(50px)' }} />
      <div className="lp-wrap" style={{ position: 'relative' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 60px' }}>
          <Eyebrow light>The Journey · 49 Days</Eyebrow>
          <SectionTitle light>{'다섯 단계를 천천히,\n함께 지나갑니다'}</SectionTitle>
          <p style={{ margin: '16px auto 0', maxWidth: 440, fontFamily: 'var(--f-sans)', fontSize: 14.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.72)' }}>
            서두르지 않아요. 오늘의 마음이 머무는 자리에서, 다음 별까지 한 걸음씩.
          </p>
        </div>

        <div className="lp-journey">
          <svg style={{ position: 'absolute', top: 13, left: '10%', width: '80%', height: 4, overflow: 'visible', pointerEvents: 'none' }} preserveAspectRatio="none" viewBox="0 0 100 4">
            <line x1="0" y1="2" x2="100" y2="2" stroke="rgba(255,236,210,0.35)" strokeWidth="0.6" strokeDasharray="1.4 1.8" />
          </svg>
          {stages.map((s, i) => (
            <div key={i} style={{ position: 'relative', textAlign: 'center', padding: '0 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: 28, height: 28 }}>
                  <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', background: `radial-gradient(circle, rgba(250,180,137,${i === 0 ? 0.6 : 0.32}), transparent 70%)` }} />
                  <svg width="28" height="28" viewBox="0 0 28 28" style={{ position: 'relative' }}>
                    <path d="M14 3 l2.6 7 l7.4 0.3 l-5.9 4.5 l2.2 7.1 l-6.3 -4.1 l-6.3 4.1 l2.2 -7.1 l-5.9 -4.5 l7.4 -0.3 z" fill={i === 0 ? '#fbb489' : '#d8c3ec'} stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
                  </svg>
                </div>
              </div>
              <div style={{ marginTop: 14, fontFamily: 'var(--f-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: '#FEBE98' }}>{s.no}</div>
              <div style={{ marginTop: 6, fontFamily: 'var(--f-serif)', fontSize: 17, fontWeight: 600, color: '#fff' }}>{s.name}</div>
              <div style={{ marginTop: 9, fontFamily: 'var(--f-hand)', fontSize: 16, lineHeight: 1.5, color: 'rgba(255,255,255,0.78)', whiteSpace: 'pre-line' }}>{s.copy}</div>
            </div>
          ))}
        </div>

        <div style={{ margin: '56px auto 0', maxWidth: 620, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '11px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.16)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/icon-book.png" alt="" width="22" height="22" style={{ objectFit: 'contain' }} />
            <span style={{ fontFamily: 'var(--f-sans)', fontSize: 12.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)' }}>
              어바이딩의 여정은 <strong style={{ color: '#fff', fontWeight: 600 }}>퀴블러-로스의 애도 단계</strong>와 <strong style={{ color: '#fff', fontWeight: 600 }}>지속적 유대 이론</strong>에 기반해 설계되었습니다.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// S6 — 왜 만들었는가 (창업자 스토리)
// ═══════════════════════════════════════════════════════════════════
function FounderSection() {
  const paras: ReactNode[] = [
    <span key="0">2021년 11월, 제 반려견 순탄이가 세상을 떠났습니다. 고작 3살이었어요. 척수연화증이라는 희귀병으로, 하루아침에 보내야 했습니다.</span>,
    <span key="1">가장 가까운 사람들의 위로가, 아이러니하게도 가장 상처가 됐습니다. 슬픔을 억눌러야 했던 시간, 저는 혼자 아이에게 편지를 쓰곤 했습니다.</span>,
    <span key="2">나중에야 이런 슬픔에 이름이 있다는 걸 알았습니다. <strong style={{ color: 'var(--peach-500)', fontWeight: 600 }}>박탈된 애도.</strong> 사회가 온전히 인정하기를 거부하는 슬픔이라고요.</span>,
    <span key="3">너무 사랑했기에 슬픈 것일 뿐인데… 저는 마음을 터놓고 말할 곳이 필요했습니다.</span>,
    <span key="4">그래서 만들었습니다. 이 슬픔에 <strong style={{ color: 'var(--lav-700)', fontWeight: 600 }}>설명이 필요 없는 곳</strong>을요. 어바이딩은 그 시작입니다.</span>,
  ]
  return (
    <section id="founder" style={{ position: 'relative', overflow: 'hidden', padding: '104px 24px 110px', background: 'linear-gradient(180deg, rgba(237,228,243,0) 0%, rgba(232,222,239,0.6) 50%, rgba(237,228,243,0) 100%)' }}>
      <div className="lp-wrap">
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 56px' }}>
          <Eyebrow>Why we made this</Eyebrow>
          <SectionTitle>왜 만들었는가</SectionTitle>
        </div>

        <div className="lp-founder">
          {/* portrait */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 280 }}>
              <div style={{ position: 'absolute', inset: -14, borderRadius: 28, background: 'radial-gradient(circle at 40% 30%, rgba(250,221,202,0.55), transparent 70%)', filter: 'blur(6px)' }} />
              <div style={{ position: 'relative', padding: 10, borderRadius: 24, background: '#fffaf0', boxShadow: '0 20px 44px rgba(86,52,140,0.18)', border: '0.5px solid rgba(200,170,130,0.35)', transform: 'rotate(-1.5deg)' }}>
                {/* 순탄이 / 만든이 사진 — public/landing/founder.jpg */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/landing/founder.png"
                  alt="우리 순탄이와 만든이"
                  style={{ display: 'block', width: '100%', height: 300, objectFit: 'cover', borderRadius: 16 }}
                />
                <div style={{ textAlign: 'center', padding: '14px 0 6px', fontFamily: 'var(--f-hand)', fontSize: 22, color: 'var(--lav-700)' }}>우리 순탄이를 기억하며,</div>
              </div>
              <div style={{ position: 'absolute', bottom: -18, right: -8, opacity: 0.85, transform: 'rotate(12deg)' }}>
                <LavenderSprig w={26} h={64} />
              </div>
            </div>
          </div>

          {/* story */}
          <div>
            <svg width="40" height="32" viewBox="0 0 40 32" fill="none" style={{ marginBottom: 14 }}>
              <path d="M0 32 V18 C0 7 6 1 17 0 L17 7 C11 8 9 11 9 16 L17 16 V32 Z M22 32 V18 C22 7 28 1 39 0 L39 7 C33 8 31 11 31 16 L39 16 V32 Z" fill="var(--lav-300)" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {paras.map((p, i) => (
                <p key={i} style={{ margin: 0, fontFamily: 'var(--f-serif)', fontSize: 16.5, fontWeight: 400, lineHeight: 1.85, color: 'var(--lav-800)', letterSpacing: '-0.01em', textWrap: 'pretty' }}>{p}</p>
              ))}
            </div>

            <div style={{ marginTop: 28, paddingTop: 22, borderTop: '0.5px solid rgba(166,133,199,0.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--lav-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paw size={20} color="var(--lav-500)" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--f-hand)', fontSize: 22, color: 'var(--lav-800)', lineHeight: 1 }}>순탄순리맘</div>
                <div style={{ marginTop: 4, fontFamily: 'var(--f-sans)', fontSize: 12.5, color: 'var(--ink-300)' }}>Abiding 만든이</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// S7 — VOICES (베타 이후 공개 · 현재 SHOW_VOICES=false 로 숨김)
// ═══════════════════════════════════════════════════════════════════
function TestimonialsSection() {
  return (
    <section style={{ position: 'relative', padding: '96px 24px 104px' }}>
      <div className="lp-wrap">
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 40px' }}>
          <Eyebrow>Voices</Eyebrow>
          <SectionTitle>먼저 걸어본 마음들</SectionTitle>
        </div>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '52px 32px', textAlign: 'center', borderRadius: 24, background: 'rgba(255,255,255,0.5)', border: '1px dashed rgba(166,133,199,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Paw size={30} color="var(--lav-200)" />
          </div>
          <p style={{ margin: 0, fontFamily: 'var(--f-serif)', fontSize: 18, fontWeight: 400, lineHeight: 1.7, color: 'var(--lav-700)', letterSpacing: '-0.01em' }}>
            먼저 걸어본 분들의 이야기는<br />베타 버전 이후에 이곳에 담길 예정이에요.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 22, padding: '6px 14px', borderRadius: 999, background: 'rgba(249,156,105,0.12)', border: '0.5px solid rgba(249,156,105,0.3)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--peach-400)' }} />
            <span style={{ fontFamily: 'var(--f-sans)', fontSize: 12, fontWeight: 500, color: 'var(--peach-500)' }}>클로즈베타 진행 중</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// S8 — 최종 CTA
// ═══════════════════════════════════════════════════════════════════
function FinalCTAv2() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: '112px 24px 96px', textAlign: 'center', background: 'linear-gradient(180deg, #f1e7f3 0%, #ece2f0 40%, #e6d8ea 100%)' }}>
      <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 520, height: 360, background: 'radial-gradient(circle, rgba(250,221,202,0.5), transparent 70%)', filter: 'blur(40px)' }} />
      <div className="lp-wrap" style={{ position: 'relative', maxWidth: 680 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landing/wax-seal-logo-lavender.png" alt="" width="76" height="76" style={{ display: 'block', filter: 'drop-shadow(0 8px 18px rgba(86,52,140,0.28))', animation: 'lp-float 6s ease-in-out infinite' }} />
        </div>
        <SectionTitle style={{ fontSize: 33 }}>{'지금이 첫 시간이든, 1년이 지났든\n어바이딩은 당신 곁에 머뭅니다'}</SectionTitle>
        <p style={{ margin: '18px auto 36px', maxWidth: 420, fontFamily: 'var(--f-sans)', fontSize: 15, lineHeight: 1.7, color: 'var(--ink-500)' }}>
          카카오 로그인 한 번이면, 1분 안에 첫 편지를 시작할 수 있어요.
        </p>
        <PrimaryCTA kakao large>카카오로 시작하기</PrimaryCTA>

        <div style={{ margin: '40px auto 0', maxWidth: 480, padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(166,133,199,0.25)' }}>
          <p style={{ margin: 0, fontFamily: 'var(--f-sans)', fontSize: 12, lineHeight: 1.7, color: 'var(--ink-500)' }}>
            이 서비스는 전문 심리치료를 대체하지 않습니다.<br />위기 상황이라면 전문기관의 도움을 받아주세요.
          </p>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Footer
// ═══════════════════════════════════════════════════════════════════
const footHead: CSSProperties = { fontFamily: 'var(--f-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }
const footList: CSSProperties = { margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11 }
const footLink: CSSProperties = { fontFamily: 'var(--f-sans)', fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }

function LandingFooterV2() {
  return (
    <footer style={{ background: '#241a38', color: 'rgba(255,255,255,0.7)', padding: '54px 24px 48px' }}>
      <div className="lp-wrap" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 36, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ fontFamily: 'var(--f-brand)', fontSize: 30, color: '#f3e7d2', lineHeight: 1 }}>Abiding</span>
          </div>
          <p style={{ margin: '16px 0 0', maxWidth: 320, fontFamily: 'var(--f-sans)', fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>
            떠나보낸 아이를 향한 마음이 흩어지지 않게,<br />머무를 자리를 만드는 반려동물 상실 정서케어 서비스.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          <div>
            <div style={footHead}>서비스</div>
            <ul style={footList}>
              <li><a href="#how" style={footLink}>이용 흐름</a></li>
              <li><a href="#journey" style={footLink}>49일의 여정</a></li>
              <li><a href="#founder" style={footLink}>만든이</a></li>
            </ul>
          </div>
          <div>
            <div style={footHead}>콘텐츠</div>
            <ul style={footList}>
              <li><span style={{ ...footLink, cursor: 'default' }}>펫로스 가이드 <span style={{ color: 'rgba(255,255,255,0.4)' }}>(준비중)</span></span></li>
            </ul>
          </div>
          <div>
            <div style={footHead}>문의</div>
            <ul style={footList}>
              <li><a href="mailto:abiding.pages26@gmail.com" style={footLink}>abiding.pages26@gmail.com</a></li>
              <li><span style={{ ...footLink, color: 'rgba(255,255,255,0.5)' }}>고객센터</span></li>
              <li style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
                <a href="http://pf.kakao.com/_PxcaxfX" target="_blank" rel="noreferrer noopener" style={{ ...footLink, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>카카오채널</a>
                <a href="https://www.instagram.com/abiding.pages/" target="_blank" rel="noreferrer noopener" style={{ ...footLink, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>인스타그램</a>
                <a href="https://www.threads.com/@abiding.pages" target="_blank" rel="noreferrer noopener" style={{ ...footLink, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>스레드</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="lp-wrap" style={{ marginTop: 40, paddingTop: 22, borderTop: '0.5px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'var(--f-sans)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>© 2026 Abiding. 곁에 머무는 마음.</span>
        <span style={{ fontFamily: 'var(--f-hand)', fontSize: 17, color: 'rgba(255,236,210,0.6)' }}>다시 만나는 그날까지, 함께 걸을게요.</span>
      </div>
    </footer>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Page assembly (8 sections · 무지개정원 제거)
// ═══════════════════════════════════════════════════════════════════
export default function LandingPage() {
  return (
    <div className="lp-root">
      {/* 디자인 원본이 쓰는 Noto Serif KR(제목/본문 serif) — 프로젝트 레이아웃엔 없으므로 랜딩에서만 로드 */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;600&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />

      <LandingNavV2 />
      <main>
        <HeroSectionV2 />
        <StatsSection />
        <FourValueSection />
        <HowItWorksSectionV2 />
        <JourneySectionV2 />
        <FounderSection />
        {SHOW_VOICES && <TestimonialsSection />}
        <FinalCTAv2 />
      </main>
      <LandingFooterV2 />
    </div>
  )
}
