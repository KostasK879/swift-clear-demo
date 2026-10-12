import { NextRequest, NextResponse } from 'next/server'
import { anonServerClient } from '@/lib/supabase-server'
import { TIME_SLOTS } from '@/types'
import {
  demoForced,
  demoTakenSlots,
  isSupabaseConfigured,
} from '@/lib/demo-store'

function shouldUseDemo(): boolean {
  return demoForced() || !isSupabaseConfigured()
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date) {
    return NextResponse.json({ error: 'date param required' }, { status: 400 })
  }

  if (shouldUseDemo()) {
    const takenSlots = demoTakenSlots(date)
    const availability = TIME_SLOTS.map(slot => ({
      slot,
      available: !takenSlots.has(slot),
    }))
    return NextResponse.json({ availability, demo: true })
  }

  try {
    const supabase = anonServerClient()
    const [bookingsRes, blockedRes] = await Promise.all([
      // booked_slots view exposes only date + time_slot (no personal data)
      supabase.from('booked_slots').select('time_slot').eq('date', date),
      supabase.from('blocked_slots').select('time_slot').eq('date', date),
    ])

    if (bookingsRes.error || blockedRes.error) {
      const takenSlots = demoTakenSlots(date)
      const availability = TIME_SLOTS.map(slot => ({
        slot,
        available: !takenSlots.has(slot),
      }))
      return NextResponse.json({
        availability,
        demo: true,
        warning: bookingsRes.error?.message || blockedRes.error?.message,
      })
    }

    const takenSlots = new Set<string>([
      ...(bookingsRes.data ?? []).map((r: { time_slot: string }) => r.time_slot),
      ...(blockedRes.data ?? []).map((r: { time_slot: string }) => r.time_slot),
    ])

    const availability = TIME_SLOTS.map(slot => ({
      slot,
      available: !takenSlots.has(slot),
    }))

    return NextResponse.json({ availability })
  } catch (err) {
    const takenSlots = demoTakenSlots(date)
    const availability = TIME_SLOTS.map(slot => ({
      slot,
      available: !takenSlots.has(slot),
    }))
    const message = err instanceof Error ? err.message : 'supabase unreachable'
    return NextResponse.json({ availability, demo: true, warning: message })
  }
}
