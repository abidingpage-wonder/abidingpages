// Supabase Edge Function — generate-reply 금지 규칙 검증기 (Phase 1, regex only / LLM 없음)
//
// Level 1 — 절대 금지(서사 차단): 검출 시 실패
// Level 2 — 상황부 금지(위치 조건): 안심 표현이 '감정 인정'보다 앞이면 실패
// Level 3 — 품질 경고: 직전 답장과 중복 시 경고(실패 아님)

export interface ValidationResult {
  ok: boolean
  level: 1 | 2 | 3 | null
  reason: string
  warning?: string   // Level 3 경고 (ok=true와 공존 가능)
}

// ── Level 1: 절대 금지 서사 ────────────────────────────────────────────────
// "무지개다리"는 보호자가 먼저 쓴 경우에만 예외 허용 → 별도 처리
const L1_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /무지개\s*다리\s*(를\s*)?(건너|너머|넘어)/, label: '무지개다리 분리 서사' },
  { re: /천국에서\s*(행복|잘)/, label: '천국 행복 서사' },
  { re: /(여긴|여기는|이곳은)\s*(하나도\s*)?안\s*아파/, label: '고통 없는 천국 서사' },
  { re: /(난|나는)\s*매일\s*행복/, label: '완벽한 행복 서사' },
  { re: /(난|나는)\s*(이제\s*)?(이미\s*)?떠났/, label: '이별 종료 서사' },
  { re: /(이제\s*)?(나를|날)\s*보내\s*(줘|주세요|줘도)/, label: '관계 종료 요청' },
  { re: /(이제\s*)?(나를|날|나)\s*잊어도\s*(돼|괜찮)/, label: '망각 종용' },
]

// ── Level 2: 상황부 금지(섣부른 안심) ──────────────────────────────────────
const L2_REASSURANCE = /(걱정\s*마|걱정하지\s*마|괜찮아|다\s*괜찮|힘내|잘\s*될\s*거야|잘될\s*거야)/

// 감정 인정 패턴 — 좁게(오탐 방지). 단독 "알아"는 인정으로 보지 않음.
const L2_ACKNOWLEDGE_PATTERNS: RegExp[] = [
  /얼마나[^.!?…~\n]*했는지\s*알아/,
  /[^.!?…~\n]*마음\s*(을|도|은|를)?\s*알아/,
  /[^.!?…~\n]*힘들었는지\s*알아/,
  /[^.!?…~\n]*무거웠는지\s*알아/,
  /울었구나/,
  /미안했구나/,
]

// ── Level 3: 품질 경고(상투 반복) ──────────────────────────────────────────
const L3_PATTERNS: RegExp[] = [
  /언제나\s*지켜보고\s*있어/,
  /항상\s*함께야/,
  /영원히\s*곁에\s*있어/,
]

function firstIndex(text: string, re: RegExp): number {
  const m = re.exec(text)
  return m ? m.index : -1
}

/**
 * 답장 검증.
 * @param reply        생성된 답장 본문
 * @param guardianLetter 보호자 원문(무지개다리 예외 판별용)
 * @param recentReplies 직전 답장 본문 배열(Level 3 중복 검사용)
 */
export function validateReply(
  reply: string,
  guardianLetter = '',
  recentReplies: string[] = [],
): ValidationResult {
  const text = (reply ?? '').replace(/\s+/g, ' ').trim()
  const guardianUsedRainbow = /무지개\s*다리/.test(guardianLetter ?? '')

  // Level 1
  for (const { re, label } of L1_PATTERNS) {
    if (re.test(text)) {
      // 무지개다리는 보호자가 먼저 쓴 경우 예외
      if (label === '무지개다리 분리 서사' && guardianUsedRainbow) continue
      return { ok: false, level: 1, reason: `Level1 금지 서사: ${label}` }
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
      return { ok: false, level: 2, reason: 'Level2: 고통 인정 전에 섣부른 안심 등장' }
    }
  }

  // Level 3 — 경고만 (실패 아님)
  const recentNorm = recentReplies.map(r => (r ?? '').replace(/\s+/g, ' '))
  for (const re of L3_PATTERNS) {
    if (re.test(text) && recentNorm.some(r => re.test(r))) {
      return { ok: true, level: 3, reason: '', warning: 'Level3: 직전 답장과 상투 표현 반복' }
    }
  }

  return { ok: true, level: null, reason: '' }
}
