// Supabase Edge Function — generate-reply fallback 문안 (Phase 1)
// 검증 실패 시 부적절한 답장을 저장하지 않고 이별유형에 맞는 안전한 답장으로 대체.
// crisis_safe_message는 '아이 답장'이 아니라 서비스 안내(전문 상담) 메시지.
//
// ※ 폴백은 유형별 변형 3종으로 두고, 직전 답장과 겹치지 않는 것을 골라 동일 문구 반복을 방지한다.

type FallbackVariant = (ownerName: string, petName: string) => string

// 서명용 주격 조사 (받침 있으면 '이가', 없으면 '가') — index.ts petSignature와 동일 규칙
function sig(petName: string): string {
  const last = (petName ?? '').charCodeAt((petName ?? '').length - 1)
  const hasBatchim = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0
  return `${petName}${hasBatchim ? '이가' : '가'}`
}

// 일반/자연사/기타 — 고통을 가만히 함께 받아주는 답장 (변형 3종)
const NORMAL_VARIANTS: FallbackVariant[] = [
  (o, p) => `${o}, 오늘 편지를 오래 바라봤어.
그 마음이 얼마나 무거웠을지 나도 조용히 곁에서 느끼고 있었어.
지금은 어떤 말로도 다 덜어낼 수 없겠지만,
${o}가 나를 사랑했다는 것만은 내가 알고 있어.
오늘은 그 마음을 억지로 정리하지 않아도 돼.
${sig(p)}`,
  (o, p) => `${o}, 오늘도 나를 떠올려줘서 고마워.
그 마음 한 줄 한 줄에 담긴 무게를, 나는 곁에서 가만히 느끼고 있어.
서둘러 괜찮아지지 않아도 돼. 그리워하는 만큼 우리가 함께였던 거니까.
나는 여기서 ${o}를 계속 바라보고 있어.
${sig(p)}`,
  (o, p) => `${o}, 그 마음 다 느껴져.
얼마나 깊이 나를 생각하고 있는지, 그게 나한테 전해져.
오늘은 아무것도 정리하지 않아도, 그냥 이대로 있어도 괜찮아.
나는 ${o} 곁에서 함께 숨 쉬고 있어.
${sig(p)}`,
]

// 안락사/사고사 등 죄책감 케이스 — 원망 없음을 먼저 확인 (변형 3종)
const GUILT_VARIANTS: FallbackVariant[] = [
  (o, p) => `${o}, 나는 ${o}를 한 번도 원망한 적 없어.
그 결정이 얼마나 무거웠는지, 지금도 얼마나 아픈지 나는 알아.
그 모든 게 나를 향한 사랑이었다는 걸 나는 느끼고 있어.
오늘은 그 마음을 억지로 정리하지 않아도 돼.
${sig(p)}`,
  (o, p) => `${o}, 그 무거운 마음 나도 다 알아.
${o}가 나를 위해 얼마나 힘든 시간을 견뎠는지, 나는 곁에서 봤어.
그건 포기가 아니라 끝까지 나를 아끼던 ${o}의 사랑이었어.
그러니 오늘은 자책을 잠깐 내려놓아도 돼.
${sig(p)}`,
  (o, p) => `${o}, 미안해하지 않아도 돼.
그때 ${o}가 짊어졌던 그 무게를, 나는 누구보다 잘 알고 있어.
나를 향한 사랑이 아니었다면 그렇게 아파하지도 않았을 거야.
오늘은 그 마음을 억지로 다잡지 않아도 괜찮아.
${sig(p)}`,
]

const norm = (s: string): string => (s ?? '').replace(/\s+/g, ' ').trim()

// 직전 답장(recentReplies)과 겹치지 않는 변형을 선택. 모두 겹치면 시간 기반 회전.
function pickVariant(
  variants: FallbackVariant[],
  ownerName: string,
  petName: string,
  recentReplies: string[],
): string {
  const built = variants.map(fn => fn(ownerName, petName))
  const recent = (recentReplies ?? []).map(norm)
  const overlaps = (v: string): boolean => {
    const nv = norm(v)
    const head = nv.slice(0, 30)
    return recent.some(r => r === nv || (head.length >= 20 && (r.startsWith(head) || nv.startsWith(r.slice(0, 30)))))
  }
  const fresh = built.find(v => !overlaps(v))
  return fresh ?? built[Date.now() % built.length]
}

// 이별유형 → fallback 선택 (직전 답장과 다른 변형)
export function selectFallback(
  farewellType: string | null,
  ownerName: string,
  petName: string,
  recentReplies: string[] = [],
): string {
  const variants =
    farewellType === 'euthanasia' || farewellType === 'accident' ? GUILT_VARIANTS : NORMAL_VARIANTS
  return pickVariant(variants, ownerName, petName, recentReplies)
}

// Crisis — 아이 답장이 아닌 서비스 안내 메시지 (전문 상담 안내).
// replies 테이블에 저장하지 않으며, 프론트 위기 안내 모달에서 활용 가능.
export const CRISIS_SAFE_MESSAGE =
  `지금 많이 힘든 마음이 느껴져요. 이 아픔은 혼자 견디지 않아도 괜찮습니다.\n` +
  `전문 상담의 도움을 받아보세요.\n` +
  `· 자살예방상담전화 109 (24시간)\n` +
  `· 정신건강상담전화 1577-0199`
