'use client'

import { OnboardingData } from '../page'

interface Props {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onNext: () => void
}

const FAREWELL_OPTIONS = [
  {
    value: 'natural',
    label: '자연사',
    desc: '나이가 들어 자연스럽게',
    icon: '🌿',
  },
  {
    value: 'euthanasia',
    label: '안락사',
    desc: '고통 없이 보내드렸어요',
    icon: '🕊️',
  },
  {
    value: 'accident',
    label: '사고',
    desc: '갑작스럽게 떠나보냈어요',
    icon: '💔',
  },
  {
    value: 'other',
    label: '기타',
    desc: '그 외의 이별',
    icon: '🌸',
  },
]

const NICKNAME_OPTIONS = ['엄마', '아빠', '언니', '오빠', '누나', '형', '직접입력']

export default function StepFarewell({ data, onChange, onNext }: Props) {
  const isValid = data.farewellType !== '' && data.ownerNickname.trim() !== ''

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '4px 28px 24px', flex: 1, overflowY: 'auto' }}>
        {/* 헤더 */}
        <div style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 22,
          fontWeight: 500,
          color: 'var(--lav-800)',
          lineHeight: 1.45,
          letterSpacing: '-0.02em',
        }}>
          이별을 기억해요.
        </div>
        <div style={{
          marginTop: 8,
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: 'var(--ink-500)',
        }}>
          말하기 어려웠던 이야기, 괜찮아요.
        </div>

        {/* 이별 상황 */}
        <div style={{ marginTop: 28 }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11.5,
            color: 'var(--ink-500)',
            letterSpacing: '0.04em',
            marginBottom: 12,
          }}>
            어떤 이별이었나요? <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAREWELL_OPTIONS.map((opt) => {
              const active = data.farewellType === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => onChange({ farewellType: opt.value })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 16,
                    border: `1.5px solid ${active ? 'var(--lav-400)' : 'rgba(166,133,199,0.2)'}`,
                    background: active ? 'var(--lav-50)' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all .15s',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{opt.icon}</span>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      color: active ? 'var(--lav-700)' : 'var(--lav-800)',
                    }}>{opt.label}</div>
                    <div style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 12,
                      color: 'var(--ink-500)',
                      marginTop: 2,
                    }}>{opt.desc}</div>
                  </div>
                  {active && (
                    <div style={{
                      marginLeft: 'auto',
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--lav-500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* 사고 선택 시 전문가 연계 안내 */}
          {data.farewellType === 'accident' && (
            <div style={{
              marginTop: 14,
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(251,180,137,0.1)',
              border: '1px solid rgba(251,180,137,0.3)',
            }}>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12.5,
                color: 'var(--peach-500)',
                lineHeight: 1.6,
              }}>
                💛 갑작스러운 이별은 더 힘들 수 있어요.<br />
                필요하다면 언제든지 전문 상담가와 연결해드릴 수 있어요.
              </div>
            </div>
          )}
        </div>

        {/* 호칭 선택 */}
        <div style={{ marginTop: 28 }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11.5,
            color: 'var(--ink-500)',
            letterSpacing: '0.04em',
            marginBottom: 10,
          }}>
            아이가 나를 뭐라고 불렀나요? <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {NICKNAME_OPTIONS.map((opt) => {
              const isCustom = opt === '직접입력'
              const active = isCustom
                ? data.ownerNicknameType === 'custom'
                : data.ownerNicknameType === opt
              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (isCustom) {
                      onChange({ ownerNicknameType: 'custom', ownerNickname: '' })
                    } else {
                      onChange({ ownerNicknameType: opt, ownerNickname: opt })
                    }
                  }}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 999,
                    border: `1px solid ${active ? 'var(--lav-500)' : 'rgba(166,133,199,0.25)'}`,
                    background: active ? 'var(--lav-100)' : '#fff',
                    color: active ? 'var(--lav-700)' : 'var(--ink-500)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
          {/* 직접입력 필드 */}
          {data.ownerNicknameType === 'custom' && (
            <input
              type="text"
              placeholder="ex. 보호자님, 할머니"
              value={data.ownerNickname}
              onChange={(e) => onChange({ ownerNickname: e.target.value })}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '13px 16px',
                borderRadius: 14,
                background: '#fff',
                border: '1px solid rgba(166,133,199,0.25)',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                color: 'var(--lav-800)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          )}
          {/* 미리보기 */}
          {data.ownerNickname && (
            <div style={{
              marginTop: 10,
              fontFamily: 'var(--font-serif)',
              fontSize: 13,
              color: 'var(--lav-600)',
              fontStyle: 'italic',
            }}>
              "사랑하는 {data.ownerNickname}에게..."
            </div>
          )}
        </div>
      </div>

      {/* 다음 버튼 */}
      <div style={{ padding: '12px 24px 28px' }}>
        <button
          onClick={onNext}
          disabled={!isValid}
          style={{
            width: '100%',
            padding: '15px',
            border: 'none',
            borderRadius: 18,
            background: isValid ? 'var(--lav-600)' : 'var(--lav-200)',
            color: isValid ? '#fff' : 'var(--lav-400)',
            fontFamily: 'var(--font-sans)',
            fontSize: 14.5,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            boxShadow: isValid ? '0 6px 18px rgba(86,52,140,0.22)' : 'none',
            cursor: isValid ? 'pointer' : 'not-allowed',
            transition: 'all .2s',
          }}
        >
          다음으로
        </button>
      </div>
    </div>
  )
}
