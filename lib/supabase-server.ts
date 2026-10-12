import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase clients.
 *
 * - anonServerClient(): uses the public (publishable/anon) key. Subject to RLS:
 *   can INSERT bookings, read booked_slots (date + time only) and blocked_slots.
 * - adminServerClient(): uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS). Only for
 *   admin routes that are already protected by HTTP Basic Auth in middleware.ts.
 *   Never expose this key to the browser (no NEXT_PUBLIC_ prefix).
 */

export function anonServerClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export const SERVICE_ROLE_MISSING = 'SUPABASE_SERVICE_ROLE_KEY not configured'

export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function adminServerClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error(SERVICE_ROLE_MISSING)
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
