import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function serverSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET() {
  const supabase = serverSupabase()
  const { data, error } = await supabase
    .from('blocked_slots')
    .select('*')
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ blocked_slots: data })
}

export async function POST(req: NextRequest) {
  const { date, time_slot } = await req.json()
  const supabase = serverSupabase()

  const { data, error } = await supabase
    .from('blocked_slots')
    .insert([{ date, time_slot }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ blocked_slot: data }, { status: 201 })
}
