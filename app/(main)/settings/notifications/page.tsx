'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sunrise, Sun, Moon } from 'lucide-react'
import { usePushSubscription } from '@/hooks/usePushSubscription'

// ─── 상수 ──────────────────────────────────────────────────────────────────
const QUICK_PRESETS = [
  { k: 'morning', label: '아침', Icon: Sunrise, timeLabel: '오전 9:00', h: 9,  m: 0, ampm: '오전' },
  { k: 'noon',    label: '오후', Icon: Sun,     timeLabel: '오후 4:00', h: 4,  m: 0, ampm: '오후' },
  { k: 'night',   label: '밤',   Icon: Moon,    timeLabel: '오후 9:00', h: 9,  m: 0, ampm: '오후' },
] as const

const DOW = ['월', '화', '수', '목', '금', '토', '일']

interface TimeVal { h: number; m: number; ampm: string }

function fmtTime(h: number, m: number, ampm: string) {
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`
}

// ─── 스크롤 휠 피커 ────────────────────────────────────────────────────────
const ROW = 30

function Col<T extends number | string>({
  items, value, fmt, onPick, width,
}: {
  items: T[]; value: T; fmt?: (v: T) => string
  onPick: (v: T) => void; width: number
}) {
  return (
    <div style={{ position: 'relative', height: ROW * 5, width, overflow: 'hidden' }}>
      {/* 위 페이드 */}
      <div style={{
        position: 'absolute', inset: '0 0 auto', height: ROW * 2,
        background: 'linear-gradient(180deg,rgba(255,255,255,.95),transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      {/* 아래 페이드 */}
      <div style={{
        position: 'absolute', inset: 'auto 0 0', height: ROW * 2,
        background: 'linear-gradient(0deg,rgba(255,255,255,.95),transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      <div style={{ height: '100%', overflowY: 'auto', scrollSnapType: 'y mandatory', padding: `${ROW * 2}px 0` }}>
        {items.map((it) => {
          const on = it === value
          return (
            <div key={String(it)} onClick={() => onPick(it)} style={{
              height: ROW, display: 'flex', alignItems: 'center', justifyContent: 'center',
              scrollSnapAlign: 'center', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: on ? 24 : 19, fontWeight: on ? 700 : 400,
              color: on ? 'var(--lav-800)' : 'var(--ink-300)', transition: 'all .12s',
            }}>
              {fmt ? fmt(it) : String(it)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── 직접 설정 바텀시트 ────────────────────────────────────────────────────
function TimeSheet({ time, setTime, onConfirm, onClose }: {
  time: TimeVal; setTime: (t: TimeVal) => void
  onConfirm: () => void; onClose: () => void
}) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const mins  = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(40,20,60,0.35)' }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26,
        boxShadow: '0 -10px 40px rgba(60,30,90,0.25)',
        padding: '16px 22px calc(86px + 24px)',
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M6 6l12 12M6 18L18 6" stroke="var(--lav-700)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--lav-800)', marginRight: 24 }}>
            직접 설정
          </div>
        </div>

        {/* 휠 피커 */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, top: ROW * 2, height: ROW,
            borderRadius: 14, background: 'var(--lav-50)', zIndex: 0,
          }} />
          <Col items={hours} value={time.h} width={56} onPick={(h) => setTime({ ...time, h })} />
          <Col items={mins}  value={time.m} width={56} fmt={(m) => String(m).padStart(2, '0')} onPick={(m) => setTime({ ...time, m })} />
          <Col items={['오전', '오후'] as string[]} value={time.ampm} width={64} onPick={(ampm) => setTime({ ...time, ampm })} />
        </div>

        <button onClick={onConfirm} style={{
          marginTop: 18, width: '100%', padding: '16px', borderRadius: 999, border: 'none',
          background: 'var(--lav-600)', color: '#fff',
          fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700,
          boxShadow: '0 6px 18px rgba(86,52,140,0.25)', cursor: 'pointer',
        }}>
          시간 설정
        </button>
      </div>
    </div>
  )
}

// ─── 섹션 레이블 ──────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700,
      color: 'var(--ink-400)', letterSpacing: '0.08em',
      textAlign: 'left', marginBottom: 10,
    }}>
      {children}
    </div>
  )
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const router = useRouter()
  const { permission, subscribed, loading, subscribe, unsubscribe } = usePushSubscription()

  // selectedKey: 'morning' | 'noon' | 'night' | 'custom' | null
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [customTime, setCustomTime]   = useState<TimeVal>({ h: 9, m: 0, ampm: '오전' })
  const [customSet, setCustomSet]     = useState(false) // 직접 설정 완료 여부
  const [days, setDays]               = useState([true, true, true, true, true, true, true])
  const [sheet, setSheet]             = useState(false)
  const [done, setDone]               = useState(false)

  // 마운트 시 기존 알림 설정 불러와 UI 복원
  useEffect(() => {
    fetch('/api/push/subscribe')
      .then(r => r.json())
      .then(({ subscription }) => {
        if (!subscription) return
        const { notifHour, notifMinute, notifAmpm, notifDays } = subscription

        // 빠른 설정 3개와 매칭되는지 확인
        const matched = QUICK_PRESETS.find(
          p => p.h === notifHour && p.m === notifMinute && p.ampm === notifAmpm
        )
        if (matched) {
          setSelectedKey(matched.k)
        } else {
          setSelectedKey('custom')
          setCustomTime({ h: notifHour, m: notifMinute, ampm: notifAmpm })
          setCustomSet(true)
        }

        // 요일 복원
        if (notifDays && notifDays.length === 7) {
          setDays(notifDays.split('').map((c: string) => c === '1'))
        }
      })
      .catch(() => {})
  }, [])

  function toggleDay(i: number) {
    setDays((d) => d.map((v, idx) => (idx === i ? !v : v)))
  }

  // 빠른 설정 선택
  function choosePreset(k: string) {
    setSelectedKey(k)
    setCustomSet(false) // 직접 설정 초기화
  }

  // 직접 설정 버튼 클릭 → 시트 열기
  function openCustomSheet() {
    setSheet(true)
  }

  // 직접 설정 확정
  function confirmCustomTime() {
    setSelectedKey('custom')
    setCustomSet(true)
    setSheet(false)
  }

  async function handleSetNotif() {
    if (!picked) return

    // 현재 선택된 시간 결정
    const preset = QUICK_PRESETS.find(p => p.k === selectedKey)
    const activeTime = preset
      ? { h: preset.h, m: preset.m, ampm: preset.ampm }
      : customTime

    const notifDays = days.map(v => v ? '1' : '0').join('')

    const settings = {
      notifHour:   activeTime.h,
      notifMinute: activeTime.m,
      notifAmpm:   activeTime.ampm,
      notifDays,
    }

    const ok = await subscribe(settings)
    if (ok || subscribed) setDone(true)
  }

  const picked = selectedKey !== null && (selectedKey !== 'custom' || customSet)

  // 현재 선택된 시간 요약 텍스트
  function selectedSummary() {
    if (!picked) return ''
    if (selectedKey === 'custom') return fmtTime(customTime.h, customTime.m, customTime.ampm)
    const p = QUICK_PRESETS.find(x => x.k === selectedKey)
    return p ? p.timeLabel : ''
  }

  // ── 완료 화면 ──────────────────────────────────────────────────────────
  if (done) {
    const preset = QUICK_PRESETS.find(p => p.k === selectedKey)
    const label = preset
      ? preset.timeLabel
      : fmtTime(customTime.h, customTime.m, customTime.ampm)

    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-app)', padding: '0 28px', textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', marginBottom: 20,
          border: '1px solid rgba(143,68,208,0.35)', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
        }}>🔔</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--lav-800)', fontWeight: 600, marginBottom: 10 }}>
          알림이 설정되었어요
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.7, marginBottom: 36 }}>
          매일 <strong style={{ color: 'var(--lav-700)' }}>{label}</strong>에<br />
          아이의 답장을 알려드릴게요.
        </div>
        <button onClick={() => router.back()} style={{
          padding: '14px 40px', borderRadius: 999, border: 'none',
          background: 'var(--lav-600)', color: '#fff',
          fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700,
          boxShadow: '0 6px 18px rgba(86,52,140,0.25)', cursor: 'pointer',
        }}>
          확인
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>

      {/* ── 헤더 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px 10px', position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-app)',
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="var(--lav-700)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#6b6080' }}>
          알림 설정
        </span>
        <div style={{ width: 38 }} />
      </div>

      {/* ── 콘텐츠 ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 24px' }}>

        {/* 상단 안내 */}
        <div style={{ textAlign: 'center', padding: '12px 0 24px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', margin: '0 auto 14px',
            border: '1px solid rgba(143,68,208,0.3)', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 3a6 6 0 0 0-6 6c0 5-2 6-2 6h16s-2-1-2-6a6 6 0 0 0-6-6z"
                stroke="var(--peach-500)" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M10 20a2 2 0 0 0 4 0" stroke="var(--peach-500)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 500, color: 'var(--lav-800)', letterSpacing: '-0.02em' }}>
            답장 도착 알림
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--ink-500)', lineHeight: 1.65 }}>
            아이의 답장이 도착하면 알려드릴게요.
          </div>
        </div>

        {/* 알림 차단 배너 */}
        {permission === 'denied' && (
          <div style={{
            marginBottom: 20, padding: '12px 16px', borderRadius: 14,
            background: 'rgba(251,180,137,0.12)', border: '1px solid rgba(251,180,137,0.3)',
            fontFamily: 'var(--font-sans)', fontSize: 12.5, color: '#7a4f30', lineHeight: 1.6,
          }}>
            알림이 차단되어 있어요.<br />기기 설정에서 알림을 허용해 주세요.
          </div>
        )}

        {/* 이미 구독 중 배너 */}
        {subscribed && permission === 'granted' && (
          <div style={{
            marginBottom: 20, padding: '12px 16px', borderRadius: 14,
            background: 'rgba(139,107,184,0.08)', border: '1px solid rgba(139,107,184,0.18)',
            fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--lav-700)',
          }}>
            현재 알림이 켜져 있어요. 시간대를 변경하려면 다시 선택해 주세요.
          </div>
        )}

        {/* ── 빠른 설정 섹션 ── */}
        <SectionLabel>빠른 설정</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
          {QUICK_PRESETS.map((p) => {
            const on = selectedKey === p.k
            return (
              <button key={p.k} onClick={() => choosePreset(p.k)} style={{
                width: '100%', padding: '14px 20px', borderRadius: 999,
                border: on ? '1.5px solid var(--peach-400)' : '1px solid rgba(166,133,199,0.28)',
                background: on ? '#fff' : 'rgba(255,255,255,0.55)',
                color: 'var(--lav-800)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: on ? '0 4px 14px rgba(249,156,105,0.16)' : 'none',
                transition: 'all .18s',
              }}>
                {/* 체크 원 */}
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: on ? '1.5px solid var(--peach-400)' : '1.5px solid rgba(166,133,199,0.35)',
                  background: on ? 'var(--peach-300)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .18s',
                }}>
                  {on && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l4 4 10-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>

                <p.Icon
                  size={18}
                  strokeWidth={1.5}
                  color="var(--peach-500)"
                  style={{ flexShrink: 0 }}
                />

                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 600, flex: 1, textAlign: 'left' }}>
                  {p.label}
                </span>

                {/* 고정 시간 뱃지 */}
                <span style={{
                  fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 500,
                  color: on ? 'var(--peach-500)' : 'var(--ink-300)',
                  transition: 'color .18s',
                }}>
                  {p.timeLabel}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── 직접 설정 섹션 ── */}
        <SectionLabel>직접 설정</SectionLabel>
        <button
          onClick={openCustomSheet}
          style={{
            width: '100%', padding: '14px 20px', borderRadius: 999,
            border: selectedKey === 'custom'
              ? '1.5px solid var(--peach-400)'
              : '1px solid rgba(166,133,199,0.28)',
            background: selectedKey === 'custom' ? '#fff' : 'rgba(255,255,255,0.55)',
            color: 'var(--lav-800)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: selectedKey === 'custom' ? '0 4px 14px rgba(249,156,105,0.16)' : 'none',
            transition: 'all .18s',
          }}
        >
          {/* 체크 원 */}
          <span style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            border: selectedKey === 'custom' ? '1.5px solid var(--peach-400)' : '1.5px solid rgba(166,133,199,0.35)',
            background: selectedKey === 'custom' ? 'var(--peach-300)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .18s',
          }}>
            {selectedKey === 'custom' && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l4 4 10-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>

          {/* 시계 아이콘 */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="13" r="8" stroke="var(--peach-500)" strokeWidth="1.5" />
            <path d="M12 9.5V13l2.5 1.5" stroke="var(--peach-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 4L8 6.5M19 4l-3 2.5" stroke="var(--peach-500)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>

          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 600, flex: 1, textAlign: 'left' }}>
            {customSet ? fmtTime(customTime.h, customTime.m, customTime.ampm) : '직접 설정'}
          </span>

          {/* 수정 화살표 */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="var(--ink-300)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* ── 반복 요일 (선택 완료 시에만 표시) ── */}
        {picked && (
          <div style={{ marginTop: 28 }}>
            {/* 구분선 */}
            <div style={{ height: 1, background: 'rgba(166,133,199,0.15)', marginBottom: 20 }} />

            <SectionLabel>반복</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
              {DOW.map((d, i) => (
                <button key={d} onClick={() => toggleDay(i)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: days[i] ? '1.5px solid var(--peach-400)' : '1px solid rgba(166,133,199,0.28)',
                    background: days[i] ? '#fff' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s',
                  }}>
                    {days[i] && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l4 4 10-10" stroke="var(--peach-500)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-sans)', fontSize: 11.5,
                    color: days[i] ? 'var(--lav-800)' : 'var(--ink-300)',
                    transition: 'color .15s',
                  }}>
                    {d}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CTA ── */}
      <div style={{ padding: '12px 24px 40px', background: 'var(--bg-app)' }}>
        {subscribed && !picked && (
          <button
            onClick={async () => { await unsubscribe() }}
            style={{
              width: '100%', padding: '14px', borderRadius: 999, marginBottom: 10,
              border: '1px solid rgba(166,133,199,0.4)', background: 'transparent',
              color: 'var(--lav-600)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? '처리 중…' : '알림 끄기'}
          </button>
        )}
        <button
          disabled={!picked || loading || permission === 'denied'}
          onClick={handleSetNotif}
          style={{
            width: '100%', padding: '16px', borderRadius: 999, border: 'none',
            background: picked && permission !== 'denied' ? 'var(--lav-600)' : 'rgba(166,133,199,0.25)',
            color: picked && permission !== 'denied' ? '#fff' : 'var(--lav-400)',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700,
            boxShadow: picked ? '0 6px 18px rgba(86,52,140,0.25)' : 'none',
            cursor: picked && !loading && permission !== 'denied' ? 'pointer' : 'default',
            transition: 'all .18s',
          }}
        >
          {loading ? '설정 중…' : '알림 설정'}
        </button>
      </div>

      {/* ── 직접 설정 바텀시트 ── */}
      {sheet && (
        <TimeSheet
          time={customTime}
          setTime={setCustomTime}
          onConfirm={confirmCustomTime}
          onClose={() => setSheet(false)}
        />
      )}
    </div>
  )
}
