// Supabase Edge Function — generate-reply Phase 2
// LLM 1: 편지 분류 + 전략 수립 (tool_use JSON)
// 결과(PlanResult)는 LLM 2 프롬프트에 주입됨.

import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

export interface PlanResult {
  riskLevel:        'normal' | 'caution' | 'crisis'
  primaryEmotion:   'grief' | 'guilt' | 'longing' | 'recovery' | 'anger' | 'numb'
  secondaryEmotion?: string
  guiltPresent:     boolean
  toneLevel:        'quiet' | 'gentle' | 'warm'
  mustAddress:      string[]   // 답장에 반드시 반영할 구체 요소
  mustAvoid:        string[]   // 이번 답장에서 피해야 할 표현/주제
  replyStrategy:    string     // 고통인정→안심 순서의 2-3문장 전략
}

const PLAN_DEFAULT: PlanResult = {
  riskLevel:      'normal',
  primaryEmotion: 'grief',
  guiltPresent:   false,
  toneLevel:      'gentle',
  mustAddress:    [],
  mustAvoid:      [],
  replyStrategy:  '',
}

const CLASSIFY_TOOL: Anthropic.Tool = {
  name: 'classify_letter',
  description: '보호자 편지를 분석해 답장 생성 전략을 반환합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      riskLevel: {
        type: 'string',
        enum: ['normal', 'caution', 'crisis'],
        description: 'normal=일반, caution=강한 죄책감·삶의 의지 저하, crisis=자해·자살 신호(직접·우회 모두)',
      },
      primaryEmotion: {
        type: 'string',
        enum: ['grief', 'guilt', 'longing', 'recovery', 'anger', 'numb'],
        description: '편지의 주된 감정',
      },
      secondaryEmotion: {
        type: 'string',
        description: '복합 감정일 때 부차 감정 (없으면 생략)',
      },
      guiltPresent: {
        type: 'boolean',
        description: '편지에서 죄책감 신호가 감지되면 true (안락사·사고·자책 표현 등)',
      },
      toneLevel: {
        type: 'string',
        enum: ['quiet', 'gentle', 'warm'],
        description: 'quiet=조용/차분, gentle=부드럽고 따뜻한 기본, warm=따뜻하고 적극적인 위로',
      },
      mustAddress: {
        type: 'array',
        items: { type: 'string' },
        description: '편지에 등장한 구체적 요소(장소·사물·행동·기억) 중 답장에 반드시 반영할 것 (최대 3개)',
      },
      mustAvoid: {
        type: 'array',
        items: { type: 'string' },
        description: '이번 답장에서 피해야 할 표현·주제 (직전 답장 반복 패턴, 감정을 틀렸다 교정하는 표현 등)',
      },
      replyStrategy: {
        type: 'string',
        description: '고통인정→안심 순서로 이 편지에 맞는 답장 방향 2-3문장',
      },
    },
    required: ['riskLevel', 'primaryEmotion', 'guiltPresent', 'toneLevel', 'mustAddress', 'mustAvoid', 'replyStrategy'],
  },
}

/**
 * 편지를 분류해 답장 전략을 반환.
 * 내부 오류 시 PLAN_DEFAULT 반환 — 분류 실패가 답장 생성을 막지 않음.
 * 쉼표(comma_auto) 유형은 호출하지 말 것 (index.ts에서 분기).
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
riskLevel 기준: 자해·자살 의도(직접·우회 표현 모두)가 감지되면 crisis, 강한 죄책감·삶의 의지 저하면 caution, 그 외 normal.
guiltPresent: 안락사·사고사·"내가 못 지켰다" 류 자책 표현이 있으면 true.
mustAddress: 편지에 실제로 등장한 구체 요소만, 없으면 빈 배열.
replyStrategy: 반드시 고통인정을 먼저, 안심은 나중 순서로 2-3문장.`

  try {
    const message = await anthropic.messages.create({
      model:        'claude-haiku-4-5',
      max_tokens:   400,
      tools:        [CLASSIFY_TOOL],
      tool_choice:  { type: 'tool', name: 'classify_letter' },
      messages:     [{ role: 'user', content: prompt }],
    })

    const toolBlock = message.content.find(b => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      console.warn('[classifyAndPlan] no tool_use block — using default')
      return PLAN_DEFAULT
    }

    const i = toolBlock.input as Partial<PlanResult & { secondaryEmotion?: string }>

    return {
      riskLevel:        (['normal','caution','crisis'] as const).includes(i.riskLevel as 'normal'|'caution'|'crisis')
                          ? (i.riskLevel as PlanResult['riskLevel']) : 'normal',
      primaryEmotion:   (['grief','guilt','longing','recovery','anger','numb'] as const).includes(i.primaryEmotion as PlanResult['primaryEmotion'])
                          ? (i.primaryEmotion as PlanResult['primaryEmotion']) : 'grief',
      secondaryEmotion: typeof i.secondaryEmotion === 'string' && i.secondaryEmotion ? i.secondaryEmotion : undefined,
      guiltPresent:     typeof i.guiltPresent === 'boolean' ? i.guiltPresent : false,
      toneLevel:        (['quiet','gentle','warm'] as const).includes(i.toneLevel as 'quiet'|'gentle'|'warm')
                          ? (i.toneLevel as PlanResult['toneLevel']) : 'gentle',
      mustAddress:      Array.isArray(i.mustAddress) ? (i.mustAddress as string[]).slice(0, 3) : [],
      mustAvoid:        Array.isArray(i.mustAvoid)   ? (i.mustAvoid   as string[]).slice(0, 3) : [],
      replyStrategy:    typeof i.replyStrategy === 'string' ? i.replyStrategy.slice(0, 400) : '',
    }
  } catch (err) {
    console.error('[classifyAndPlan] failed — using default:', err)
    return PLAN_DEFAULT
  }
}
