'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── 상수 ────────────────────────────────────────────────────────────────
const SPECIES_OPTIONS = [
  { value: 'dog',     label: '강아지' },
  { value: 'cat',     label: '고양이' },
  { value: 'hamster', label: '햄스터' },
  { value: 'parrot',  label: '앵무새' },
  { value: 'other',   label: '기타' },
]

const FAREWELL_OPTIONS = [
  { value: 'natural',    label: '자연사' },
  { value: 'euthanasia', label: '안락사' },
  { value: 'accident',   label: '사고' },
  { value: 'other',      label: '기타' },
]

const FAREWELL_MESSAGES: Record<string, string> = {
  natural: '오랜 시간 아이의 곁을 든든하게 지켜주셨군요. 텅 빈 마음에 조용히, 가만히 곁을 지켜드릴게요.',
  euthanasia: '그 결정을 내리기까지 얼마나 외로우셨을까요. 그 마음에 담긴 깊은 사랑을 아이에게 온전히 전해줄게요.',
  accident: '준비하지 못한 이별에 마음이 많이 먹먹하시겠어요. 아이가 전하고 싶었을 다정한 마음에만 집중하도록 도울게요.',
  other: '어떤 이별이었든, 아이를 향한 그 마음만큼은 변하지 않았을 거예요. 그 마음 그대로 함께 걸어갈게요.',
}

const NICKNAME_OPTIONS = ['엄마', '아빠', '직접입력']

const PERSONALITY_TAGS = [
  '장난꾸러기', '다정해요', '겁많아요', '용감해요',
  '애교쟁이', '새침해요', '호기심쟁이', '순해요',
  '활발해요', '조용해요', '식탐쟁이', '고집쟁이',
]

const FAVORITE_TAGS = ['간식', '산책', '낮잠', '담요', '창가햇살', '사람구경']

const MAX_TAGS = 3

// ─── 스타일 헬퍼 ─────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 16px', borderRadius: 14,
  border: '1px solid rgba(166,133,199,0.25)',
  background: '#fff', fontSize: 14,
  fontFamily: 'var(--font-sans)', color: 'var(--lav-800)',
  outline: 'none', boxSizing: 'border-box',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--ink-500)',
      letterSpacing: '0.04em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {children}
    </div>
  )
}

function Required() {
  return <span style={{ color: 'var(--peach-500)', fontSize: 10, fontWeight: 500 }}>필수</span>
}

function Optional() {
  return <span style={{ color: 'var(--ink-300)', fontSize: 10, fontWeight: 400 }}>(선택)</span>
}

function Field({ children, mt = 22 }: { children: React.ReactNode; mt?: number }) {
  return <div style={{ marginTop: mt }}>{children}</div>
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────
export default function PetSettingsPage() {
  const router = useRouter()

  const [petId, setPetId]                       = useState<string | null>(null)
  const [loading, setLoading]                   = useState(true)
  const [saving, setSaving]                     = useState(false)
  const [toast, setToast]                       = useState('')

  // 폼 상태
  const [name, setName]                         = useState('')
  const [species, setSpecies]                   = useState('')
  const [bornAt, setBornAt]                     = useState('')
  const [diedAt, setDiedAt]                     = useState('')
  const [farewellType, setFarewellType]         = useState('')
  const [ownerNickname, setOwnerNickname]       = useState('')
  const [ownerNicknameType, setOwnerNicknameType] = useState('')
  const [personalityTags, setPersonalityTags]   = useState<string[]>([])
  const [favoriteThings, setFavoriteThings]     = useState<string[]>([])
  const [favCustomMode, setFavCustomMode]       = useState(false)
  const [favCustom, setFavCustom]               = useState('')
  const [firstWord, setFirstWord]               = useState('')
  const [gardenPublic, setGardenPublic]         = useState(true)
  const [commentAllowed, setCommentAllowed]     = useState(true)
  const [profileImageUrl, setProfileImageUrl]   = useState<string | null>(null)
  const [photoUploading, setPhotoUploading]     = useState(false)
  const [dateError, setDateError]               = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]

  // activePet 정보 로드
  useEffect(() => {
    async function load() {
      try {
        const petRes = await fetch('/api/pets/me')
        const { pet } = await petRes.json()
        if (!pet) { setLoading(false); return }
        setPetId(pet.id)

        setName(pet.name ?? '')
        setSpecies(pet.species ?? '')
        setBornAt(pet.bornAt ? pet.bornAt.slice(0, 10) : '')
        setDiedAt(pet.diedAt ? pet.diedAt.slice(0, 10) : '')
        setFarewellType(pet.farewellType ?? '')
        const nick = pet.ownerNickname ?? ''
        setOwnerNickname(nick)
        setOwnerNicknameType(NICKNAME_OPTIONS.includes(nick) ? nick : nick ? 'custom' : '')
        setPersonalityTags(pet.personalityTags ?? [])
        setFavoriteThings(pet.favoriteThings ?? [])
        setFirstWord(pet.firstWord ?? '')
        setGardenPublic(pet.gardenPublic ?? true)
        setCommentAllowed(pet.commentAllowed ?? true)
        setProfileImageUrl(pet.profileImageUrl ?? null)
      } catch { /* silent */ }
      setLoading(false)
    }
    load()
  }, [])

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/pet-photo', { method: 'POST', body: formData })
      if (res.ok) {
        const { url } = await res.json()
        setProfileImageUrl(url)
      }
    } catch { /* silent */ }
    setPhotoUploading(false)
  }

  function handleDiedAtChange(val: string) {
    setDiedAt(val)
    if (val > today) {
      setDateError('별이 된 날은 오늘 이전이어야 해요.')
    } else if (bornAt && val && bornAt >= val) {
      setDateError('태어난 날은 별이 된 날보다 이전이어야 해요.')
    } else {
      setDateError('')
    }
  }

  function handleBornAtChange(val: string) {
    setBornAt(val)
    if (diedAt && val >= diedAt) {
      setDateError('태어난 날은 별이 된 날보다 이전이어야 해요.')
    } else {
      setDateError('')
    }
  }

  function togglePersonality(tag: string) {
    setPersonalityTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : prev.length < MAX_TAGS ? [...prev, tag] : prev
    )
  }

  function toggleFavoritePreset(tag: string) {
    setFavoriteThings(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : prev.length < MAX_TAGS ? [...prev, tag] : prev
    )
  }

  function addFavCustom() {
    const v = favCustom.trim()
    if (v && !favoriteThings.includes(v) && favoriteThings.length < MAX_TAGS) {
      setFavoriteThings(p => [...p, v])
    }
    setFavCustom('')
  }

  const isValid =
    name.trim() !== '' &&
    species !== '' &&
    bornAt !== '' &&
    diedAt !== '' &&
    diedAt <= today &&
    bornAt < diedAt &&
    farewellType !== '' &&
    ownerNickname.trim() !== '' &&
    personalityTags.length >= 1 &&
    favoriteThings.length >= 1

  async function handleSave() {
    if (!petId || saving || !isValid) return
    setSaving(true)
    try {
      const res = await fetch(`/api/pets/${petId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, species, bornAt, diedAt,
          farewellType, ownerNickname,
          personalityTags, favoriteThings,
          firstWord, gardenPublic, commentAllowed,
          profileImageUrl,
        }),
      })
      if (res.ok) {
        setToast('저장되었어요 🌿')
        setTimeout(() => { setToast(''); router.back() }, 1200)
      } else {
        setToast('저장에 실패했어요. 다시 시도해 주세요.')
        setTimeout(() => setToast(''), 2000)
      }
    } catch {
      setToast('오류가 발생했어요.')
      setTimeout(() => setToast(''), 2000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-400)' }}>불러오는 중…</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)', paddingBottom: 48 }}>

      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px 10px', position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-app)',
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="var(--lav-700)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#6b6080' }}>
          아이 정보 수정
        </span>
        <div style={{ width: 38 }} />
      </div>

      <div style={{ padding: '4px 24px 32px' }}>

        {/* 프로필 사진 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 20px' }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 90, height: 90, borderRadius: '50%', cursor: 'pointer',
              background: 'linear-gradient(145deg, #ece4f3, #d8c8d8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative',
              border: '2px solid rgba(139,107,184,0.2)',
              boxShadow: '0 2px 12px rgba(86,52,140,0.12)',
            }}
          >
            {photoUploading ? (
              <div style={{ fontSize: 20 }}>⏳</div>
            ) : profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileImageUrl} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ fontSize: 32 }}>
                {species === 'dog' ? '🐶' : species === 'cat' ? '🐱' : species === 'hamster' ? '🐹' : species === 'parrot' ? '🦜' : '🐾'}
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'rgba(0,0,0,0.35)', padding: '5px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="13" r="4" stroke="#fff" strokeWidth="1.8"/>
              </svg>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          <div style={{ marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--ink-400)' }}>
            사진을 눌러 변경
          </div>
        </div>

        {/* 이름 */}
        <Field mt={8}>
          <SectionLabel>아이의 이름 <Required /></SectionLabel>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="아이 이름을 입력해주세요." />
        </Field>

        {/* 종 */}
        <Field>
          <SectionLabel>어떤 아이인가요? <Required /></SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SPECIES_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSpecies(opt.value)}
                style={{
                  padding: '9px 16px', borderRadius: 999, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 13,
                  fontWeight: species === opt.value ? 600 : 400,
                  background: species === opt.value ? 'var(--lav-100)' : '#fff',
                  color: species === opt.value ? 'var(--lav-700)' : 'var(--ink-500)',
                  border: `1px solid ${species === opt.value ? 'var(--lav-500)' : 'rgba(166,133,199,0.25)'}`,
                  transition: 'all .15s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>

        {/* 생일 / 별날 */}
        <Field>
          <SectionLabel>태어난 날 <Required /></SectionLabel>
          <input
            type="date"
            style={{ ...inputStyle, border: `1px solid ${dateError && bornAt ? 'rgba(234,126,74,0.5)' : 'rgba(166,133,199,0.25)'}` }}
            value={bornAt}
            onChange={e => handleBornAtChange(e.target.value)}
          />
        </Field>
        <Field>
          <SectionLabel>별이 된 날 <Required /></SectionLabel>
          <input
            type="date"
            style={{ ...inputStyle, border: `1px solid ${dateError && diedAt ? 'rgba(234,126,74,0.5)' : 'rgba(166,133,199,0.25)'}` }}
            value={diedAt}
            max={today}
            onChange={e => handleDiedAtChange(e.target.value)}
          />
        </Field>
        {dateError && (
          <div style={{ marginTop: 6, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--peach-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
            ⚠️ {dateError}
          </div>
        )}

        {/* 이별 유형 — 심플 칩 */}
        <Field>
          <SectionLabel>어떤 이별이었나요? <Required /></SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FAREWELL_OPTIONS.map(opt => {
              const active = farewellType === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setFarewellType(opt.value)}
                  style={{
                    padding: '9px 20px', borderRadius: 999, cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: active ? 600 : 400,
                    border: `1px solid ${active ? 'var(--lav-500)' : 'rgba(166,133,199,0.25)'}`,
                    background: active ? 'var(--lav-100)' : '#fff',
                    color: active ? 'var(--lav-700)' : 'var(--ink-500)',
                    transition: 'all .15s',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          {farewellType && (
            <div style={{
              marginTop: 12, padding: '14px 16px', borderRadius: 14,
              background: farewellType === 'accident' ? 'rgba(251,180,137,0.08)' : 'rgba(166,133,199,0.07)',
              border: `1px solid ${farewellType === 'accident' ? 'rgba(251,180,137,0.25)' : 'rgba(166,133,199,0.18)'}`,
            }}>
              <div style={{
                fontFamily: 'var(--font-serif)', fontSize: 13,
                color: farewellType === 'accident' ? 'var(--peach-500)' : 'var(--lav-600)',
                lineHeight: 1.75, letterSpacing: '-0.01em',
              }}>
                {FAREWELL_MESSAGES[farewellType]}
              </div>
            </div>
          )}
        </Field>

        {/* 호칭 — 칩 + 직접입력 */}
        <Field>
          <SectionLabel>아이가 나를 뭐라고 불렀나요? <Required /></SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {NICKNAME_OPTIONS.map(opt => {
              const isCustom = opt === '직접입력'
              const active = isCustom ? ownerNicknameType === 'custom' : ownerNicknameType === opt
              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (isCustom) {
                      setOwnerNicknameType('custom')
                      setOwnerNickname('')
                    } else {
                      setOwnerNicknameType(opt)
                      setOwnerNickname(opt)
                    }
                  }}
                  style={{
                    padding: '9px 18px', borderRadius: 999, cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: active ? 600 : 400,
                    border: `1px solid ${active ? 'var(--lav-500)' : 'rgba(166,133,199,0.25)'}`,
                    background: active ? 'var(--lav-100)' : '#fff',
                    color: active ? 'var(--lav-700)' : 'var(--ink-500)',
                    transition: 'all .15s',
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
          {ownerNicknameType === 'custom' && (
            <input
              type="text"
              placeholder="ex. 보호자님, 할머니"
              value={ownerNickname}
              onChange={e => setOwnerNickname(e.target.value)}
              style={{ ...inputStyle, marginTop: 10 }}
            />
          )}
          {ownerNickname && (
            <div style={{ marginTop: 10, fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--lav-600)', fontStyle: 'italic' }}>
              &ldquo;사랑하는 {ownerNickname}에게...&rdquo;
            </div>
          )}
        </Field>

        {/* 성격 태그 */}
        <Field>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--ink-500)',
            letterSpacing: '0.04em', marginBottom: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>아이의 성격 <Required /></span>
            <span style={{ color: personalityTags.length >= MAX_TAGS ? 'var(--lav-500)' : 'var(--ink-300)', fontSize: 11 }}>
              {personalityTags.length}/{MAX_TAGS}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PERSONALITY_TAGS.map(tag => {
              const active = personalityTags.includes(tag)
              const disabled = !active && personalityTags.length >= MAX_TAGS
              return (
                <button
                  key={tag}
                  onClick={() => togglePersonality(tag)}
                  disabled={disabled}
                  style={{
                    padding: '9px 16px', borderRadius: 999, cursor: disabled ? 'default' : 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: active ? 600 : 400,
                    border: `1px solid ${active ? 'var(--lav-500)' : 'rgba(166,133,199,0.25)'}`,
                    background: active ? 'var(--lav-100)' : '#fff',
                    color: active ? 'var(--lav-700)' : disabled ? 'var(--ink-100)' : 'var(--ink-500)',
                    opacity: disabled ? 0.45 : 1,
                    transition: 'all .15s',
                  }}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </Field>

        {/* 좋아했던 것들 — 프리셋 태그 + 직접입력 */}
        <Field>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--ink-500)',
            letterSpacing: '0.04em', marginBottom: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>무엇을 좋아했나요? <Required /></span>
            <span style={{ color: favoriteThings.length >= MAX_TAGS ? 'var(--peach-400)' : 'var(--ink-300)', fontSize: 11 }}>
              {favoriteThings.length}/{MAX_TAGS}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FAVORITE_TAGS.map(tag => {
              const active = favoriteThings.includes(tag)
              const disabled = !active && favoriteThings.length >= MAX_TAGS
              return (
                <button
                  key={tag}
                  onClick={() => toggleFavoritePreset(tag)}
                  disabled={disabled}
                  style={{
                    padding: '9px 16px', borderRadius: 999, cursor: disabled ? 'default' : 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: active ? 600 : 400,
                    border: `1px solid ${active ? 'rgba(251,180,137,0.7)' : 'rgba(166,133,199,0.25)'}`,
                    background: active ? 'rgba(251,180,137,0.12)' : '#fff',
                    color: active ? 'var(--peach-500)' : disabled ? 'var(--ink-100)' : 'var(--ink-500)',
                    opacity: disabled ? 0.45 : 1,
                    transition: 'all .15s',
                  }}
                >
                  {tag}
                </button>
              )
            })}
            {/* 직접입력 토글 */}
            <button
              onClick={() => setFavCustomMode(p => !p)}
              style={{
                padding: '9px 16px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: favCustomMode ? 600 : 400,
                border: `1px solid ${favCustomMode ? 'rgba(251,180,137,0.7)' : 'rgba(166,133,199,0.25)'}`,
                background: favCustomMode ? 'rgba(251,180,137,0.12)' : '#fff',
                color: favCustomMode ? 'var(--peach-500)' : 'var(--ink-500)',
                transition: 'all .15s',
              }}
            >
              직접입력
            </button>
          </div>
          {/* 프리셋에 없는 기존 항목 표시 */}
          {favoriteThings.filter(t => !FAVORITE_TAGS.includes(t)).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {favoriteThings.filter(t => !FAVORITE_TAGS.includes(t)).map(t => (
                <span
                  key={t}
                  onClick={() => setFavoriteThings(p => p.filter(x => x !== t))}
                  style={{
                    padding: '8px 12px', borderRadius: 999, cursor: 'pointer',
                    border: '1px solid rgba(251,180,137,0.7)',
                    background: 'rgba(251,180,137,0.12)', color: 'var(--peach-500)',
                    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {t} <span style={{ opacity: 0.6, fontSize: 11 }}>×</span>
                </span>
              ))}
            </div>
          )}
          {favCustomMode && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={favCustom}
                onChange={e => setFavCustom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addFavCustom()}
                placeholder="ex. 햇살 받기, 유리창 핥기"
              />
              <button
                onClick={addFavCustom}
                style={{
                  padding: '13px 16px', borderRadius: 14, border: 'none',
                  background: 'var(--lav-500)', color: '#fff',
                  fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                추가
              </button>
            </div>
          )}
        </Field>

        {/* 한마디 */}
        <Field>
          <SectionLabel>아이에게 전하고 싶은 한마디 <Optional /></SectionLabel>
          <textarea
            placeholder="늘 사랑한다는 말…"
            value={firstWord}
            onChange={e => setFirstWord(e.target.value)}
            maxLength={80}
            rows={3}
            style={{
              width: '100%', padding: '13px 16px', borderRadius: 14,
              background: '#fff', border: '1px solid rgba(166,133,199,0.25)',
              fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--lav-800)',
              outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.7,
            }}
          />
          <div style={{ textAlign: 'right', fontFamily: 'var(--font-sans)', fontSize: 11, color: firstWord.length >= 72 ? 'var(--peach-400)' : 'var(--ink-300)', marginTop: 4 }}>
            {firstWord.length}/80
          </div>
        </Field>

        {/* 구분선 */}
        <div style={{ height: 1, background: 'rgba(166,133,199,0.15)', margin: '28px 0 20px' }} />
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', letterSpacing: '0.08em', marginBottom: 14 }}>
          추모 정원 설정
        </div>

        {/* 추모정원 공개 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(166,133,199,0.16)', marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--lav-800)' }}>추모정원 공개</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>다른 분들이 추모관을 방문할 수 있어요</div>
          </div>
          <Toggle on={gardenPublic} onToggle={() => setGardenPublic(p => !p)} />
        </div>

        {/* 댓글 허용 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(166,133,199,0.16)', marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--lav-800)' }}>응원 댓글 허용</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>추모관에 방문 메시지를 받을 수 있어요</div>
          </div>
          <Toggle on={commentAllowed} onToggle={() => setCommentAllowed(p => !p)} />
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving || !isValid}
          style={{
            marginTop: 32, width: '100%', padding: '16px', borderRadius: 999, border: 'none',
            background: (saving || !isValid) ? 'var(--lav-200)' : 'var(--lav-600)',
            color: (saving || !isValid) ? 'var(--lav-400)' : '#fff',
            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700,
            boxShadow: (saving || !isValid) ? 'none' : '0 6px 18px rgba(86,52,140,0.25)',
            cursor: (saving || !isValid) ? 'not-allowed' : 'pointer', transition: 'all .18s',
          }}
        >
          {saving ? '저장 중…' : '저장하기'}
        </button>
      </div>

      {/* 토스트 */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(40,28,68,0.88)', color: '#fff', padding: '10px 20px',
          borderRadius: 999, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
          whiteSpace: 'nowrap', zIndex: 100,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── 토글 컴포넌트 ────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 44, height: 26, borderRadius: 999, flexShrink: 0,
        background: on ? 'var(--lav-500)' : 'var(--lav-200)',
        position: 'relative', transition: 'background .2s', cursor: 'pointer',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left .2s',
      }} />
    </div>
  )
}
