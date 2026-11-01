import { NextRequest, NextResponse } from 'next/server'
import { generateText, type ModelMessage } from 'ai'
import { reply } from '@/lib/chatbot'
import { ellieChatInstructions } from '@/lib/ellie-persona'
import { ellieChatModel } from '@/lib/ellie-model'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

type Incoming = { role?: string; content?: string }

function fallback(text: string, lastUnclear: number | undefined) {
  const turn = reply(text, { lastUnclear })
  const { unclearIndex, ...rest } = turn
  return NextResponse.json({ reply: rest, unclearIndex: unclearIndex ?? null, source: 'fallback' })
}

export async function POST(req: NextRequest) {
  let body: { messages?: Incoming[]; lastUnclear?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const incoming = Array.isArray(body.messages) ? body.messages : []
  const messages: ModelMessage[] = incoming
    .filter((message) => (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string')
    .slice(-12)
    .map((message) => ({
      role: message.role as 'user' | 'assistant',
      content: message.content!.slice(0, 1000),
    }))
    .filter((message) => message.content.trim().length > 0)

  const lastUser = [...messages].reverse().find((message) => message.role === 'user')
  const text = typeof lastUser?.content === 'string' ? lastUser.content : ''
  if (!text.trim()) {
    return NextResponse.json({ error: 'missing message' }, { status: 400 })
  }

  const lastUnclear = typeof body.lastUnclear === 'number' ? body.lastUnclear : undefined
  const model = ellieChatModel()
  if (!model) return fallback(text, lastUnclear)

  try {
    const result = await generateText({
      model,
      instructions: ellieChatInstructions(),
      messages,
      maxOutputTokens: 180,
      maxRetries: 1,
      timeout: 12000,
    })
    const answer = result.text.replace(/\s+/g, ' ').trim().slice(0, 600)
    if (!answer) return fallback(text, lastUnclear)
    return NextResponse.json({ reply: { text: answer }, unclearIndex: null, source: 'llm' })
  } catch (err) {
    console.error('Ellie chat model failed:', err instanceof Error ? err.message : err)
    return fallback(text, lastUnclear)
  }
}
