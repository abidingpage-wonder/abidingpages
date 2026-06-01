import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, buildUserPrompt, type PromptInput } from './prompt'

export type { PromptInput }
export type GenerateReplyInput = PromptInput

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generatePetReply(input: GenerateReplyInput): Promise<string> {
  const systemPrompt = buildSystemPrompt(input)
  const userPrompt   = buildUserPrompt(input)

  const message = await client.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 1024,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: userPrompt }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text.trim()
}
