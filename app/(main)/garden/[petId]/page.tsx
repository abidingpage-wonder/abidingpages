'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import Spinner from '@/components/ui/Spinner'
import { petJosa } from '@/lib/korean'

// ── 타입 ──────────────────────────────────────────────────────────
interface PetDetail {
  id: string; name: string; species: string; breed: string | null
  bornAt: string; diedAt: string | null; profileImageUrl: string | null
  ownerNickname: string | null; firstWord: string | null; togetherDays: number
  commentAllowed: boolean
}
interface PageData {
  pet: PetDetail
  stickers: { candle: number; flower: number; heart: number }
  stickerSenders: number
  myStickers: string[]
  comments: Comment[]
  daysSince: number
}
interface Comment {
  id: string; content: string; createdAt: string; authorLabel: string; isOwner?: boolean
}

// ── 유틸 ──────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${y}.${m}.${d}`
}
function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}시간 전`
  return `${Math.floor(hrs / 24)}일 전`
}

// ── 메인 페이지 ──────────────────────────────────────────────────
export default function GardenDetailPage({ params }: { params: Promise<{ petId: string }> }) {
  const router = useRouter()
  const [petId, setPetId] = useState<string | null>(null)
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState('')
  const [posting, setPosting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    params.then(p => setPetId(p.petId))
  }, [params])

  useEffect(() => {
    if (!petId) return
    fetch(`/api/garden/${petId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [petId])

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!menuOpenId) return
    const close = () => setMenuOpenId(null)
    document.addEventListener('click', close, { once: true })
    return () => document.removeEventListener('click', close)
  }, [menuOpenId])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleSticker(type: 'candle' | 'flower' | 'heart') {
    if (!petId || !data) return
    // 낙관적 업데이트 (stickerSenders는 첫 스티커일 때만 +1)
    setData(prev => prev && !prev.myStickers.includes(type) ? {
      ...prev,
      stickers: { ...prev.stickers, [type]: prev.stickers[type] + 1 },
      stickerSenders: prev.myStickers.length === 0 ? prev.stickerSenders + 1 : prev.stickerSenders,
      myStickers: [...prev.myStickers, type],
    } : prev)
    try {
      const res = await fetch('/api/garden/sticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId, stickerType: type }),
      })
      const d = await res.json()
      if (res.ok && d.stickers) {
        // 해당 type만 서버 값으로 교정 (다른 스티커 카운트 덮어쓰기 방지)
        setData(prev => prev ? {
          ...prev,
          stickers: { ...prev.stickers, [type]: d.stickers[type] },
        } : prev)
      }
    } catch {}
  }

  async function handleDeleteComment(commentId: string) {
    if (!petId) return
    setData(prev => prev ? { ...prev, comments: prev.comments.filter(c => c.id !== commentId) } : prev)
    setMenuOpenId(null)
    try {
      await fetch(`/api/garden/${petId}/comment/${commentId}`, { method: 'DELETE' })
    } catch {}
  }

  async function handleEditComment(commentId: string) {
    if (!petId || !editText.trim()) return
    const trimmed = editText.trim()
    setData(prev => prev ? {
      ...prev,
      comments: prev.comments.map(c => c.id === commentId ? { ...c, content: trimmed } : c),
    } : prev)
    setEditingId(null)
    setMenuOpenId(null)
    try {
      await fetch(`/api/garden/${petId}/comment/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })
    } catch {}
  }

  async function handleComment() {
    if (!petId || !inputText.trim() || posting) return
    setPosting(true)
    try {
      const res = await fetch(`/api/garden/${petId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputText.trim() }),
      })
      const d = await res.json()
      if (!res.ok) {
        showToast(d.error === 'comments_disabled' ? '댓글이 비공개 상태입니다' : '잠시 후 다시 시도해주세요')
        setPosting(false)
        return
      }
      setInputText('')
      setData(prev => prev ? { ...prev, comments: [d, ...prev.comments] } : prev)
    } catch {
      showToast('잠시 후 다시 시도해주세요')
    }
    setPosting(false)
  }

  const commentCount = data?.comments.length ?? 0
  const { visible: visibleComments, loading: commentsLoading, hasMore: commentsHasMore, sentinelRef: commentsSentinel } = useInfiniteScroll(commentCount, 15, 10)

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#cfc3d9',
      }}>
        <Spinner size={32} label="불러오는 중..." />
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12, background: '#cfc3d9',
      }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-300)' }}>
          추모관을 찾을 수 없어요
        </div>
        <button onClick={() => router.back()} style={{
          fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--lav-600)',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>돌아가기</button>
      </div>
    )
  }

  const { pet, stickers, stickerSenders, myStickers, comments, daysSince } = data

  return (
    <div style={{ minHeight: '100%', background: '#cfc3d9', fontFamily: 'var(--font-sans)' }}>

      {/* ── HERO (garden 메인과 동일 구조) ── */}
      <div style={{ position: 'relative', height: 440, overflow: 'hidden', marginTop: -72 }}>
        {/* 배경 이미지 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/garden-night.png" alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'top center',
        }}/>
        {/* 어두운 오버레이 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.05) 40%, rgba(28,15,46,0.65) 100%)',
        }}/>

        {/* 뒤로가기 버튼 (TopBar 높이 아래에 위치) */}
        <button
          onClick={() => router.back()}
          style={{
            position: 'absolute', top: 80, left: 16, zIndex: 5,
            width: 34, height: 34, borderRadius: '50%', border: 'none',
            background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="rgba(243,232,222,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* 추모관 카드 (배경 없음, 중앙 정렬, 야간 배경 위) */}
        <div style={{
          position: 'absolute', left: 16, right: 16,
          top: '50%', transform: 'translateY(-54%)',
          zIndex: 3,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 0, textAlign: 'center',
        }}>
          {/* 원형 프로필 */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', padding: 2,
              boxShadow: '0 4px 20px rgba(28,15,46,0.4), 0 0 0 1.5px rgba(255,255,255,0.25)',
              overflow: 'hidden',
            }}>
              {pet.profileImageUrl ? (
                <Image
                  src={pet.profileImageUrl} alt={pet.name}
                  width={76} height={76}
                  style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  background: 'linear-gradient(145deg, rgba(200,180,230,0.6), rgba(160,130,200,0.5))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32,
                }}>
                  {pet.species === 'dog' ? '🐶' : pet.species === 'cat' ? '🐱' : '🐾'}
                </div>
              )}
            </div>
          </div>

          {/* 이름 */}
          <div style={{
            fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700,
            color: '#fff', lineHeight: 1, letterSpacing: '-0.02em',
            textShadow: '0 0 20px rgba(143,68,208,0.6), 0 2px 8px rgba(0,0,0,0.4)',
          }}>{pet.name}</div>

          {/* 생몰일 */}
          <div style={{
            marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 12,
            fontWeight: 500, color: 'rgba(220,205,240,0.9)', letterSpacing: '0.04em',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}>
            {fmtDate(pet.bornAt)}{pet.diedAt ? ` — ${fmtDate(pet.diedAt)}` : ''}
          </div>

          {/* 기억 일수 */}
          <div style={{
            marginTop: 4, fontFamily: 'var(--font-sans)', fontSize: 11.5,
            color: 'rgba(200,180,230,0.85)', letterSpacing: '-0.01em',
            textShadow: '0 1px 4px rgba(0,0,0,0.35)',
          }}>
            {daysSince}일째 {petJosa(pet.name, '을를')} 기억하는 중
          </div>

          {/* 한마디 */}
          {pet.firstWord && (
            <div style={{
              marginTop: 10, fontFamily: 'var(--font-handwriting)', fontSize: 15.5,
              lineHeight: 1.5, color: 'rgba(255,220,190,0.95)', letterSpacing: '-0.01em',
              textShadow: '0 0 12px rgba(254,190,152,0.5), 0 1px 4px rgba(0,0,0,0.3)',
            }}>
              <span style={{ opacity: 0.7 }}>"</span>{pet.firstWord}
            </div>
          )}

          {/* 구분선 */}
          <div style={{ width: '60%', height: 0.5, background: 'rgba(255,255,255,0.2)', margin: '14px 0 12px' }}/>

          {/* 스티커 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {(['candle', 'flower', 'heart'] as const).map(kind => {
              const count = stickers[kind]
              const sent = myStickers.includes(kind)
              const isEmpty = count === 0
              const icon = kind === 'candle' ? '/icons/candle.webp' : kind === 'flower' ? '/icons/flower.webp' : '/icons/heart-cream.webp'
              return (
                <button
                  key={kind}
                  onClick={() => handleSticker(kind)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: isEmpty ? 2 : 4,
                    padding: isEmpty ? '5px 9px 5px 7px' : '5px 10px 5px 7px', borderRadius: 20,
                    background: sent ? 'rgba(166,133,199,0.35)' : isEmpty ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.18)',
                    border: sent ? '0.5px solid rgba(200,170,240,0.6)' : isEmpty ? '0.5px dashed rgba(255,255,255,0.3)' : '0.5px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer', opacity: isEmpty ? 0.75 : 1,
                    backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon} alt="" width={20} height={20} style={{ objectFit: 'contain', opacity: isEmpty ? 0.65 : 1 }}/>
                  {isEmpty ? (
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, color: 'rgba(220,200,240,0.9)' }}>+</span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600, color: '#fff' }}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>
          {/* 마음 총합 — 스티커 아래 별도 줄 */}
          <div style={{
            marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 11.5,
            color: 'rgba(200,180,230,0.85)',
          }}>· {stickers.candle + stickers.flower + stickers.heart}개의 마음이 전해졌어요</div>
        </div>
      </div>

      {/* ── 댓글 패널 (garden 메인의 카드패널과 동일 구조) ── */}
      <div style={{
        marginTop: -18, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        background: '#cfc3d9', padding: '20px 16px 18px',
        position: 'relative', zIndex: 2, minHeight: 'calc(100dvh - 422px)',
      }}>
        {/* 섹션 타이틀 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  stroke="var(--lav-600)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{
            fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600,
            color: 'var(--lav-800)', letterSpacing: '-0.01em',
          }}>마음 한 줄</div>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 11,
            color: 'var(--lav-500)', background: 'rgba(166,133,199,0.18)',
            padding: '2px 8px', borderRadius: 10,
          }}>{comments.length}</div>
        </div>

        {/* 댓글 목록 */}
        {comments.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 0',
            fontFamily: 'var(--font-sans)', fontSize: 13, color: '#b0a0c0', lineHeight: 1.7,
          }}>
            아직 응원 댓글이 없어요<br/>
            <span style={{ fontSize: 12, color: '#c4b4d4' }}>첫 번째로 마음을 전해보세요 ✦</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comments.slice(0, visibleComments).map(c => (
              <div key={c.id} style={{
                padding: '12px 14px', borderRadius: 14,
                background: 'rgba(255,255,255,0.45)',
                border: '0.5px solid rgba(166,133,199,0.2)',
                boxShadow: '0 1px 8px rgba(86,52,140,0.07)',
                position: 'relative',
              }}>
                {/* 헤더 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{
                    fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                    color: 'var(--lav-700)', letterSpacing: '-0.01em',
                  }}>{c.authorLabel}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: '#b0a0c0' }}>
                      {fmtRelative(c.createdAt)}
                    </div>
                    {/* 본인 댓글에만 ··· 메뉴 */}
                    {c.isOwner && (
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === c.id ? null : c.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '2px 4px', color: '#b0a0c0', fontSize: 14, lineHeight: 1,
                          }}
                        >···</button>
                        {menuOpenId === c.id && (
                          <div style={{
                            position: 'absolute', right: 0, top: '100%', zIndex: 10,
                            background: '#fff', borderRadius: 10,
                            boxShadow: '0 4px 16px rgba(86,52,140,0.15)',
                            border: '0.5px solid rgba(166,133,199,0.2)',
                            overflow: 'hidden', minWidth: 80,
                          }}>
                            <button
                              onClick={() => { setEditingId(c.id); setEditText(c.content); setMenuOpenId(null) }}
                              style={{
                                display: 'block', width: '100%', padding: '9px 14px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--lav-700)',
                                textAlign: 'left',
                              }}
                            >수정</button>
                            <div style={{ height: 0.5, background: 'rgba(166,133,199,0.15)' }}/>
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              style={{
                                display: 'block', width: '100%', padding: '9px 14px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontFamily: 'var(--font-sans)', fontSize: 12.5, color: '#d07070',
                                textAlign: 'left',
                              }}
                            >삭제</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 내용 or 수정 인풋 */}
                {editingId === c.id ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                    <input
                      autoFocus
                      value={editText}
                      onChange={e => setEditText(e.target.value.slice(0, 50))}
                      onKeyDown={e => { if (e.key === 'Enter') handleEditComment(c.id); if (e.key === 'Escape') setEditingId(null) }}
                      style={{
                        flex: 1, height: 34, borderRadius: 10, border: '1px solid rgba(143,68,208,0.3)',
                        padding: '0 10px', fontSize: 12.5, fontFamily: 'var(--font-sans)',
                        outline: 'none', background: 'rgba(255,255,255,0.8)', color: 'var(--ink-700)',
                      }}
                    />
                    <button
                      onClick={() => handleEditComment(c.id)}
                      style={{
                        padding: '6px 12px', borderRadius: 10, border: 'none',
                        background: 'var(--lav-600)', color: '#fff',
                        fontFamily: 'var(--font-sans)', fontSize: 11.5, cursor: 'pointer',
                      }}
                    >완료</button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{
                        padding: '6px 10px', borderRadius: 10, border: 'none',
                        background: 'rgba(166,133,199,0.15)', color: 'var(--lav-600)',
                        fontFamily: 'var(--font-sans)', fontSize: 11.5, cursor: 'pointer',
                      }}
                    >취소</button>
                  </div>
                ) : (
                  <div style={{
                    fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-700)',
                    lineHeight: 1.6, letterSpacing: '-0.01em',
                  }}>{c.content}</div>
                )}
              </div>
            ))}
            <div ref={commentsSentinel} style={{ height: 1 }} />
            {commentsLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: '2px solid rgba(166,133,199,0.2)',
                  borderTopColor: 'var(--lav-500)',
                  animation: 'spin 0.7s linear infinite',
                }}/>
              </div>
            )}
            {!commentsHasMore && comments.length > 0 && (
              <div style={{
                textAlign: 'center', padding: '12px 0 4px',
                fontFamily: 'var(--font-sans)', fontSize: 12, color: '#b0a0c0',
              }}>모든 마음을 다 불러왔어요 ✦</div>
            )}
          </div>
        )}
      </div>

      <div style={{ height: 170 }} />

      {/* ── 하단 고정 입력 (garden 메인과 동일 위치 bottom:86) ── */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 86,
        padding: '10px 12px 8px', zIndex: 5,
        background: 'transparent',
      }}>
        {pet.commentAllowed ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value.slice(0, 50))}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                placeholder={`${pet.name}에게 마음 한 줄을 남겨보세요`}
                maxLength={50}
                style={{
                  width: '100%', height: 40, borderRadius: 20, boxSizing: 'border-box',
                  background: '#fff', border: '0.8px solid rgba(143,68,208,0.2)',
                  padding: '0 50px 0 16px', fontSize: 12, color: '#3a2a4d',
                  boxShadow: '0 2px 8px rgba(86,52,140,0.06)', outline: 'none',
                  fontFamily: 'var(--font-sans)',
                }}
              />
              {inputText.length > 0 && (
                <span style={{
                  position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 10, color: inputText.length >= 50 ? '#e07060' : '#9a8caa',
                  fontFamily: 'var(--font-sans)', pointerEvents: 'none',
                }}>{inputText.length}/50</span>
              )}
            </div>
            <button
              onClick={handleComment}
              disabled={posting || !inputText.trim()}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: '#8F44D0', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(143,68,208,0.4)',
                opacity: posting || !inputText.trim() ? 0.55 : 1,
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '11px 0',
            fontFamily: 'var(--font-sans)', fontSize: 12.5, color: '#b0a0c0',
          }}>댓글이 비공개 상태입니다</div>
        )}
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 148, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(28,15,46,0.88)', color: '#fff', borderRadius: 20,
          padding: '9px 18px', fontSize: 12.5, fontFamily: 'var(--font-sans)',
          whiteSpace: 'nowrap', zIndex: 20,
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        }}>{toast}</div>
      )}
    </div>
  )
}
