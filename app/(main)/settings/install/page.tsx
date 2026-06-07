'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type OS = 'ios' | 'android'

const STEPS: Record<OS, { icon: string; text: string }[]> = {
  ios: [
    { icon: '🌐', text: 'Safari 브라우저로 abiding.pages를 열어주세요.' },
    { icon: '⬆️', text: '하단 가운데의 공유 버튼(□↑)을 탭하세요.' },
    { icon: '➕', text: '스크롤을 내려 "홈 화면에 추가"를 탭하세요.' },
    { icon: '✅', text: '오른쪽 위 "추가"를 탭하면 완료!' },
  ],
  android: [
    { icon: '🌐', text: 'Chrome 브라우저로 abiding.pages를 열어주세요.' },
    { icon: '⋮', text: '오른쪽 위 메뉴(⋮)를 탭하세요.' },
    { icon: '📱', text: '"앱 설치" 또는 "홈 화면에 추가"를 탭하세요.' },
    { icon: '✅', text: '"설치" 버튼을 탭하면 완료!' },
  ],
}

export default function InstallPage() {
  const router = useRouter()
  const [os, setOs] = useState<OS>('ios')

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)', paddingBottom: 48 }}>

      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px 10px', position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-app)',
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="var(--lav-700)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#6b6080' }}>
          홈화면에 추가
        </span>
        <div style={{ width: 38 }} />
      </div>

      <div style={{ padding: '16px 24px 32px', textAlign: 'center' }}>

        {/* 앱 아이콘 */}
        <div style={{ margin: '8px auto 20px', width: 72, height: 72, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 16px rgba(86,52,140,0.18)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192x192.png" alt="Abiding" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 500, color: 'var(--lav-800)', letterSpacing: '-0.02em' }}>
          앱처럼 설치하기
        </div>
        <div style={{ marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--ink-500)', lineHeight: 1.65 }}>
          홈화면에 추가하면 앱처럼 바로 열 수 있어요.
        </div>

        {/* OS 탭 */}
        <div style={{
          display: 'flex', gap: 8, margin: '24px 0 28px',
          background: 'rgba(255,255,255,0.6)', borderRadius: 999, padding: 4,
          border: '1px solid rgba(166,133,199,0.2)',
        }}>
          {(['ios', 'android'] as OS[]).map(o => (
            <button
              key={o}
              onClick={() => setOs(o)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 700,
                background: os === o ? 'var(--lav-500)' : 'transparent',
                color: os === o ? '#fff' : 'var(--lav-600)',
                transition: 'all .18s',
              }}
            >
              {o === 'ios' ? '🍎 iPhone / iPad' : '🤖 Android'}
            </button>
          ))}
        </div>

        {/* 단계 안내 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
          {STEPS[os].map((step, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '14px 16px', borderRadius: 16,
                background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)',
                border: '0.5px solid rgba(166,133,199,0.16)',
              }}
            >
              {/* 번호 */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'var(--lav-500)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700,
              }}>
                {i + 1}
              </div>
              {/* 내용 */}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 16, marginRight: 6 }}>{step.icon}</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--lav-800)', lineHeight: 1.55 }}>
                  {step.text}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 안내 */}
        <div style={{
          marginTop: 24, padding: '12px 16px', borderRadius: 14,
          background: 'rgba(139,107,184,0.08)', border: '1px solid rgba(139,107,184,0.18)',
          fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--lav-700)', lineHeight: 1.6,
        }}>
          {os === 'ios'
            ? 'iOS 16.4 이상, Safari 브라우저에서 푸시알림을 받을 수 있어요.'
            : 'Chrome 브라우저에서 설치 시 알림을 더 안정적으로 받을 수 있어요.'}
        </div>
      </div>
    </div>
  )
}
