import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { sendConfirmationEmail } from '@/lib/resend'
import type { Booking } from '@/types'
import {
  demoForced,
  demoInsertBooking,
  demoListBookings,
  isSupabaseConfigured,
} from '@/lib/demo-store'
import { calculatePrice } from '@/lib/pricing'
import {
  SERVICE_ROLE_MISSING,
  adminServerClient,
  anonServerClient,
  hasServiceRoleKey,
} from '@/lib/supabase-server'

function shouldUseDemo(): boolean {
  return demoForced() || !isSupabaseConfigured()
}

// Public: customers create bookings with the anon/publishable key.
// RLS allows anon INSERT on bookings but not SELECT, so we generate id/created_at
// server-side and insert without reading the row back.
export async function POST(req: NextRequest) {
  const body = await req.json()

  // Never trust client-supplied price in a public demo.
  let price = body.price
  try {
    if (body.service_details) {
      price = calculatePrice(body.service_details)
    }
  } catch {
    // keep body.price if pricing throws
  }

  const booking: Booking = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    name: body.name,
    email: body.email,
    phone: body.phone,
    address: body.address,
    service_details: body.service_details,
    price,
    date: body.date,
    time_slot: body.time_slot,
  }

  if (shouldUseDemo()) {
    const demoBooking = demoInsertBooking(booking)
    try {
      await sendConfirmationEmail(demoBooking)
    } catch {
      // non-fatal in demo
    }
    return NextResponse.json({ booking: demoBooking, demo: true }, { status: 201 })
  }

  try {
    const supabase = anonServerClient()
    const { error } = await supabase.from('bookings').insert([booking])

    if (error) {
      const demoBooking = demoInsertBooking(booking)
      return NextResponse.json({ booking: demoBooking, demo: true, warning: error.message }, { status: 201 })
    }

    try {
      await sendConfirmationEmail(booking)
    } catch {
      // booking is saved; email failure is non-fatal
    }
    return NextResponse.json({ booking }, { status: 201 })
  } catch (err) {
    const demoBooking = demoInsertBooking(booking)
    const message = err instanceof Error ? err.message : 'supabase unreachable'
    return NextResponse.json({ booking: demoBooking, demo: true, warning: message }, { status: 201 })
  }
}

// Admin only (HTTP Basic Auth in middleware.ts). Reads with the service role key.
export async function GET() {
  if (shouldUseDemo()) {
    return NextResponse.json({ bookings: demoListBookings(), demo: true })
  }

  if (!hasServiceRoleKey()) {
    return NextResponse.json({ error: SERVICE_ROLE_MISSING, bookings: [] }, { status: 503 })
  }

  try {
    const supabase = adminServerClient()
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      return NextResponse.json({ bookings: demoListBookings(), demo: true, warning: error.message })
    }

    return NextResponse.json({ bookings: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'supabase unreachable'
    return NextResponse.json({ bookings: demoListBookings(), demo: true, warning: message })
  }
}
