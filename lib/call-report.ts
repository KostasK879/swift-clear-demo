import { fitSms } from './ellie-copy'
import { sendOwnerCallEmail } from './resend'
import { sendSms, smsLogsInsteadOfSending } from './sms'

export const DEFAULT_OWNER_NOTIFY_EMAIL = 'hello@nodusai.io'

const ONE_LINE_MAX = 118

export type OwnerCallReport = {
  callId: string
  caller: string
  callerName: string
  duration: string
  summary: string
  endedReason: string
  recordingUrl: string
  subject: string
  text: string
  html: string
}

export type OwnerEmailInput = {
  to: string
  subject: string
  text: string
  html: string
  idempotencyKey?: string
}

export type OwnerEmailResult = {
  sent: boolean
  id?: string
  error?: string
}

export type DeliverResult = {
  email: { sent: boolean; to: string; error?: string }
  sms: 'sent' | 'skipped' | 'failed'
}

type DeliverDeps = {
  sendEmail?: (input: OwnerEmailInput) => Promise<OwnerEmailResult>
  sendSms?: (to: string, body: string) => Promise<{ delivery: string }>
}

export function ownerNotifyEmail(): string {
  const raw = process.env.OWNER_NOTIFY_EMAIL?.trim() ?? ''
  if (!raw || !raw.includes('@')) return DEFAULT_OWNER_NOTIFY_EMAIL
  return raw
}

/**
 * Read a Vapi end-of-call-report (the webhook body, or the inner message)
 * into the email the business owner should receive. Missing fields become
 * plain placeholders; nothing here throws.
 */
export function buildOwnerCallReport(payload: unknown): OwnerCallReport {
  const root = unwrap(payload)
  const call = asRecord(root.call)
  const customer = asRecord(call.customer)
  const topCustomer = asRecord(root.customer)
  const analysis = asRecord(root.analysis)
  const data = { ...asRecord(root.structuredData), ...asRecord(analysis.structuredData) }

  const callId = str(call.id) || str(root.callId)
  const number = str(customer.number) || str(topCustomer.number) || str(data.callerNumber) || str(data.phone)
  const caller = number || 'unknown caller'
  const callerName = str(data.callerName) || str(customer.name) || str(topCustomer.name)
  const summary = collapse(str(analysis.summary) || str(root.summary))
  const endedReason = str(root.endedReason) || str(call.endedReason) || 'not recorded'
  const recordingUrl = findRecording(root)
  const duration = formatDuration(durationSeconds(root)) || 'not recorded'
  const oneLine = summary ? clip(summary, ONE_LINE_MAX) : 'no summary'
  const subject = `Swift Clear call: ${caller} — ${oneLine}`
  const quoteLines = bookingLines(data, toolNotes(root))

  const text = renderText({
    caller,
    callerName,
    duration,
    endedReason,
    callId,
    summary: summary || 'No summary was provided.',
    quoteLines,
    recordingUrl,
  })

  return {
    callId,
    caller,
    callerName,
    duration,
    summary,
    endedReason,
    recordingUrl,
    subject,
    text,
    html: renderHtml({
      caller,
      callerName,
      duration,
      endedReason,
      callId,
      summary: summary || 'No summary was provided.',
      quoteLines,
      recordingUrl,
    }),
  }
}

/** Email the owner, and text OWNER_NOTIFY_PHONE when a live SMS provider is configured. Never throws. */
export async function deliverOwnerCallReport(payload: unknown, deps: DeliverDeps = {}): Promise<DeliverResult> {
  const report = buildOwnerCallReport(payload)
  const to = ownerNotifyEmail()
  const email = await sendEmail(report, to, deps)
  const sms = await sendOwnerText(report, deps)
  return { email, sms }
}

async function sendEmail(
  report: OwnerCallReport,
  to: string,
  deps: DeliverDeps,
): Promise<DeliverResult['email']> {
  try {
    const send = deps.sendEmail ?? sendOwnerCallEmail
    const result = await send({
      to,
      subject: report.subject,
      text: report.text,
      html: report.html,
      idempotencyKey: idempotencyKey(report.callId),
    })
    if (result.sent) console.log('[Owner call email] sent', { to, id: result.id ?? null })
    else console.error('[Owner call email] not sent', { to, error: result.error ?? 'unknown' })
    return { sent: result.sent, to, error: result.error }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Owner call email failed'
    console.error('[Owner call email] failed', err)
    return { sent: false, to, error }
  }
}

async function sendOwnerText(report: OwnerCallReport, deps: DeliverDeps): Promise<DeliverResult['sms']> {
  const phone = process.env.OWNER_NOTIFY_PHONE?.trim() ?? ''
  if (!phone) return 'skipped'
  if (smsLogsInsteadOfSending()) {
    console.log('[Owner call SMS] skipped; SMS provider is not sending live texts')
    return 'skipped'
  }
  try {
    const send = deps.sendSms ?? ((to: string, body: string) => sendSms(to, body, 'owner'))
    const result = await send(phone, smsBody(report))
    if (result.delivery === 'failed') {
      console.error('[Owner call SMS] failed', { to: phone })
      return 'failed'
    }
    console.log('[Owner call SMS] sent', { to: phone })
    return 'sent'
  } catch (err) {
    console.error('[Owner call SMS] failed', err)
    return 'failed'
  }
}

function smsBody(report: OwnerCallReport): string {
  const headline = report.summary ? clip(report.summary, ONE_LINE_MAX) : 'no summary'
  const duration = report.duration !== 'not recorded' ? ` (${report.duration})` : ''
  return fitSms(`Swift Clear call: ${report.caller}${duration}. ${headline}`)
}

function idempotencyKey(callId: string): string | undefined {
  if (!callId || callId.length > 180 || !/^[A-Za-z0-9._:-]+$/.test(callId)) return undefined
  return `end-of-call/${callId}`
}

function unwrap(payload: unknown): Record<string, unknown> {
  const root = asRecord(payload)
  if (root.message && typeof root.message === 'object') return asRecord(root.message)
  return root
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function str(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function clip(value: string, max: number): string {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trimEnd()}…`
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value.trim()))) return Number(value.trim())
  return null
}

function durationSeconds(root: Record<string, unknown>): number | null {
  const call = asRecord(root.call)
  const direct = num(root.durationSeconds) ?? num(call.durationSeconds)
  if (direct != null && direct >= 0) return direct
  const ms = num(root.durationMs) ?? num(call.durationMs)
  if (ms != null && ms >= 0) return ms / 1000
  const minutes = num(root.durationMinutes)
  if (minutes != null && minutes >= 0) return minutes * 60
  const callDuration = num(call.duration)
  if (callDuration != null && callDuration >= 0) return callDuration
  const started = Date.parse(str(root.startedAt) || str(call.startedAt))
  const ended = Date.parse(str(root.endedAt) || str(call.endedAt))
  if (Number.isFinite(started) && Number.isFinite(ended) && ended >= started) return (ended - started) / 1000
  return null
}

function formatDuration(totalSeconds: number | null): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds < 0) return ''
  const seconds = Math.round(totalSeconds)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function httpUrl(value: string): string {
  if (!value) return ''
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString()
  } catch {
    return ''
  }
  return ''
}

function findRecording(root: Record<string, unknown>): string {
  const artifact = asRecord(root.artifact)
  const recording = asRecord(artifact.recording)
  const mono = asRecord(recording.mono)
  const call = asRecord(root.call)
  const candidates = [
    artifact.recordingUrl,
    mono.combinedUrl,
    artifact.stereoRecordingUrl,
    recording.stereoUrl,
    root.recordingUrl,
    call.recordingUrl,
  ]
  for (const candidate of candidates) {
    const url = httpUrl(str(candidate))
    if (url) return url
  }
  return ''
}

function toolNotes(root: Record<string, unknown>): string[] {
  const artifact = asRecord(root.artifact)
  const lists = [artifact.messages, root.messages]
  const notes: string[] = []
  for (const list of lists) {
    if (!Array.isArray(list)) continue
    for (const item of list) {
      const message = asRecord(item)
      const name = str(message.name) || str(message.toolName) || str(asRecord(message.function).name)
      if (name !== 'get_price' && name !== 'create_booking') continue
      const result = message.result ?? message.content
      const text = typeof result === 'string' ? result : result && typeof result === 'object' ? JSON.stringify(result) : ''
      const clipped = clip(collapse(text), 300)
      if (clipped) notes.push(`${name}: ${clipped}`)
    }
  }
  return notes
}

function bookingLines(data: Record<string, unknown>, notes: string[]): string[] {
  const lines: string[] = []
  const job = str(data.job)
  const price = str(data.priceQuoted) || str(data.price)
  const day = str(data.day)
  const slot = str(data.slot)
  const postcode = str(data.postcode)
  const address = str(data.address)
  if (job) lines.push(`Job: ${job}`)
  if (price) lines.push(`Price quoted: ${price}`)
  if (data.booked === true || data.booked === 'true' || data.booked === 'yes') lines.push('Booked: yes')
  else if (data.booked === false || data.booked === 'false' || data.booked === 'no') lines.push('Booked: no')
  if (day) lines.push(`Day: ${day}`)
  if (slot) lines.push(`Slot: ${slot}`)
  if (postcode) lines.push(`Postcode: ${postcode}`)
  if (address) lines.push(`Address: ${address}`)
  lines.push(...notes)
  return lines
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderText(input: {
  caller: string
  callerName: string
  duration: string
  endedReason: string
  callId: string
  summary: string
  quoteLines: string[]
  recordingUrl: string
}): string {
  const lines = [
    'Swift Clear call summary',
    '',
    `Caller: ${input.caller}`,
    input.callerName ? `Name: ${input.callerName}` : null,
    `Duration: ${input.duration}`,
    `Ended: ${input.endedReason}`,
    input.callId ? `Call id: ${input.callId}` : null,
    '',
    'Summary:',
    input.summary,
    '',
    'Quote and booking:',
    input.quoteLines.length ? input.quoteLines.join('\n') : 'No booking or quote details were captured.',
    '',
    `Recording: ${input.recordingUrl || 'not recorded'}`,
    '',
  ]
  return lines.filter((line): line is string => line !== null).join('\n')
}

function renderHtml(input: {
  caller: string
  callerName: string
  duration: string
  endedReason: string
  callId: string
  summary: string
  quoteLines: string[]
  recordingUrl: string
}): string {
  const rows: Array<[string, string]> = [
    ['Caller', input.caller],
    ...(input.callerName ? [['Name', input.callerName] as [string, string]] : []),
    ['Duration', input.duration],
    ['Ended', input.endedReason],
    ...(input.callId ? [['Call id', input.callId] as [string, string]] : []),
  ]
  const table = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding: 8px 16px 8px 0; color: #5c665f; vertical-align: top;">${escapeHtml(label)}</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(value)}</td></tr>`,
    )
    .join('')
  const quote = input.quoteLines.length
    ? input.quoteLines.map((line) => escapeHtml(line)).join('<br>')
    : 'No booking or quote details were captured.'
  const recording = input.recordingUrl
    ? `<a href="${escapeHtml(input.recordingUrl)}">${escapeHtml(input.recordingUrl)}</a>`
    : 'not recorded'

  return `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: #1B3A2D; padding: 24px 28px;">
    <p style="margin: 0; color: #E08B20; font-size: 12px; letter-spacing: 0.08em;">SWIFT CLEAR</p>
    <h1 style="margin: 8px 0 0; color: #ffffff; font-size: 22px; font-weight: 600;">Call summary</h1>
  </div>
  <div style="background: #f8f4ee; padding: 24px 28px; border: 1px solid #e5e0d8; border-top: 0;">
    <table style="width: 100%; border-collapse: collapse;">${table}</table>
    <h2 style="font-size: 14px; margin: 24px 0 8px;">Summary</h2>
    <p style="margin: 0; line-height: 1.5;">${escapeHtml(input.summary)}</p>
    <h2 style="font-size: 14px; margin: 24px 0 8px;">Quote and booking</h2>
    <p style="margin: 0; line-height: 1.5;">${quote}</p>
    <h2 style="font-size: 14px; margin: 24px 0 8px;">Recording</h2>
    <p style="margin: 0; line-height: 1.5;">${recording}</p>
  </div>
</div>`
}
