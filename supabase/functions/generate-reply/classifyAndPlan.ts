// Supabase Edge Function — generate-reply Phase 2
// 1차 LLM 호출: 편지 분류 + 답장 전략 수립 (tool_use JSON)
// 결과(PlanResult)는 2차 호출(buildSystemPrompt/buildUserPrompt)에 주입됨.

import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

export interface PlanResult {
  riskLevel: 'safe' | 'moderate' | 'high'
  emotionCategory: 'grief' | 'guilt' | 'anger' | 'anxiety' | 'yearning' | 'gratitude' | 'numb' | 'mixed'
  guardianUsedRainbow: boolean  // 보호자가 "무지개다리" 직접 사용했는지
  keyMentions: string[]         // 답장에 반드시 반영할 구체 요소 (최대 3개)
  replyApproach: string         // 이 편지에 맞는 답장 방향 한 줄
}

const PLAN_DEFAULT: PlanResult = {
  riskLevel: 'safe',
  emotionCategory: 'grief',
  guardianUsedRainbow: false,
  keyMentions: [],
  replyApproach: '',
}

const CLASSIFY_TOOL: Anthropic.Tool = {
  name: 'classify_letter',
  description: '보호자 편지를 분석해 답장 생성 전략을 반환합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      riskLevel: {
        type: 'string',
        enum: ['safe', 'moderate', 'high'],
        description: 'safe=일반, moderate=강한 죄책감·삶의 의지 저하, high=자해·자살 신호(직접·우회 모두)',
      },
      emotionCategory: {
        type: 'string',
        enum: ['grief', 'guilt', 'anger', 'anxiety', 'yearning', 'gratitude', 'numb', 'mixed'],
      },
      guardianUsedRainbow: {
        type: 'boolean',
        description: '보호자가 편지에서 "무지개다리" 표현을 직접 사용했는지',
      },
      keyMentions: {
        type: 'array',
        items: { type: 'string' },
        description: '편지에 등장한 구체적 요소(장소·사물·행동·기억) — 답장에 반드시 녹여낼 것, 최대 3개',
      },
      replyApproach: {
        type: 'string',
        description: '이 편지에 맞는 답장 방향 한 줄 (80자 이내)',
      },
    },
    required: ['riskLevel', 'emotionCategory', 'guardianUsedRainbow', 'keyMentions', 'replyApproach'],
  },
}

/**
 * 편지를 분석해 답장 생성 전략을 반환.
 * 내부 오류 시 PLAN_DEFAULT를 반환 — 분류 실패가 답장 생성 전체를 막지 않음.
 */
export async function classifyAndPlan(
  anthropic: Anthropic,
  letterContent: string,
  petName: string,
  farewellType: string | null,
  week: number,
): Promise<PlanResult> {
  const prompt = `펫 이름: ${petName} / 이별 유형: ${farewellType ?? '기타'} / ${week}주차

보호자 편지:
---
${(letterContent ?? '').slice(0, 800)}
---

classify_letter 도구로 분석하세요.
riskLevel 기준: 자해·자살 의도(직접·우회 모두)가 감지되면 high, 강한 죄책감·삶의 의지 저하면 moderate, 그 외 safe.
keyMentions: 편지에 실제로 등장한 구체적 요소만 추출하세요. 없으면 빈 배열.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      tools: [CLASSIFY_TOOL],
      tool_choice: { type: 'tool', name: 'classify_letter' },
      messages: [{ role: 'user', content: prompt }],
    })

    const toolBlock = message.content.find(b => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      console.warn('[classifyAndPlan] no tool_use block, using default')
      return PLAN_DEFAULT
    }

    const input = toolBlock.input as Partial<PlanResult>

    return {
      riskLevel:           (['safe', 'moderate', 'high'] as const).includes(input.riskLevel as 'safe' | 'moderate' | 'high')
                             ? (input.riskLevel as PlanResult['riskLevel'])
                             : 'safe',
      emotionCategory:     (['grief','guilt','anger','anxiety','yearning','gratitude','numb','mixed'] as const).includes(input.emotionCategory as PlanResult['emotionCategory'])
                             ? (input.emotionCategory as PlanResult['emotionCategory'])
                             : 'grief',
      guardianUsedRainbow: typeof input.guardianUsedRainbow === 'boolean' ? input.guardianUsedRainbow : false,
      keyMentions:         Array.isArray(input.keyMentions) ? input.keyMentions.slice(0, 3) : [],
      replyApproach:       typeof input.replyApproach === 'string' ? input.replyApproach.slice(0, 120) : '',
    }
  } catch (err) {
    console.error('[classifyAndPlan] failed, using default:', err)
    return PLAN_DEFAULT
  }
}
