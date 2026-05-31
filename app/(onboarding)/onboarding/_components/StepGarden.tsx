'use client'

import { OnboardingData } from '../page'

interface Props {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export default function StepGarden({ data, onChange, onSubmit, isSubmitting }: Props) {
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
          추모정원에<br />아이를 등록할게요.
        </div>
        <div style={{
          marginTop: 8,
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: 'var(--ink-500)',
        }}>
          다른 보호자분들과 함께 위로를 나눌 수 있어요.
        </div>

        {/* 추모정원 카드 일러스트 */}
        <div style={{
          marginTop: 28,
          padding: '24px',
          borderRadius: 20,
          background: 'linear-gradient(145deg, #f7f3fb, #fef4ec)',
          border: '1px solid rgba(166,133,199,0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{ fontSize: 48 }}>🌷</div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 16,
            color: 'var(--lav-700)',
            fontWeight: 500,
          }}>
            {data.petName || '아이'}의 정원
          </div>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--ink-500)',
            textAlign: 'center',
            lineHeight: 1.6,
          }}>
            다른 보호자들이 위로 스티커와<br />따뜻한 한 마디를 전할 수 있어요.
          </div>
        </div>

        {/* 공개 여부 토글 */}
        <div style={{ marginTop: 24 }}>
          <div
            onClick={() => onChange({ gardenPublic: !data.gardenPublic })}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderRadius: 16,
              background: '#fff',
              border: '1px solid rgba(166,133,199,0.2)',
              cursor: 'pointer',
            }}
          >
            <div>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--lav-800)',
              }}>추모정원 공개</div>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: 'var(--ink-500)',
                marginTop: 2,
              }}>다른 보호자분들이 위로를 전할 수 있어요</div>
            </div>
            {/* 토글 */}
            <div style={{
              width: 48,
              height: 28,
              borderRadius: 999,
              background: data.gardenPublic ? 'var(--lav-500)' : 'var(--ink-100)',
              position: 'relative',
              transition: 'background .2s',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute',
                top: 3,
                left: data.gardenPublic ? 23 : 3,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                transition: 'left .2s',
              }}/>
            </div>
          </div>

          {/* 댓글 허용 */}
          {data.gardenPublic && (
            <div
              onClick={() => onChange({ commentAllowed: !data.commentAllowed })}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderRadius: 16,
                background: '#fff',
                border: '1px solid rgba(166,133,199,0.2)',
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              <div>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--lav-800)',
                }}>한 줄 댓글 허용</div>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  color: 'var(--ink-500)',
                  marginTop: 2,
                }}>따뜻한 한 마디를 받을 수 있어요</div>
              </div>
              <div style={{
                width: 48,
                height: 28,
                borderRadius: 999,
                background: data.commentAllowed ? 'var(--lav-500)' : 'var(--ink-100)',
                position: 'relative',
                transition: 'background .2s',
                flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute',
                  top: 3,
                  left: data.commentAllowed ? 23 : 3,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  transition: 'left .2s',
                }}/>
              </div>
            </div>
          )}
        </div>

        {/* 동의 문구 */}
        <div style={{
          marginTop: 20,
          padding: '14px 16px',
          borderRadius: 14,
          background: 'rgba(166,133,199,0.06)',
          border: '1px solid rgba(166,133,199,0.15)',
        }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--ink-500)',
            lineHeight: 1.7,
          }}>
            {data.gardenPublic
              ? `아이의 카드가 추모정원에 등록됩니다. 다른 보호자들이 위로 스티커와 따뜻한 한 마디를 전할 수 있어요. 언제든 설정에서 변경할 수 있습니다.`
              : `아이의 카드가 나만 볼 수 있는 비공개 정원에 등록됩니다. 언제든 설정에서 공개로 변경할 수 있습니다.`
            }
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div style={{ padding: '12px 24px 28px' }}>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '16px',
            border: 'none',
            borderRadius: 18,
            background: isSubmitting
              ? 'var(--lav-300)'
              : 'linear-gradient(135deg, var(--lav-600), var(--lav-500))',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            boxShadow: isSubmitting ? 'none' : '0 8px 24px rgba(86,52,140,0.3)',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'all .2s',
          }}
        >
          {isSubmitting ? '저장 중...' : '저장하고 시작하기 ✨'}
        </button>
        <div style={{
          marginTop: 10,
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          color: 'var(--ink-300)',
          lineHeight: 1.6,
        }}>
          아이와의 여정을 시작할게요
        </div>
      </div>
    </div>
  )
}
