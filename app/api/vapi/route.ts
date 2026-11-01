import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { HOUSE_CALLBACK, POSTCODE_ASK } from '@/lib/ellie-copy'
import { rememberNotified, wasNotified } from '@/lib/call-memory'
import { summariseCall } from '@/lib/call-summary'
import { notifyOwner, ownerBodyForBooking } from '@/lib/owner-notify'
import { calculatePrice, formatPrice, houseClearancePrice, parseHouseSize, serviceSummary } from '@/lib/pricing'
import { sendSms as deliverSms } from '@/lib/sms'
import { demoForced, demoInsertBooking, demoTakenSlots, isSupabaseConfigured } from '@/lib/demo-store'
import { anonServerClient } from '@/lib/supabase-server'
import { sendConfirmationEmail } from '@/lib/resend'
import { TIME_SLOTS } from '@/types'
import type { Booking, ServiceCategory, ServiceDetails, TimeSlot } from '@/types'

/**
 * Vapi webhook for the Swift Clear phone receptionist.
 * Handles tool-calls for get_price, check_availability, create_booking and send_sms.
 * Every tool result is returned with HTTP 200 (Vapi ignores non-2xx bodies).
 * If VAPI_SECRET is set, the request must carry a matching `x-vapi-secret` header.
 */

export const dynamic = 'force-dynamic'

type Args = Record<string, unknown>
type ToolCtx = { callId?: string; customerNumber?: string }
interface ToolCall {
  id: string
  function?: { name?: string; arguments?: Args | string }
}

const CATEGORIES: ServiceCategory[] = ['furniture', 'garden', 'rubble', 'junk', 'appliances', 'house']
const LOAD_SIZES = ['small', 'half', 'full'] as const

function shouldUseDemo(): boolean {
  return demoForced() || !isSupabaseConfigured()
}

function parseArgs(raw: Args | string | undefined): Args {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Args
    } catch {
      return {}
    }
  }
  return raw
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : ''
}

function normaliseKey(v: string): string {
  return v.toLowerCase().trim().replace(/[\s-]+/g, '_').replace(/s$/, '')
}

function normaliseCategory(v: string): string {
  const key = v.toLowerCase().trim().replace(/[\s-]+/g, '_')
  if (key === 'house' || key === 'houses' || key === 'home' || key === 'homes') return 'house'
  return key.replace(/s$/, '')
}

function buildServiceDetails(args: Args): ServiceDetails | string {
  const category = normaliseCategory(str(args.category)) as ServiceCategory
  const cat = (CATEGORIES as string[]).includes(category)
    ? category
    : (CATEGORIES as string[]).includes(category + 's')
      ? ((category + 's') as ServiceCategory)
      : null
  if (!cat) return `Unknown category "${str(args.category)}". Use one of: ${CATEGORIES.join(', ')}.`

  if (cat === 'furniture') {
    const rawItems = Array.isArray(args.items) ? args.items : []
    const items = rawItems
      .map((i) => {
        const o = (i ?? {}) as Args
        const qty = Math.max(1, Math.round(Number(o.quantity ?? 1)) || 1)
        return { type: normaliseKey(str(o.type)) || 'other', quantity: qty }
      })
      .filter((i) => i.type)
    if (!items.length) {
      return 'For furniture, list the items (e.g. sofa, bed, wardrobe, table, chair, mattress, desk) with quantities.'
    }
    return { category: cat, items }
  }

  if (cat === 'house') {
    const size = parseHouseSize(str(args.houseSize) || str(args.size))
    if (!size) {
      return 'For a house clearance, give houseSize: room, 1_bed, 2_bed or 3_bed. If that price is not set, do not invent one.'
    }
    return { category: 'house', houseSize: size }
  }

  if (cat === 'appliances') {
    const raw = Array.isArray(args.appliances)
      ? args.appliances
      : Array.isArray(args.applianceTypes)
        ? args.applianceTypes
        : []
    const applianceTypes = raw.map((a) => normaliseKey(str(a))).filter(Boolean)
    if (!applianceTypes.length) {
      return 'For appliances, list them (fridge, washing_machine, dishwasher, oven, tumble_dryer, freezer).'
    }
    return { category: cat, applianceTypes }
  }

  const size = normaliseKey(str(args.loadSize)) as (typeof LOAD_SIZES)[number]
  if (!(LOAD_SIZES as readonly string[]).includes(size)) {
    return 'For garden, rubble or junk, give loadSize: small (quarter van), half or full.'
  }
  return { category: cat, loadSize: size }
}

function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const d = new Date(date + 'T00:00:00Z')
  return !Number.isNaN(d.getTime())
}

function londonToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date())
}

function normaliseSlot(v: string): TimeSlot | null {
  const s = v.toLowerCase().replace(/[\s.:]/g, '').replace(/00/g, '')
  const map: Record<string, TimeSlot> = {
    '8am': '8am',
    '8': '8am',
    '10am': '10am',
    '10': '10am',
    '12pm': '12pm',
    '12': '12pm',
    noon: '12pm',
    midday: '12pm',
    '2pm': '2pm',
    '14': '2pm',
    '2': '2pm',
    '4pm': '4pm',
    '16': '4pm',
    '4': '4pm',
  }
  return map[s] ?? null
}

async function takenSlots(date: string): Promise<Set<string>> {
  if (shouldUseDemo()) return demoTakenSlots(date)
  try {
    const supabase = anonServerClient()
    const [b, x] = await Promise.all([
      supabase.from('booked_slots').select('time_slot').eq('date', date),
      supabase.from('blocked_slots').select('time_slot').eq('date', date),
    ])
    if (b.error || x.error) return demoTakenSlots(date)
    return new Set<string>([
      ...(b.data ?? []).map((r: { time_slot: string }) => r.time_slot),
      ...(x.data ?? []).map((r: { time_slot: string }) => r.time_slot),
    ])
  } catch {
    return demoTakenSlots(date)
  }
}

async function getPrice(args: Args): Promise<string> {
  const details = buildServiceDetails(args)
  if (typeof details === 'string') throw new Error(details)
  if (details.category === 'house' && houseClearancePrice(details.houseSize) == null) {
    return HOUSE_CALLBACK
  }
  const price = calculatePrice(details)
  return `${serviceSummary(details)}: ${formatPrice(price)} all-in (labour, loading, disposal and VAT included).`
}

async function checkAvailability(args: Args): Promise<string> {
  const date = str(args.date)
  if (!isValidDate(date)) throw new Error(`Date must be YYYY-MM-DD. Today in Kent is ${londonToday()}.`)
  if (date < londonToday()) throw new Error(`That date is in the past. Today in Kent is ${londonToday()}.`)
  const taken = await takenSlots(date)
  const free = TIME_SLOTS.filter((s) => !taken.has(s))
  return free.length
    ? `Free arrival slots on ${date}: ${free.join(', ')}.`
    : `No slots left on ${date}. Offer the next day.`
}

async function createBooking(args: Args, ctx: ToolCtx): Promise<string> {
  const name = str(args.name)
  const phone = str(args.phone)
  const street = str(args.address)
  const postcode = str(args.postcode).toUpperCase()
  const date = str(args.date)
  const slot = normaliseSlot(str(args.slot))
  const missing = [
    !name && 'name',
    !phone && 'phone',
    !street && 'address',
    !postcode && 'postcode',
    !date && 'date',
    !slot && 'slot',
  ].filter(Boolean)
  if (!postcode) {
    throw new Error(`Missing postcode. Ask: "${POSTCODE_ASK}" Do not confirm the booking without it.`)
  }
  if (missing.length) throw new Error(`Missing or invalid: ${missing.join(', ')}. Slots are ${TIME_SLOTS.join(', ')}.`)
  if (!isValidDate(date) || date < londonToday()) {
    throw new Error(`Invalid date. Today in Kent is ${londonToday()}.`)
  }

  const details = buildServiceDetails(args)
  if (typeof details === 'string') throw new Error(details)
  if (details.category === 'house' && houseClearancePrice(details.houseSize) == null) {
    throw new Error(HOUSE_CALLBACK)
  }

  const taken = await takenSlots(date)
  if (taken.has(slot as string)) {
    const free = TIME_SLOTS.filter((s) => !taken.has(s))
    throw new Error(`The ${slot} slot on ${date} was just taken. Free: ${free.join(', ') || 'none'}.`)
  }

  const booking: Booking = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    name,
    email: str(args.email),
    phone,
    address: postcode && !street.toUpperCase().includes(postcode) ? `${street}, ${postcode}` : street,
    service_details: details,
    price: calculatePrice(details),
    date,
    time_slot: slot as TimeSlot,
  }

  let saved = booking
  if (shouldUseDemo()) {
    saved = demoInsertBooking(booking)
  } else {
    try {
      const { error } = await anonServerClient().from('bookings').insert([booking])
      if (error) saved = demoInsertBooking(booking)
    } catch {
      saved = demoInsertBooking(booking)
    }
  }

  if (saved.email) {
    try {
      await sendConfirmationEmail(saved)
    } catch (err) {
      console.error('Vapi booking: confirmation email failed', err)
    }
  }

  try {
    await notifyOwner('booked', ownerBodyForBooking(saved, postcode))
    rememberNotified([
      ctx.callId ? `call:${ctx.callId}` : '',
      `phone:${phone}`,
      ctx.customerNumber ? `phone:${ctx.customerNumber}` : '',
    ])
  } catch (err) {
    console.error('Owner SMS after booking failed', err)
  }

  const ref = saved.id.slice(0, 8).toUpperCase()
  return `Booked. Reference ${ref}. ${serviceSummary(details)} on ${date}, arrival slot ${slot}, at ${saved.address}. Price ${formatPrice(saved.price)}. Now call send_sms to text the caller a short confirmation with this reference.`
}

/**
 * Mid-call SMS confirmation (Apex Auto Works reel style).
 * Uses Twilio when TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER are set.
 * In DEMO_MODE or without Twilio creds, logs the body and returns success so demos still work.
 */
async function sendCallerSms(args: Args): Promise<string> {
  const toRaw = str(args.to) || str(args.phone)
  const message = str(args.message) || str(args.body)
  if (!toRaw) throw new Error('Need a phone number (to) for the SMS.')
  if (!message) throw new Error('Need a message body for the SMS.')
  if (message.length > 320) throw new Error('Keep the SMS under 320 characters.')

  const result = await deliverSms(toRaw, message, 'caller')
  if (result.delivery === 'failed') {
    throw new Error(`${result.detail} Tell the caller the booking is confirmed and you'll text shortly.`)
  }
  return result.detail
}

const HANDLERS: Record<string, (a: Args, ctx: ToolCtx) => Promise<string>> = {
  get_price: (args) => getPrice(args),
  check_availability: (args) => checkAvailability(args),
  create_booking: (args, ctx) => createBooking(args, ctx),
  send_sms: (args) => sendCallerSms(args),
}

export async function POST(req: NextRequest) {
  const secret = process.env.VAPI_SECRET
  if (secret && req.headers.get('x-vapi-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: {
    message?: {
      type?: string
      toolCallList?: ToolCall[]
      call?: { id?: string; customer?: { number?: string } }
    }
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const message = body.message
  if (!message) return NextResponse.json({ ok: true })

  if (message.type === 'end-of-call-report') {
    try {
      const summary = summariseCall(message)
      if (!wasNotified(summary.keys)) {
        await notifyOwner(summary.kind, summary.body)
        rememberNotified(summary.keys)
      }
    } catch (err) {
      console.error('Owner SMS after call failed', err)
    }
    return NextResponse.json({ ok: true })
  }

  if (message.type !== 'tool-calls') {
    return NextResponse.json({ ok: true })
  }

  const ctx: ToolCtx = {
    callId: message.call?.id,
    customerNumber: message.call?.customer?.number,
  }

  const results = await Promise.all(
    (message.toolCallList ?? []).map(async (call) => {
      const name = call.function?.name ?? ''
      const handler = HANDLERS[name]
      if (!handler) return { toolCallId: call.id, error: `Unknown tool ${name}` }
      try {
        const result = await handler(parseArgs(call.function?.arguments), ctx)
        return { toolCallId: call.id, result }
      } catch (err) {
        return { toolCallId: call.id, error: err instanceof Error ? err.message : 'Tool failed' }
      }
    }),
  )

  return NextResponse.json({ results })
}
