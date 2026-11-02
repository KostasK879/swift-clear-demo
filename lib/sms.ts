import { demoForced, isSupabaseConfigured } from './demo-store'

export type SmsDelivery = 'sent' | 'demo' | 'failed'

export type SmsSendResult = {
  delivery: SmsDelivery
  to: string
  detail: string
}

/** Normalise a UK-ish phone to E.164 (+44…) when possible. */
export function toE164(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, '')
  if (/^\+[1-9]\d{7,14}$/.test(digits)) return digits
  const bare = digits.replace(/\D/g, '')
  if (/^07\d{9}$/.test(bare)) return `+44${bare.slice(1)}`
  if (/^447\d{9}$/.test(bare)) return `+${bare}`
  if (/^0\d{9,10}$/.test(bare)) return `+44${bare.slice(1)}`
  return null
}

export function twilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim()
    && process.env.TWILIO_AUTH_TOKEN?.trim()
    && process.env.TWILIO_FROM_NUMBER?.trim(),
  )
}

/** Demo, or missing Twilio creds: log the text and treat it as queued. */
export function smsLogsInsteadOfSending(): boolean {
  return demoForced() || !isSupabaseConfigured() || !twilioConfigured()
}

/**
 * Shared Twilio send used by Ellie's caller confirmation and the owner summary.
 * Does not throw. Caller-facing tools can throw from the detail when delivery is failed.
 */
export async function sendSms(
  toRaw: string,
  message: string,
  channel: 'caller' | 'owner' = 'caller',
): Promise<SmsSendResult> {
  const to = toE164(toRaw) ?? toRaw
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const token = process.env.TWILIO_AUTH_TOKEN?.trim()
  const from = process.env.TWILIO_FROM_NUMBER?.trim()

  if (smsLogsInsteadOfSending()) {
    const label = channel === 'owner' ? '[Owner SMS DEMO]' : '[Ellie SMS DEMO]'
    console.log(label, { to, from: from || '(no TWILIO_FROM_NUMBER)', message })
    return {
      delivery: 'demo',
      to,
      detail: `SMS queued (demo). Text would go to ${to}: "${message}"`,
    }
  }

  const auth = Buffer.from(`${sid}:${token}`).toString('base64')
  const body = new URLSearchParams({ To: to, From: from!, Body: message })
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string; error_message?: string }
  if (!res.ok) {
    return {
      delivery: 'failed',
      to,
      detail: `Twilio SMS failed (${res.status}): ${data.message || data.error_message || 'unknown'}.`,
    }
  }
  return { delivery: 'sent', to, detail: `SMS sent to ${to} (Twilio ${data.sid ?? 'ok'}).` }
}
