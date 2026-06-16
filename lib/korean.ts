// 한글 조사(josa) 자동 처리 — 받침 유무에 맞는 조사 선택
// 의존성 없는 순수 함수. 펫 이름/호칭이 문장에 끼워질 때 사용.

/** 마지막 문자가 한글 받침(종성)을 가지면 true. 한글이 아니면 false(모음형으로 처리). */
export function hasBatchim(word: string): boolean {
  const s = (word ?? '').trim()
  if (!s) return false
  const code = s.charCodeAt(s.length - 1)
  // 한글 음절 영역: 0xAC00(가) ~ 0xD7A3(힣)
  if (code < 0xac00 || code > 0xd7a3) return false
  return (code - 0xac00) % 28 !== 0
}

type Pair = '을를' | '이가' | '은는' | '와과' | '아야'

// [받침 있을 때, 받침 없을 때]
const PARTICLES: Record<Pair, [string, string]> = {
  을를: ['을', '를'],
  이가: ['이', '가'],
  은는: ['은', '는'],
  와과: ['과', '와'],
  아야: ['아', '야'],
}

/** 호칭/일반명사 + 조사 (친근형 '이' 접미사 없음). 예: josa('주인님','이가')='주인님이' */
export function josa(word: string, pair: Pair): string {
  const [withBatchim, noBatchim] = PARTICLES[pair]
  return word + (hasBatchim(word) ? withBatchim : noBatchim)
}

/** 친근형 이름: 받침 있으면 '이' 접미사. petLabel('탄탄')='탄탄이', petLabel('순리')='순리' */
export function petLabel(name: string): string {
  return name + (hasBatchim(name) ? '이' : '')
}

/** 펫 이름 + 조사(친근형). petJosa('탄탄','을를')='탄탄이를', petJosa('순리','을를')='순리를' */
export function petJosa(name: string, pair: Pair): string {
  return josa(petLabel(name), pair)
}

/** 서술격 조사 '(이)에요'. ida('탄탄')='탄탄이에요', ida('미우')='미우예요' */
export function ida(word: string): string {
  return word + (hasBatchim(word) ? '이에요' : '예요')
}

/** 이름에 친근형 '이' 접미사. nameWithI('탄탄')='탄탄이', nameWithI('순리')='순리' */
export const nameWithI = petLabel
