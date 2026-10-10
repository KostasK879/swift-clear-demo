import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendConfirmationEmail } from '@/lib/resend'
import type { Booking } from '@/types'
import {
  demoForced,
  demoInsertBooking,
  demoListBookings,
  isSupabaseConfigured,
} from '@/lib/demo-store'
import { calculatePrice } from '@/lib/pricing'

function serverSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function shouldUseDemo(): boolean {
  return demoForced() || !isSupabaseConfigured()
}

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

  const payload = { ...body, price }

  if (shouldUseDemo()) {
    const booking = demoInsertBooking(payload)
    try {
      await sendConfirmationEmail(booking)
    } catch {
      // non-fatal in demo
    }
    return NextResponse.json({ booking, demo: true }, { status: 201 })
  }

  try {
    const supabase = serverSupabase()
    const { data, error } = await supabase
      .from('bookings')
      .insert([payload])
      .select()
      .single()

    if (error) {
      const booking = demoInsertBooking(payload)
      return NextResponse.json({ booking, demo: true, warning: error.message }, { status: 201 })
    }

    await sendConfirmationEmail(data as Booking)
    return NextResponse.json({ booking: data }, { status: 201 })
  } catch (err) {
    const booking = demoInsertBooking(payload)
    const message = err instanceof Error ? err.message : 'supabase unreachable'
    return NextResponse.json({ booking, demo: true, warning: message }, { status: 201 })
  }
}

export async function GET() {
  if (shouldUseDemo()) {
    return NextResponse.json({ bookings: demoListBookings(), demo: true })
  }

  try {
    const supabase = serverSupabase()
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
