#!/usr/bin/env node
/**
 * Creates or updates the Swift Clear receptionist on Vapi.
 *
 *   VAPI_API_KEY=...  SERVER_URL=https://your-app.vercel.app  [VAPI_SECRET=...]
 *   [VAPI_ASSISTANT_ID=...]  [HUMAN_TRANSFER_NUMBER=+44...]  [ELEVENLABS_VOICE_ID=...]
 *   node scripts/setup-vapi.mjs
 *
 * - Fills {{SERVER_URL}}, {{VAPI_SECRET}}, {{HUMAN_TRANSFER_NUMBER}}, {{ELEVENLABS_VOICE_ID}}.
 * - Default British voice is ElevenLabs Lily (pFZP5JQG7iQjIQuC4Bku).
 * - Default transfer number is a placeholder; set HUMAN_TRANSFER_NUMBER before real demos.
 * - Prints the assistant id. API docs: https://docs.vapi.ai/api-reference/assistants/create
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const API = 'https://api.vapi.ai'
const DEFAULT_VOICE = 'pFZP5JQG7iQjIQuC4Bku' // ElevenLabs Lily — British female
const DEFAULT_TRANSFER = '+447700900000' // placeholder UK-style number; replace before live transfers

const {
  VAPI_API_KEY,
  SERVER_URL,
  VAPI_SECRET = '',
  VAPI_ASSISTANT_ID,
  HUMAN_TRANSFER_NUMBER = DEFAULT_TRANSFER,
  ELEVENLABS_VOICE_ID = DEFAULT_VOICE,
} = process.env

if (!VAPI_API_KEY || !SERVER_URL) {
  console.error('Set VAPI_API_KEY (private key from dashboard.vapi.ai) and SERVER_URL (public https URL of this app).')
  process.exit(1)
}
if (!/^https:\/\//.test(SERVER_URL)) {
  console.error('SERVER_URL must be a public https URL (Vercel deploy or an ngrok/cloudflared tunnel), not localhost.')
  process.exit(1)
}

const here = path.dirname(fileURLToPath(import.meta.url))
const raw = await readFile(path.join(here, '..', 'vapi', 'assistant.json'), 'utf8')
const config = JSON.parse(
  raw
    .replaceAll('{{SERVER_URL}}', SERVER_URL.replace(/\/+$/, ''))
    .replaceAll('{{VAPI_SECRET}}', VAPI_SECRET)
    .replaceAll('{{HUMAN_TRANSFER_NUMBER}}', HUMAN_TRANSFER_NUMBER)
    .replaceAll('{{ELEVENLABS_VOICE_ID}}', ELEVENLABS_VOICE_ID),
)

// Drop the secret header entirely when no secret is configured.
if (!VAPI_SECRET) {
  delete config.server.headers
  for (const t of config.model.tools) if (t.server) delete t.server.headers
}

async function vapi(method, url, body) {
  const res = await fetch(API + url, {
    method,
    headers: { Authorization: `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

let id = VAPI_ASSISTANT_ID
if (!id) {
  const list = await vapi('GET', '/assistant?limit=100')
  id = (Array.isArray(list) ? list : []).find((a) => a.name === config.name)?.id
}

const assistant = id ? await vapi('PATCH', `/assistant/${id}`, config) : await vapi('POST', '/assistant', config)
console.log(`${id ? 'Updated' : 'Created'} assistant "${assistant.name}"`)
console.log(`VAPI_ASSISTANT_ID=${assistant.id}`)
console.log(`Voice: ElevenLabs ${ELEVENLABS_VOICE_ID}${ELEVENLABS_VOICE_ID === DEFAULT_VOICE ? ' (Lily, British)' : ''}`)
console.log(`Human transfer: ${HUMAN_TRANSFER_NUMBER}${HUMAN_TRANSFER_NUMBER === DEFAULT_TRANSFER ? ' (PLACEHOLDER — set HUMAN_TRANSFER_NUMBER)' : ''}`)
console.log('Next: Vapi dashboard -> Phone Numbers -> pick/import your UK number -> Inbound assistant = this one.')
console.log('Or open the assistant and click "Talk to Assistant" for a browser mic test (needs a public SERVER_URL).')
