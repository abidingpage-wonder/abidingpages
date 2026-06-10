'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── 상수 (온보딩과 동일) ──────────────────────────────────────────────────
const SPECIES_OPTIONS = [
  { value: 'dog',     label: '강아지' },
  { value: 'cat',     label: '고양이' },
  { value: 'hamster', label: '햄스터' },
  { value: 'bird',    label: '앵무새' },
  { value: 'other',   label: '직접입력' },
]

const PERSONALITY_TAGS = [
  '장난꾸러기', '다정해요', '겁많아요', '용감해요',
  '애교쟁이', '새침해요', '호기심쟁이', '순해요',
  '활발해요', '조용해요', '식탐쟁이', '고집쟁이',
]

const FAVORITE_TAGS = ['간식', '산책', '낮잠', '담요', '창가햇살', '사람구경']

const FAREWELL_OPTIONS = [
  { value: 'natural',    label: '자연사' },
  { value: 'euthanasia', label: '안락사' },
  { value: 'accident',   label: '사고' },
  { value: 'other',      label: '기타' },
]

const FAREWELL_MESSAGES: Record<string, string> = {
  natural:    '오랜 시간 아이의 곁을 든든하게 지켜주셨군요. 텅 빈 마음에 조용히, 가만히 곁을 지켜드릴게요.',
  euthanasia: '그 결정을 내리기까지 얼마나 외로우셨을까요. 그 마음에 담긴 깊은 사랑을 아이에게 온전히 전해줄게요.',
  accident:   '준비하지 못한 이별에 마음이 많이 먹먹하시겠어요. 아이가 전하고 싶었을 다정한 마음에만 집중하도록 도울게요.',
  other:      '어떤 이별이었든, 아이를 향한 그 마음만큼은 변하지 않았을 거예요. 그 마음 그대로 함께 걸어갈게요.',
}

const NICKNAME_OPTIONS = ['엄마', '아빠', '직접입력']

const MAX_TAGS = 3

// ─── 공통 스타일 ──────────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  width: '100%', padding: '13px 16px', borderRadius: 14,
  border: '1px solid rgba(166,133,199,0.25)',
  background: '#fff', fontSize: 14,
  fontFamily: 'var(--font-sans)', color: 'var(--lav-800)',
  outline: 'none', boxSizing: 'border-box',
}

const labelBase: React.CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 11.5,
  color: 'var(--ink-500)', letterSpacing: '0.04em',
  marginBottom: 6,
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────
export default function PetSettingsPage() {
  const router = useRouter()

  const [petId, setPetId]                         = useState<string | null>(null)
  const [loading, setLoading]                     = useState(true)
  const [saving, setSaving]                       = useState(false)
  const [toast, setToast]                         = useState('')

  // ── Step1 필드 ──
  const [profileImageUrl, setProfileImageUrl]     = useState<string | null>(null)
  const [photoUploading, setPhotoUploading]       = useState(false)
  const [name, setName]                           = useState('')
  const [species, setSpecies]                     = useState('')
  const [speciesCustom, setSpeciesCustom]         = useState('')
  const [breed, setBreed]                         = useState('')
  const [bornAt, setBornAt]                       = useState('')
  const [diedAt, setDiedAt]                       = useState('')
  const [dateError, setDateError]                 = useState('')

  // ── Step2 필드 ──
  const [personalityTags, setPersonalityTags]     = useState<string[]>([])
  const [favoriteThings, setFavoriteThings]       = useState<string[]>([])
  const [favCustomMode, setFavCustomMode]         = useState(false)
  const [favCustom, setFavCustom]                 = useState('')
  const [firstWord, setFirstWord]                 = useState('')

  // ── Step3 필드 ──
  const [farewellType, setFarewellType]           = useState('')
  const [ownerNickname, setOwnerNickname]         = useState('')
  const [ownerNicknameType, setOwnerNicknameType] = useState('')
  const [gardenPublic, setGardenPublic]           = useState(true)
  const [commentAllowed, setCommentAllowed]       = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const today = new Date().toISOString().split('T')[0]

  // ── 데이터 로드 ──
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/pets/me')
        const { pet } = await res.json()
        if (!pet) { setLoading(false); return }
        setPetId(pet.id)

        setProfileImageUrl(pet.profileImageUrl ?? null)
        setName(pet.name ?? '')

        // species: 'bird'/'parrot' 등 기존 값 호환
        const knownValues = SPECIES_OPTIONS.map(o => o.value)
        if (knownValues.includes(pet.species)) {
          setSpecies(pet.species)
        } else if (pet.species) {
          setSpecies('other')
          setSpeciesCustom(pet.species)
        }

        setBreed(pet.breed ?? '')
        setBornAt(pet.bornAt ? pet.bornAt.slice(0, 10) : '')
        setDiedAt(pet.diedAt ? pet.diedAt.slice(0, 10) : '')
        setPersonalityTags(pet.personalityTags ?? [])
        setFavoriteThings(pet.favoriteThings ?? [])
        setFirstWord(pet.firstWord ?? '')
        setFarewellType(pet.farewellType ?? '')

        const nick = pet.ownerNickname ?? ''
        setOwnerNickname(nick)
        // 엄마/아빠는 직접 preset, 그 외는 custom
        setOwnerNicknameType(['엄마', '아빠'].includes(nick) ? nick : nick ? 'custom' : '')

        setGardenPublic(pet.gardenPublic ?? true)
        setCommentAllowed(pet.commentAllowed ?? true)
      } catch { /* silent */ }
      setLoading(false)
    }
    load()
  }, [])

  // ── 사진 업로드 ──
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/pet-photo', { method: 'POST', body: formData })
      if (res.ok) setProfileImageUrl((await res.json()).url)
    } catch { /* silent */ }
    setPhotoUploading(false)
  }

  // ── 날짜 검증 ──
  function handleBornAtChange(val: string) {
    setBornAt(val)
    if (diedAt && val >= diedAt) setDateError('태어난 날은 별이 된 날보다 이전이어야 해요.')
    else setDateError('')
  }
  function handleDiedAtChange(val: string) {
    setDiedAt(val)
    if (val > today) setDateError('별이 된 날은 오늘 이전이어야 해요.')
    else if (bornAt && bornAt >= val) setDateError('태어난 날은 별이 된 날보다 이전이어야 해요.')
    else setDateError('')
  }

  // ── 태그 토글 ──
  function togglePersonality(tag: string) {
    setPersonalityTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < MAX_TAGS ? [...prev, tag] : prev)
  }
  function toggleFavorite(tag: string) {
    setFavoriteThings(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < MAX_TAGS ? [...prev, tag] : prev)
  }
  function addFavCustom() {
    const v = favCustom.trim()
    if (v && !favoriteThings.includes(v) && favoriteThings.length < MAX_TAGS) setFavoriteThings(p => [...p, v])
    setFavCustom('')
  }

  // ── 유효성 ──
  const isValid =
    name.trim() !== '' &&
    species !== '' &&
    (species !== 'other' || speciesCustom.trim() !== '') &&
    bornAt !== '' && diedAt !== '' &&
    diedAt <= today && bornAt < diedAt &&
    personalityTags.length >= 1 &&
    favoriteThings.length >= 1 &&
    farewellType !== '' &&
    ownerNickname.trim() !== ''

  // ── 저장 ──
  async function handleSave() {
    if (!petId || saving || !isValid) return
    setSaving(true)
    try {
      const finalSpecies = species === 'other' ? speciesCustom.trim() : species
      const res = await fetch(`/api/pets/${petId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, species: finalSpecies, breed,
          bornAt, diedAt, farewellType, ownerNickname,
          personalityTags, favoriteThings,
          firstWord, gardenPublic, commentAllowed, profileImageUrl,
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

  // ── 칩 공통 스타일 헬퍼 ──
  const chip = (active: boolean, disabled = false): React.CSSProperties => ({
    padding: '9px 16px', borderRadius: 999, cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: active ? 600 : 400,
    border: `1px solid ${active ? 'var(--lav-500)' : 'rgba(166,133,199,0.25)'}`,
    background: active ? 'var(--lav-100)' : '#fff',
    color: active ? 'var(--lav-700)' : disabled ? 'var(--ink-100)' : 'var(--ink-500)',
    opacity: disabled ? 0.45 : 1,
    transition: 'all .15s',
  })

  const favChip = (active: boolean, disabled = false): React.CSSProperties => ({
    padding: '9px 16px', borderRadius: 999, cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: active ? 600 : 400,
    border: `1px solid ${active ? 'rgba(251,180,137,0.7)' : 'rgba(166,133,199,0.25)'}`,
    background: active ? 'rgba(251,180,137,0.12)' : '#fff',
    color: active ? 'var(--peach-500)' : disabled ? 'var(--ink-100)' : 'var(--ink-500)',
    opacity: disabled ? 0.45 : 1,
    transition: 'all .15s',
  })

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
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#6b6080' }}>아이 정보 수정</span>
        <div style={{ width: 38 }} />
      </div>

      <div style={{ padding: '4px 28px 32px' }}>

        {/* ── 사진 ── */}
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label style={{ cursor: 'pointer' }}>
            <div style={{
              width: 116, height: 116, borderRadius: '50%',
              background: 'linear-gradient(145deg, #ece4f3, rgba(250,221,202,0.2))',
              border: profileImageUrl ? 'none' : '1px dashed rgba(166,133,199,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              {photoUploading ? (
                <div style={{ fontSize: 20 }}>⏳</div>
              ) : profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileImageUrl} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <path d="M18 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm16 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM8 18c-2.2 0-4 1.8-4 4 0 4.4 6.3 8 14 8s14-3.6 14-8c0-2.2-1.8-4-4-4H8z" fill="rgba(166,133,199,0.6)"/>
                  </svg>
                  <div style={{
                    position: 'absolute', bottom: -2, right: 6,
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--peach-300)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(249,156,105,0.4)',
                    color: '#fff', fontSize: 18, fontWeight: 600,
                  }}>+</div>
                </>
              )}
            </div>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} ref={fileInputRef} />
          </label>
          <div style={{ marginTop: 10, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-500)' }}>
            {profileImageUrl ? '사진을 눌러 변경할 수 있어요' : '아이의 사진을 올려주세요'}
          </div>
        </div>

        {/* ── 이름 ── */}
        <div style={{ marginTop: 26 }}>
          <div style={{ ...labelBase, display: 'flex', alignItems: 'center', gap: 4 }}>
            아이의 이름
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path d="M12 20s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 10c0 5.5-7 10-7 10z" fill="var(--peach-400)"/>
            </svg>
            <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span>
          </div>
          <input
            type="text"
            placeholder="아이의 이름을 입력해주세요."
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputBase}
          />
        </div>

        {/* ── 종류 ── */}
        <div style={{ marginTop: 14 }}>
          <div style={labelBase}>
            어떤 아이인가요? <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SPECIES_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setSpecies(opt.value)} style={chip(species === opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
          {species === 'other' && (
            <input
              type="text"
              placeholder="종을 입력해주세요"
              value={speciesCustom}
              onChange={e => setSpeciesCustom(e.target.value)}
              autoFocus
              style={{ ...inputBase, marginTop: 10 }}
            />
          )}
        </div>

        {/* ── 품종 (선택) ── */}
        <div style={{ marginTop: 14 }}>
          <div style={labelBase}>
            품종 <span style={{ color: 'var(--ink-300)' }}>(선택)</span>
          </div>
          <input
            type="text"
            placeholder="ex. 말티즈"
            value={breed}
            onChange={e => setBreed(e.target.value)}
            style={inputBase}
          />
        </div>

        {/* ── 날짜 (나란히) ── */}
        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={labelBase}>
              태어난 날 <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span>
            </div>
            <input
              type="date"
              value={bornAt}
              onChange={e => handleBornAtChange(e.target.value)}
              style={{
                ...inputBase,
                padding: '13px 10px',
                border: `1px solid ${dateError && bornAt ? 'rgba(234,126,74,0.5)' : 'rgba(166,133,199,0.25)'}`,
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={labelBase}>
              별이 된 날 <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span>
            </div>
            <input
              type="date"
              value={diedAt}
              max={today}
              onChange={e => handleDiedAtChange(e.target.value)}
              style={{
                ...inputBase,
                padding: '13px 10px',
                border: `1px solid ${dateError && diedAt ? 'rgba(234,126,74,0.5)' : 'rgba(166,133,199,0.25)'}`,
              }}
            />
          </div>
        </div>
        {dateError && (
          <div style={{ marginTop: 6, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--peach-500)' }}>
            ⚠️ {dateError}
          </div>
        )}

        {/* ── 성격 태그 ── */}
        <div style={{ marginTop: 28 }}>
          <div style={{ ...labelBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>아이의 성격 <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span></span>
            <span style={{ color: personalityTags.length >= MAX_TAGS ? 'var(--lav-500)' : 'var(--ink-300)', fontSize: 11 }}>
              {personalityTags.length}/{MAX_TAGS}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PERSONALITY_TAGS.map(tag => {
              const active = personalityTags.includes(tag)
              const disabled = !active && personalityTags.length >= MAX_TAGS
              return (
                <button key={tag} onClick={() => togglePersonality(tag)} disabled={disabled} style={chip(active, disabled)}>
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── 좋아했던 것 ── */}
        <div style={{ marginTop: 28 }}>
          <div style={{ ...labelBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>무엇을 좋아했나요? <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span></span>
            <span style={{ color: favoriteThings.length >= MAX_TAGS ? 'var(--peach-400)' : 'var(--ink-300)', fontSize: 11 }}>
              {favoriteThings.length}/{MAX_TAGS}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FAVORITE_TAGS.map(tag => {
              const active = favoriteThings.includes(tag)
              const disabled = !active && favoriteThings.length >= MAX_TAGS
              return (
                <button key={tag} onClick={() => toggleFavorite(tag)} disabled={disabled} style={favChip(active, disabled)}>
                  {tag}
                </button>
              )
            })}
            <button onClick={() => setFavCustomMode(p => !p)} style={favChip(favCustomMode)}>
              직접입력
            </button>
          </div>
          {/* 프리셋에 없는 기존 커스텀 항목 */}
          {favoriteThings.filter(t => !FAVORITE_TAGS.includes(t)).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {favoriteThings.filter(t => !FAVORITE_TAGS.includes(t)).map(t => (
                <button key={t} onClick={() => setFavoriteThings(p => p.filter(x => x !== t))} style={favChip(true)}>
                  {t} <span style={{ opacity: 0.6, fontSize: 11 }}>×</span>
                </button>
              ))}
            </div>
          )}
          {favCustomMode && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                style={{ ...inputBase, flex: 1 }}
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
              >추가</button>
            </div>
          )}
        </div>

        {/* ── 한마디 (선택) ── */}
        <div style={{ marginTop: 24 }}>
          <div style={labelBase}>
            아이에게 전하고 싶은 한마디 <span style={{ color: 'var(--ink-300)' }}>(선택)</span>
          </div>
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
        </div>

        {/* ── 이별 유형 ── */}
        <div style={{ marginTop: 28 }}>
          <div style={labelBase}>
            어떤 이별이었나요? <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FAREWELL_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setFarewellType(opt.value)} style={{
                padding: '9px 20px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13,
                fontWeight: farewellType === opt.value ? 600 : 400,
                border: `1px solid ${farewellType === opt.value ? 'var(--lav-500)' : 'rgba(166,133,199,0.25)'}`,
                background: farewellType === opt.value ? 'var(--lav-100)' : '#fff',
                color: farewellType === opt.value ? 'var(--lav-700)' : 'var(--ink-500)',
                transition: 'all .15s',
              }}>
                {opt.label}
              </button>
            ))}
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
        </div>

        {/* ── 호칭 ── */}
        <div style={{ marginTop: 28 }}>
          <div style={labelBase}>
            아이가 나를 뭐라고 불렀나요? <span style={{ color: 'var(--peach-500)', fontSize: 10 }}>필수</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {NICKNAME_OPTIONS.map(opt => {
              const isCustom = opt === '직접입력'
              const active = isCustom ? ownerNicknameType === 'custom' : ownerNicknameType === opt
              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (isCustom) { setOwnerNicknameType('custom'); setOwnerNickname('') }
                    else { setOwnerNicknameType(opt); setOwnerNickname(opt) }
                  }}
                  style={{
                    padding: '9px 20px', borderRadius: 999, cursor: 'pointer',
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
              placeholder="ex. 언니, 오빠"
              value={ownerNickname}
              onChange={e => setOwnerNickname(e.target.value)}
              style={{ ...inputBase, marginTop: 10 }}
            />
          )}
        </div>

        {/* ── 추모 정원 설정 ── */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(166,133,199,0.15)' }}>
          {/* 추모정원 공개 */}
          <div
            onClick={() => setGardenPublic(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 16,
              background: '#fff', border: '1px solid rgba(166,133,199,0.18)',
              cursor: 'pointer', marginBottom: 8,
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 500, color: 'var(--lav-800)' }}>추모정원 등록</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>조용한 추모를 전할 수 있어요.</div>
            </div>
            <Toggle on={gardenPublic} />
          </div>

          {gardenPublic && (
            <div
              onClick={() => setCommentAllowed(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: 16,
                background: '#fff', border: '1px solid rgba(166,133,199,0.18)',
                cursor: 'pointer', marginBottom: 8,
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 500, color: 'var(--lav-800)' }}>한 줄 댓글 허용</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>아이에게 전할 따뜻한 한 마디를 받을 수 있어요.</div>
              </div>
              <Toggle on={commentAllowed} />
            </div>
          )}

          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--ink-300)', paddingLeft: 4 }}>
            *언제든 설정에서 변경할 수 있습니다.
          </div>
        </div>

        {/* ── 저장 버튼 ── */}
        <button
          onClick={handleSave}
          disabled={saving || !isValid}
          style={{
            marginTop: 32, width: '100%', padding: '15px', borderRadius: 18, border: 'none',
            background: (saving || !isValid)
              ? 'var(--lav-200)'
              : 'linear-gradient(135deg, var(--lav-600), var(--lav-500))',
            color: (saving || !isValid) ? 'var(--lav-400)' : '#fff',
            fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 500,
            letterSpacing: '-0.01em',
            boxShadow: (saving || !isValid) ? 'none' : '0 8px 24px rgba(86,52,140,0.28)',
            cursor: (saving || !isValid) ? 'not-allowed' : 'pointer', transition: 'all .2s',
          }}
        >
          {saving ? '저장 중...' : '저장하기'}
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

function Toggle({ on }: { on: boolean }) {
  return (
    <div style={{
      width: 46, height: 26, borderRadius: 999, flexShrink: 0,
      background: on ? 'var(--lav-500)' : 'var(--ink-100)',
      position: 'relative', transition: 'background .2s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 22 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        transition: 'left .2s',
      }} />
    </div>
  )
}
