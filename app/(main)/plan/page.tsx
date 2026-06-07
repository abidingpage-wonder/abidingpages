'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// ── 플랜 혜택 항목 ──────────────────────────────────────────────────
function PlanRow({ label, dark }: { label: string; dark?: boolean }) {
  const color = dark ? '#fff' : 'var(--ink-700)'
  const iconBg = dark ? 'rgba(250,221,202,0.2)' : 'var(--peach-100)'
  const checkColor = dark ? '#faddca' : 'var(--peach-500)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontSize: 12.5, color, lineHeight: 1.5 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" fill={iconBg}/>
        <path d="M7 12l3.5 3.5L17 9" stroke={checkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ flex: 1, opacity: dark ? 0.92 : 1 }}>{label}</span>
    </div>
  )
}

// ── FAQ 아이템 ─────────────────────────────────────────────────────
const FAQS = [
  { q: '49일 후에는 어떻게 되나요?', a: '영구 보존된 보관함과 추모정원 카드는 계속 유지돼요.' },
  { q: '중간에 해지하면요?', a: '남은 기간 동안은 사용 가능하며, 환불은 정책에 따라 처리됩니다.' },
  { q: '아이를 두 명 등록할 수 있나요?', a: '한 계정당 한 아이의 여정을 천천히 함께해요.' },
]

// ── 메인 페이지 ────────────────────────────────────────────────────
export default function PlanPage() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [userPlan, setUserPlan] = useState<string>('free')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/payments/plan')
      .then(r => r.json())
      .then(d => setUserPlan(d.plan ?? 'free'))
      .catch(() => {})
  }, [])

  function handleProStart() {
    if (userPlan === 'pro') return
    setLoading(true)
    router.push('/payments/toss')
  }

  return (
    <div style={{ minHeight: '100dvh', position: 'relative', overflow: 'hidden' }}>
      {/* 배경 */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(180deg, #f7f3fb 0%, #ece4f3 100%)',
        zIndex: 0,
      }}/>

      <div style={{ position: 'relative', zIndex: 1, overflowY: 'auto', minHeight: '100dvh' }}>

        {/* 상단 바 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 0',
        }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="var(--lav-700)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#6b6080' }}>
            플랜 안내
          </span>
          <div style={{ width: 38 }}/>
        </div>

        {/* 인트로 */}
        <div style={{ padding: '24px 28px 0', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 500,
            color: 'var(--lav-800)', lineHeight: 1.55, letterSpacing: '-0.02em',
          }}>
            아이와 함께하는 여정
          </div>
          <div style={{
            marginTop: 10, fontFamily: 'var(--font-sans)', fontSize: 12.5,
            color: 'var(--ink-500)', lineHeight: 1.7,
          }}>
            마음을 천천히 돌보기에 알맞은 속도로<br/>플랜을 선택해 주세요.
          </div>
        </div>

        {/* 플랜 카드 */}
        <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* FREE 카드 */}
          <div style={{
            padding: '20px', borderRadius: 20,
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)',
            border: userPlan === 'free'
              ? '1.5px solid var(--lav-300)'
              : '0.5px solid rgba(166,133,199,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-brand)', fontSize: 30, color: 'var(--lav-600)', lineHeight: 1 }}>Free</div>
                <div style={{ marginTop: 6, fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--ink-500)', letterSpacing: '0.04em' }}>
                  처음 머무는 분에게
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--lav-800)' }}>무료</div>
                <div style={{ marginTop: 2, fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--ink-500)' }}>3일 체험</div>
              </div>
            </div>

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <PlanRow label="3일 체험 (1단계 질문 3개)"/>
              <PlanRow label="보관함 1년 보존"/>
              <PlanRow label="추모정원 스티커 & 한줄 작성"/>
            </div>

            {userPlan === 'free' && (
              <div style={{
                marginTop: 14, width: '100%', padding: '10px', borderRadius: 10,
                background: 'var(--lav-100)', textAlign: 'center',
                fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--lav-600)', fontWeight: 600,
              }}>
                현재 이용 중
              </div>
            )}
          </div>

          {/* PRO 카드 */}
          <div style={{
            position: 'relative', padding: '22px 20px', borderRadius: 20,
            background: 'linear-gradient(160deg, #2a223f 0%, #524080 100%)',
            border: userPlan === 'pro'
              ? '1.5px solid rgba(250,221,202,0.6)'
              : '0.5px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}>
            {/* glow */}
            <div style={{
              position: 'absolute', top: -30, right: -30, width: 160, height: 160,
              background: 'radial-gradient(circle, rgba(250,221,202,0.4), transparent 70%)',
              filter: 'blur(20px)', pointerEvents: 'none',
            }}/>
            {/* RECOMMENDED 배지 */}
            {userPlan !== 'pro' && (
              <div style={{
                position: 'absolute', top: 14, right: 14,
                padding: '4px 10px', borderRadius: 999,
                background: 'var(--peach-400)',
                fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
                color: '#fff', letterSpacing: '0.08em',
              }}>RECOMMENDED</div>
            )}
            {userPlan === 'pro' && (
              <div style={{
                position: 'absolute', top: 14, right: 14,
                padding: '4px 10px', borderRadius: 999,
                background: 'rgba(250,221,202,0.25)', border: '0.5px solid rgba(250,221,202,0.5)',
                fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
                color: '#faddca', letterSpacing: '0.08em',
              }}>이용 중</div>
            )}

            <div style={{ position: 'relative' }}>
              <div style={{ fontFamily: 'var(--font-brand)', fontSize: 30, color: '#faddca', lineHeight: 1 }}>Pro</div>
              <div style={{ marginTop: 6, fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em' }}>
                49일의 여정 · 전체
              </div>

              <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600, color: '#fff' }}>
                  4,900<span style={{ fontSize: 14, fontWeight: 500, marginLeft: 2 }}>원</span>
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>/ 100일</div>
              </div>

              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <PlanRow dark label="'49일의 여정' 전체 프로그램"/>
                <PlanRow dark label="매일 편지쓰기 + 아이 답장"/>
                <PlanRow dark label="사진 첨부 (최대 3장)"/>
                <PlanRow dark label="단계 완료 시 포토카드 자동 생성"/>
                <PlanRow dark label="보관함 영구 보존"/>
              </div>

              {userPlan === 'pro' ? (
                <div style={{
                  marginTop: 18, width: '100%', padding: '13px', borderRadius: 14,
                  background: 'rgba(250,221,202,0.15)', border: '0.5px solid rgba(250,221,202,0.3)',
                  textAlign: 'center',
                  fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#faddca',
                }}>
                  Pro 이용 중
                </div>
              ) : (
                <button
                  onClick={handleProStart}
                  disabled={loading}
                  style={{
                    marginTop: 18, width: '100%', padding: '13px', borderRadius: 14, border: 'none',
                    background: loading ? 'rgba(249,156,105,0.5)' : 'var(--peach-400)', color: '#fff',
                    fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 700,
                    boxShadow: '0 6px 18px rgba(249,156,105,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    cursor: loading ? 'default' : 'pointer',
                  }}
                >
                  {loading ? '잠시만요...' : (
                    <>
                      Pro로 시작하기
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 5l7 7-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </>
                  )}
                </button>
              )}

              <div style={{
                marginTop: 10, fontFamily: 'var(--font-sans)', fontSize: 10.5,
                color: 'rgba(255,255,255,0.45)', textAlign: 'center',
              }}>
                100일 단위 결제 · 언제든 해지 가능
              </div>
            </div>
          </div>
        </div>

        {/* 안내 문구 */}
        <div style={{
          margin: '20px 20px 0',
          padding: '14px 16px', borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(253,222,202,0.45), rgba(245,196,167,0.3))',
          border: '0.5px solid rgba(249,156,105,0.25)',
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>🌿</span>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: '#7a4f30', lineHeight: 1.75 }}>
              Abiding은 AI 기반 감정 동행 서비스로,{' '}
              <strong style={{ color: '#c0622a' }}>전문 심리치료나 의료 서비스를 대체하지 않습니다.</strong><br/>
              심리적 어려움이 심각하다면 전문가 상담을 권합니다.
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ padding: '24px 20px 120px' }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600,
            color: 'var(--ink-500)', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 4,
          }}>
            자주 묻는 질문
          </div>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                padding: '14px', marginBottom: 6, borderRadius: 14,
                background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
                border: '0.5px solid rgba(166,133,199,0.16)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--lav-800)' }}>
                  Q. {faq.q}
                </div>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  style={{ transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
                >
                  <path d="M6 9l6 6 6-6" stroke="var(--lav-500)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              {openFaq === i && (
                <div style={{
                  marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 11.5,
                  color: 'var(--ink-500)', lineHeight: 1.7,
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
