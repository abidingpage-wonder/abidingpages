'use client'

import { useEffect, useState } from 'react'

const JOURNEY_STAGES = [
  { week: 1, name: '머무름', label: 'WEEK 1', cx: 42,  cy: 46  },
  { week: 2, name: '쏟아냄', label: 'WEEK 2', cx: 22,  cy: 108 },
  { week: 3, name: '마주함', label: 'WEEK 3', cx: 68,  cy: 164 },
  { week: 4, name: '기억함', label: 'WEEK 4', cx: 160, cy: 185 },
  { week: 5, name: '연결함', label: 'WEEK 5', cx: 252, cy: 162 },
  { week: 6, name: '다독임', label: 'WEEK 6', cx: 296, cy: 102 },
  { week: 7, name: '간직함', label: 'WEEK 7', cx: 274, cy: 40  },
]

export function ConstellationMini() {
  const [currentWeek, setCurrentWeek] = useState(1)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentWeek(w => (w === 7 ? 1 : w + 1))
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <svg width="100%" height="140" viewBox="0 0 320 225" preserveAspectRatio="xMidYMid meet">
      {/* 스테이지 연결 점선 */}
      {JOURNEY_STAGES.slice(0, -1).map((s, i) => {
        const next = JOURNEY_STAGES[i + 1]
        const passed = s.week < currentWeek
        return (
          <line key={i} x1={s.cx} y1={s.cy} x2={next.cx} y2={next.cy}
            style={{
              stroke: passed ? 'rgba(184,156,210,0.55)' : 'rgba(184,156,210,0.18)',
              transition: 'stroke 0.6s ease',
            }}
            strokeWidth="1.2" strokeDasharray="3 5"
          />
        )
      })}

      {/* 각 스테이지 노드 + 라벨 */}
      {JOURNEY_STAGES.map((s) => {
        const isCurrent = s.week === currentWeek
        const passed    = s.week <= currentWeek
        const isLeft    = s.cx < 80
        const isRight   = s.cx > 240
        const anchor    = isLeft ? 'end' : isRight ? 'start' : 'middle'
        const lx        = isLeft ? s.cx - 18 : isRight ? s.cx + 18 : s.cx
        const ly        = s.cy > 130 ? s.cy + 22 : s.cy - 18

        return (
          <g key={s.week}>
            {/* 발광 링 — 현재 위치에서만 보임 */}
            <circle cx={s.cx} cy={s.cy} r={30}
              style={{
                fill: 'rgba(251,180,137,0.10)',
                opacity: isCurrent ? 1 : 0,
                transition: 'opacity 0.6s ease',
              }}
            />
            <circle cx={s.cx} cy={s.cy} r={20}
              style={{
                fill: 'rgba(251,180,137,0.20)',
                opacity: isCurrent ? 1 : 0,
                transition: 'opacity 0.6s ease',
              }}
            />
            {/* 노드 본체 */}
            <circle cx={s.cx} cy={s.cy}
              r={isCurrent ? 11 : 8}
              style={{
                fill: isCurrent ? '#fbb489' : passed ? '#b89dd6' : 'rgba(255,255,255,0.15)',
                transition: 'fill 0.6s ease',
              }}
            />
            {/* 현재 테두리 링 */}
            <circle cx={s.cx} cy={s.cy} r={11} fill="none"
              style={{
                stroke: '#fbb489',
                strokeWidth: 2,
                opacity: isCurrent ? 0.6 : 0,
                transition: 'opacity 0.6s ease',
              }}
            />
            {/* 스테이지 이름 */}
            <text x={lx} y={ly}
              textAnchor={anchor as 'end' | 'start' | 'middle'}
              fontFamily="var(--font-serif)" fontSize="12"
              fontWeight={isCurrent ? '700' : '400'}
              style={{
                fill: isCurrent ? '#fbb489' : passed ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                transition: 'fill 0.6s ease, font-weight 0.6s ease',
              }}
            >
              {s.name}
            </text>
            {/* 주차 라벨 */}
            <text x={lx} y={ly + 14}
              textAnchor={anchor as 'end' | 'start' | 'middle'}
              fontFamily="var(--font-sans)" fontSize="8"
              style={{
                fill: isCurrent ? 'rgba(251,180,137,0.8)' : 'rgba(255,255,255,0.3)',
                transition: 'fill 0.6s ease',
              }}
            >
              {s.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
