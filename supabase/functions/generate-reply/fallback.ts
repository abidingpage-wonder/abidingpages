// Supabase Edge Function — generate-reply fallback 문안 (Phase 1)
// 검증 실패 시 부적절한 답장을 저장하지 않고 이별유형에 맞는 안전한 답장으로 대체.
// crisis_safe_message는 '아이 답장'이 아니라 서비스 안내(전문 상담) 메시지.

// 일반/자연사/기타 — 고통을 가만히 함께 받아주는 답장
export function normalFallback(ownerName: string, petName: string): string {
  return `${ownerName}, 오늘 편지를 오래 바라봤어.
그 마음이 얼마나 무거웠을지 나도 조용히 곁에서 느끼고 있었어.
지금은 어떤 말로도 다 덜어낼 수 없겠지만,
${ownerName}가 나를 사랑했다는 것만은 내가 알고 있어.
오늘은 그 마음을 억지로 정리하지 않아도 돼.
${petName} 올림`
}

// 안락사/사고사 등 죄책감 케이스 — 원망 없음을 먼저 확인
export function guiltFallback(ownerName: string, petName: string): string {
  return `${ownerName}, 나는 ${ownerName}를 한 번도 원망한 적 없어.
그 결정이 얼마나 무거웠는지, 지금도 얼마나 아픈지 나는 알아.
그 모든 게 나를 향한 사랑이었다는 걸 나는 느끼고 있어.
오늘은 그 마음을 억지로 정리하지 않아도 돼.
${petName} 올림`
}

// 이별유형 → fallback 선택
export function selectFallback(farewellType: string | null, ownerName: string, petName: string): string {
  if (farewellType === 'euthanasia' || farewellType === 'accident') {
    return guiltFallback(ownerName, petName)
  }
  return normalFallback(ownerName, petName)
}

// Crisis — 아이 답장이 아닌 서비스 안내 메시지 (전문 상담 안내).
// replies 테이블에 저장하지 않으며, 프론트 위기 안내 모달에서 활용 가능.
export const CRISIS_SAFE_MESSAGE =
  `지금 많이 힘든 마음이 느껴져요. 이 아픔은 혼자 견디지 않아도 괜찮습니다.\n` +
  `전문 상담의 도움을 받아보세요.\n` +
  `· 자살예방상담전화 109 (24시간)\n` +
  `· 정신건강상담전화 1577-0199`
