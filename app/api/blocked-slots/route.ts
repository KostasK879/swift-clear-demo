import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  demoForced,
  demoInsertBlocked,
  demoListBlocked,
  isSupabaseConfigured,
} from '@/lib/demo-store'
import type { TimeSlot } from '@/types'

function serverSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function shouldUseDemo(): boolean {
  return demoForced() || !isSupabaseConfigured()
}

export async function GET() {
  if (shouldUseDemo()) {
    return NextResponse.json({ blocked_slots: demoListBlocked(), demo: true })
  }

  try {
    const supabase = serverSupabase()
    const { data, error } = await supabase
      .from('blocked_slots')
      .select('*')
      .order('date', { ascending: true })

    if (error) {
      return NextResponse.json({ blocked_slots: demoListBlocked(), demo: true, warning: error.message })
    }
    return NextResponse.json({ blocked_slots: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'supabase unreachable'
    return NextResponse.json({ blocked_slots: demoListBlocked(), demo: true, warning: message })
  }
}

export async function POST(req: NextRequest) {
  const { date, time_slot } = await req.json() as { date: string; time_slot: TimeSlot }

  if (shouldUseDemo()) {
    const blocked_slot = demoInsertBlocked(date, time_slot)
    return NextResponse.json({ blocked_slot, demo: true }, { status: 201 })
  }

  try {
    const supabase = serverSupabase()
    const { data, error } = await supabase
      .from('blocked_slots')
      .insert([{ date, time_slot }])
      .select()
      .single()

    if (error) {
      const blocked_slot = demoInsertBlocked(date, time_slot)
      return NextResponse.json({ blocked_slot, demo: true, warning: error.message }, { status: 201 })
    }
    return NextResponse.json({ blocked_slot: data }, { status: 201 })
  } catch (err) {
    const blocked_slot = demoInsertBlocked(date, time_slot)
    const message = err instanceof Error ? err.message : 'supabase unreachable'
    return NextResponse.json({ blocked_slot, demo: true, warning: message }, { status: 201 })
  }
}
