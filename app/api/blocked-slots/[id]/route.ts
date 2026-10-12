import { NextRequest, NextResponse } from 'next/server'
import {
  demoDeleteBlocked,
  demoForced,
  isSupabaseConfigured,
} from '@/lib/demo-store'
import {
  SERVICE_ROLE_MISSING,
  adminServerClient,
  hasServiceRoleKey,
} from '@/lib/supabase-server'

// Admin only (HTTP Basic Auth in middleware.ts). Writes use the service role key.

function shouldUseDemo(): boolean {
  return demoForced() || !isSupabaseConfigured()
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (shouldUseDemo()) {
    const ok = demoDeleteBlocked(params.id)
    if (!ok) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ success: true, demo: true })
  }

  if (!hasServiceRoleKey()) {
    return NextResponse.json({ error: SERVICE_ROLE_MISSING }, { status: 503 })
  }

  try {
    const supabase = adminServerClient()
    const { error } = await supabase
      .from('blocked_slots')
      .delete()
      .eq('id', params.id)

    if (error) {
      const ok = demoDeleteBlocked(params.id)
      if (ok) return NextResponse.json({ success: true, demo: true, warning: error.message })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    const ok = demoDeleteBlocked(params.id)
    const message = err instanceof Error ? err.message : 'supabase unreachable'
    if (ok) return NextResponse.json({ success: true, demo: true, warning: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
