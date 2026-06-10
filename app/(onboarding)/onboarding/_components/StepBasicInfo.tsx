'use client'

import { useState } from 'react'
import { OnboardingData } from '../page'

interface Props {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onNext: () => void
}

const SPECIES_OPTIONS = [
  { value: 'dog', label: '강아지' },
  { value: 'cat', label: '고양이' },
  { value: 'hamster', label: '햄스터' },
  { value: 'bird', label: '앵무새' },
  { value: 'other', label: '직접입력' },
]

export default function StepBasicInfo({ data, onChange, onNext }: Props) {
  const [dateError, setDateError] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const validateAndNext = () => {
    if (data.passedDate > today) {
      setDateError('별이 된 날은 오늘 이전이어야 해요.')
      return
    }
    if (data.bornDate && data.passedDate && data.bornDate >= data.passedDate) {
      setDateError('태어난 날은 별이 된 날보다 이전이어야 해요.')
      return
    }
    setDateError('')
    onNext()
  }

  const handlePassedDateChange = (val: string) => {
    onChange({ passedDate: val })
    if (val > today) {
      setDateError('별이 된 날은 오늘 이전이어야 해요.')
    } else if (data.bornDate && val && data.bornDate >= val) {
      setDateError('태어난 날은 별이 된 날보다 이전이어야 해요.')
    } else {
      setDateError('')
    }
  }

  const handleBornDateChange = (val: string) => {
    onChange({ bornDate: val })
    if (data.passedDate && val >= data.passedDate) {
      setDateError('태어난 날은 별이 된 날보다 이전이어야 해요.')
    } else {
      setDateError('')
    }
  }

  const isValid =
    data.petName.trim() !== '' &&
    data.species !== '' &&
    (data.species !== 'other' || data.speciesCustom.trim() !== '') &&
    data.bornDate !== '' &&
    data.passedDate !== '' &&
    data.passedDate <= today &&
    data.bornDate < data.passedDate

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
          아이를 떠올려주세요.<br />이름을 적어볼게요.
        </div>
        <div style={{
          marginTop: 8,
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: 'var(--ink-500)',
        }}>
          이 정보는 따뜻한 편지가 되어 돌아옵니다.
        </div>

        {/* 사진 업로드 슬롯 */}
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label style={{ cursor: 'pointer' }}>
            <div style={{
              width: 116,
              height: 116,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #ece4f3, rgba(250,221,202,0.2))',
              border: data.petPhotoUrl ? 'none' : '1px dashed rgba(166,133,199,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {data.petPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.petPhotoUrl}
                  alt="아이 사진"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <path d="M18 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm16 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM8 18c-2.2 0-4 1.8-4 4 0 4.4 6.3 8 14 8s14-3.6 14-8c0-2.2-1.8-4-4-4H8z" fill="rgba(166,133,199,0.6)"/>
                  </svg>
                  {/* 사진 없을 때만 + 버튼 표시 */}
                  <div style={{
                    position: 'absolute',
                    bottom: -2,
                    right: 6,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--peach-300)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(249,156,105,0.4)',
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: 600,
                  }}>+</div>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const url = URL.createObjectURL(file)
                  onChange({ petPhotoFile: file, petPhotoUrl: url })
                }
              }}
            />
          </label>
          <div style={{
            marginTop: 10,
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--ink-500)',
          }}>
            {data.petPhotoUrl ? '사진을 눌러 변경할 수 있어요' : '아이의 사진을 올려주세요'}
          </div>
        </div>

        {/* 입력 필드들 */}
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 이름 */}
          <div>
            <label style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11.5,
              color: 'var(--ink-500)',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginBottom: 6,
            }}>
              아이의 이름
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path d="M12 20s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 10c0 5.5-7 10-7 10z" fill="var(--peach-400)"/>
              </svg>
              <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span>
            </label>
            <input
              type="text"
              placeholder="아이의 이름을 입력해주세요."
              value={data.petName}
              onChange={(e) => onChange({ petName: e.target.value })}
              style={{
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
          </div>

          {/* 종 선택 */}
          <div>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11.5,
              color: 'var(--ink-500)',
              letterSpacing: '0.04em',
              marginBottom: 8,
            }}>
              어떤 아이인가요? <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SPECIES_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChange({ species: opt.value })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 999,
                    border: `1px solid ${data.species === opt.value ? 'var(--lav-500)' : 'rgba(166,133,199,0.25)'}`,
                    background: data.species === opt.value ? 'var(--lav-100)' : '#fff',
                    color: data.species === opt.value ? 'var(--lav-700)' : 'var(--ink-500)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: data.species === opt.value ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {data.species === 'other' && (
              <input
                type="text"
                placeholder="종을 입력해주세요"
                value={data.speciesCustom}
                onChange={(e) => onChange({ speciesCustom: e.target.value })}
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

          {/* 품종 */}
          <div>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11.5,
              color: 'var(--ink-500)',
              letterSpacing: '0.04em',
              marginBottom: 6,
            }}>품종 <span style={{ color: 'var(--ink-300)' }}>(선택)</span></div>
            <input
              type="text"
              placeholder="ex. 말티즈"
              value={data.breed}
              onChange={(e) => onChange({ breed: e.target.value })}
              style={{
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
          </div>

          {/* 날짜 */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11.5,
                color: 'var(--ink-500)',
                letterSpacing: '0.04em',
                marginBottom: 6,
              }}>태어난 날 <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span></div>
              <input
                type="date"
                value={data.bornDate}
                onChange={(e) => handleBornDateChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 6px',
                  borderRadius: 14,
                  background: '#fff',
                  border: `1px solid ${dateError && data.bornDate ? 'rgba(234,126,74,0.5)' : 'rgba(166,133,199,0.25)'}`,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: 'var(--lav-800)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11.5,
                color: 'var(--ink-500)',
                letterSpacing: '0.04em',
                marginBottom: 6,
              }}>별이 된 날 <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span></div>
              <input
                type="date"
                value={data.passedDate}
                onChange={(e) => handlePassedDateChange(e.target.value)}
                max={today}
                style={{
                  width: '100%',
                  padding: '11px 6px',
                  borderRadius: 14,
                  background: '#fff',
                  border: `1px solid ${dateError && data.passedDate ? 'rgba(234,126,74,0.5)' : 'rgba(166,133,199,0.25)'}`,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: 'var(--lav-800)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {dateError && (
            <div style={{
              marginTop: -8,
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: 'var(--peach-500)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              ⚠️ {dateError}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 24px 28px' }}>
        <button
          onClick={validateAndNext}
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
