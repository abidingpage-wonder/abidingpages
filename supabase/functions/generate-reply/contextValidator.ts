// Supabase Edge Function — generate-reply Phase 3 맥락 검증
//
// 하나의 LLM tool_use 호출로 두 가지 검사:
//   [작업 2] Level 2 LLM: premature reassurance 위치 정밀 검사 (hasReassurance=true 시)
//   [작업 3] Level 3 LLM: 맥락 붕괴 3종 (억지 연상/종 특성 삽입/가르치는 톤)
//
// 내부 오류 시 통과 처리 (검증 실패가 답장 생성을 막지 않음)

import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

export interface ContextValidationResult {
  ok: boolean
  reason: string   // 실패 시 실패 유형 목록
  detail: string   // 실패 표현 발췌 (로그 수집용)
}

const CHECK_TOOL: Anthropic.Tool = {
  name: 'check_reply_context',
  description: '아이 답장의 맥락 품질 문제를 검사합니다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      prematureReassurance: {
        type: 'boolean',
        description: [
          '안심·위로 표현("괜찮아", "걱정 마", "힘내", "잘될 거야" 등)이',
          '보호자의 고통·감정을 충분히 인정하기 **전에** 등장하면 true.',
          '고통 인정이 먼저 나온 뒤 안심이 나오면 false.',
          '안심 표현 자체가 없으면 false.',
        ].join(' '),
      },
      forcedAssociation: {
        type: 'boolean',
        description: [
          '보호자 편지에 없는 내용을 단어 연상으로 억지 연결한 표현이 있으면 true.',
          '예: 편지에 "비" 언급 없는데 답장이 "빗소리처럼 그리워" — true.',
          '편지에 언급된 요소를 이미지화한 것은 false.',
        ].join(' '),
      },
      speciesMismatch: {
        type: 'boolean',
        description: [
          '편지 흐름·맥락과 무관하게 종(species) 특성을 억지 삽입한 표현이 있으면 true.',
          '예: 편지가 기억·그리움 중심인데 갑자기 "나는 발톱으로 긁었잖아" 등장 — true.',
          '자연스러운 종 특성 표현(맥락 있음)은 false.',
        ].join(' '),
      },
      preachyTone: {
        type: 'boolean',
        description: [
          '보호자에게 행동·방향을 지시하거나 교훈을 주는 표현이 있을 때만 true.',
          '예: "이겨내야 해", "앞으로 나아가야 해", "슬픔은 시간이 지나면 나아져", "~하면 돼", "~해야 해".',
          '반대로 따뜻한 인정·공감·정서적 칭찬은 지시가 아니므로 false:',
          '예: "잘 견뎌줘서 고마워", "네 마음 정말 단단해", "그 마음 아름다워", "충분히 그래도 돼", "울어도 괜찮아".',
          '핵심: 지시/명령/교훈이 있어야 true. 단순 위로·공감·칭찬은 false.',
        ].join(' '),
      },
      failDetail: {
        type: 'string',
        description: 'true 항목이 있을 때 해당 표현을 그대로 발췌 (최대 2개, 없으면 빈 문자열)',
      },
    },
    required: ['prematureReassurance', 'forcedAssociation', 'speciesMismatch', 'preachyTone', 'failDetail'],
  },
}

/**
 * 답장의 맥락 품질을 LLM으로 검사.
 *
 * @param anthropic       Anthropic 클라이언트
 * @param reply           검사할 답장 본문
 * @param guardianLetter  보호자 원문 (맥락 비교용)
 * @param species         아이의 종 (speciesMismatch 판단용)
 * @param checkReassurance  hasReassurance=true 일 때 true — prematureReassurance 검사 활성
 */
export async function llmValidateContext(
  anthropic: Anthropic,
  reply: string,
  guardianLetter: string,
  species: string,
  checkReassurance: boolean,
): Promise<ContextValidationResult> {
  const prompt = [
    '[보호자 편지]',
    '---',
    (guardianLetter ?? '').slice(0, 600),
    '---',
    '',
    '[아이 답장]',
    '---',
    (reply ?? '').slice(0, 800),
    '---',
    '',
    `아이의 종: ${species}`,
    '',
    'check_reply_context 도구로 아래 기준에 따라 답장을 검사하세요.',
    '',
    checkReassurance
      ? '- prematureReassurance: 답장에 안심 표현이 있다면, 보호자 고통을 충분히 인정한 뒤에 나왔는지 확인. 인정 전 등장이면 true.'
      : '- prematureReassurance: 답장에 안심 표현이 없으므로 false로 설정.',
    '- forcedAssociation: 편지에 없는 내용을 단어 연상으로 억지 연결했으면 true.',
    '- speciesMismatch: 편지 맥락과 무관하게 종 특성을 억지 삽입했으면 true.',
    '- preachyTone: 보호자에게 행동·방향을 지시하거나 교훈을 주면("이겨내야 해", "~해야 해", "시간이 지나면 나아져") true. 따뜻한 인정·공감·정서적 칭찬("잘 견뎌줘서 고마워", "그 마음 아름다워", "충분히 그래도 돼")은 false.',
    '모두 해당 없으면 전부 false, failDetail은 빈 문자열.',
  ].join('\n')

  try {
    const message = await anthropic.messages.create({
      model:       'claude-haiku-4-5',
      max_tokens:  300,
      tools:       [CHECK_TOOL],
      tool_choice: { type: 'tool', name: 'check_reply_context' },
      messages:    [{ role: 'user', content: prompt }],
    })

    const toolBlock = message.content.find(b => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      console.warn('[contextValidator] no tool_use block — pass through')
      return { ok: true, reason: '', detail: '' }
    }

    const i = toolBlock.input as {
      prematureReassurance: boolean
      forcedAssociation:    boolean
      speciesMismatch:      boolean
      preachyTone:          boolean
      failDetail:           string
    }

    const failures: string[] = []
    if (i.prematureReassurance) failures.push('premature_reassurance')
    if (i.forcedAssociation)    failures.push('forced_association')
    if (i.speciesMismatch)      failures.push('species_mismatch')
    if (i.preachyTone)          failures.push('preachy_tone')

    if (failures.length > 0) {
      return {
        ok:     false,
        reason: `LLM 맥락 검사 실패: ${failures.join(', ')}`,
        detail: typeof i.failDetail === 'string' ? i.failDetail.slice(0, 200) : '',
      }
    }

    return { ok: true, reason: '', detail: '' }
  } catch (err) {
    console.error('[contextValidator] error — pass through:', err)
    return { ok: true, reason: '', detail: '' }
  }
}
