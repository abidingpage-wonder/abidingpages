'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StepBasicInfo from './_components/StepBasicInfo'
import StepPersonality from './_components/StepPersonality'
import StepFarewellGarden from './_components/StepFarewellGarden'

// ─── 온보딩 공유 데이터 타입 ───────────────────────────────────────
export interface OnboardingData {
  // Step 1 — 기본 정보
  petPhotoFile: File | null
  petPhotoUrl: string
  petName: string
  species: string
  speciesCustom: string
  breed: string
  bornDate: string
  passedDate: string

  // Step 2 — 성격/좋아했던 것
  personalityTags: string[]
  favoriteTags: string[]
  favoriteCustomMode: boolean
  favoriteCustom: string
  firstWord: string

  // Step 3 — 이별/호칭 + 정원
  farewellType: string
  ownerNicknameType: string
  ownerNickname: string
  gardenPublic: boolean
  commentAllowed: boolean
}

const INITIAL_DATA: OnboardingData = {
  petPhotoFile: null,
  petPhotoUrl: '',
  petName: '',
  species: '',
  speciesCustom: '',
  breed: '',
  bornDate: '',
  passedDate: '',
  personalityTags: [],
  favoriteTags: [],
  favoriteCustomMode: false,
  favoriteCustom: '',
  firstWord: '',
  farewellType: '',
  ownerNicknameType: '',
  ownerNickname: '',
  gardenPublic: true,
  commentAllowed: true,
}

// 총 3 스텝
const TOTAL_STEPS = 3

const STEP_TITLES = [
  '아이의 정보',
  '아이의 모습',
  '이별 이야기',
]

// ─── 상단 진행률 바 ───────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '0 24px 16px', justifyContent: 'center' }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const idx = i + 1
        const isActive = idx === step
        const isDone = idx < step
        return (
          <div
            key={idx}
            style={{
              height: 5,
              borderRadius: 999,
              flex: isActive ? 2 : 1,
              background: isDone
                ? 'var(--lav-400)'
                : isActive
                ? 'var(--lav-600)'
                : 'var(--lav-200)',
              transition: 'all .35s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── 상단 헤더 ────────────────────────────────────────────────────
function TopBar({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '56px 20px 12px',
      position: 'relative',
    }}>
      <button
        onClick={onBack}
        style={{
          width: 36,
          height: 36,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          color: 'var(--lav-700)',
        }}
        aria-label="뒤로가기"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--lav-800)',
        letterSpacing: '-0.01em',
      }}>
        {STEP_TITLES[step - 1]}
      </div>

      <div style={{ marginLeft: 'auto' }}>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          color: 'var(--lav-500)',
          fontWeight: 500,
        }}>
          {step} / {TOTAL_STEPS}
        </span>
      </div>
    </div>
  )
}

// ─── 메인 온보딩 페이지 ──────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }))
  }

  const handleBack = () => {
    if (step === 1) {
      router.back()
    } else {
      setStep((s) => s - 1)
    }
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1)
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      // 1. 사진 업로드 (있는 경우)
      let photoUrl: string | null = null
      if (data.petPhotoFile) {
        const formData = new FormData()
        formData.append('file', data.petPhotoFile)
        const uploadRes = await fetch('/api/upload/pet-photo', {
          method: 'POST',
          body: formData,
        })
        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          photoUrl = url
        }
      }

      // 2. pet + journey_progress 저장
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petName: data.petName,
          species: data.species === 'other' ? data.speciesCustom : data.species,
          breed: data.breed || null,
          bornDate: data.bornDate,
          passedDate: data.passedDate,
          photoUrl,
          personalityTags: data.personalityTags,
          favoriteTags: [
            ...data.favoriteTags,
            ...(data.favoriteCustomMode && data.favoriteCustom.trim()
              ? [data.favoriteCustom.trim()]
              : []),
          ],
          firstWord: data.firstWord || null,
          farewellType: data.farewellType,
          ownerNickname: data.ownerNickname,
          gardenPublic: data.gardenPublic,
          commentAllowed: data.commentAllowed,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '저장 실패')
      }

      router.push('/home')
    } catch (err) {
      console.error('온보딩 저장 실패:', err)
      alert('저장 중 오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--lav-50)',
    }}>
      <TopBar step={step} onBack={handleBack} />
      <ProgressBar step={step} />

      {step === 1 && (
        <StepBasicInfo data={data} onChange={handleChange} onNext={handleNext} />
      )}
      {step === 2 && (
        <StepPersonality data={data} onChange={handleChange} onNext={handleNext} />
      )}
      {step === 3 && (
        <StepFarewellGarden
          data={data}
          onChange={handleChange}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
