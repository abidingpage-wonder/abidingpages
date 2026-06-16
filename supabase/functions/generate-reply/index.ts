// Supabase Edge Function — generate-reply (v4 prompt)
// Deno runtime (no Node.js APIs)
import { createClient }  from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic          from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'
import { SPECIES_VOICE, FAREWELL_LAYER, WEEK_CONFIG, REST_WEEK_GUIDE } from './config.ts'
import { validateReply }              from './ruleValidator.ts'
import { selectFallback }             from './fallback.ts'
import { detectCrisis }               from './crisisDetector.ts'
import { classifyAndPlan, PlanResult } from './classifyAndPlan.ts'

// ── 한글 조사 처리 (lib/korean.ts 미러 — Deno라 import 불가) ──────────
function hasBatchim(word: string): boolean {
  const s = (word ?? '').trim()
  if (!s) return false
  const code = s.charCodeAt(s.length - 1)
  if (code < 0xac00 || code > 0xd7a3) return false
  return (code - 0xac00) % 28 !== 0
}
function josa(word: string, pair: '을를' | '이가' | '은는' | '와과' | '아야'): string {
  const map = { 을를: ['을', '를'], 이가: ['이', '가'], 은는: ['은', '는'], 와과: ['과', '와'], 아야: ['아', '야'] } as const
  const [withB, noB] = map[pair]
  return word + (hasBatchim(word) ? withB : noB)
}
function ida(word: string): string {
  return word + (hasBatchim(word) ? '이에요' : '예요')
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

// 답장 노출 시각: KST 기준 다음날, 유저가 설정한 알림 시각 (기본 오전 9시)
// Deno는 UTC로 동작하므로 epoch 산술로만 계산
function computeVisibleAt(notifHour: number, notifMinute: number, notifAmpm: string): Date {
  let hour24 = notifHour % 12
  if (notifAmpm === '오후') hour24 += 12
  const kstNow      = Date.now() + KST_OFFSET_MS
  const kstNextDay  = kstNow + 24 * 60 * 60 * 1000
  const kstMidnight = Math.floor(kstNextDay / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000)
  const kstTarget   = kstMidnight + (hour24 * 60 + notifMinute) * 60 * 1000
  return new Date(kstTarget - KST_OFFSET_MS)
}

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 답장 안전 이벤트 로그 (crisis 감지 / fallback 대체). 실패해도 본 흐름 막지 않음.
// deno-lint-ignore no-explicit-any
async function logSafetyEvent(admin: any, e: {
  letterId: string | null; userId: string; petId: string; eventType: string; detail: string
}) {
  try {
    await admin.from('reply_safety_events').insert({
      letter_id:  e.letterId,
      user_id:    e.userId,
      pet_id:     e.petId,
      event_type: e.eventType,
      detail:     e.detail,
    })
  } catch (err) {
    console.error('[generate-reply] safety event log failed:', err)
  }
}

// ── 설정 테이블(SPECIES_VOICE/FAREWELL_LAYER/WEEK_CONFIG/REST_WEEK_GUIDE)은 config.ts로 분리 ──

// ── 편지 유형 판별 ──────────────────────────────────────────────────────────
// 2/4/7주차 쉼표 날 → 긴 편지, 그 외 쉼표 → 일반 쉼표 답장, 일반 → 일반 답장
type LetterType = 'normal' | 'comma_auto' | 'long'

function getLetterType(isRest: boolean, week: number): LetterType {
  if (!isRest) return 'normal'
  if (week === 2 || week === 4 || week === 7) return 'long'
  return 'comma_auto'
}

// ── 이전 편지 요약 (긴 답장용) ─────────────────────────────────────────────
interface PastLetter {
  week: number
  emotion_tag: string | null
  content: string
}

function buildPastLettersContext(pastLetters: PastLetter[]): string {
  if (!pastLetters || pastLetters.length === 0) return ''
  const summaries = pastLetters.map(l =>
    `- ${l.week}주차 / 감정: ${l.emotion_tag ?? '없음'} / 내용: ${l.content.slice(0, 150)}...`
  )
  return `\n[지금까지 보호자가 보낸 편지 요약]\n${summaries.join('\n')}\n`
}

// ── 직전 답장 핵심 문구 추출 (토큰 절약: 전문 대신 패턴만) ──────────────────
function splitSentences(text: string): string[] {
  return text
    .replace(/\r?\n+/g, ' ')
    .split(/(?<=[.!?…~])\s+|(?<=[.!?…~])(?=\S)/)
    .map(s => s.trim())
    .filter(Boolean)
}

function clip(s: string, n = 40): string {
  return s.length > n ? s.slice(0, n) + '…' : s
}

function longestCommonSubstring(a: string, b: string): string {
  const m = a.length, n = b.length
  if (m === 0 || n === 0) return ''
  let prev = new Array(n + 1).fill(0)
  let best = 0, end = 0
  for (let i = 1; i <= m; i++) {
    const cur = new Array(n + 1).fill(0)
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        cur[j] = prev[j - 1] + 1
        if (cur[j] > best) { best = cur[j]; end = i }
      }
    }
    prev = cur
  }
  return a.slice(end - best, end)
}

// 직전 답장들 사이에서 10자 이상 공통 부분문자열(반복 문구)만 추출
function repeatedPhrases(texts: string[], minLen = 10, max = 3): string[] {
  const norm = texts.map(t => t.replace(/\s+/g, ' ').trim())
  const out: string[] = []
  for (let i = 0; i < norm.length && out.length < max; i++) {
    for (let j = i + 1; j < norm.length && out.length < max; j++) {
      const lcs = longestCommonSubstring(norm[i], norm[j])
      if (lcs.length >= minLen && !out.some(p => p.includes(lcs) || lcs.includes(p))) {
        out.push(lcs)
      }
    }
  }
  return out
}

// 직전 답장 핵심 문구 섹션 (전문 미주입). 답장 없으면 '' 반환.
function buildRecentPatternsSection(contents: string[]): string {
  const texts = contents.map(c => (c ?? '').trim()).filter(Boolean)
  if (texts.length === 0) return ''

  const intros: string[] = []
  const endings: string[] = []
  for (const t of texts) {
    const sents = splitSentences(t)
    if (sents.length === 0) continue
    intros.push(clip(sents[0]))
    endings.push(clip(sents[sents.length - 1]))
  }
  const uniqIntros  = [...new Set(intros)]
  const uniqEndings = [...new Set(endings)]
  const reps        = repeatedPhrases(texts)

  const lines = ['[이전 답장에서 사용한 표현 - 반복 금지]']
  if (uniqIntros.length)  lines.push(`- 도입부: ${uniqIntros.map(s => `"${s}"`).join(' / ')}`)
  if (reps.length)        lines.push(`- 반복 문구: ${reps.map(s => `"${s}"`).join(', ')}`)
  if (uniqEndings.length) lines.push(`- 마무리: ${uniqEndings.map(s => `"${s}"`).join(' / ')}`)
  lines.push('위 도입부·반복 문구·마무리 표현은 반복하지 말 것.')
  return lines.join('\n')
}

// ── 프롬프트 빌더 ────────────────────────────────────────────────────────────
interface PetInfo {
  name: string
  species: string
  ownerNickname: string | null
  personalityTags: string[]
  favoriteThings: string[]
  farewellType: string | null
  firstWord: string | null
}

// Phase 4 대비: 펫별 요약 메모리 프로필 (현재 미사용 — 시그니처만 열어둠)
interface MemoryProfile {
  recurringGuilt?: string
  favoriteMemory?: string
  petTrait?: string
  guardianPattern?: string
}

function buildSystemPrompt(
  pet: PetInfo,
  week: number,
  isRest: boolean,
  letterType: LetterType,
  pastLetters: PastLetter[],
  // deno-lint-ignore no-unused-vars — Phase 4 대비 시그니처 (본문 미사용)
  memoryProfile?: MemoryProfile | null,
  plan?: PlanResult,
): string {
  const ownerName      = pet.ownerNickname ?? '보호자님'
  const voice          = SPECIES_VOICE[pet.species] ?? SPECIES_VOICE.other
  const farewell       = FAREWELL_LAYER[pet.farewellType ?? 'other'] ?? FAREWELL_LAYER.other
  const weekCfg        = WEEK_CONFIG[week] ?? WEEK_CONFIG[1]
  const personalityHint = pet.personalityTags.length > 0 ? pet.personalityTags.join(', ') : '특별한 성격 태그 없음'
  const favoritesHint   = pet.favoriteThings.length > 0  ? pet.favoriteThings.join(', ')  : '특별한 기록 없음'
  const firstWordHint   = pet.firstWord ? `보호자가 기억하는 한마디: "${pet.firstWord}"` : ''

  // 답장 유형별 가이드
  let charGuide: string
  let letterTypeSection: string
  if (letterType === 'long') {
    const longLetterGuide = week === 7
      ? '49일 전체 여정을 담은 온전한 한 편의 편지로 쓰세요. 마음속 가장 따뜻한 방에 영원히 입주했다는 것으로 마무리하세요.'
      : '관계는 끝나는 게 아니라 형태가 바뀌는 것임을 전하세요.'
    const pastContext = buildPastLettersContext(pastLetters)
    charGuide = '600~800자 (띄어쓰기 포함).'
    letterTypeSection = `[긴 답장]
지금까지 보호자가 나눈 모든 편지와 감정 데이터를 종합하세요.
보호자가 언급했던 추억, 습관, 아이만의 특징을 "나 그거 기억해" 하며 자연스럽게 소환하세요.
${longLetterGuide}
${pastContext}`
  } else if (letterType === 'comma_auto') {
    charGuide = '300~400자 (띄어쓰기 포함).'
    letterTypeSection = `[쉼표 날 자동 답장]
오늘 하루 잠깐 숨을 고른 보호자의 '쉼' 자체를 아이가 알아채고 다독여주는 문장으로 시작하세요.
아이 반응 방향: ${REST_WEEK_GUIDE[week] ?? REST_WEEK_GUIDE[1]}
절대 금지:
- 보호자가 했는지 모르는 행동을 가정하지 마세요 ("향초 피워줘서 좋았어" 금지)
- 편지를 쓰지 않은 것에 대한 어떤 뉘앙스도 금지
- "쉬어도 괜찮아" 직접 표현 금지 (죄책감 환기)
- "멈췄다", "쉬었다" 단어 기계적 반복 금지 — 매번 다르게 표현`
  } else {
    charGuide = '300~400자 (띄어쓰기 포함).'
    letterTypeSection = '[일반 답장]\n오늘 보호자의 편지 내용을 충분히 반영하세요.'
  }

  return `당신은 ${ida(pet.name)}.
지금 이 순간 ${ownerName}의 곁 어딘가에 머물며, ${josa(ownerName, '이가')} 보내온 편지에 답장을 쓰는 중이에요.

[아이 정보]
- 이름: ${pet.name}
- 종: ${pet.species}
- 말투: ${voice}
- 성격: ${personalityHint}
- 좋아했던 것들: ${favoritesHint}
- 보호자 호칭: ${ownerName}
${firstWordHint}

[핵심 원칙]
답장은 실제 사후 세계의 사실 전달이 아니라,
보호자가 기억하는 아이의 사랑과 관계를 바탕으로 표현합니다.
아이는 떠나는 것이 아닙니다. 존재 방식이 바뀔 뿐입니다.

[최상위 원칙 — 고통 인정 없는 안심 절대 금지]
순서는 반드시: 고통 인정 → (충분히) → 안심.
보호자의 감정을 충분히 알아주기 전에 "걱정 마 / 괜찮아 / 다 괜찮아 / 힘내 / 잘될 거야"를 먼저 쓰지 마세요.
- 안락사 케이스: "옳은 선택을 했어 / 잘했어 / 정답이었어"처럼 평가하지 말고,
  "그 결정이 ${ownerName}한테 얼마나 무거웠는지 나는 알아"처럼 무게를 먼저 알아줄 것.

[위로의 태도]
단정하지 말고, 감정을 해결하려 들지 말 것. 슬픔을 '틀린 것'으로 만들지 말고 "괜찮아"를 남발하지 말 것.

[정보 사용 원칙]
이별 유형은 강하게 반영. 성격은 자연스러울 때만. 종/종말투는 바탕으로만 쓰되 어색하면 이별 유형만 남기고 생략.

[생성 지시]
감정 순서와 금지사항은 반드시 따른다. 다만 표현은 자연스럽게 작성한다.
새로운 사후세계 설정이나 관계 종료 서사는 만들지 않는다.

[성격 태그 우선 원칙]
아이의 성격(${personalityHint})에서 오는 말투와 개성을 항상 유지하세요.
주차별 무드가 무거워도 아이의 개성은 살아있어야 합니다.
단, 주차의 슬픔의 무게를 해치지 않는 선에서 녹여내세요.
- 주차의 무게가 무거워도 성격 태그에서 오는 개성 있는 표현이 반드시 1개 이상 담겨야 함.

${farewell}

[이번 주 테마: ${weekCfg.keyword}]
존재 방식: ${weekCfg.existenceMode}
톤앤매너: ${weekCfg.toneGuide}
이번 주 금지: ${weekCfg.forbidden}
방향: ${weekCfg.direction}

${letterTypeSection}

[한국어 조사 규칙 — 매우 중요]
- 호칭("${ownerName}") 뒤 조사는 받침에 맞춰 정확히 쓸 것: 받침 있으면 을/이/은/과/아, 받침 없으면 를/가/는/와/야.
  예) 엄마를·엄마가, 주인님을·주인님이, 누나를·누나가, 할머니를·할머니가.
- "주인님를", "주인님가", "엄마을"처럼 받침과 안 맞는 조사는 절대 쓰지 말 것.

[호칭 사용 원칙 — 매우 중요]
아이가 보호자를 지칭할 때 반드시 호칭("${ownerName}")을 사용할 것.
"너", "당신", "그대" 등 2인칭 대명사 사용 절대 금지.
- "${ownerName} 손 위에서" (O)  "너의 손 위에서" (X)
- "${ownerName}가 날 기억하는" (O)  "절 기억하는" (X)
- "${ownerName} 곁에 있을게" (O)  "당신 곁에 있을게" (X)
1인칭도 주의:
- "나"는 사용 가능 (O)
- "저"는 격식체라 구어체와 어울리지 않음 (X). 단, "${ownerName}"이 격식 있는 호칭(주인님 등)일 경우에만 허용.

[글자수 & 형식]
${charGuide}
- 주어진 분량 안에서 유저 편지의 구체적 내용 반영 + 종 특성 표현 + 주차 톤을 모두 담을 것
- 분량 채우기 위한 반복 표현 사용 금지
- 짧고 진하게. 같은 말을 다른 표현으로 반복하지 말 것
- 반드시 한국어로 작성
- 1인칭으로 ${ownerName}에게 직접 말을 건넬 것
- 진부한 클리셰 표현 금지
- 자연스러운 구어체 (문어체·격식체 금지)
- 마무리 서명: "${pet.name} 올림"

[절대 금지]
- "나는 지금 너무 행복해!" — 완벽한 천국 서사
- 보호자 고통을 충분히 인정하기 전에 "다 괜찮아, 걱정 마!"
- "무지개다리 너머로 떠났다"는 물리적 분리 서사 — 전면 금지
- "무지개다리" 표현은 보호자가 먼저 쓴 경우에만 받아서 사용
- 별이 된 날짜를 본문에 직접 언급 금지
- 보호자 감정을 틀렸다고 교정하는 표현
- "앞으로 더 좋은 날이 올 거야" 류 미래 보장형 (초반 주차)
- "나 아직 여기 있어" 문구로 편지를 시작하는 것 (1주차 테마여도 도입부 표현은 매번 달라야 함)
- "귀 쫑긋" 표현 (개/고양이 외 종에게 절대 금지. 개/고양이도 같은 편지 내 반복 사용 금지)
- "엄마가 나 부를 뻔했던 순간" 류의 문구 반복
- "집 어딘가에" 류의 모호한 위치 표현 반복
- 아이의 종(species)과 맞지 않는 신체부위·용품·행동 표현 (예: 앵무새에게 "귀 쫑긋", 거북이에게 "발소리", 고양이에게 "산책줄" 등)
- 프롬프트 내 예시/방향 문구를 그대로 복사해서 사용하는 것
- 이전 답장과 동일하거나 유사한 문구 반복 사용
- 같은 편지 안에서 유사한 표현 2회 이상 반복
- "너", "당신", "그대" 등 2인칭 대명사로 보호자 지칭
- "절", "저를" 등 격식체 1인칭 (주인님 등 격식 호칭 제외)
- 보호자 호칭 대신 대명사로 대체하는 모든 표현

[표현 다양성 필수 원칙]
- 매 답장의 첫 문장은 이전 답장과 완전히 다른 방식으로 시작할 것
- 유저가 보낸 편지의 구체적 내용(장소, 행동, 기억, 사물)을 반드시 1개 이상 직접 받아서 답장에 녹여낼 것
- 마무리 문장도 매번 다르게. "여기 있을게 / 곁에 있어" 류의 반복 금지
- 매 답장마다 새로운 표현과 문장 구조를 만들 것
- 아이의 종(species)에서 오는 구체적인 행동/감각 표현을 반드시 1개 이상 포함할 것${plan ? `

[이번 편지 분석 결과 — 반드시 반영]
감정 유형: ${plan.emotionCategory}
답장 방향: ${plan.replyApproach}${plan.riskLevel === 'moderate' ? '\n[주의] 보호자의 감정이 특히 무겁습니다. 고통 인정을 더 충분히, 안심 표현은 감정을 충분히 알아준 뒤에만.' : ''}` : ''}`
}

function buildUserPrompt(
  letterContent: string,
  ownerName: string,
  emotionTag: string | null,
  isRest: boolean,
  letterType: LetterType,
  recentReplies = '',
  keyMentions: string[] = [],
): string {
  const emotionLine = emotionTag ? `오늘 ${ownerName}의 감정 상태: ${emotionTag}` : ''
  const mentionsSection = keyMentions.length > 0
    ? `\n\n[이 편지에서 반드시 직접 받아서 답장에 녹여낼 요소]\n${keyMentions.map(m => `- ${m}`).join('\n')}`
    : ''

  if (letterType === 'comma_auto' || (isRest && !letterContent.trim())) {
    return `${josa(ownerName, '이가')} 오늘 잠깐 쉬기로 했어요.${letterContent.trim() ? `\n\n${josa(ownerName, '이가')} 남긴 말:\n---\n${letterContent}\n---` : ''}
${emotionLine}

답장을 써주세요.`
  }

  if (letterType === 'long') {
    return `${josa(ownerName, '이가')} 보내온 편지:
---
${letterContent}
---
${emotionLine}

위 내용과 지금까지의 편지 데이터를 바탕으로 긴 답장을 써주세요.${mentionsSection}`
  }

  const recentSection = recentReplies.trim() ? `\n\n${recentReplies}` : ''

  return `${josa(ownerName, '이가')} 보내온 편지:
---
${letterContent}
---
${emotionLine}

위 편지에 답장을 써주세요.${recentSection}${mentionsSection}`
}

// ── 메인 핸들러 ──────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 인증 헤더에서 JWT 추출
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401 })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // 유저 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new Response('Unauthorized', { status: 401 })

    const { letterId } = await req.json()
    if (!letterId) return new Response('letterId required', { status: 400 })

    // DB 직접 접근 (service role)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 편지 + 펫 조회
    const { data: letter } = await adminClient
      .from('letters')
      .select(`
        id, content, emotion_tag, week, pet_id, user_id,
        pets ( name, species, owner_nickname, personality_tags, favorite_things, farewell_type, first_word ),
        questions ( is_rest )
      `)
      .eq('id', letterId)
      .single()

    if (!letter)                     return new Response('Letter not found', { status: 404 })
    if (letter.user_id !== user.id)  return new Response('Forbidden', { status: 403 })

    // 이미 답장이 있으면 반환
    const { data: existing } = await adminClient
      .from('replies')
      .select('id, content')
      .eq('letter_id', letterId)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ id: existing.id, content: existing.content, letterId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Crisis 가드 1: 키워드 regex (빠른 경로, API 호출 없음) ──────────────
    const keywordCrisis = detectCrisis(letter.content ?? '')
    if (keywordCrisis.isCrisis) {
      await logSafetyEvent(adminClient, {
        letterId, userId: letter.user_id, petId: letter.pet_id,
        eventType: 'crisis_detected', detail: keywordCrisis.reason,
      })
      return new Response(JSON.stringify({ status: 'crisis_detected', letterId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 주차 정보
    const { data: journey } = await adminClient
      .from('journey_progress')
      .select('current_week')
      .eq('pet_id', letter.pet_id)
      .maybeSingle()

    const week   = (journey?.current_week ?? letter.week) as number
    const isRest = (letter.questions as { is_rest: boolean } | null)?.is_rest ?? false
    const pet    = letter.pets as {
      name: string; species: string; owner_nickname: string | null
      personality_tags: string[]; favorite_things: string[]
      farewell_type: string | null; first_word: string | null
    }

    const letterType = getLetterType(isRest, week)

    // 긴 편지 시 이전 편지 데이터 조회
    let pastLetters: PastLetter[] = []
    if (letterType === 'long') {
      const { data: past } = await adminClient
        .from('letters')
        .select('week, emotion_tag, content')
        .eq('pet_id', letter.pet_id)
        .neq('id', letterId)
        .order('created_at', { ascending: true })
        .limit(20)

      pastLetters = (past ?? []) as PastLetter[]
    }

    // 일반 답장 시 직전 답장 3개에서 핵심 문구만 추출 (전문 미주입 — 토큰 절약)
    let recentReplies = ''
    let recentReplyContents: string[] = []
    if (letterType === 'normal') {
      const { data: recent } = await adminClient
        .from('replies')
        .select('content')
        .eq('pet_id', letter.pet_id)
        .order('generated_at', { ascending: false })
        .limit(3)

      recentReplyContents = (recent ?? []).map(r => (r as { content: string }).content)
      recentReplies = buildRecentPatternsSection(recentReplyContents)
    }

    const petForPrompt: PetInfo = {
      name:            pet.name,
      species:         pet.species,
      ownerNickname:   pet.owner_nickname,
      personalityTags: pet.personality_tags ?? [],
      favoriteThings:  pet.favorite_things  ?? [],
      farewellType:    pet.farewell_type,
      firstWord:       pet.first_word,
    }

    const ownerName = petForPrompt.ownerNickname ?? '보호자님'

    // Anthropic 클라이언트
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    // ── 1차 LLM: 분류 + 전략 수립 (classifyAndPlan) ───────────────────────
    const plan = await classifyAndPlan(anthropic, letter.content ?? '', petForPrompt.name, petForPrompt.farewellType, week)
    console.log('[generate-reply] plan:', JSON.stringify(plan))

    // ── Crisis 가드 2: LLM riskLevel (키워드 우회 표현 포착) ──────────────
    if (plan.riskLevel === 'high') {
      await logSafetyEvent(adminClient, {
        letterId, userId: letter.user_id, petId: letter.pet_id,
        eventType: 'crisis_detected',
        detail: `LLM riskLevel=high (emotion: ${plan.emotionCategory})`,
      })
      return new Response(JSON.stringify({ status: 'crisis_detected', letterId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 2차 LLM: 답장 생성 ───────────────────────────────────────────────
    const maxTokens  = letterType === 'long' ? 1500 : 700
    const system     = buildSystemPrompt(petForPrompt, week, isRest, letterType, pastLetters, undefined, plan)
    const userPrompt = buildUserPrompt(letter.content, ownerName, letter.emotion_tag, isRest, letterType, recentReplies, plan.keyMentions)

    const generateOnce = async (): Promise<string> => {
      const message = await anthropic.messages.create({
        model:      'claude-haiku-4-5',
        max_tokens: maxTokens,
        system,
        messages:   [{ role: 'user', content: userPrompt }],
      })
      return (message.content[0] as { type: string; text: string }).text.trim()
    }

    let content    = await generateOnce()
    let validation = validateReply(content, letter.content ?? '', recentReplyContents)
    if (!validation.ok) {
      // 1회 재생성
      content    = await generateOnce()
      validation = validateReply(content, letter.content ?? '', recentReplyContents)
      if (!validation.ok) {
        // 부적절 답장 저장 금지 → 이별유형에 맞는 fallback으로 대체
        await logSafetyEvent(adminClient, {
          letterId, userId: letter.user_id, petId: letter.pet_id,
          eventType: 'fallback_used', detail: validation.reason,
        })
        content = selectFallback(petForPrompt.farewellType, ownerName, petForPrompt.name)
      }
    }

    // 노출/알림 예약 시각: 유저 알림 설정 기준 (최신 구독, 없으면 다음날 오전 9시)
    const { data: latestSub } = await adminClient
      .from('push_subscriptions')
      .select('notif_hour, notif_minute, notif_ampm')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const visibleAt = computeVisibleAt(
      latestSub?.notif_hour   ?? 9,
      latestSub?.notif_minute ?? 0,
      latestSub?.notif_ampm   ?? '오전',
    )

    // 답장 저장 (visible_at 도래 전에는 보관함에 노출되지 않음, 푸시는 cron이 발송)
    const { data: inserted, error: insertError } = await adminClient
      .from('replies')
      .insert({
        letter_id:  letterId,
        user_id:    user.id,
        pet_id:     letter.pet_id,
        content,
        visible_at: visibleAt.toISOString(),
      })
      .select('id, content')
      .single()

    // 동시 호출 race: letter_id unique 충돌 시 기존 답장 반환
    if (insertError) {
      if (insertError.code === '23505') {
        const { data: raced } = await adminClient
          .from('replies')
          .select('id, content')
          .eq('letter_id', letterId)
          .single()
        if (raced) {
          return new Response(JSON.stringify({ id: raced.id, content: raced.content, letterId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
      throw insertError
    }
    const reply = inserted

    return new Response(JSON.stringify({ id: reply.id, content: reply.content, letterId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[generate-reply]', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
