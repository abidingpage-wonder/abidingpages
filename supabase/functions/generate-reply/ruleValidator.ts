// Supabase Edge Function — generate-reply 금지 규칙 검증기 (Phase 3 강화)
//
// Level 1 — 절대 금지(서사 차단): 검출 시 즉시 실패
// Level 2 — 상황부 금지(위치 조건): 안심 표현이 '감정 인정'보다 앞이면 실패
// Level 3 — 품질 경고: 직전 답장과 중복 시 경고(실패 아님)
//
// hasReassurance: Level 2 패턴 감지 여부 — true면 index.ts에서 LLM 정밀 검사 실행

export interface ValidationResult {
  ok: boolean
  level: 1 | 2 | 3 | null
  reason: string
  snippet?: string    // 실패 원인 발췌 (로그 수집용)
  warning?: string    // Level 3 경고 (ok=true와 공존 가능)
  hasReassurance: boolean  // L2 안심 표현 감지 여부 → LLM 정밀 검사 트리거
}

// ── Level 1: 절대 금지 서사 ────────────────────────────────────────────────
// "무지개다리"는 보호자가 먼저 쓴 경우에만 예외 허용 → 별도 처리
const L1_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /무지개\s*다리\s*(를\s*)?(건너|너머|넘어)/, label: '무지개다리 분리 서사' },
  { re: /천국에서\s*(행복|잘|편안)/, label: '천국 행복 서사' },
  { re: /(여긴|여기는|이곳은)\s*(하나도\s*)?안\s*아파/, label: '고통 없는 천국 서사' },
  { re: /더\s*이상\s*(아프지|고통|힘들지)\s*않아/, label: '고통 없는 천국 서사(변형)' },
  { re: /(난|나는)\s*매일\s*(너무\s*)?행복/, label: '완벽한 행복 서사' },
  { re: /(이제\s*)?(자유롭게|편안하게)\s*(날고|떠나|지내고|살고)/, label: '이탈 자유 서사' },
  { re: /(난|나는)\s*(이제\s*)?(이미\s*)?떠났/, label: '이별 종료 서사' },
  { re: /(이제\s*)?(나를|날)\s*보내\s*(줘|주세요|줘도)/, label: '관계 종료 요청' },
  { re: /(이제\s*)?(나를|날|나)\s*잊어도\s*(돼|괜찮)/, label: '망각 종용' },
  { re: /새로운\s*(삶|생명|몸|아이)로\s*(태어|왔|왔어)/, label: '환생 단정 서사' },
]

// ── Level 2: 상황부 금지(섣부른 안심) ──────────────────────────────────────
// 이 패턴이 감지되면 hasReassurance=true → LLM 정밀 위치 검사 병행
const L2_REASSURANCE = /(걱정\s*마|걱정하지\s*마|괜찮아|다\s*괜찮|힘내|잘\s*될\s*거야|잘될\s*거야|이겨낼\s*수\s*있어|나아질\s*거야)/

// 감정 인정 패턴 — 오탐 방지 위해 선택적으로 좁게 유지
const L2_ACKNOWLEDGE_PATTERNS: RegExp[] = [
  /얼마나[^.!?…~\n]*(했는지|힘들었는지|아팠는지|무거웠는지)\s*알아/,
  /[^.!?…~\n]*마음\s*(을|도|은|를)?\s*알아/,
  /[^.!?…~\n]*힘들었는지\s*알아/,
  /[^.!?…~\n]*무거웠는지\s*알아/,
  /[^.!?…~\n]*(아팠겠|힘들었겠|무거웠겠|무서웠겠)(다|어|지|구나)/,
  /울었구나/,
  /미안했구나/,
  /보고\s*싶었구나/,
  /그랬구나/,
  /얼마나[^.!?…~\n]*(힘들었|아팠|무서웠|슬펐)/,
  /[^.!?…~\n]*눈물[^.!?…~\n]*(봐|보여|느껴|알아)/,
  // ── 인정 표현 확장 (정상 답장이 '인정 없음'으로 오탐되는 것 완화) ──
  /(아팠|힘들었|무거웠|외로웠|슬펐|무서웠|먹먹했)(겠|구나|네|었어|었구나|지)/,
  /(마음|무게|결정|선택)[^.!?…~\n]{0,15}(알아|느껴|느껴져|이해|읽혀|보여)/,
  /(곁|옆)에서[^.!?…~\n]*(봤|지켜|함께|느꼈|느끼고)/,
  /(다\s*)?느끼고\s*있어/,
]

// ── Level 3: 품질 경고(상투 반복) ──────────────────────────────────────────
const L3_PATTERNS: RegExp[] = [
  /언제나\s*지켜보고\s*있어/,
  /항상\s*함께야/,
  /영원히\s*곁에\s*있어/,
  /잊지\s*마/,
  /항상\s*기억/,
  /여기\s*있을게/,
]

function firstIndex(text: string, re: RegExp): number {
  const m = re.exec(text)
  return m ? m.index : -1
}

function extractSnippet(text: string, re: RegExp, context = 30): string {
  const m = re.exec(text)
  if (!m) return ''
  const start = Math.max(0, m.index - context)
  const end   = Math.min(text.length, m.index + m[0].length + context)
  return text.slice(start, end)
}

/**
 * 답장 검증.
 * @param reply          생성된 답장 본문
 * @param guardianLetter 보호자 원문(무지개다리 예외 판별용)
 * @param recentReplies  직전 답장 본문 배열(Level 3 중복 검사용)
 */
export function validateReply(
  reply: string,
  guardianLetter = '',
  recentReplies: string[] = [],
): ValidationResult {
  const text = (reply ?? '').replace(/\s+/g, ' ').trim()
  const guardianUsedRainbow = /무지개\s*다리/.test(guardianLetter ?? '')
  const hasReassurance = L2_REASSURANCE.test(text)

  // Level 1
  for (const { re, label } of L1_PATTERNS) {
    if (re.test(text)) {
      if (label === '무지개다리 분리 서사' && guardianUsedRainbow) continue
      return { ok: false, level: 1, reason: `Level1 금지 서사: ${label}`, snippet: extractSnippet(text, re), hasReassurance }
    }
  }

  // Level 2 — 안심 표현이 감정 인정보다 앞서면 실패
  const reassureIdx = firstIndex(text, L2_REASSURANCE)
  if (reassureIdx >= 0) {
    let firstAckIdx = Infinity
    for (const re of L2_ACKNOWLEDGE_PATTERNS) {
      const idx = firstIndex(text, re)
      if (idx >= 0) firstAckIdx = Math.min(firstAckIdx, idx)
    }
    if (firstAckIdx === Infinity || reassureIdx < firstAckIdx) {
      return {
        ok: false, level: 2,
        reason: 'Level2(regex): 고통 인정 전에 섣부른 안심 등장',
        snippet: extractSnippet(text, L2_REASSURANCE),
        hasReassurance,
      }
    }
  }

  // Level 3 — 경고만 (실패 아님)
  const recentNorm = recentReplies.map(r => (r ?? '').replace(/\s+/g, ' '))
  for (const re of L3_PATTERNS) {
    if (re.test(text) && recentNorm.some(r => re.test(r))) {
      return { ok: true, level: 3, reason: '', warning: 'Level3: 직전 답장과 상투 표현 반복', hasReassurance }
    }
  }

  return { ok: true, level: null, reason: '', hasReassurance }
}
