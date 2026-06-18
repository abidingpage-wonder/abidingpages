'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Spinner from '@/components/ui/Spinner'
import { josa } from '@/lib/korean'

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}
function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// 사진마다 고정 기울기
function getRotate(i: number) {
  const rotations = [-2.2, 1.8, -1.5, 2.0, -1.8, 1.2]
  return rotations[i % rotations.length]
}

interface LetterData {
  id: string
  content: string
  imageUrls: string[]
  sentAt: string
  week: number
  weekKeyword: string | null
  category: string | null
  questionContent: string | null
  petName: string
  ownerNickname: string
}

// ── 쉼표(rest) 도장 오버레이 — CSS만, 편지지 중앙 ──────────────────
function RestStamp() {
  return (
    <div style={{
      position: 'absolute', top: '34%', left: '50%',
      transform: 'translate(-50%, -50%) rotate(-7deg)',
      zIndex: 6, pointerEvents: 'none', userSelect: 'none',
      width: 132, height: 132, borderRadius: '50%',
      border: '2.5px solid rgba(139,107,184,0.42)',
      background: 'rgba(166,133,199,0.14)',
      boxShadow: 'inset 0 0 0 6px rgba(166,133,199,0.10)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{
        fontFamily: 'var(--font-serif)', fontSize: 21, fontWeight: 700,
        color: 'rgba(107,74,160,0.62)', letterSpacing: '0.08em', whiteSpace: 'nowrap',
      }}>
        쉼표 하루
      </span>
    </div>
  )
}

// ── 폴라로이드 사진 컴포넌트 ──────────────────────────────────────
function PolaroidPhoto({ url, rotate }: { url: string; rotate: number }) {
  return (
    <div style={{
      background: '#f8f4f0',
      padding: '6px 6px 22px',
      borderRadius: 4,
      boxShadow: '0 3px 14px rgba(86,52,140,0.18)',
      transform: `rotate(${rotate}deg)`,
      position: 'relative',
    }}>
      <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <img src={url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      {/* 하단 흰 여백 라벤더 하트 */}
      <div style={{
        position: 'absolute', bottom: 4, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
      }}>
        <svg width="12" height="11" viewBox="0 0 24 22" fill="none">
          <path d="M12 20s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.5-8 11-8 11z" fill="#c4a8e0"/>
        </svg>
      </div>
    </div>
  )
}

// ── 사진 레이아웃 (1/2/3장 분기) ─────────────────────────────────
function PhotoLayout({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null
  if (urls.length === 1) {
    return (
      <div style={{ width: '52%', marginTop: '8%' }}>
        <PolaroidPhoto url={urls[0]} rotate={getRotate(0)} />
      </div>
    )
  }
  if (urls.length === 2) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', marginTop: '4%' }}>
        {urls.map((url, i) => <PolaroidPhoto key={i} url={url} rotate={getRotate(i)} />)}
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, width: '100%', marginTop: '2%' }}>
      {urls.slice(0, 3).map((url, i) => (
        <PolaroidPhoto key={i} url={url} rotate={getRotate(i)} />
      ))}
    </div>
  )
}

export default function LetterPage() {
  const router = useRouter()
  const { letterId } = useParams<{ letterId: string }>()

  const [letter, setLetter] = useState<LetterData | null>(null)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    fetch(`/api/letters/${letterId}`)
      .then(r => r.json())
      .then(d => { setLetter(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [letterId])

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: `#f3eef6`,
      }}>
        <Spinner size={32} label="편지를 불러오는 중..." />
      </div>
    )
  }

  if (!letter) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: `#f3eef6`,
        fontFamily: 'var(--font-sans)', fontSize: 13, color: '#8b6bb8',
      }}>
        <div>편지를 찾을 수 없어요.</div>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b6bb8', fontSize: 13 }}>
          돌아가기
        </button>
      </div>
    )
  }

  // 쉼표 편지 = 내용이 빈 편지 (쉼표 버튼으로 생성). 내용을 쓴 편지는 일반 편지 → 도장 없음
  const isRest = !letter.content?.trim()

  return (
    <div style={{ minHeight: '100dvh', background: `#f3eef6`, paddingBottom: 32, position: 'relative' }}>

      {/* ── 상단 바 ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center',
        padding: '14px 16px 10px',
        background: `#f3eef6`,
        borderBottom: '1px solid rgba(139,107,184,0.1)',
      }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px 4px 0', color: '#8b6bb8', display: 'flex', alignItems: 'center' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: '#3d2b5e', letterSpacing: '-0.01em' }}>
            {josa(letter.ownerNickname, '이가')} {letter.petName}에게
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#a890c8', marginTop: 2 }}>
            {formatDate(letter.sentAt)} · {formatTime(letter.sentAt)}
          </div>
        </div>
        <div style={{
          padding: '5px 12px', borderRadius: 999,
          background: 'rgba(139,107,184,0.75)',
          fontFamily: 'var(--font-sans)', fontSize: 11,
          color: '#fff', fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          내가 보낸 편지
        </div>
      </div>

      {/* ── 편지지 이미지 ── */}
      {letter.imageUrls.length > 0 ? (
        /* 사진 있을 때: 두 파일 따로 (모두 RGBA 투명 배경) */
        <div style={{ padding: '0 16px' }}>
          {/* 1. 사진 프레임 — letter-lav-photo-bg 2.webp (889×529, 56.6% ratio → 195.27px) */}
          <div style={{ position: 'relative', width: '100%', paddingBottom: '59.5%', marginBottom: 16, filter: 'drop-shadow(0 4px 12px rgba(86,52,140,0.15))' }}>
            <Image src="/letter-lav-photo-bg 2.webp" alt="사진 프레임" fill
              style={{ objectFit: 'fill', zIndex: 0 }} priority />
            {/* 폴라로이드 — 프레임 내부 */}
            <div style={{
              position: 'absolute',
              top: letter.imageUrls.length === 3 ? '5%' : '10%',
              left: letter.imageUrls.length === 3 ? '3%' : '10%',
              right: letter.imageUrls.length === 3 ? '3%' : '10%',
              bottom: letter.imageUrls.length === 3 ? '5%' : '10%',
              zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PhotoLayout urls={letter.imageUrls} />
            </div>
          </div>

          {/* 2. 편지지+봉투 — letter-lav-photo-bg 3.webp (890×850, 95.5% ratio) */}
          <div style={{ position: 'relative', width: '100%', paddingBottom: '95.5%', filter: 'drop-shadow(0 4px 12px rgba(86,52,140,0.15))' }}>
            <Image src="/letter-lav-photo-bg 3.webp" alt="편지 봉투" fill
              style={{ objectFit: 'fill', zIndex: 0 }} />
            {/* 텍스트 — 편지지 흰 영역 (~8%~60%) */}
            <div className="letter-text-scroll" style={{
              position: 'absolute', top: '8%', left: '10%', right: '10%', height: '50%',
              overflowY: 'auto', zIndex: 1,
              backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 27.5px, rgba(139,107,184,0.1) 27.5px, rgba(139,107,184,0.1) 28.5px)',
              scrollbarWidth: 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-handwriting)', fontSize: 17, lineHeight: '2.0', color: '#3d2b5e', whiteSpace: 'pre-wrap', wordBreak: 'keep-all', letterSpacing: '0.02em' }}>
                {letter.content}
              </div>
            </div>
            {/* 쉼표 도장 */}
            {isRest && <RestStamp />}
            {/* Abiding 로고 */}
            <div style={{ position: 'absolute', bottom: '4%', left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none', userSelect: 'none' }}>
              <span style={{ fontFamily: 'var(--font-brand)', fontSize: 20, color: '#8b6bb8', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Abiding</span>
            </div>
          </div>
        </div>
      ) : (
        /* 사진 없을 때: 봉투만 — letter-lav-photo-bg 3.webp (RGBA 투명) */
        <div style={{ padding: '16px 16px 0' }}>
        <div style={{ position: 'relative', width: '100%', paddingBottom: '95.5%', filter: 'drop-shadow(0 4px 12px rgba(86,52,140,0.15))' }}>
          <Image src="/letter-lav-photo-bg 3.webp" alt="편지 봉투" fill
            style={{ objectFit: 'fill', zIndex: 0 }} priority />
          <div className="letter-text-scroll" style={{
            position: 'absolute', top: '8%', left: '10%', right: '10%', height: '50%',
            overflowY: 'auto', zIndex: 1, scrollbarWidth: 'none',
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 27.5px, rgba(139,107,184,0.1) 27.5px, rgba(139,107,184,0.1) 28.5px)',
          }}>
            <div style={{ fontFamily: 'var(--font-handwriting)', fontSize: 17, lineHeight: '2.0', color: '#3d2b5e', whiteSpace: 'pre-wrap', wordBreak: 'keep-all', letterSpacing: '0.02em' }}>
              {letter.content}
            </div>
          </div>
          {/* 쉼표 도장 */}
          {isRest && <RestStamp />}
          <div style={{ position: 'absolute', bottom: '4%', left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none', userSelect: 'none' }}>
            <span style={{ fontFamily: 'var(--font-brand)', fontSize: 20, color: '#8b6bb8', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Abiding</span>
          </div>
        </div>
        </div>
      )}

      {/* ── 질문 컨텍스트 + 닫기 버튼 ── */}
      <div style={{ padding: '16px 16px 0' }}>

        {/* 질문 컨텍스트 */}
        <div style={{
          background: 'rgba(255,255,255,0.6)',
          borderRadius: 12,
          padding: '12px 16px',
          border: '1px solid rgba(180,150,220,0.2)',
          marginBottom: 14,
        }}>
          {/* 주차 + 카테고리 뱃지 */}
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
            color: '#8b6bb8', marginBottom: 6,
          }}>
            {letter.week}주차{letter.weekKeyword ? ` · ${letter.weekKeyword}` : ''}{letter.category ? ` │ ${letter.category}` : ''}
          </div>
          {/* 질문 내용 */}
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 13,
            color: '#6b5e85', lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {letter.questionContent ?? '✏️ 자유롭게 쓴 편지'}
          </div>
        </div>

        {/* 구분선 */}
        <div style={{ height: 1, background: 'rgba(139,107,184,0.1)', margin: '0 0 14px' }} />

        {/* 닫기 버튼 */}
        <button
          onClick={() => router.back()}
          style={{
            width: '100%',
            padding: '13px 0', borderRadius: 999,
            background: 'transparent',
            border: '1px solid rgba(139,107,184,0.3)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
            color: '#8b6bb8',
          }}
        >
          닫기
        </button>
      </div>
    </div>
  )
}
