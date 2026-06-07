'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const SHARE_URL  = 'https://abiding.pages'
const SHARE_TEXT = '반려동물을 떠나보낸 마음을 천천히 돌보는 공간, Abiding에서 49일 여정을 함께해요.'

export default function SharePage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)

  async function handleCopy() {
    // 1순위: Clipboard API
    try {
      await navigator.clipboard.writeText(SHARE_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    } catch { /* fallback으로 이동 */ }

    // 2순위: execCommand (구형 브라우저 / iOS fallback)
    try {
      const el = document.createElement('textarea')
      el.value = SHARE_URL
      el.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
      document.body.appendChild(el)
      el.focus()
      el.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(el)
      if (ok) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        return
      }
    } catch { /* fallback으로 이동 */ }

    // 3순위: Web Share API
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Abiding', url: SHARE_URL })
        return
      }
    } catch { /* 취소해도 무시 */ }

    // 모두 실패 시 URL 노출 안내
    setCopyFailed(true)
    setTimeout(() => setCopyFailed(false), 3000)
  }

  function handleKakao() {
    // 카카오 SDK가 로드돼 있으면 사용, 아니면 공유 URL fallback
    if (typeof window !== 'undefined' && (window as unknown as { Kakao?: { isInitialized?: () => boolean; Share?: { sendDefault: (o: unknown) => void } } }).Kakao?.isInitialized?.()) {
      const Kakao = (window as unknown as { Kakao: { Share: { sendDefault: (o: unknown) => void } } }).Kakao
      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: 'Abiding',
          description: SHARE_TEXT,
          imageUrl: `${SHARE_URL}/icons/icon-512x512.png`,
          link: { mobileWebUrl: SHARE_URL, webUrl: SHARE_URL },
        },
        buttons: [{ title: '함께하기', link: { mobileWebUrl: SHARE_URL, webUrl: SHARE_URL } }],
      })
    } else {
      // 카카오 SDK 미로드 시 Web Share API fallback
      if (navigator.share) {
        navigator.share({ title: 'Abiding', text: SHARE_TEXT, url: SHARE_URL })
      } else {
        handleCopy()
      }
    }
  }

  return (
    <div style={{ minHeight: '100dvh', position: 'relative', overflow: 'hidden' }}>

      {/* 배경 */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(160deg, #faddca 0%, #ece4f3 60%, #d2bee0 100%)',
        zIndex: 0,
      }}/>
      {/* 배경 glow */}
      <div style={{
        position: 'fixed', top: -40, left: -60, width: 240, height: 240,
        background: 'radial-gradient(circle, rgba(250,221,202,0.7), transparent 70%)',
        filter: 'blur(20px)', pointerEvents: 'none', zIndex: 0,
      }}/>
      <div style={{
        position: 'fixed', bottom: -80, right: -80, width: 280, height: 280,
        background: 'radial-gradient(circle, rgba(166,133,199,0.4), transparent 70%)',
        filter: 'blur(30px)', pointerEvents: 'none', zIndex: 0,
      }}/>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>

        {/* 상단 바 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 0', flexShrink: 0,
        }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="var(--lav-700)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#6b6080' }}>
            서비스 공유
          </span>
          <div style={{ width: 38 }}/>
        </div>

        {/* 편지봉투 일러스트 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0 0' }}>
          <div style={{ position: 'relative', width: 180, height: 150 }}>
            {/* 뒤 glow */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle, rgba(255,229,180,0.5), transparent 65%)',
              filter: 'blur(14px)',
            }}/>
            <svg viewBox="0 0 180 150" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <defs>
                <radialGradient id="sealGrad" cx="35%" cy="30%">
                  <stop offset="0%" stopColor="#c0a3dc"/>
                  <stop offset="100%" stopColor="#7a4b8f"/>
                </radialGradient>
              </defs>
              {/* 봉투 몸통 */}
              <g transform="translate(50,38)">
                <rect x="0" y="6" width="80" height="56" rx="6" fill="#f5ecdc" stroke="rgba(74,46,28,0.12)" strokeWidth="0.6"/>
                {/* 봉투 접힘선 (V자) */}
                <path d="M0 8 L40 40 L80 8" stroke="rgba(74,46,28,0.18)" strokeWidth="0.7" fill="none"/>
                {/* 하트 씰 */}
                <g transform="translate(40,36)">
                  <circle r="13" fill="url(#sealGrad)"/>
                  <path d="M0 5s-6-3.6-6-8a3.4 3.4 0 0 1 6-2 3.4 3.4 0 0 1 6 2c0 4.4-6 8-6 8z" fill="#fff" opacity="0.85"/>
                </g>
              </g>
              {/* 반짝이 별들 */}
              {([[20,30,3],[160,28,2.6],[150,110,2.8],[26,114,2.6],[14,70,2.2],[168,70,2.4],[90,12,2.6]] as [number,number,number][]).map(([x,y,r],i) => (
                <g key={i} transform={`translate(${x},${y})`} fill="#fbb489" opacity={0.75}>
                  <path d={`M0 ${-r} L${r*0.35} ${-r*0.35} L${r} 0 L${r*0.35} ${r*0.35} L0 ${r} L${-r*0.35} ${r*0.35} L${-r} 0 L${-r*0.35} ${-r*0.35} Z`}/>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* 메인 카피 */}
        <div style={{ padding: '20px 30px 0', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600,
            color: 'var(--peach-500)', letterSpacing: '0.1em', marginBottom: 10,
          }}>
            SHARE ABIDING
          </div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontSize: 21, fontWeight: 500,
            color: 'var(--lav-800)', lineHeight: 1.55, letterSpacing: '-0.02em',
          }}>
            반려동물을 떠나보낸<br/>
            <span style={{ color: 'var(--lav-600)' }}>소중한 사람</span>에게
          </div>
          <div style={{
            marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 12.5,
            color: 'var(--ink-500)', lineHeight: 1.7,
          }}>
            Abiding을 소개해주세요.
          </div>
        </div>

        {/* 링크 미리보기 카드 */}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{
            padding: '14px 16px', borderRadius: 999,
            background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)',
            border: '0.5px solid rgba(166,133,199,0.2)',
            boxShadow: '0 4px 18px rgba(86,52,140,0.1)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {/* 링크 카드 아이콘 — 작은 앱 아이콘 */}
            <div style={{
              width: 40, height: 40, borderRadius: 11, flexShrink: 0,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(86,52,140,0.12)',
            }}>
              <img
                src="/icons/icon-192x192.png"
                alt="Abiding"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600, color: 'var(--lav-800)' }}>
                Abiding
              </div>
              <div style={{
                marginTop: 1, fontFamily: 'var(--font-sans)', fontSize: 11.5,
                color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {SHARE_URL}
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 8 }}/>

        {/* CTA 버튼 */}
        <div style={{ padding: '12px 24px 36px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          {/* 링크 복사 */}
          <button
            onClick={handleCopy}
            style={{
              width: '100%', padding: '15px', borderRadius: 999,
              background: copied ? 'rgba(220,255,220,0.9)' : copyFailed ? 'rgba(255,235,220,0.9)' : 'rgba(255,255,255,0.85)',
              border: copied ? '1px solid rgba(100,180,100,0.4)' : copyFailed ? '1px solid rgba(249,156,105,0.4)' : '1px solid rgba(166,133,199,0.35)',
              color: copied ? '#2a6a2a' : copyFailed ? '#c0622a' : 'var(--lav-700)',
              fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', boxShadow: '0 2px 10px rgba(86,52,140,0.06)',
              transition: 'all 0.2s ease',
            }}
          >
            {copied ? (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#2a6a2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                복사 완료!
              </>
            ) : copyFailed ? (
              <>⚠️ 직접 복사해주세요 · {SHARE_URL}</>
            ) : (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="11" height="11" rx="2.5" stroke="var(--lav-700)" strokeWidth="1.6"/>
                  <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" stroke="var(--lav-700)" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                링크 복사
              </>
            )}
          </button>

          {/* 카카오 공유 */}
          <button
            onClick={handleKakao}
            style={{
              width: '100%', padding: '15px', borderRadius: 999, border: 'none',
              background: '#FEE500', color: '#3c1e1e',
              fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', boxShadow: '0 6px 18px rgba(254,229,0,0.35)',
            }}
          >
            {/* 카카오 말풍선 아이콘 */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 4C7 4 3 7.2 3 11.1c0 2.5 1.7 4.7 4.2 6L6.4 20c-.1.4.3.7.6.5l3.3-2.2c.5.06 1.1.1 1.7.1 5 0 9-3.2 9-7.1S17 4 12 4z" fill="#3c1e1e"/>
            </svg>
            카카오 공유
          </button>

          <div style={{
            marginTop: 2, fontFamily: 'var(--font-sans)', fontSize: 11,
            color: 'var(--ink-500)', textAlign: 'center',
          }}>
            함께 나눌수록 위로는 더 깊어져요
          </div>
        </div>
      </div>
    </div>
  )
}
