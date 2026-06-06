'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

// ── 7주차 메타데이터 ────────────────────────────────────────────────
const WEEK_META: Record<number, { keyword: string; title: string; color: string; desc: string }> = {
  1: { keyword: '머무름',  title: '익숙한 온기 속에서',           color: '#bca4d6', desc: '아이가 남긴 온기를 느끼며, 슬픔과 함께 머무르는 시간이에요.' },
  2: { keyword: '쏟아냄',  title: '참지 않고 소리 내어 울기',      color: '#a8b9d9', desc: '억눌렸던 감정을 있는 그대로 꺼내어 써내려가는 시간이에요.' },
  3: { keyword: '마주함',  title: '미안했던 밤들의 고백',          color: '#a8c997', desc: '죄책감과 아픔을 솔직하게 마주하고 언어로 담아보는 시간이에요.' },
  4: { keyword: '기억함',  title: '너와 함께 걸었던 길',           color: '#fbb489', desc: '아이와 함께한 소중한 순간들을 하나씩 꺼내어 기억하는 시간이에요.' },
  5: { keyword: '연결됨',  title: '눈에 보이지 않아도 느껴지는 것', color: '#f4b8d4', desc: '눈에 보이지 않아도 여전히 연결되어 있는 유대감을 느끼는 시간이에요.' },
  6: { keyword: '다독임',  title: '너를 닮은 마음으로 나를 돌보기', color: '#a8c9b8', desc: '아이가 나를 사랑했던 방식으로, 이제 나 자신을 돌보는 시간이에요.' },
  7: { keyword: '간직함',  title: '내 마음속 가장 따뜻했던 방에',  color: '#8b6bb8', desc: '아이와의 사랑을 영원히 간직하며, 49일의 여정을 마무리하는 시간이에요.' },
}

interface QuestionItem {
  id: string
  day: number
  content: string
  category: string | null
  isRest: boolean
  done: boolean
  letterId: string | null
}

interface GuideData {
  week: number
  keyword: string
  title: string
  subtitle: string
  guide: string
}

interface StageData {
  questions: QuestionItem[]
  guide: GuideData | null
  photoCard: { imageUrl: string; stage: number } | null
  petName: string
}

export default function StageDetailPage() {
  const router = useRouter()
  const { week: weekParam } = useParams<{ week: string }>()
  const week = parseInt(weekParam)
  const meta = WEEK_META[week] ?? WEEK_META[1]

  const [data, setData] = useState<StageData | null>(null)
  const [slide, setSlide] = useState(0)
  const touchStartX = useRef(0)

  useEffect(() => {
    fetch(`/api/journey/stage?week=${week}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
  }, [week])

  const doneCount = data?.questions.filter(q => q.done).length ?? 0
  const totalCount = data?.questions.length ?? 7
  const todayQuestion = data?.questions.find(q => !q.done && !q.isRest)
  const hasPhotoCard = !!data?.photoCard
  const canShare = typeof navigator !== 'undefined' && !!navigator.canShare

  async function handleShare() {
    const imageUrl = data?.photoCard?.imageUrl
    const petName  = data?.petName ?? ''
    if (!imageUrl) return
    try {
      const blob = await fetch(imageUrl).then(r => r.blob())
      const file = new File([blob], `photo-card-week-${week}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `${petName}의 ${week}주차 포토카드`, files: [file] })
        return
      }
    } catch { /* fallback */ }
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `photo-card-week-${week}.png`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  return (
    <div style={{ minHeight: '100dvh', position: 'relative', overflow: 'hidden' }}>
      {/* 배경 그라데이션 */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'linear-gradient(160deg, #faddca 0%, #ece4f3 60%, #d2bee0 100%)',
      }}/>
      <div style={{
        position: 'fixed', top: -40, left: -60, width: 240, height: 240, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(250,221,202,0.7), transparent 70%)', filter: 'blur(20px)',
      }}/>
      <div style={{
        position: 'fixed', bottom: -80, right: -80, width: 280, height: 280, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(166,133,199,0.4), transparent 70%)', filter: 'blur(30px)',
      }}/>

      {/* 콘텐츠 */}
      <div style={{ position: 'relative', zIndex: 1, paddingBottom: 80 }}>

        {/* ── 상단 헤더 ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 10px',
        }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px 4px 0', color: 'var(--lav-700)', display: 'flex', alignItems: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--lav-800)' }}>
            {week}주차 · {meta.keyword}
          </div>
          <div style={{ width: 28 }}/>
        </div>

        {/* ── 캐러셀 ── */}
        <div style={{ padding: '0 16px', marginBottom: 0 }}>
          <div
            style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', userSelect: 'none' }}
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
            onTouchEnd={e => {
              const dx = e.changedTouches[0].clientX - touchStartX.current
              if (dx < -40 && hasPhotoCard) setSlide(1)
              else if (dx > 40) setSlide(0)
            }}
          >
            {/* 슬라이드 트랙 */}
            <div style={{
              display: 'flex',
              transform: `translateX(-${slide * 100}%)`,
              transition: 'transform 0.3s ease',
            }}>
              {/* 슬라이드 0: 주차 이미지 */}
              <div style={{ minWidth: '100%', aspectRatio: '1/1' }}>
                <img
                  src={`/images/weeks/${week}w_v1.png`}
                  alt={`${week}주차`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                />
              </div>

              {/* 슬라이드 1: 포토카드 (hasPhotoCard일 때만) */}
              {hasPhotoCard && (
                <div style={{ minWidth: '100%', position: 'relative', aspectRatio: '16/9', background: '#1a0f2e' }}>
                  <img
                    src={data!.photoCard!.imageUrl}
                    alt={`${week}주차 포토카드`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  {/* 공유 버튼 */}
                  <div style={{
                    position: 'absolute', bottom: 12, right: 12,
                  }}>
                    <button
                      onClick={handleShare}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 999,
                        background: 'rgba(255,255,255,0.92)', border: 'none',
                        fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                        color: '#5a3a8a', cursor: 'pointer',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                      }}
                    >
                      🐾 저장/공유
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 카드 저장/공유 버튼 (슬라이드 0 = 여정카드일 때) */}
          {slide === 0 && (
            <button
              onClick={async () => {
                const imageUrl = `/images/weeks/${week}w_v1.png`
                const title = `${week}주차 · ${meta.keyword}`
                try {
                  const blob = await fetch(imageUrl).then(r => r.blob())
                  const file = new File([blob], `week-${week}-card.png`, { type: 'image/png' })
                  if (navigator.canShare?.({ files: [file] })) {
                    await navigator.share({ title, files: [file] })
                    return
                  }
                } catch { /* fallback */ }
                const a = document.createElement('a')
                a.href = imageUrl; a.download = `week-${week}-card.png`
                document.body.appendChild(a); a.click(); document.body.removeChild(a)
              }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', marginTop: 12, marginBottom: 24, padding: '11px 0', borderRadius: 999,
                background: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(166,133,199,0.2)',
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                color: 'var(--lav-700)', cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
            >
              {canShare ? '🌿 카드 공유하기' : '🌿 카드 저장하기'}
            </button>
          )}

          {/* 도트 인디케이터 (포토카드 있을 때만) */}
          {hasPhotoCard && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
              {[0, 1].map(i => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  style={{
                    width: slide === i ? 18 : 6, height: 6, borderRadius: 999, border: 'none', padding: 0,
                    background: slide === i ? meta.color : 'rgba(166,133,199,0.3)',
                    transition: 'all 0.2s ease', cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── 주차 소개 ── */}
        <div style={{ padding: '24px 22px' }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 12.5,
            color: '#7a6a90', lineHeight: 1.7, letterSpacing: '-0.01em',
          }}>
            {data?.guide?.guide ?? meta.desc}
          </div>

          {/* 진행률 */}
          <div style={{ marginTop: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.5)', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.round((doneCount / totalCount) * 100)}%`,
                height: '100%', borderRadius: 999,
                background: meta.color, transition: 'width .6s ease',
              }}/>
            </div>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#9a8ab0', whiteSpace: 'nowrap' }}>
              {doneCount} / {totalCount}일
            </span>
          </div>
        </div>

        {/* ── 질문 리스트 ── */}
        <div style={{ padding: '0 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, marginTop: 24 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 500, color: 'var(--lav-800)' }}>
              이번 주의 질문
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: '#9a8ab0' }}>
              아카이브 영구 보존
            </div>
          </div>

          {data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.questions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => router.push(`/write/letter?questionId=${q.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '14px 16px', borderRadius: 14,
                    background: q.done ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.4)',
                    border: '0.5px solid rgba(166,133,199,0.16)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 999, flexShrink: 0,
                        background: q.isRest
                          ? 'rgba(166,133,199,0.12)'
                          : q.done ? '#c47a3a' : 'transparent',
                        border: q.isRest
                          ? 'none'
                          : q.done ? 'none' : '1.5px solid rgba(139,107,184,0.5)',
                        fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600,
                        color: q.isRest ? '#9a8ab0' : q.done ? '#fff' : 'var(--lav-600)',
                        letterSpacing: '0.06em',
                      }}>
                        {q.isRest ? '쉼표' : `DAY ${q.day}`}
                      </span>
                      {q.category && (
                        <span style={{
                          padding: '2px 8px', borderRadius: 999, flexShrink: 0,
                          background: 'rgba(139,107,184,0.1)',
                          fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600,
                          color: '#8b6bb8', letterSpacing: '0.04em',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          maxWidth: 160,
                        }}>
                          {q.category}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-sans)', fontSize: 14,
                      color: '#4a3d6b', lineHeight: 1.4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {q.content}
                    </div>
                  </div>
                  {!q.done && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M9 5l7 7-7 7" stroke={q.isRest ? '#9a8ab0' : 'var(--lav-500)'} strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{
                  height: 52, borderRadius: 14,
                  background: 'rgba(255,255,255,0.4)', animation: 'pulse 1.5s infinite',
                }}/>
              ))}
            </div>
          )}
        </div>

        {/* ── 오늘 편지쓰기 CTA ── */}
        <div style={{ padding: '24px 22px 0' }}>
          <button
            onClick={() => {
              if (todayQuestion) router.push(`/write/letter?questionId=${todayQuestion.id}`)
              else router.push('/write/letter')
            }}
            style={{
              width: '100%', padding: '15px', borderRadius: 999, border: 'none',
              background: 'linear-gradient(135deg, #bca4d6, var(--lav-600))',
              color: '#fff',
              fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 600,
              boxShadow: '0 6px 18px rgba(188,164,214,0.35)',
              cursor: 'pointer',
            }}
          >
            {todayQuestion ? '오늘 질문으로 편지쓰기' : '자유롭게 편지쓰기'}
          </button>
        </div>

      </div>
    </div>
  )
}
