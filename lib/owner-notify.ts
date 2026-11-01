import { randomUUID } from 'crypto'
import type { Booking } from '@/types'
import { bookedOwnerText, fitSms } from './ellie-copy'
import { serviceSummary } from './pricing'
import { sendSms, type SmsDelivery } from './sms'

export type OwnerDelivery = SmsDelivery | 'skipped'

export type OwnerNotice = {
  id: string
  created_at: string
  kind: 'booked' | 'missed'
  body: string
  to: string | null
  delivery: OwnerDelivery
  detail: string
}

const g = globalThis as unknown as { __swiftOwnerNotices?: OwnerNotice[] }

function notices(): OwnerNotice[] {
  if (!g.__swiftOwnerNotices) g.__swiftOwnerNotices = []
  return g.__swiftOwnerNotices
}

export function listOwnerNotices(): OwnerNotice[] {
  return [...notices()]
}

export function ownerNumberHint(): string | null {
  const raw = process.env.OWNER_SMS_NUMBER?.trim()
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 4) return 'set'
  return `ending ${digits.slice(-4)}`
}

export function formatUkDay(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || 'unconfirmed day'
  const date = new Date(`${iso}T12:00:00Z`)
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/London',
  }).format(date)
}

export function postcodeFromAddress(address: string): string {
  const match = address.toUpperCase().match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/)
  if (!match) return 'postcode not given'
  return match[1].replace(/\s+/, ' ')
}

export function ownerBodyForBooking(booking: Pick<Booking, 'name' | 'phone' | 'address' | 'price' | 'date' | 'time_slot' | 'service_details'>, postcode?: string): string {
  return bookedOwnerText({
    name: booking.name,
    number: booking.phone,
    job: serviceSummary(booking.service_details),
    price: booking.price,
    day: formatUkDay(booking.date),
    slot: booking.time_slot,
    postcode: postcode?.trim() || postcodeFromAddress(booking.address),
  })
}

/** Text the owner. Always logged for /admin, even when Twilio or the number is missing. */
export async function notifyOwner(kind: OwnerNotice['kind'], body: string): Promise<OwnerNotice> {
  const to = process.env.OWNER_SMS_NUMBER?.trim() || ''
  const text = fitSms(body)
  let delivery: OwnerDelivery = 'skipped'
  let detail = 'OWNER_SMS_NUMBER is not set, so this was logged here only.'

  if (to) {
    try {
      const result = await sendSms(to, text, 'owner')
      delivery = result.delivery
      detail = result.detail
    } catch (err) {
      delivery = 'failed'
      detail = err instanceof Error ? err.message : 'Owner SMS failed'
    }
  }

  const notice: OwnerNotice = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    kind,
    body: text,
    to: to || null,
    delivery,
    detail,
  }
  const list = notices()
  list.unshift(notice)
  list.splice(30)
  console.log('[Owner SMS]', { kind, delivery, to: to || '(unset)', body: text })
  return notice
}
