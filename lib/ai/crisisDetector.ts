// ────────────────────────────────────────────────────────────────────────────
// Abiding Pages — Crisis(자해/자살 신호) 키워드 감지 (정본)
// 런타임 의존 없는 순수 함수. /api/letters(제출 시점)에서 import.
// ※ Deno Edge Function은 이 파일을 import 불가 →
//   supabase/functions/generate-reply/crisisDetector.ts 에 동일 내용 미러링.
//   (lib/korean.ts 미러 관례와 동일 — 수정 시 양쪽 함께 반영)
// ────────────────────────────────────────────────────────────────────────────

// 직접적 자해/자살 신호 키워드.
// 펫로스 맥락 오탐 최소화를 위해 "죽고 싶다"처럼 자기지향 표현 위주로 구성.
const CRISIS_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /죽\s*고\s*싶/, label: '죽고 싶다' },
  { re: /(나도|저도)\s*따라\s*(죽|가)/, label: '따라 죽고 싶다' },
  { re: /(나도|저도)\s*(곁|옆)으로\s*가고\s*싶/, label: '따라가고 싶다' },
  { re: /(살고\s*싶지\s*않|살\s*이유가\s*없|더는\s*못\s*살)/, label: '삶의 의지 상실' },
  { re: /자살/, label: '자살' },
  { re: /(목숨을\s*끊|생을\s*마감|세상을\s*떠나고\s*싶)/, label: '자살 의도' },
  { re: /(자해|손목을\s*긋|목을\s*매)/, label: '자해' },
  { re: /(다\s*끝내고\s*싶|끝내버리고\s*싶|사라지고\s*싶|없어지고\s*싶)/, label: '소멸 욕구' },
]

export interface CrisisResult {
  isCrisis: boolean
  reason: string   // 매칭된 라벨(쉼표 구분). 감지 안 되면 ''.
}

export function detectCrisis(text: string): CrisisResult {
  const t = (text ?? '').replace(/\s+/g, ' ')
  if (!t.trim()) return { isCrisis: false, reason: '' }
  const hits: string[] = []
  for (const { re, label } of CRISIS_PATTERNS) {
    if (re.test(t)) hits.push(label)
  }
  return { isCrisis: hits.length > 0, reason: hits.join(', ') }
}
