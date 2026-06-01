import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface Pet {
  name: string
  species: string          // dog | cat | hamster | parrot | other
  personalityTags: string[]
  favoriteThings: string[]
  ownerNickname: string | null
}

interface GenerateReplyInput {
  pet: Pet
  letterContent: string
  emotionTag: string | null
  week: number
}

// 종(種)별 말투 힌트
const SPECIES_VOICE: Record<string, string> = {
  dog:     '활기차고 해맑으며, 꼬리를 흔들 것 같은 따뜻한 말투',
  cat:     '차분하고 조금 도도하지만 속 깊은 따뜻함이 배어나오는 말투',
  hamster: '작고 귀엽지만 진지하고 사랑스러운 말투',
  parrot:  '명랑하고 재잘거리는 듯 밝은 말투',
  other:   '부드럽고 따뜻한 말투',
}

// 주차별 주제 힌트 (7단계 여정)
const WEEK_THEME: Record<number, string> = {
  1: '그리움과 따뜻한 기억 속에 머무르기',
  2: '마음속 감정을 솔직하게 쏟아내기',
  3: '이별의 현실과 마주하기',
  4: '함께한 시간을 소중히 기억하기',
  5: '사랑의 연결이 계속됨을 느끼기',
  6: '스스로를 다독이고 용서하기',
  7: '사랑을 가슴에 간직하고 앞으로 나아가기',
}

export async function generatePetReply(input: GenerateReplyInput): Promise<string> {
  const { pet, letterContent, emotionTag, week } = input

  const ownerName = pet.ownerNickname ?? '보호자님'
  const voice = SPECIES_VOICE[pet.species] ?? SPECIES_VOICE.other
  const theme = WEEK_THEME[week] ?? WEEK_THEME[1]
  const personalityHint = pet.personalityTags.length > 0
    ? `성격: ${pet.personalityTags.join(', ')}`
    : ''
  const favoritesHint = pet.favoriteThings.length > 0
    ? `좋아했던 것들: ${pet.favoriteThings.join(', ')}`
    : ''

  const systemPrompt = `당신은 무지개 다리를 건넌 반려동물 "${pet.name}"입니다.
하늘에서 사랑하는 ${ownerName}에게 따뜻한 편지를 씁니다.

[캐릭터 정보]
- 이름: ${pet.name}
- 말투: ${voice}
${personalityHint}
${favoritesHint}

[이번 주 여정 주제]
${theme}

[작성 규칙]
- 반드시 한국어로 작성
- 200~280자 분량 (띄어쓰기 포함)
- ${ownerName}가 보낸 편지에 공감하며 시작
- 하늘에서 지켜보고 있다는 따뜻한 존재감 전달
- 슬픔보다 따뜻함과 안도감을 남기는 마무리
- "무지개 다리", "하늘나라" 등 직접 언급은 1회 이내로 자제
- 과도한 문어체나 격식체 금지, 자연스러운 구어체
- 편지 형식: "${ownerName}에게," 로 시작, 서명은 "${pet.name} 올림" 으로 마무리`

  const userPrompt = `${ownerName}가 나에게 보낸 편지:
---
${letterContent}
---
${emotionTag ? `오늘 ${ownerName}의 감정 상태: ${emotionTag}` : ''}

위 편지에 답장을 써주세요.`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 600,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return block.text.trim()
}
