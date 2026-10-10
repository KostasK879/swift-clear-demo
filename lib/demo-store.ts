import { randomUUID } from 'crypto'
import type { Booking, BlockedSlot, TimeSlot } from '@/types'

/**
 * In-memory fallback when Supabase is unreachable or DEMO_MODE=1.
 * Process-local only (fine for a live demo; resets on cold start).
 */
const g = globalThis as unknown as {
  __swiftDemoBookings?: Booking[]
  __swiftDemoBlocked?: BlockedSlot[]
}

function bookings(): Booking[] {
  if (!g.__swiftDemoBookings) g.__swiftDemoBookings = []
  return g.__swiftDemoBookings
}

function blocked(): BlockedSlot[] {
  if (!g.__swiftDemoBlocked) g.__swiftDemoBlocked = []
  return g.__swiftDemoBlocked
}

export function demoForced(): boolean {
  return process.env.DEMO_MODE === '1' || process.env.DEMO_MODE === 'true'
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(url && key && !url.includes('your-project') && key !== 'your_anon_key_here')
}

export function demoListBookings(): Booking[] {
  return [...bookings()].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
}

export function demoInsertBooking(input: Omit<Booking, 'id' | 'created_at'> & Partial<Pick<Booking, 'id' | 'created_at'>>): Booking {
  const booking: Booking = {
    id: input.id ?? randomUUID(),
    created_at: input.created_at ?? new Date().toISOString(),
    name: input.name,
    email: input.email,
    phone: input.phone,
    address: input.address,
    service_details: input.service_details,
    price: input.price,
    date: input.date,
    time_slot: input.time_slot,
  }
  bookings().unshift(booking)
  return booking
}

export function demoListBlocked(): BlockedSlot[] {
  return [...blocked()].sort((a, b) => a.date.localeCompare(b.date))
}

export function demoInsertBlocked(date: string, time_slot: TimeSlot): BlockedSlot {
  const row: BlockedSlot = { id: randomUUID(), date, time_slot }
  blocked().push(row)
  return row
}

export function demoDeleteBlocked(id: string): boolean {
  const list = blocked()
  const i = list.findIndex((r) => r.id === id)
  if (i === -1) return false
  list.splice(i, 1)
  return true
}

export function demoTakenSlots(date: string): Set<string> {
  const taken = new Set<string>()
  for (const b of bookings()) if (b.date === date) taken.add(b.time_slot)
  for (const s of blocked()) if (s.date === date) taken.add(s.time_slot)
  return taken
}
