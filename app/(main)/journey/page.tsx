'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// ── 7주차 메타데이터 ────────────────────────────────────────────────
const STAGES = [
  { n: 1, keyword: '머무름', title: '익숙한 온기 속에서',           color: '#bca4d6', emoji: '🌾' },
  { n: 2, keyword: '쏟아냄', title: '참지 않고 소리 내어 울기',      color: '#a8b9d9', emoji: '🌊' },
  { n: 3, keyword: '마주함', title: '미안했던 밤들의 고백',          color: '#a8c997', emoji: '🌿' },
  { n: 4, keyword: '기억함', title: '너와 함께 걸었던 길',           color: '#fbb489', emoji: '🌅' },
  { n: 5, keyword: '연결됨', title: '눈에 보이지 않아도 느껴지는 것', color: '#f4b8d4', emoji: '🌸' },
  { n: 6, keyword: '다독임', title: '너를 닮은 마음으로 나를 돌보기', color: '#a8c9b8', emoji: '🌱' },
  { n: 7, keyword: '간직함', title: '내 마음속 가장 따뜻했던 방에',  color: '#8b6bb8', emoji: '⭐' },
]

interface JourneyData {
  currentStage: number
  currentWeek: number
  currentDay: number
  totalLetters: number
  totalMinutes: number
  totalDays: number
  emotionCount: number
  nextStageAvailable: boolean
}

// ── 통계 칩 ────────────────────────────────────────────────────────
function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--lav-700)' }}>
        {value}
      </div>
      <div style={{ marginTop: 2, fontFamily: 'var(--font-sans)', fontSize: 10.5, color: '#9a8ab0' }}>
        {label}
      </div>
    </div>
  )
}

// ── 주차 카드 ──────────────────────────────────────────────────────
function StageCard({
  n, keyword, title, color, emoji, state, pct, onClick,
}: {
  n: number; keyword: string; title: string
  color: string; emoji: string
  state: 'done' | 'doing' | 'locked'
  pct: number
  onClick: () => void
}) {
  const isDoing  = state === 'doing'
  const isLocked = state === 'locked'
  const isDone   = state === 'done'

  return (
    <div
      onClick={isLocked ? undefined : onClick}
      style={{
        padding: '14px 16px', borderRadius: 18, position: 'relative',
        backgroundColor: '#fff',
        backgroundImage: [
          'radial-gradient(circle at 12% 15%, rgba(255,255,255,0.55), transparent 50%)',
          'repeating-linear-gradient(43deg,  rgba(100,70,160,0.022) 0 1px, transparent 1px 3px)',
          'repeating-linear-gradient(133deg, rgba(100,70,160,0.018) 0 1px, transparent 1px 3px)',
        ].join(', '),
        border: isDoing ? `1.5px solid ${color}` : '0.5px solid rgba(166,133,199,0.18)',
        boxShadow: isDoing ? `0 6px 20px ${color}33` : '0 2px 8px rgba(86,52,140,0.04)',
        cursor: isLocked ? 'default' : 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* 주차 일러스트 원형 이미지 */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          border: '1.5px solid rgba(188,164,214,0.53)',
          overflow: 'hidden', position: 'relative',
        }}>
          <img
            src={`/images/weeks/${n}w_v1.png`}
            alt={`${n}주차`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        {/* 텍스트 2줄 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 1줄: N주차 · 키워드 + 배지 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
              color: '#bca4d6', letterSpacing: '0.04em',
            }}>{n}주차 · {keyword}</span>
            {isDoing && (
              <span style={{
                padding: '1px 7px', borderRadius: 999,
                background: color, color: '#fff',
                fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
              }}>진행중</span>
            )}
            {isDone && (
              <span style={{
                padding: '1px 7px', borderRadius: 4,
                background: '#faddca', color: '#c47a3a',
                fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
              }}>완료</span>
            )}
          </div>
          {/* 2줄: 테마명 */}
          <div style={{
            marginTop: 3, fontFamily: 'var(--font-serif)', fontSize: 14.5, fontWeight: 500,
            color: 'var(--lav-800)', letterSpacing: '-0.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {title}
          </div>
        </div>

        {/* 우측 아이콘 */}
        {isLocked ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <rect x="5" y="11" width="14" height="9" rx="2" stroke="#bca4d6" strokeWidth="1.5"/>
            <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="#bca4d6" strokeWidth="1.5"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M9 5l7 7-7 7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </div>

      {/* 진행중 프로그레스 바 (7개 / 주차) */}
      {isDoing && (
        <div style={{ marginTop: 12, height: 5, borderRadius: 999, background: 'var(--lav-100)', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', background: color, borderRadius: 999,
            transition: 'width .6s ease', minWidth: pct > 0 ? 8 : 0,
          }}/>
        </div>
      )}
    </div>
  )
}

// ── 메인 페이지 ────────────────────────────────────────────────────
export default function JourneyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<JourneyData | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/journey')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
  }, [])

  // URL ?toast= 파라미터 처리
  useEffect(() => {
    const msg = searchParams.get('toast')
    if (!msg) return
    setToast(decodeURIComponent(msg))
    // URL에서 파라미터 제거
    const url = new URL(window.location.href)
    url.searchParams.delete('toast')
    window.history.replaceState(null, '', url.toString())
  }, [searchParams])

  // toast 자동 닫기
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const stagePct    = data ? Math.min(Math.round((data.currentDay / 7) * 100), 100) : 0
  const progressPct = data ? Math.round((data.totalDays / 49) * 100) : 0

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)', position: 'relative' }}>

      {/* 헤더 그라데이션 배경 */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 260, zIndex: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, #ece4f3 0%, transparent 100%)',
      }}/>

      <div style={{ position: 'relative', zIndex: 1, padding: '8px 20px 32px' }}>

        {/* ── 헤더 타이틀 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-brand)', fontSize: 34, color: 'var(--lav-600)', lineHeight: 1 }}>
              49 Days
            </div>
            <div style={{ marginTop: 5, fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 500, color: 'var(--lav-800)' }}>
              '49일의 여정'
            </div>
            <div style={{ marginTop: 2, fontFamily: 'var(--font-sans)', fontSize: 11.5, color: '#9a8ab0', lineHeight: 1.5 }}>
              아이와 함께하는 7주간의 마음 회복 여정
            </div>
          </div>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '0.5px solid rgba(166,133,199,0.25)', fontSize: 28,
            filter: 'grayscale(1) opacity(0.35)',
          }}>🐾</div>
        </div>

        {/* ── 진행률 카드 ── */}
        <div style={{
          padding: '16px 18px', borderRadius: 18, marginBottom: 18,
          background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(12px)',
          border: '0.5px solid rgba(166,133,199,0.16)',
          boxShadow: '0 2px 12px rgba(86,52,140,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 500, color: 'var(--lav-800)' }}>
              여정 진행률
            </span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--lav-500)' }}>
              {data?.totalDays ?? 0} / 49일
            </span>
          </div>

          {/* 진행률 바 */}
          <div style={{ height: 8, borderRadius: 999, background: 'var(--lav-100)', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.max(progressPct, data?.totalDays ? 2 : 0)}%`,
              height: '100%', borderRadius: 999,
              background: 'linear-gradient(90deg, var(--lav-400), #f4b8a0)',
              transition: 'width .8s ease',
            }}/>
          </div>

          {/* 통계 */}
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <StatChip value={String(data?.emotionCount ?? 0)} label="감정 기록"/>
            <div style={{ width: 1, height: 28, background: 'rgba(166,133,199,0.2)' }}/>
            <StatChip value={String(data?.totalLetters ?? 0)} label="여정 편지"/>
            <div style={{ width: 1, height: 28, background: 'rgba(166,133,199,0.2)' }}/>
            <StatChip value={`${data?.totalMinutes ?? 0}분`} label="함께한 시간"/>
          </div>
        </div>

        {/* ── 0단계 가이드 카드 ── */}
        <div
          onClick={() => router.push('/journey/guide')}
          style={{
            padding: '16px 18px', borderRadius: 18, marginBottom: 14,
            background: 'linear-gradient(135deg, #f5c4a7 0%, #faddca 40%, #ede4f3 100%)',
            border: '1px solid rgba(249,156,105,0.35)',
            boxShadow: '0 4px 16px rgba(249,120,70,0.15)',
            cursor: 'pointer',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* 배경 광택 */}
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 100, height: 100, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 13,
              background: 'rgba(255,255,255,0.75)',
              boxShadow: '0 2px 8px rgba(249,120,70,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>🧭</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--font-serif)', fontSize: 14.5, fontWeight: 700,
                color: '#6b3c20', letterSpacing: '-0.01em',
              }}>
                '49일의 여정' 가이드
              </div>
              <div style={{ marginTop: 2, fontFamily: 'var(--font-sans)', fontSize: 11.5, color: '#b07050' }}>
                여정 시작 전, 읽어보세요 ✦
              </div>
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 5l7 7-7 7" stroke="#c0693a" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* ── 5단계 카드 리스트 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {STAGES.map(s => {
            const currentWeek = data?.currentWeek ?? 1
            const state: 'done' | 'doing' | 'locked' =
              s.n < currentWeek ? 'done'
              : s.n === currentWeek ? 'doing'
              : 'locked'
            const pct = state === 'doing' ? stagePct : state === 'done' ? 100 : 0
            return (
              <StageCard
                key={s.n}
                {...s}
                state={state}
                pct={pct}
                onClick={() => router.push(`/journey/stage/${s.n}`)}
              />
            )
          })}
        </div>

        {/* ── 하단 언제든 섹션 ── */}
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600,
          color: '#9a8ab0', letterSpacing: '0.08em', marginBottom: 10,
        }}>언제든</div>

        {/* 자유롭게 편지쓰기 */}
        <div
          onClick={() => router.push('/write?free=1')}
          style={{
            padding: '14px 16px', borderRadius: 16, marginBottom: 8,
            backgroundColor: '#fff',
            backgroundImage: [
              'radial-gradient(circle at 12% 15%, rgba(255,255,255,0.55), transparent 50%)',
              'repeating-linear-gradient(43deg,  rgba(100,70,160,0.022) 0 1px, transparent 1px 3px)',
              'repeating-linear-gradient(133deg, rgba(100,70,160,0.018) 0 1px, transparent 1px 3px)',
            ].join(', '),
            border: '0.5px solid rgba(166,133,199,0.18)',
            display: 'flex', alignItems: 'center', gap: 12,
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(86,52,140,0.04)',
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 12, background: '#fddeca',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>✍️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 500, color: 'var(--lav-800)' }}>
              자유롭게 편지쓰기
            </div>
            <div style={{ marginTop: 1, fontFamily: 'var(--font-sans)', fontSize: 11, color: '#9a8ab0' }}>
              질문 없이 마음 가는 대로
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 5l7 7-7 7" stroke="var(--lav-500)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* COMING 카드 */}
        <div style={{
          padding: '14px 16px', borderRadius: 16,
          background: 'rgba(255,255,255,0.4)', border: '0.5px dashed rgba(166,133,199,0.3)',
          display: 'flex', alignItems: 'center', gap: 12, opacity: 0.5,
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, background: 'var(--lav-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🧘</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 500, color: 'var(--lav-700)' }}>
              더 많은 여정이 준비되고 있어요
            </div>
          </div>
        </div>

      </div>

      {/* ── 토스트 ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(44,28,72,0.95)', backdropFilter: 'blur(12px)',
          border: '0.5px solid rgba(255,255,255,0.15)',
          borderRadius: 14, padding: '12px 20px',
          fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.9)',
          maxWidth: 320, textAlign: 'center', lineHeight: 1.5,
          zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          whiteSpace: 'pre-wrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
