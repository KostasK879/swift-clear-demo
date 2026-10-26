import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Returns only what the browser needs to start a Vapi web call.
 * NEVER includes VAPI_API_KEY (private). Public keys are designed for client use.
 */
export async function GET() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.trim() ||
    process.env.VAPI_PUBLIC_KEY?.trim() ||
    null

  const assistantId =
    process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID?.trim() ||
    process.env.VAPI_ASSISTANT_ID?.trim() ||
    'fe2e9be2-9621-4ec1-99b1-7f315d19f69c'

  return NextResponse.json({
    assistantId,
    publicKey,
    configured: Boolean(publicKey),
  })
}
