import { bookedOwnerText, missedOwnerText } from './ellie-copy'

export type CallSummary = {
  kind: 'booked' | 'missed'
  body: string
  keys: string[]
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : ''
}

function clip(value: string, max: number): string {
  const text = value.replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

/**
 * Turn a Vapi end-of-call-report into the owner text.
 * Booked calls that already notified from create_booking are filtered by keys.
 */
export function summariseCall(message: unknown): CallSummary {
  const root = (message ?? {}) as {
    call?: { id?: string; customer?: { number?: string } }
    callId?: string
    customer?: { number?: string }
    analysis?: { summary?: string; structuredData?: Record<string, unknown> }
    summary?: string
    structuredData?: Record<string, unknown>
  }
  const data = root.analysis?.structuredData ?? root.structuredData ?? {}
  const callId = str(root.call?.id) || str(root.callId)
  const callerId = str(root.call?.customer?.number) || str(root.customer?.number)
  const statedNumber = str(data.callerNumber)
  const keys = [
    callId ? `call:${callId}` : '',
    callerId ? `phone:${callerId}` : '',
    statedNumber ? `phone:${statedNumber}` : '',
  ].filter(Boolean)

  const name = str(data.callerName) || 'Unknown'
  const number = statedNumber || callerId || 'unknown number'
  const summary = str(root.analysis?.summary) || str(root.summary)
  const job = str(data.job) || clip(summary, 80) || 'something unclear'
  const bookedFlag = data.booked === true || data.booked === 'true'
  const postcode = str(data.postcode)
  const slot = str(data.slot)
  const day = str(data.day)
  const price = str(data.priceQuoted) || str(data.price)

  if (bookedFlag && postcode && slot) {
    return {
      kind: 'booked',
      keys,
      body: bookedOwnerText({
        name,
        number,
        job,
        price: price || 'unconfirmed',
        day: day || 'unconfirmed day',
        slot,
        postcode,
      }),
    }
  }

  return {
    kind: 'missed',
    keys,
    body: missedOwnerText({ name, number, job }),
  }
}
