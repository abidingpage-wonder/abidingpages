// 인앱 브라우저(웹뷰) 감지 + 외부 브라우저로 열기 헬퍼.
// 인스타/스레드/페이스북 등 인앱 웹뷰에서는 카카오 OAuth 가 PKCE 쿠키 유실·컨텍스트
// 분리로 자주 실패한다 → 감지 시 외부 브라우저(Safari/Chrome)로 유도한다.

export type InAppKind = 'instagram' | 'threads' | 'facebook' | 'kakaotalk' | 'naver' | 'line' | 'other'

// UA 토큰 → 인앱 종류. 순서 중요(스레드는 Barcelona, 인스타/페북은 FBAN/FBAV 공유).
const RULES: { kind: InAppKind; test: RegExp }[] = [
  { kind: 'instagram', test: /Instagram/i },
  { kind: 'threads', test: /Barcelona|Threads/i },
  { kind: 'kakaotalk', test: /KAKAOTALK/i },
  { kind: 'naver', test: /NAVER\(inapp|whale/i },
  { kind: 'line', test: /\bLine\//i },
  { kind: 'facebook', test: /FBAN|FBAV|FB_IAB/i },
]

export function detectInApp(ua?: string): InAppKind | null {
  const agent = ua ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '')
  if (!agent) return null
  for (const r of RULES) {
    if (r.test.test(agent)) return r.kind
  }
  return null
}

export function isInAppBrowser(ua?: string): boolean {
  return detectInApp(ua) !== null
}

const KIND_LABEL: Record<InAppKind, string> = {
  instagram: '인스타그램',
  threads: '스레드',
  facebook: '페이스북',
  kakaotalk: '카카오톡',
  naver: '네이버',
  line: '라인',
  other: '인앱',
}

export function inAppLabel(kind: InAppKind | null): string {
  return kind ? KIND_LABEL[kind] : '인앱'
}

// 외부 브라우저로 현재 URL 열기 시도.
// Android: chrome intent 스킴으로 크롬 열기. iOS: 인앱→기본브라우저 자동 전환 불가 →
// 호출부에서 "URL 복사 후 Safari로 열기" 안내로 폴백.
export function openInExternalBrowser(url?: string) {
  if (typeof window === 'undefined') return
  const target = url ?? window.location.href
  const ua = navigator.userAgent
  const isAndroid = /Android/i.test(ua)

  if (isAndroid) {
    const noScheme = target.replace(/^https?:\/\//, '')
    // 크롬으로 강제 오픈 (없으면 사용자가 직접 선택)
    window.location.href = `intent://${noScheme}#Intent;scheme=https;package=com.android.chrome;end`
    return
  }
  // iOS 등: 자동 전환 불가 → 새 탭 시도(대부분 인앱 내에서 열림). 호출부에서 복사 폴백 안내.
  window.open(target, '_blank')
}
