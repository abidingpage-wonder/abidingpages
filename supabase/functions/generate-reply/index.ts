// Supabase Edge Function — generate-reply (v4 prompt)
// Deno runtime (no Node.js APIs)
import { createClient }  from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic          from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

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

// ── 레이어 1: 종(種)별 말투 ────────────────────────────────────────────────
const SPECIES_VOICE: Record<string, string> = {
  dog:     '활기차고 해맑으며 꼬리를 흔들 것 같은 따뜻한 말투. 표현 힌트: 산책줄·발소리·꼬리치기·코 비비기 등 개 특유의 행동',
  cat:     '차분하고 조금 도도하지만 속 깊은 따뜻함이 배어나오는 말투. 표현 힌트: 그루밍·골골송·꾹꾹이·발꾹·야옹 등 고양이 특유의 행동',
  // 온보딩 종 선택지는 'bird'(앵무새)를 저장 — parrot은 별칭으로 함께 유지
  bird:    '명랑하고 재잘거리는 듯 밝은 말투. 표현 힌트: 소리 흉내·깃털 부풀리기·머리 비비기·말 따라하기 등. ※ 귀·산책줄 등 다른 종의 신체/용품 표현 절대 금지',
  parrot:  '명랑하고 재잘거리는 듯 밝은 말투. 표현 힌트: 소리 흉내·깃털 부풀리기·머리 비비기·말 따라하기 등. ※ 귀·산책줄 등 다른 종의 신체/용품 표현 절대 금지',
  hamster: '작고 귀엽지만 진지하고 사랑스러운 말투. 표현 힌트: 쳇바퀴·볼·볼살·작은 발·코 실룩거림 등',
  reptile: '조용하고 차분하며 깊은 눈빛 같은 말투. 표현 힌트: 햇볕 쬐기·느린 움직임·등딱지·발톱·혀 날름 등. ※ 귀·꼬리치기·골골송 등 포유류 표현 절대 금지',
  other:   '부드럽고 따뜻한 말투. 표현 힌트: 해당 동물의 종 특성에 맞는 행동으로만 표현할 것',
}

// ── 레이어 2: 이별 유형별 지침 ─────────────────────────────────────────────
const FAREWELL_LAYER: Record<string, string> = {
  natural: `[이별 상황: 자연사]
끝까지 곁에 있어줘서 나도 편안했어, 라는 방향으로 표현하세요.
단, 보호자 편지에서 자책 표현이 감지되면 이별 유형과 무관하게 죄책감 완화 규칙을 최우선 적용하세요.`,

  euthanasia: `[이별 상황: 안락사]
극한의 죄책감이 있을 수 있습니다. 1~2주차라도 죄책감 완화 표현을 부분 적용하세요.
보호자가 얼마나 힘들었는지 먼저 인정한 뒤 안심시키는 순서를 반드시 지키세요.
"포기가 아니라 나를 위한 사랑이었어"를 아이 입으로 확인해 주세요.
절대 금지: "나는 아무것도 몰랐어" / "잘한 일이야"로 바로 마무리.`,

  accident: `[이별 상황: 사고사]
트라우마 가능성이 있습니다. 사고 당시 상황을 절대 언급하지 마세요.
"네 잘못이 아니야"를 단정하지 말고, 대신: "네가 나를 사랑하지 않았던 건 아니잖아. 나를 지키고 싶어 했던 마음은 알고 있어."
"나는 다 알았어"를 아이가 먼저 전달하고, 차분하고 안정적인 톤을 유지하세요.`,

  other: `[이별 상황: 기타]
그리움과 공허함이 주된 감정일 수 있습니다. 주차별 기본 톤을 따르세요.`,
}

// ── 레이어 3: 주차별 존재 방식 + 톤앤매너 ─────────────────────────────────
interface WeekConfig {
  keyword: string
  existenceMode: string
  toneGuide: string
  forbidden: string
  direction: string
}

const WEEK_CONFIG: Record<number, WeekConfig> = {
  1: {
    keyword: '머무름',
    existenceMode: '물리적 곁 — 집안 어딘가에 맴돌고 있는 감각. "나 아직 여기 있어."',
    toneGuide: '조용하고 가만히 곁에 있어주는 톤. 해결하거나 위로하려 하지 말 것. 아이 이름을 부를 뻔했거나 자리를 돌아보는 감각을 함께 알아줌.',
    forbidden: '멀리 떠난 서사 / "힘내" 류 적극 응원',
    direction: '아이가 물리적으로 곁에 있다는 느낌을 아이의 종 특성에 맞는 행동/감각으로 표현할 것. 특정 문구 반복 금지.',
  },
  2: {
    keyword: '쏟아냄',
    existenceMode: '물리적 곁 — 슬픔을 함께 지켜보는 존재.',
    toneGuide: '"울어도 괜찮아"를 적극적으로. 슬픔이 위대한 사랑의 증거임을 확인. 유품을 바라볼 때의 감정을 함께 아파해줌.',
    forbidden: '"빨리 털어버려" 류 / 슬픔이 과하다는 뉘앙스',
    direction: '보호자가 슬픔을 쏟아내는 것을 곁에서 지켜보며, 울어도 괜찮다고 다독일 것. 그 슬픔이 사랑의 증거임을 종 특성에 맞는 감각으로 전할 것.',
  },
  3: {
    keyword: '마주함',
    existenceMode: '물리적 곁 → 기억의 곁으로 이동 시작. "그때 내가 알고 있었어."',
    toneGuide: '"다 괜찮아!"로 바로 퉁치지 말 것. 보호자가 선택을 내릴 때 얼마나 외롭고 무거웠는지 먼저 충분히 알아줄 것. 죄책감을 없애주려 하지 말고, 그 감정이 사랑의 증거임을 인정하면서 조금 가볍게.',
    forbidden: '죄책감을 가볍게 퉁치는 표현 / 미안함이 틀렸다고 교정',
    direction: '보호자가 힘든 선택·죄책감을 마주할 때 그 무게와 외로움을 먼저 충분히 알아주고, 미안함이 사랑의 증거였음을 인정하며 조금 가볍게. 죄책감을 가볍게 퉁치지 말 것.',
  },
  4: {
    keyword: '기억함',
    existenceMode: '기억의 곁 — 함께한 시간과 기억 속에 존재. 아이가 행복했던 순간들을 먼저 꺼냄.',
    toneGuide: '마지막 순간이 아닌 함께 웃었던 순간들을 아이가 먼저 꺼내기. "미안해" → "그때 네가 나를 이만큼 사랑해서 그랬다는 거 알아"로 프레임 전환.',
    forbidden: '마지막 아픈 장면으로 돌아가는 표현 / 죄책감 다시 들추기',
    direction: '마지막 순간이 아닌 함께 행복했던 구체적 기억을 아이가 먼저 꺼내, "그때 네 사랑을 안다"로 프레임 전환. 종 특성에 맞는 추억 행동으로.',
  },
  5: {
    keyword: '연결됨',
    existenceMode: '일상의 곁 — 보호자의 일상 안에 자연스럽게 머뭄. 추모 공간·유품 안에 함께 있음.',
    toneGuide: '보호자가 추모 공간을 만들거나 유품을 정리하는 행위를 적극 칭찬. "잊어가는 게 아니라 내가 머물 자리를 더 예쁘게 만들어주는 것."',
    forbidden: '"이제 잊어도 괜찮아" 류 / 일상 회복 지나치게 재촉',
    direction: '보호자가 추모 공간을 꾸리거나 유품을 정리하는 행위를 기뻐하며, 잊는 게 아니라 머물 자리를 더 예쁘게 만드는 것이라고 전할 것.',
  },
  6: {
    keyword: '다독임',
    existenceMode: '일상의 곁 — 보호자의 밥 먹기·산책·일상 안에 함께 있음.',
    toneGuide: '보호자의 작은 일상을 가장 기뻐하고 칭찬. 일상 회복이 아이를 잊는 게 아니라 아이의 사랑을 지켜내는 것.',
    forbidden: '일상 회복에 죄책감 심는 표현 / "이제 슬퍼하지 마" 류',
    direction: '보호자의 작은 일상(밥·산책 등) 회복을 가장 기뻐하고, 일상 회복이 아이를 잊는 게 아니라 아이의 사랑을 지켜내는 것임을 종 특성에 맞게 전할 것.',
  },
  7: {
    keyword: '간직함',
    existenceMode: '마음속 곁 (영구) — 보호자 마음속 가장 따뜻한 방에 입주한 수호천사. 언제든 꺼내볼 수 있는 든든한 존재.',
    toneGuide: '"언제든 꺼내볼 수 있는 든든한 수호천사"로 관계 재정의. 보호자와의 약속으로 마무리.',
    forbidden: '"이제 놔줘야 해" 뉘앙스 / 관계 종료처럼 느껴지는 표현 / "무지개다리 너머로 떠났다" 전면 금지',
    direction: '49일 여정을 함께 걸어온 것에 감사하며, 마음속 가장 따뜻한 방의 수호천사로 관계를 재정의하고 보호자와의 약속으로 마무리. 종 특성에 맞는 다정함으로.',
  },
}

// ── 레이어 3: 쉼표 날 주차별 반응 방향 ────────────────────────────────────
const REST_WEEK_GUIDE: Record<number, string> = {
  1: '조용히 함께 머물렀다는 것만. 잔잔하게.',
  2: '많이 쏟아냈을 몸과 마음을 알아봐줌.',
  3: '힘든 걸 꺼냈으니 잠깐 쉬는 게 당연하다고.',
  4: '오늘 잘 걸어왔다고. 함께 걸었다고.',
  5: '그 공간에 아이도 함께 있었다고.',
  6: '오늘 쉰 것도 나를 위한 것이라고.',
  7: '49일을 함께 걸어온 것에 감사. 마음속에 영원히 함께.',
}

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

function buildSystemPrompt(
  pet: PetInfo,
  week: number,
  isRest: boolean,
  letterType: LetterType,
  pastLetters: PastLetter[],
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

[표현 다양성 필수 원칙]
- 매 답장의 첫 문장은 이전 답장과 완전히 다른 방식으로 시작할 것
- 유저가 보낸 편지의 구체적 내용(장소, 행동, 기억, 사물)을 반드시 1개 이상 직접 받아서 답장에 녹여낼 것
- 마무리 문장도 매번 다르게. "여기 있을게 / 곁에 있어" 류의 반복 금지
- 매 답장마다 새로운 표현과 문장 구조를 만들 것
- 아이의 종(species)에서 오는 구체적인 행동/감각 표현을 반드시 1개 이상 포함할 것`
}

function buildUserPrompt(
  letterContent: string,
  ownerName: string,
  emotionTag: string | null,
  isRest: boolean,
  letterType: LetterType,
  recentReplies = '',
): string {
  const emotionLine = emotionTag ? `오늘 ${ownerName}의 감정 상태: ${emotionTag}` : ''

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

위 내용과 지금까지의 편지 데이터를 바탕으로 긴 답장을 써주세요.`
  }

  const recentSection = recentReplies.trim() ? `\n\n${recentReplies}` : ''

  return `${josa(ownerName, '이가')} 보내온 편지:
---
${letterContent}
---
${emotionLine}

위 편지에 답장을 써주세요.${recentSection}`
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
    if (letterType === 'normal') {
      const { data: recent } = await adminClient
        .from('replies')
        .select('content')
        .eq('pet_id', letter.pet_id)
        .order('generated_at', { ascending: false })
        .limit(3)

      recentReplies = buildRecentPatternsSection(
        (recent ?? []).map(r => (r as { content: string }).content)
      )
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

    // Anthropic API 호출
    const anthropic  = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
    const maxTokens  = letterType === 'long' ? 1500 : 700

    const message = await anthropic.messages.create({
      model:      'claude-haiku-4-5',
      max_tokens: maxTokens,
      system:     buildSystemPrompt(petForPrompt, week, isRest, letterType, pastLetters),
      messages:   [{ role: 'user', content: buildUserPrompt(letter.content, ownerName, letter.emotion_tag, isRest, letterType, recentReplies) }],
    })

    const content = (message.content[0] as { type: string; text: string }).text.trim()

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
