import { gateway, type LanguageModel } from 'ai'
import { openai } from '@ai-sdk/openai'

/** Cheap current chat model. Override with ELLIE_CHAT_MODEL. */
export const DEFAULT_CHAT_MODEL = 'gpt-5.4-mini'

export function ellieChatConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim())
}

/**
 * Prefer the Vercel AI Gateway when AI_GATEWAY_API_KEY is set.
 * Otherwise use OpenAI directly (the same provider Ellie already uses on the phone) when OPENAI_API_KEY is set.
 * Returns null when neither key is set, and the keyword bot answers instead.
 */
export function ellieChatModel(): LanguageModel | null {
  const requested = process.env.ELLIE_CHAT_MODEL?.trim()
  if (process.env.AI_GATEWAY_API_KEY?.trim()) {
    const id = requested
      ? (requested.includes('/') ? requested : `openai/${requested}`)
      : `openai/${DEFAULT_CHAT_MODEL}`
    return gateway(id)
  }
  if (process.env.OPENAI_API_KEY?.trim()) {
    const id = (requested || DEFAULT_CHAT_MODEL).replace(/^openai\//, '')
    return openai(id)
  }
  return null
}
