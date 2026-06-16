// Supabase Edge Function — generate-reply Phase 4 메모리 추출·갱신
//
// 답장 생성 완료 후 호출 — 새 편지를 기반으로 펫별 요약 프로필 갱신.
// 오류 시 조용히 실패 (답장 생성 결과에 영향 없음).

import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'
// deno-lint-ignore no-explicit-any
type SupabaseClient = any

export interface MemoryProfile {
  recurring_guilt:  string   // 반복 죄책감·자책 패턴
  favorite_memory:  string   // 자주 언급되는 추억·장소·사물
  pet_trait:        string   // 아이의 성격·습관·특징
  guardian_pattern: string   // 보호자의 표현 방식·감정 패턴
}

const EMPTY_PROFILE: MemoryProfile = {
  recurring_guilt:  '',
  favorite_memory:  '',
  pet_trait:        '',
  guardian_pattern: '',
}

export function hasProfile(profile: MemoryProfile | null | undefined): boolean {
  if (!profile) return false
  return !!(profile.recurring_guilt || profile.favorite_memory || profile.pet_trait || profile.guardian_pattern)
}

const EXTRACT_TOOL: Anthropic.Tool = {
  name: 'update_memory_profile',
  description: '보호자 편지를 바탕으로 펫별 메모리 프로필을 갱신합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      recurring_guilt: {
        type: 'string',
        description: '보호자가 반복적으로 표현하는 죄책감·자책 내용 (안락사 결정, 마지막 순간 부재 등). 60자 이내. 없으면 기존 값 유지.',
      },
      favorite_memory: {
        type: 'string',
        description: '편지에 자주 등장하는 구체적 추억·장소·사물·행동 (공원 산책, 특정 간식, 좋아하던 자리 등). 60자 이내. 없으면 기존 값 유지.',
      },
      pet_trait: {
        type: 'string',
        description: '편지에서 드러나는 아이의 성격·행동·특징·습관. 60자 이내. 없으면 기존 값 유지.',
      },
      guardian_pattern: {
        type: 'string',
        description: '보호자의 표현 방식, 감정 패턴, 글쓰기 스타일 (직접 감정 표현 vs 행동 묘사, 자책 경향 등). 60자 이내. 없으면 기존 값 유지.',
      },
    },
    required: ['recurring_guilt', 'favorite_memory', 'pet_trait', 'guardian_pattern'],
  },
}

/**
 * 새 편지를 기반으로 메모리 프로필을 갱신하고 DB에 저장.
 *
 * @param anthropic     Anthropic 클라이언트
 * @param adminClient   Supabase service role 클라이언트
 * @param petId         펫 ID
 * @param letterContent 보호자 편지 원문
 * @param week          현재 주차
 * @param current       기존 메모리 프로필 (없으면 null)
 */
export async function updateMemoryProfile(
  anthropic: Anthropic,
  adminClient: SupabaseClient,
  petId: string,
  letterContent: string,
  week: number,
  current: MemoryProfile | null,
): Promise<void> {
  const prev = current ?? EMPTY_PROFILE

  const prompt = [
    '[현재 메모리 프로필]',
    `recurring_guilt: "${prev.recurring_guilt}"`,
    `favorite_memory: "${prev.favorite_memory}"`,
    `pet_trait: "${prev.pet_trait}"`,
    `guardian_pattern: "${prev.guardian_pattern}"`,
    '',
    `[새 편지 — ${week}주차]`,
    '---',
    (letterContent ?? '').slice(0, 600),
    '---',
    '',
    'update_memory_profile 도구로 프로필을 갱신하세요.',
    '각 필드 규칙:',
    '1. 새 편지에 해당 필드 관련 새 정보가 있으면: 기존 내용 + 새 정보를 통합해 반환 (60자 이내).',
    '2. 새 편지에 관련 정보가 없으면: 기존 값을 그대로 반환.',
    '3. 과거 정보를 삭제하지 말 것. 누적 요약으로 관리.',
  ].join('\n')

  try {
    const message = await anthropic.messages.create({
      model:       'claude-haiku-4-5',
      max_tokens:  400,
      tools:       [EXTRACT_TOOL],
      tool_choice: { type: 'tool', name: 'update_memory_profile' },
      messages:    [{ role: 'user', content: prompt }],
    })

    const toolBlock = message.content.find((b: { type: string }) => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      console.warn('[memoryExtractor] no tool_use block — skipping update')
      return
    }

    const i = toolBlock.input as Partial<MemoryProfile>
    const merged: MemoryProfile = {
      recurring_guilt:  (typeof i.recurring_guilt  === 'string' ? i.recurring_guilt  : prev.recurring_guilt).slice(0, 120),
      favorite_memory:  (typeof i.favorite_memory  === 'string' ? i.favorite_memory  : prev.favorite_memory).slice(0, 120),
      pet_trait:        (typeof i.pet_trait        === 'string' ? i.pet_trait        : prev.pet_trait).slice(0, 120),
      guardian_pattern: (typeof i.guardian_pattern === 'string' ? i.guardian_pattern : prev.guardian_pattern).slice(0, 120),
    }

    const { error } = await adminClient
      .from('pets')
      .update({ memory_profile: merged })
      .eq('id', petId)

    if (error) {
      console.error('[memoryExtractor] DB update error:', error)
    } else {
      console.log('[memoryExtractor] profile updated:', petId)
    }
  } catch (err) {
    console.error('[memoryExtractor] failed:', err)
  }
}
