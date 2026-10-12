import { NextRequest, NextResponse } from 'next/server'

/**
 * HTTP Basic Auth for the admin area.
 *
 * Protected:
 *   - /admin and everything under it
 *   - /api/bookings for every method except POST (POST is the public quote flow)
 *   - /api/blocked-slots and /api/blocked-slots/* for every method (admin only;
 *     the public quote flow reads /api/availability instead)
 *
 * Credentials come from ADMIN_USER (default "admin") and ADMIN_PASSWORD.
 * Fails closed: if ADMIN_PASSWORD is not set, protected routes return 503.
 */

const REALM = 'Swift Clear Admin'

function isProtected(req: NextRequest): boolean {
  let path = req.nextUrl.pathname
  if (path.length > 1 && path.endsWith('/')) path = path.replace(/\/+$/, '')

  if (path === '/admin' || path.startsWith('/admin/')) return true
  if (path === '/api/blocked-slots' || path.startsWith('/api/blocked-slots/')) return true
  if (path === '/api/bookings' || path.startsWith('/api/bookings/')) {
    return !(path === '/api/bookings' && req.method === 'POST')
  }
  return false
}

// Length-independent, constant-time-ish string comparison.
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const ab = enc.encode(a)
  const bb = enc.encode(b)
  const len = Math.max(ab.length, bb.length)
  let diff = ab.length ^ bb.length
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0)
  }
  return diff === 0
}

function decodeBasic(header: string | null): { user: string; pass: string } | null {
  if (!header) return null
  const [scheme, encoded] = header.split(' ')
  if (!scheme || scheme.toLowerCase() !== 'basic' || !encoded) return null
  try {
    const bin = atob(encoded)
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
    const decoded = new TextDecoder().decode(bytes)
    const idx = decoded.indexOf(':')
    if (idx < 0) return null
    return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) }
  } catch {
    return null
  }
}

function unauthorized(): NextResponse {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Cache-Control': 'no-store',
    },
  })
}

export function middleware(req: NextRequest) {
  if (!isProtected(req)) return NextResponse.next()

  const expectedUser = process.env.ADMIN_USER || 'admin'
  const expectedPass = process.env.ADMIN_PASSWORD

  if (!expectedPass) {
    return new NextResponse('Admin is disabled: ADMIN_PASSWORD is not configured.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const creds = decodeBasic(req.headers.get('authorization'))
  if (!creds) return unauthorized()

  const userOk = safeEqual(creds.user, expectedUser)
  const passOk = safeEqual(creds.pass, expectedPass)
  if (!(userOk && passOk)) return unauthorized()

  const res = NextResponse.next()
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/bookings', '/api/bookings/:path*', '/api/blocked-slots', '/api/blocked-slots/:path*'],
}
