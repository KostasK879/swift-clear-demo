import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendConfirmationEmail } from '@/lib/resend'
import type { Booking } from '@/types'

function serverSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = serverSupabase()

  const { data, error } = await supabase
    .from('bookings')
    .insert([body])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await sendConfirmationEmail(data as Booking)

  return NextResponse.json({ booking: data }, { status: 201 })
}

export async function GET() {
  const supabase = serverSupabase()

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bookings: data })
}
