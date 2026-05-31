'use client'

import { OnboardingData } from '../page'

interface Props {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onSubmit: () => void
  isSubmitting: boolean
}

const FAREWELL_OPTIONS = [
  { value: 'natural', label: '자연사' },
  { value: 'euthanasia', label: '안락사' },
  { value: 'accident', label: '사고' },
  { value: 'other', label: '기타' },
]

const FAREWELL_MESSAGES: Record<string, string> = {
  natural: '오랜 시간 아이의 곁을 든든하게 지켜주셨군요. 텅 빈 마음에 조용히, 가만히 곁을 지켜드릴게요.',
  euthanasia: '그 결정을 내리기까지 얼마나 외로우셨을까요. 그 마음에 담긴 깊은 사랑을 아이에게 온전히 전해줄게요.',
  accident: '준비하지 못한 이별에 마음이 많이 먹먹하시겠어요. 아이가 전하고 싶었을 다정한 마음에만 집중하도록 도울게요.',
  other: '어떤 이별이었든, 아이를 향한 그 마음만큼은 변하지 않았을 거예요. 그 마음 그대로 함께 걸어갈게요.',
}

const NICKNAME_OPTIONS = ['엄마', '아빠', '직접입력']

export default function StepFarewellGarden({ data, onChange, onSubmit, isSubmitting }: Props) {
  const isValid = data.farewellType !== '' && data.ownerNickname.trim() !== ''

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '4px 28px 24px', flex: 1, overflowY: 'auto' }}>
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

        {/* 이별 상황 — 태그형 */}
        <div style={{ marginTop: 28 }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11.5,
            color: 'var(--ink-500)',
            letterSpacing: '0.04em',
            marginBottom: 10,
          }}>
            어떤 이별이었나요? <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FAREWELL_OPTIONS.map((opt) => {
              const active = data.farewellType === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => onChange({ farewellType: opt.value })}
                  style={{
                    padding: '9px 20px',
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
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* 이별 유형별 위로 메시지 */}
          {data.farewellType && (
            <div style={{
              marginTop: 12,
              padding: '14px 16px',
              borderRadius: 14,
              background: data.farewellType === 'accident'
                ? 'rgba(251,180,137,0.08)'
                : 'rgba(166,133,199,0.07)',
              border: `1px solid ${data.farewellType === 'accident' ? 'rgba(251,180,137,0.25)' : 'rgba(166,133,199,0.18)'}`,
            }}>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 13,
                color: data.farewellType === 'accident' ? 'var(--peach-500)' : 'var(--lav-600)',
                lineHeight: 1.75,
                letterSpacing: '-0.01em',
              }}>
                {FAREWELL_MESSAGES[data.farewellType]}
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
          <div style={{ display: 'flex', gap: 8 }}>
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
                    padding: '9px 20px',
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
          {data.ownerNicknameType === 'custom' && (
            <input
              type="text"
              placeholder="ex. 언니, 오빠"
              value={data.ownerNickname}
              onChange={(e) => onChange({ ownerNickname: e.target.value })}
              autoFocus
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
        </div>

        {/* ── 추모정원 토글 섹션 ── */}
        <div style={{
          marginTop: 32,
          paddingTop: 24,
          borderTop: '1px solid rgba(166,133,199,0.15)',
        }}>
          <div
            onClick={() => onChange({
              gardenPublic: !data.gardenPublic,
              commentAllowed: !data.gardenPublic ? data.commentAllowed : false,
            })}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 16,
              background: '#fff',
              border: '1px solid rgba(166,133,199,0.18)',
              cursor: 'pointer',
              marginBottom: 8,
            }}
          >
            <div>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13.5,
                fontWeight: 500,
                color: 'var(--lav-800)',
              }}>추모정원 등록</div>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: 'var(--ink-500)',
                marginTop: 2,
              }}>조용한 추모를 전할 수 있어요.</div>
            </div>
            <div style={{
              width: 46,
              height: 26,
              borderRadius: 999,
              background: data.gardenPublic ? 'var(--lav-500)' : 'var(--ink-100)',
              position: 'relative',
              transition: 'background .2s',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute',
                top: 3,
                left: data.gardenPublic ? 22 : 3,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                transition: 'left .2s',
              }}/>
            </div>
          </div>

          {data.gardenPublic && (
            <div
              onClick={() => onChange({ commentAllowed: !data.commentAllowed })}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 16,
                background: '#fff',
                border: '1px solid rgba(166,133,199,0.18)',
                cursor: 'pointer',
                marginBottom: 8,
              }}
            >
              <div>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: 'var(--lav-800)',
                }}>한 줄 댓글 허용</div>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  color: 'var(--ink-500)',
                  marginTop: 2,
                }}>아이에게 전할 따뜻한 한 마디를 받을 수 있어요.</div>
              </div>
              <div style={{
                width: 46,
                height: 26,
                borderRadius: 999,
                background: data.commentAllowed ? 'var(--lav-500)' : 'var(--ink-100)',
                position: 'relative',
                transition: 'background .2s',
                flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute',
                  top: 3,
                  left: data.commentAllowed ? 22 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  transition: 'left .2s',
                }}/>
              </div>
            </div>
          )}

          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11.5,
            color: 'var(--ink-300)',
            paddingLeft: 4,
          }}>
            *언제든 설정에서 변경할 수 있습니다.
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 24px 28px' }}>
        <button
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          style={{
            width: '100%',
            padding: '15px',
            border: 'none',
            borderRadius: 18,
            background: isValid && !isSubmitting
              ? 'linear-gradient(135deg, var(--lav-600), var(--lav-500))'
              : 'var(--lav-200)',
            color: isValid && !isSubmitting ? '#fff' : 'var(--lav-400)',
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            boxShadow: isValid && !isSubmitting ? '0 8px 24px rgba(86,52,140,0.28)' : 'none',
            cursor: isValid && !isSubmitting ? 'pointer' : 'not-allowed',
            transition: 'all .2s',
          }}
        >
          {isSubmitting ? '저장 중...' : '저장하고 시작하기'}
        </button>
        <div style={{
          marginTop: 10,
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          color: 'var(--ink-300)',
        }}>
          아이와의 여정을 시작할게요
        </div>
      </div>
    </div>
  )
}
