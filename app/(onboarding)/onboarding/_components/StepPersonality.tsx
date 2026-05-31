'use client'

import { OnboardingData } from '../page'

interface Props {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onNext: () => void
}

const PERSONALITY_TAGS = [
  '장난꾸러기', '다정해요', '겁많아요', '용감해요',
  '애교쟁이', '새침해요', '호기심쟁이', '순해요',
  '활발해요', '조용해요', '식탐쟁이', '고집쟁이',
]

const FAVORITE_TAGS = [
  '간식', '산책', '낮잠', '담요', '창가햇살', '사람구경',
]

const MAX_TAGS = 3

export default function StepPersonality({ data, onChange, onNext }: Props) {
  const togglePersonality = (tag: string) => {
    const cur = data.personalityTags
    if (cur.includes(tag)) {
      onChange({ personalityTags: cur.filter((t) => t !== tag) })
    } else if (cur.length < MAX_TAGS) {
      onChange({ personalityTags: [...cur, tag] })
    }
  }

  const toggleFavorite = (tag: string) => {
    const cur = data.favoriteTags
    if (cur.includes(tag)) {
      onChange({ favoriteTags: cur.filter((t) => t !== tag) })
    } else if (cur.length < MAX_TAGS) {
      onChange({ favoriteTags: [...cur, tag] })
    }
  }

  // 좋아했던 것: 태그 or 직접입력 중 최소 1개
  const favoriteCount = data.favoriteTags.length + (data.favoriteCustomMode && data.favoriteCustom.trim() ? 1 : 0)
  const isValid = data.personalityTags.length >= 1 && favoriteCount >= 1

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
          아이는 어떤 친구였나요?
        </div>
        <div style={{
          marginTop: 8,
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: 'var(--ink-500)',
        }}>
          아이의 모습을 떠올리며 골라주세요.
        </div>

        {/* 성격 태그 — 최소 1개, 최대 3개 필수 */}
        <div style={{ marginTop: 28 }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11.5,
            color: 'var(--ink-500)',
            letterSpacing: '0.04em',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>
              아이의 성격 <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span>
            </span>
            <span style={{ color: data.personalityTags.length >= MAX_TAGS ? 'var(--lav-500)' : 'var(--ink-300)', fontSize: 11 }}>
              {data.personalityTags.length}/{MAX_TAGS}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PERSONALITY_TAGS.map((tag) => {
              const active = data.personalityTags.includes(tag)
              const disabled = !active && data.personalityTags.length >= MAX_TAGS
              return (
                <button
                  key={tag}
                  onClick={() => togglePersonality(tag)}
                  disabled={disabled}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 999,
                    border: `1px solid ${active ? 'var(--lav-500)' : 'rgba(166,133,199,0.25)'}`,
                    background: active ? 'var(--lav-100)' : '#fff',
                    color: active ? 'var(--lav-700)' : disabled ? 'var(--ink-100)' : 'var(--ink-500)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    cursor: disabled ? 'default' : 'pointer',
                    transition: 'all .15s',
                    opacity: disabled ? 0.45 : 1,
                  }}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* 좋아했던 것 — 최소 1개, 최대 3개 필수 */}
        <div style={{ marginTop: 28 }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11.5,
            color: 'var(--ink-500)',
            letterSpacing: '0.04em',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>
              무엇을 좋아했나요? <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span>
            </span>
            <span style={{ color: data.favoriteTags.length >= MAX_TAGS ? 'var(--peach-400)' : 'var(--ink-300)', fontSize: 11 }}>
              {data.favoriteTags.length}/{MAX_TAGS}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FAVORITE_TAGS.map((tag) => {
              const active = data.favoriteTags.includes(tag)
              const disabled = !active && data.favoriteTags.length >= MAX_TAGS
              return (
                <button
                  key={tag}
                  onClick={() => toggleFavorite(tag)}
                  disabled={disabled}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 999,
                    border: `1px solid ${active ? 'rgba(251,180,137,0.7)' : 'rgba(166,133,199,0.25)'}`,
                    background: active ? 'rgba(251,180,137,0.12)' : '#fff',
                    color: active ? 'var(--peach-500)' : disabled ? 'var(--ink-100)' : 'var(--ink-500)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    cursor: disabled ? 'default' : 'pointer',
                    transition: 'all .15s',
                    opacity: disabled ? 0.45 : 1,
                  }}
                >
                  {tag}
                </button>
              )
            })}
            {/* 직접입력 */}
            <button
              onClick={() => onChange({ favoriteCustomMode: !data.favoriteCustomMode })}
              style={{
                padding: '9px 16px',
                borderRadius: 999,
                border: `1px solid ${data.favoriteCustomMode ? 'rgba(251,180,137,0.7)' : 'rgba(166,133,199,0.25)'}`,
                background: data.favoriteCustomMode ? 'rgba(251,180,137,0.12)' : '#fff',
                color: data.favoriteCustomMode ? 'var(--peach-500)' : 'var(--ink-500)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: data.favoriteCustomMode ? 600 : 400,
                cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              직접입력
            </button>
          </div>
          {data.favoriteCustomMode && (
            <input
              type="text"
              placeholder="ex. 햇살 받기, 유리창 핥기"
              value={data.favoriteCustom}
              onChange={(e) => onChange({ favoriteCustom: e.target.value })}
              autoFocus
              style={{
                marginTop: 10,
                width: '100%',
                padding: '13px 16px',
                borderRadius: 14,
                background: '#fff',
                border: '1px solid rgba(166,133,199,0.25)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13.5,
                color: 'var(--lav-800)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          )}
        </div>

        {/* 아이에게 전하고 싶은 한마디 — 최대 80자, 선택 */}
        <div style={{ marginTop: 24 }}>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11.5,
            color: 'var(--ink-500)',
            letterSpacing: '0.04em',
            marginBottom: 6,
          }}>
            아이에게 전하고 싶은 한마디 <span style={{ color: 'var(--ink-300)' }}>(선택)</span>
          </div>
          <textarea
            placeholder="늘 사랑한다는 말…"
            value={data.firstWord}
            onChange={(e) => onChange({ firstWord: e.target.value })}
            maxLength={80}
            rows={3}
            style={{
              width: '100%',
              padding: '13px 16px',
              borderRadius: 14,
              background: '#fff',
              border: '1px solid rgba(166,133,199,0.25)',
              fontFamily: 'var(--font-serif)',
              fontSize: 14,
              color: 'var(--lav-800)',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
              lineHeight: 1.7,
            }}
          />
          <div style={{
            textAlign: 'right',
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            color: data.firstWord.length >= 72 ? 'var(--peach-400)' : 'var(--ink-300)',
            marginTop: 4,
          }}>
            {data.firstWord.length}/80
          </div>
        </div>
      </div>

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
