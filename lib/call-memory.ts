/**
 * Remembers which calls already produced an owner text, so the booking
 * webhook and the end-of-call report don't both text the owner.
 * Process-local, same as the demo booking store.
 */

const TTL_MS = 30 * 60 * 1000

const g = globalThis as unknown as { __swiftNotifiedCalls?: Map<string, number> }

function store(): Map<string, number> {
  if (!g.__swiftNotifiedCalls) g.__swiftNotifiedCalls = new Map()
  return g.__swiftNotifiedCalls
}

function keyOf(value: string): string {
  return value.trim().toLowerCase()
}

export function rememberNotified(keys: Array<string | undefined | null>): void {
  const now = Date.now()
  const map = store()
  for (const key of keys) {
    if (key && key.trim()) map.set(keyOf(key), now)
  }
}

export function wasNotified(keys: Array<string | undefined | null>): boolean {
  const now = Date.now()
  const map = store()
  return keys.some((key) => {
    if (!key || !key.trim()) return false
    const at = map.get(keyOf(key))
    return at != null && now - at < TTL_MS
  })
}
