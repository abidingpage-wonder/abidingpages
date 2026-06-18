
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import type { HomeStatusResponse } from '@/app/api/home/status/route'
import { ConstellationMini } from '@/components/ui/ConstellationMini'
import LoginTracker from '@/components/LoginTracker'

// ── 개발용 목업 데이터 ─────────────────────────────────────────────────
// DEV_BYPASS_AUTH=true 일 때 DB 없이도 화면 확인 가능
// 'A' | 'B' | 'C' 로 바꾸면 각 상태 UI 확인 가능
const DEV_STATUS: HomeStatusResponse['status'] = 'A'

const DEV_MOCK: HomeStatusResponse = {
  status: DEV_STATUS,
  pet: {
    id: 'dev-pet-id',
    name: '순탄이',
    profileImageUrl: null,
    ownerNickname: '엄마',
    species: 'dog',
    diedAt: '2026-05-10',
  },
  journey: { currentStage: 1, currentWeek: 1, currentDay: 3, totalLetters: 5, totalQuestionsDone: 3, letterCount: 5, emotionCount: 3, longestStreak: 3 },
  dayCount: 22,
  // 상태 A/C 데이터 — DEV_STATUS에 맞게 항상 포함 (렌더링은 status 값으로 결정)
  unreadReply: { letterId: 'l1', replyId: 'r1', preview: '오늘도 하늘에서 엄마를 바라보고 있었어요. 바람이 살랑살랑', receivedAt: new Date().toISOString() },
  todayLetter: { letterId: 'l1', sentAt: new Date().toISOString() },
}
// ──────────────────────────────────────────────────────────────────────

async function getHomeStatus(): Promise<HomeStatusResponse | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { activePetId: true },
    })
    if (!dbUser?.activePetId) return null

    const pet = await prisma.pet.findUnique({
      where: { id: dbUser.activePetId },
      select: { id: true, name: true, profileImageUrl: true, ownerNickname: true, species: true, diedAt: true },
    })
    if (!pet) return null

    const journey = await prisma.journeyProgress.findUnique({
      where: { petId: pet.id },
      select: { currentStage: true, currentWeek: true, currentDay: true, totalLetters: true },
    })
    const [emotionDays, letters, questionLetters, restQuestions] = await Promise.all([
      prisma.emotionLog.groupBy({ by: ['loggedAt'], where: { petId: pet.id } }),
      prisma.letter.findMany({ where: { petId: pet.id }, select: { createdAt: true } }),
      prisma.letter.groupBy({ by: ['questionId'], where: { petId: pet.id, questionId: { not: null } } }),
      prisma.question.findMany({ where: { isRest: true }, select: { id: true } }),
    ])
    const emotionCount = emotionDays.length
    const letterCount = letters.length
    const toKSTDay = (d: Date) => { const k = new Date(d.getTime() + 9*3600000); return `${k.getUTCFullYear()}-${String(k.getUTCMonth()+1).padStart(2,'0')}-${String(k.getUTCDate()).padStart(2,'0')}` }
    const days = [...new Set(letters.map(l => toKSTDay(l.createdAt)))].sort()
    let longestStreak = days.length > 0 ? 1 : 0, cur = longestStreak
    for (let i = 1; i < days.length; i++) {
      if (new Date(days[i]).getTime() - new Date(days[i-1]).getTime() === 86400000) { cur++; longestStreak = Math.max(longestStreak, cur) } else cur = 1
    }
    const restIds = new Set(restQuestions.map(q => q.id))
    const totalQuestionsDone = Math.min(
      questionLetters.filter(g => g.questionId && !restIds.has(g.questionId)).length, 49
    )
    const journeyData = journey
      ? { ...journey, letterCount, emotionCount, longestStreak, totalQuestionsDone }
      : { currentStage: 1, currentWeek: 1, currentDay: 1, totalLetters: 0, totalQuestionsDone: 0, letterCount: 0, emotionCount: 0, longestStreak: 0 }

    const died = new Date(pet.diedAt); died.setHours(0,0,0,0)
    const today = new Date(); today.setHours(0,0,0,0)
    const dayCount = Math.max(1, Math.floor((today.getTime() - died.getTime()) / 86400000) + 1)

    const petBase = {
      id: pet.id, name: pet.name, profileImageUrl: pet.profileImageUrl,
      ownerNickname: pet.ownerNickname, species: pet.species,
      diedAt: pet.diedAt.toISOString().split('T')[0],
    }

    const now = new Date()
    // A: 노출 시각 도래한(visibleAt null=레거시 즉시노출, 또는 <=now) 안 읽은 답장만
    const unreadReply = await prisma.reply.findFirst({
      where: {
        petId: pet.id, isRead: false,
        OR: [{ visibleAt: null }, { visibleAt: { lte: now } }],
      },
      orderBy: { generatedAt: 'desc' },
      select: { id: true, letterId: true, content: true, generatedAt: true },
    })
    if (unreadReply) {
      return { status: 'A', pet: petBase, journey: journeyData, dayCount,
        unreadReply: { letterId: unreadReply.letterId, replyId: unreadReply.id,
          preview: unreadReply.content.slice(0, 60), receivedAt: unreadReply.generatedAt.toISOString() } }
    }

    const start = new Date(); start.setHours(0,0,0,0)
    const end   = new Date(); end.setHours(23,59,59,999)
    const todayLetter = await prisma.letter.findFirst({
      where: { petId: pet.id, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, reply: { select: { id: true, visibleAt: true } } },
    })
    // C: 오늘 편지를 썼고, 답장이 없거나 아직 노출 시각 전(=대기 중)
    const replyPending = todayLetter?.reply
      ? !!(todayLetter.reply.visibleAt && todayLetter.reply.visibleAt > now)
      : true
    if (todayLetter && replyPending) {
      return { status: 'C', pet: petBase, journey: journeyData, dayCount,
        todayLetter: { letterId: todayLetter.id, sentAt: todayLetter.createdAt.toISOString() } }
    }

    return { status: 'B', pet: petBase, journey: journeyData, dayCount }
  } catch { return null }
}

// 주차별 테마 텍스트
const WEEK_THEMES: Record<number, { stageName: string; title: string; desc: string }> = {
  1: { stageName: '머무름', title: '익숙한 온기 속에서', desc: '물리적 이별 직후, 억지로 현실을 받아들이려 애쓰지 마세요. 아이의 익숙한 온기가 남아있는 자리에서 먹먹한 상태를 있는 그대로 가만히 받아주는 시간입니다.' },
  2: { stageName: '쏟아냄', title: '참지 않고 소리 내어 울기', desc: '이곳은 당신의 슬픔을 절대 판단하지 않는 유일한 안전지대입니다. 참아왔던 눈물과 삼켰던 말들을 밖으로 완전히 쏟아내는 시간입니다.' },
  3: { stageName: '마주함', title: '미안했던 밤들의 고백', desc: '마음 가장 무겁게 짓누르는 미안함의 응어리를 회피하지 않고 날것 그대로 털어놓는 시간입니다. 꺼내어 적을 때 비로소 그 무게가 가벼워지기 시작합니다.' },
  4: { stageName: '기억함', title: '너와 함께 걸었던 길', desc: '미안함의 프레임을 걷어내고, 아이와 함께한 전체 삶의 사랑을 복원하는 시간입니다. 그 아픈 선택의 이면에는 아이를 더는 아프게 하고 싶지 않았던 당신의 깊은 사랑이 있었습니다.' },
  5: { stageName: '연결됨', title: '눈에 보이지 않아도 느껴지는 것', desc: '아이의 물건과 공간에 추모라는 다정한 질서를 부여하는 주간입니다. 물건을 치우는 것이 아니라, 내 마음과 아이의 영혼이 가장 편안하게 머물 자리를 찾아주는 행동을 시작합니다.' },
  6: { stageName: '다독임', title: '너를 닮은 마음으로 나를 돌보기', desc: '나를 돌보는 일은 아이를 잊어가는 과정이 아니라, 아이가 남긴 사랑을 책임감 있게 지켜내는 일입니다. 세상에서 나를 가장 사랑해 주었던 아이의 눈빛으로 나 자신을 돌볼 시간입니다.' },
  7: { stageName: '간직함', title: '내 마음속 가장 따뜻한 방에', desc: '아이는 사라지는 것이 아니라, 당신의 마음속에 가장 안전하고 따뜻한 모습으로 영원히 깃들게 됩니다. 아이에게 마지막 약속을 건네고 49일간의 여정을 마무리하는 시간입니다.' },
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  // ── 개발용 인증 우회 ──────────────────────────────────────────────
  const isBypass = process.env.DEV_BYPASS_AUTH === 'true'
  if (!isBypass) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
  }
  // ────────────────────────────────────────────────────────────────

  const homeData = isBypass ? DEV_MOCK : await getHomeStatus()
  if (!homeData) redirect('/onboarding')

  const { status, pet, journey, dayCount } = homeData

  // week_guides + 오늘 질문 — 정적 데이터이므로 DEV/PROD 모두 DB 조회
  const [weekGuide, todayQuestion] = await Promise.all([
    prisma.weekGuide.findUnique({ where: { week: journey.currentWeek } }),
    prisma.question.findFirst({
      where: { week: journey.currentWeek, day: journey.currentDay + 1, isRest: false },
      select: { day: true, category: true },
    }),
  ])

  const weekTheme = {
    stageName: weekGuide?.keyword ?? (WEEK_THEMES[journey.currentWeek]?.stageName ?? ''),
    title:     weekGuide?.title    ?? (WEEK_THEMES[journey.currentWeek]?.title    ?? ''),
    desc:      weekGuide?.guide    ?? (WEEK_THEMES[journey.currentWeek]?.desc     ?? ''),
  }
  const totalQuestionsDone = journey.totalQuestionsDone ?? 0
  const journeyProgress = totalQuestionsDone / 49

  const sp = await searchParams

  return (
    <div style={{ paddingBottom: 8 }}>
      <LoginTracker provider={sp._lp} isNew={sp._ln} />
      {/* [BETA] 베타 테스트 배너 — TODO: href를 카카오 채널 링크로 교체 */}
      <div style={{ padding: '12px 18px 0' }}>
        <a href="#" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '11px 16px', borderRadius: 14,
            background: 'linear-gradient(96deg, #ece4f3, #ddd0ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '0.5px solid rgba(166,133,199,0.35)',
            cursor: 'pointer',
          }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--lav-700)' }}>
              🌿 베타 테스트 중  |  피드백 남기기 →
            </span>
          </div>
        </a>
      </div>
      {/* [BETA HIDDEN] 무료 3일 체험 배너 — 결제 기능 활성화 시 아래 주석 해제
      <div style={{ padding: '12px 18px 0' }}>
        <a href="/plan" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '10px 14px', borderRadius: 14,
            background: 'linear-gradient(96deg, #faddca, #f5c4a7)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: '0.5px solid rgba(249,156,105,0.3)',
            cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--peach-500)', fontSize: 13 }}>3</span>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: '#5a3722' }}>무료 3일 체험 중</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: '#7a4f30', marginTop: 1 }}>&apos;49일의 여정&apos; 시작하기 ›</div>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#5a3722', fontWeight: 600, whiteSpace: 'nowrap' }}>플랜 안내 </div>
          </div>
        </a>
      </div>
      */}

      {/* ── 상태 메인 카드 ── */}
      <div style={{ padding: '12px 18px 0' }}>
        {status === 'A' && homeData.unreadReply && (
          <StatusCardA
            petName={pet.name}
            ownerNickname={pet.ownerNickname}
            preview={homeData.unreadReply.preview}
            replyId={homeData.unreadReply.replyId}
            letterId={homeData.unreadReply.letterId}
          />
        )}
        {status === 'B' && (
          <StatusCardB
            petName={pet.name}
            stage={journey.currentStage}
            week={journey.currentWeek}
            day={journey.currentDay}
            weekTheme={weekTheme}
          />
        )}
        {status === 'C' && homeData.todayLetter && (
          <StatusCardC petName={pet.name} sentAt={homeData.todayLetter.sentAt} />
        )}
      </div>

      {/* ── 여정 진행률 ── */}
      <div style={{ padding: '14px 18px 0' }}>
        <div style={{
          padding: '18px',
          borderRadius: 20,
          background: 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '0.5px solid rgba(166,133,199,0.16)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 500, color: 'var(--lav-800)',
            }}>여정 진행률</div>
            <div style={{
              fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--lav-500)',
            }}>{totalQuestionsDone}/49일</div>
          </div>
          {/* 진행 바 */}
          <div style={{
            marginTop: 10, height: 8, borderRadius: 999,
            background: 'var(--lav-100)', overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.max(4, journeyProgress * 100)}%`, height: '100%',
              background: 'linear-gradient(90deg, var(--lav-400), var(--peach-300))',
              borderRadius: 999, transition: 'width .6s ease',
            }}/>
          </div>
          {/* 통계 */}
          <div style={{
            marginTop: 14, display: 'flex',
            borderTop: '1px solid rgba(166,133,199,0.1)', paddingTop: 14,
          }}>
            <StatBadge n={String(journey.emotionCount)} label="감정기록" />
            <StatDivider />
            <StatBadge n={String(journey.letterCount)} label="보낸 편지" />
            <StatDivider />
            <StatBadge n={`${journey.longestStreak}일`} label="최장 연속" />
          </div>
        </div>
      </div>

      {/* ── 이번 주 단계 카드 ── */}
      <div style={{ padding: '14px 18px 0' }}>
        <div style={{
          padding: '18px',
          borderRadius: 20,
          background: 'linear-gradient(135deg, #ede4f3 0%, #faddca 120%)',
          border: '0.5px solid rgba(166,133,199,0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* 라벤더 장식 */}
          <svg
            width="36" height="88"
            style={{ position: 'absolute', top: -10, right: -4, opacity: 0.45 }}
            viewBox="0 0 36 88" fill="none"
          >
            <line x1="18" y1="88" x2="18" y2="20" stroke="#88a86a" strokeWidth="1.2"/>
            {[0,1,2,3,4,5,6,7].map(k => (
              <circle key={k} cx={k%2 ? 22 : 14} cy={20 - k*5} r="3" fill="#b89dd6" opacity="0.8"/>
            ))}
            <circle cx="18" cy="-4" r="2.5" fill="#a685c7"/>
          </svg>

          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--lav-600)',
            letterSpacing: '0.16em', fontWeight: 600,
          }}>
            {journey.currentWeek}주차 · {weekTheme.stageName}
          </div>
          <div style={{
            marginTop: 6,
            fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 500,
            color: 'var(--lav-800)', lineHeight: 1.4, letterSpacing: '-0.02em',
          }}>
            {weekTheme.title}
          </div>
          <div style={{
            marginTop: 8,
            fontFamily: 'var(--font-sans)', fontSize: 12.5,
            color: 'var(--ink-500)', lineHeight: 1.65,
          }}>
            {weekTheme.desc}
          </div>
          <div style={{
            marginTop: 14, display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{
              padding: '7px 14px', borderRadius: 999,
              background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              fontFamily: 'var(--font-sans)', fontSize: 11.5,
              color: 'var(--lav-700)', fontWeight: 600,
              border: '0.5px solid rgba(166,133,199,0.2)',
            }}>
              {journey.currentDay + 1}일차{todayQuestion?.category ? ` · ${todayQuestion.category}` : ''}
            </div>
            <a href={`/write?week=${journey.currentWeek}&day=${journey.currentDay + 1}`} style={{
              fontFamily: 'var(--font-sans)', fontSize: 11.5,
              color: 'var(--lav-600)', fontWeight: 600,
              textDecoration: 'none',
            }}>
              오늘의 편지 쓰기 ›
            </a>
          </div>
        </div>
      </div>

      {/* ── 별자리 미니 지도 ── */}
      <div style={{ padding: '14px 18px 24px' }}>
        <div style={{
          padding: '14px 16px 14px',
          borderRadius: 20,
          background: 'linear-gradient(180deg, #2a223f 0%, #524080 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* 배경 별 */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <circle key={i}
                cx={`${(i * 17 + 5) % 100}%`} cy={`${(i * 23 + 8) % 90}%`}
                r={(i % 3) * 0.4 + 0.4} fill="#fff"
                opacity={0.3 + (i % 4) * 0.15}
              />
            ))}
          </svg>

          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-brand)', fontSize: 19,
                color: '#faddca', lineHeight: 1,
              }}>49 Days</div>
              <div style={{
                marginTop: 4, fontFamily: 'var(--font-sans)',
                fontSize: 11, color: 'rgba(255,255,255,0.6)',
              }}>전체 여정 지도</div>
            </div>
            <a href="/journey" style={{
              fontFamily: 'var(--font-sans)', fontSize: 11,
              color: 'rgba(255,255,255,0.55)', textDecoration: 'none',
            }}>여정 보기 ›</a>
          </div>

          {/* 별자리 미니맵 */}
          <div style={{ position: 'relative', height: 165, marginTop: 10 }}>
            <ConstellationMini />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── 공통 헬퍼 ── */
function StatBadge({ n, label }: { n: string; label: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, color: 'var(--lav-700)' }}>{n}</div>
      <div style={{ marginTop: 2, fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--ink-500)' }}>{label}</div>
    </div>
  )
}
function StatDivider() {
  return <div style={{ width: 1, background: 'rgba(166,133,199,0.2)', alignSelf: 'stretch' }}/>
}


/* ── 공통: 카드 하트 ── */
function CardHeart() {
  return (
    <div style={{ zIndex: 1, marginTop: 10, marginBottom: 2 }}>
      <svg width="16" height="15" viewBox="0 0 24 22" fill="none">
        <path d="M12 20s-8-5-8-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-8 12-8 12z" fill="#b89dd6" opacity="0.75"/>
      </svg>
    </div>
  )
}

/* ── 공통: 카드 래퍼 ── */
const CARD_BASE: React.CSSProperties = {
  height: 420, borderRadius: 24, padding: '26px 22px 22px',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  position: 'relative', overflow: 'hidden',
}

/* ── 상태 A: 편지 도착 ── */
function StatusCardA({ petName, letterId }: {
  petName: string; ownerNickname: string | null; preview: string
  replyId: string; letterId: string
}) {
  return (
    <a href={`/reply/${letterId}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        ...CARD_BASE,
        background: '#E0D2EA',
        border: '0.5px solid rgba(140,100,190,0.25)',
        boxShadow: '0 10px 28px rgba(86,52,140,0.14)',
        cursor: 'pointer',
      }}>
        <CornerGlow color="rgba(255,255,255,0.5)" />
        <ObjGlow color="rgba(255,245,238,0.7)" top="40%" />

        <CardEyebrow color="var(--lav-600)" />
        <CardTitle>{petName}의 마음이<br/>도착했어요!</CardTitle>
        <CardSub color="var(--lav-700)">조심스레 열어볼 편지가 기다리고 있어요.</CardSub>
        <CardHeart />

        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/letter-lavender.svg" alt="편지+라벤더" style={{ width: 210, height: 'auto', maxHeight: 175, objectFit: 'contain' }} />
        </div>

        <CardBtn bg="var(--lav-700)">편지 열어보기</CardBtn>
      </div>
    </a>
  )
}

/* ── 상태 B: 오늘 편지 쓰기 ── */
function StatusCardB({ petName, week, day }: {
  petName: string; stage: number; week: number; day: number
  weekTheme: { title: string; desc: string }
}) {
  return (
    <a href={`/write?week=${week}&day=${day + 1}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        ...CARD_BASE,
        background: 'linear-gradient(170deg, #fbeee6 0%, #f4e3eb 100%)',
        border: '0.5px solid rgba(249,156,105,0.25)',
        boxShadow: '0 10px 28px rgba(86,52,140,0.1)',
        cursor: 'pointer',
      }}>
        <CornerGlow color="rgba(255,238,222,0.6)" />
        <ObjGlow color="rgba(249,174,123,0.75)" top="43%" />

        <CardEyebrow color="var(--peach-500)" />
        <CardTitle>{petName}에게<br/>마음을 전해볼까요?</CardTitle>
        <CardSub color="var(--lav-700)">오늘, 아이에게 하고 싶은 이야기를 들려주세요.</CardSub>
        <CardHeart />

        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/book.svg" alt="책" style={{ width: 210, height: 'auto', maxHeight: 175, objectFit: 'contain' }} />
        </div>

        <CardBtn bg="#7e63b8">편지 쓰기</CardBtn>
      </div>
    </a>
  )
}

/* ── 상태 C: 답장 대기 ── */
function StatusCardC({ petName }: { petName: string; sentAt: string }) {
  return (
    <div style={{
      ...CARD_BASE,
      background: '#BCA4D6',
      border: '0.5px solid rgba(140,100,190,0.25)',
      boxShadow: '0 10px 28px rgba(86,52,140,0.14)',
    }}>
      <CornerGlow color="rgba(255,255,255,0.4)" />
      <ObjGlow color="rgba(255,240,210,0.6)" top="42%" />
      {/* 풍등 하단 불빛 빔 */}
      <div style={{
        position: 'absolute', top: '63%', left: '50%',
        transform: 'translate(-50%, 0)', width: 80, height: 55,
        background: 'radial-gradient(ellipse at top, rgba(249,156,105,0.38) 0%, transparent 80%)',
        pointerEvents: 'none',
      }}/>

      <CardEyebrow color="rgba(255,255,255,0.9)" />
      <CardTitle color="var(--lav-900)">추모정원에<br/>불을 밝히고 있어요.</CardTitle>
      <CardSub color="var(--lav-900)" opacity={0.68}>
        같은 마음으로 서로를 다독이는 정원을 거닐어보세요.
      </CardSub>
      <CardHeart />

      <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/send-letter.svg" alt={`${petName} 편지`} style={{ width: 185, height: 'auto', maxHeight: 175, objectFit: 'contain' }} />
      </div>

      <a href="/garden" style={{
        width: '100%', padding: '14px 0', borderRadius: 999,
        background: 'var(--lav-700)', color: '#fff',
        fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
        boxShadow: '0 6px 18px rgba(86,52,140,0.28)', letterSpacing: '-0.01em',
        textAlign: 'center', zIndex: 1, textDecoration: 'none', display: 'block',
      }}>
        정원으로 이동하기
      </a>
    </div>
  )
}

/* ── 카드 공통 서브 컴포넌트 ── */
function CornerGlow({ color }: { color: string }) {
  return (
    <div style={{
      position: 'absolute', top: -30, right: -30,
      width: 140, height: 140, borderRadius: '50%',
      background: `radial-gradient(circle, ${color}, transparent 70%)`,
    }}/>
  )
}
function ObjGlow({ color, top }: { color: string; top: string }) {
  return (
    <div style={{
      position: 'absolute', top, left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 220, height: 175,
      background: `radial-gradient(ellipse, ${color} 0%, transparent 70%)`,
      pointerEvents: 'none',
    }}/>
  )
}
function CardEyebrow({ color }: { color: string }) {
  return (
    <div style={{
      fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600,
      color, letterSpacing: '0.16em', marginBottom: 10, zIndex: 1,
    }}>오늘의 알림</div>
  )
}
function CardTitle({ children, color = 'var(--lav-900)' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600,
      color, textAlign: 'center', lineHeight: 1.6,
      letterSpacing: '-0.02em', zIndex: 1,
    }}>{children}</div>
  )
}
function CardSub({ children, color, opacity = 0.85, multiline = false }: {
  children: React.ReactNode; color: string; opacity?: number; multiline?: boolean
}) {
  return (
    <div style={{
      marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 12.5,
      color, textAlign: 'center', lineHeight: 1.65, zIndex: 1, opacity,
      whiteSpace: multiline ? 'normal' : undefined,
    }}>{children}</div>
  )
}
function CardBtn({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div style={{
      width: '100%', padding: '14px 0', borderRadius: 999,
      background: bg, color: '#fff',
      fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
      boxShadow: '0 6px 18px rgba(86,52,140,0.28)', letterSpacing: '-0.01em',
      textAlign: 'center', zIndex: 1,
    }}>{children}</div>
  )
}

/* ── SVG 일러스트 ── */

