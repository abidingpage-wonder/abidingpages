'use client'

import { useRouter } from 'next/navigation'

const STAGES = [
  { n: 1, t: '온전히 쏟아내기', weeks: '1~2주차', color: '#bca4d6', emoji: '🌧️',
    d: '세상 눈치 보느라 억눌렀던 눈물을 이곳에서 만큼은 펑펑 쏟아냅니다. 나의 슬픔이 지극히 당연하고, 위대한 사랑의 증거임을 인정받는 단계입니다.' },
  { n: 2, t: '죄책감 마주하기', weeks: '3주차', color: '#a8c997', emoji: '🍃',
    d: '마음 깊은 곳에 가라앉아 있던 "미안해"의 응어리를 회피하지 않고 꺼내어, 마음의 짐을 조금씩 덜어냅니다.' },
  { n: 3, t: '기억의 재구성', weeks: '4주차', color: '#fbb489', emoji: '🌅',
    d: '마지막 아팠던 순간에 갇혀 있던 시선을 넓혀, 아이가 주었던 벅찬 사랑과 행복했던 순간들을 복원합니다. 미안함이 고마움으로 바뀌기 시작합니다.' },
  { n: 4, t: '치유의 의식', weeks: '5~6주차', color: '#a8b9d9', emoji: '🕯️',
    d: "아이의 빈자리로 무너진 일상에 '추모'라는 다정한 규칙을 부여합니다. 일상을 스스로 통제할 수 있는 힘을 되찾습니다." },
  { n: 5, t: '마음속 새로운 연결', weeks: '7주차', color: '#8b6bb8', emoji: '⭐',
    d: '아이는 떠나는 것이 아닙니다. 내 마음속 가장 따뜻한 공간에 아이를 영원한 동반자로 단단히 심어두는 마지막 여정입니다.' },
]

const PACE = [
  '원하는 날에 하면 됩니다. 매일 하지 않아도 괜찮아요.',
  '3일만 완료해도 다음 주차로 넘어갈 수 있어요.',
  '언제든 이전으로 돌아와 다시 읽고 써도 됩니다.',
]

function CheckIcon() {
  return (
    <span style={{
      width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
      background: 'rgba(143,68,208,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
        <path d="M5 12l4 4 10-10" stroke="var(--lav-600)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )
}

function PawIcon({ size = 16, color = 'var(--lav-600)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <ellipse cx="6" cy="7.5" rx="2" ry="2.8"/>
      <ellipse cx="11" cy="5.5" rx="2" ry="2.8"/>
      <ellipse cx="16" cy="6.5" rx="2" ry="2.8"/>
      <ellipse cx="20" cy="11" rx="2" ry="2.5"/>
      <path d="M12 11c-4 0-7 2.5-7 5.5 0 2 1.5 4 4 4.5.5.1 1.5.5 3 .5s2.5-.4 3-.5c2.5-.5 4-2.5 4-4.5 0-3-3-5.5-7-5.5z"/>
    </svg>
  )
}

export default function JourneyGuidePage() {
  const router = useRouter()

  return (
    <div style={{
      width: '100%', minHeight: '100dvh',
      background: 'var(--bg-app)', position: 'relative',
    }}>
      {/* header gradient */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 200,
        background: 'linear-gradient(180deg, #ece4f3 0%, transparent 100%)',
        zIndex: 0, pointerEvents: 'none',
      }}/>

      {/* sticky top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center',
        padding: '14px 16px 8px',
        background: 'transparent',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 36, height: 36, border: 'none', background: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="var(--lav-700)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{
          flex: 1, textAlign: 'center',
          fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600,
          color: '#6b6080',
        }}>
          여정 가이드
        </div>
        <span style={{ width: 36 }}/>
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
      }}>

        {/* ── 인트로 ── */}
        <div style={{ padding: '8px 24px 0' }}>
          <div style={{
            fontFamily: 'var(--font-brand)', fontSize: 30,
            color: 'var(--lav-700)', lineHeight: 1,
          }}>
            49 Days
          </div>
          <div style={{
            marginTop: 8, fontFamily: 'var(--font-serif)', fontSize: 21,
            fontWeight: 600, color: 'var(--lav-800)',
            letterSpacing: '-0.02em', lineHeight: 1.4,
          }}>
            49일의 여정 가이드
          </div>

          <div style={{
            marginTop: 18, padding: '18px',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '0.5px solid rgba(166,133,199,0.18)',
          }}>
            {/* 첫 줄 serif 강조 */}
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600,
              color: 'var(--lav-800)', lineHeight: 1.6, letterSpacing: '-0.01em',
            }}>
              "동물인데 너무 오래<br/>슬퍼하는 거 아니야?"
            </div>

            {/* 본문 */}
            <div style={{
              marginTop: 12, fontFamily: 'var(--font-sans)', fontSize: 13,
              color: 'var(--ink-700)', lineHeight: 1.85, letterSpacing: '-0.01em',
            }}>
              그 말이 오히려 당신을 더 외롭게 만들었을 거예요.
              <br/><br/>
              반려동물을 잃은 슬픔은 심리학에서{' '}
              <span style={{ color: 'var(--lav-700)', fontWeight: 600 }}>'박탈된 애도'</span>
              라고 부릅니다. 사회적으로 충분히 인정받지 못하지만, 아이는 기상부터 취침까지 일상 곳곳에 스며들어 있었고, 어떤 인간관계와도 다른 조건 없는 사랑을 나눈 존재였기에 — 그 빈자리는 상상 이상으로 깊고 큽니다.
              <br/><br/>
              이 여정은{' '}
              <span style={{ color: 'var(--lav-700)', fontWeight: 600 }}>퀴블러-로스의 애도 단계, 지속적 유대 이론, 내러티브 심리 기법</span>
              을 바탕으로 설계되었습니다. 반려동물 상실을 직접 경험한 분들의 이야기가 질문 하나하나에 녹아 있어요.
            </div>

            {/* 구분선 + 마지막 문장 */}
            <div style={{
              marginTop: 14, paddingTop: 14,
              borderTop: '0.5px solid rgba(166,133,199,0.2)',
              fontFamily: 'var(--font-serif)', fontSize: 13.5,
              color: 'var(--peach-500)', lineHeight: 1.7, fontWeight: 500,
            }}>
              슬픔을 침묵하거나 부끄럽게 여기지 마세요.<br/>
              충분히 슬퍼하고, 아이와의 추억을<br/>
              마음껏 그리워해주세요.
            </div>
          </div>
        </div>

        {/* ── 5단계 ── */}
        <div style={{ padding: '28px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <PawIcon size={16} color="var(--lav-600)"/>
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600,
              color: 'var(--lav-800)', letterSpacing: '-0.01em',
            }}>
              5단계의 여정을 함께 걸어갑니다
            </div>
          </div>

          <div style={{ marginTop: 16, position: 'relative' }}>
            {/* 버티컬 커넥터 */}
            <div style={{
              position: 'absolute', left: 21, top: 14, bottom: 14,
              width: 2,
              background: 'linear-gradient(180deg, #bca4d6, #8b6bb8)',
              opacity: 0.35, borderRadius: 2,
            }}/>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {STAGES.map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                  {/* 원형 노드 */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                    background: '#fff', border: `2px solid ${s.color}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 3px 10px ${s.color}44`,
                  }}>
                    <span style={{ fontSize: 17, lineHeight: 1 }}>{s.emoji}</span>
                  </div>

                  {/* 카드 */}
                  <div style={{
                    flex: 1, padding: '13px 15px', borderRadius: 15,
                    background: 'rgba(255,255,255,0.78)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '0.5px solid rgba(166,133,199,0.16)',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'baseline',
                      justifyContent: 'space-between', gap: 8,
                    }}>
                      <div style={{
                        fontFamily: 'var(--font-serif)', fontSize: 14.5, fontWeight: 600,
                        color: 'var(--lav-800)', letterSpacing: '-0.01em',
                      }}>
                        <span style={{ color: s.color, fontWeight: 700 }}>{s.n}단계.</span>{' '}{s.t}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600,
                        color: s.color, whiteSpace: 'nowrap', letterSpacing: '0.02em',
                        flexShrink: 0,
                      }}>
                        {s.weeks}
                      </div>
                    </div>
                    <div style={{
                      marginTop: 7, fontFamily: 'var(--font-sans)', fontSize: 12,
                      color: 'var(--ink-700)', lineHeight: 1.7, letterSpacing: '-0.01em',
                    }}>
                      {s.d}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 나의 속도로 ── */}
        <div style={{ padding: '28px 24px 0' }}>
          <div style={{
            padding: '18px', borderRadius: 18,
            background: 'linear-gradient(135deg, #ede4f3 0%, #f3e9df 130%)',
            border: '0.5px solid rgba(166,133,199,0.18)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>🌿</span>
              <div style={{
                fontFamily: 'var(--font-serif)', fontSize: 15.5, fontWeight: 600,
                color: 'var(--lav-800)', letterSpacing: '-0.01em',
              }}>
                나의 속도로, 부담 없이
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PACE.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <CheckIcon/>
                  <div style={{
                    flex: 1, fontFamily: 'var(--font-sans)', fontSize: 12.5,
                    color: 'var(--ink-700)', lineHeight: 1.6, letterSpacing: '-0.01em',
                  }}>
                    {p}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 전문가 안내 ── */}
        <div style={{ padding: '18px 24px 0' }}>
          <div style={{
            padding: '16px 18px', borderRadius: 18,
            background: 'rgba(249,156,105,0.1)',
            border: '0.8px solid rgba(249,156,105,0.32)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 15 }}>⚠️</span>
              <div style={{
                fontFamily: 'var(--font-serif)', fontSize: 14.5, fontWeight: 600,
                color: '#b56a3a', letterSpacing: '-0.01em',
              }}>
                이런 분들은 전문가와 함께하세요
              </div>
            </div>
            <div style={{
              marginTop: 10, fontFamily: 'var(--font-sans)', fontSize: 12,
              color: 'var(--ink-700)', lineHeight: 1.8, letterSpacing: '-0.01em',
            }}>
              49일의 여정은 일상적인 애도 과정을 함께 걷기 위해 설계된 프로그램으로,{' '}
              <span style={{ fontWeight: 600, color: '#b56a3a' }}>심리치료를 대체하지 않습니다.</span>
              {' '}사고나 갑작스러운 충격으로 아이를 잃으셨거나, 일상생활이 어려울 만큼 극심한 슬픔이 지속되고 있다면 전문 심리상담사의 도움을 먼저 받으시길 권합니다.
            </div>
            <button
              onClick={() => {/* 추후 연결 예정 */}}
              style={{
                marginTop: 14, width: '100%', padding: '13px',
                borderRadius: 13, border: 'none',
                background: '#fff', color: '#b56a3a',
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                boxShadow: '0 3px 10px rgba(181,106,58,0.12)',
                cursor: 'not-allowed', opacity: 0.6,
              }}
            >
              마음이음 심리상담 연계 안내 보기
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M9 5l7 7-7 7" stroke="#b56a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div style={{
              marginTop: 7, fontFamily: 'var(--font-sans)', fontSize: 10.5,
              color: 'var(--ink-500)', textAlign: 'center',
            }}>
              추후 연결 예정
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{ padding: '24px 24px 8px' }}>
          <button
            onClick={() => router.push('/journey')}
            style={{
              width: '100%', padding: '16px',
              borderRadius: 999, border: 'none',
              background: 'var(--lav-600)', color: '#fff',
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700,
              letterSpacing: '-0.01em',
              boxShadow: '0 6px 18px rgba(86,52,140,0.25)',
              cursor: 'pointer',
            }}
          >
            여정 시작하기
          </button>
        </div>

      </div>
    </div>
  )
}
