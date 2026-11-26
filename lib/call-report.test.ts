import assert from 'node:assert/strict'
import test from 'node:test'
import { buildOwnerCallReport, deliverOwnerCallReport, ownerNotifyEmail } from './call-report.ts'

/** A Vapi end-of-call-report, as posted to the server URL. */
const sampleEndOfCallReport = {
  message: {
    type: 'end-of-call-report',
    endedReason: 'customer-ended-call',
    durationSeconds: 184,
    startedAt: '2026-11-26T10:00:00.000Z',
    endedAt: '2026-11-26T10:03:04.000Z',
    summary: 'This top-level summary should lose to analysis.summary.',
    call: {
      id: 'call_sample_1',
      customer: { number: '+447700900123', name: 'Ada' },
    },
    customer: { number: '+447700900123' },
    analysis: {
      summary: 'Ada called about collecting a sofa.\nQuoted £70. She did not book a slot.',
      structuredData: {
        callerName: 'Ada',
        callerNumber: '07700900123',
        job: 'a sofa',
        priceQuoted: '£70',
        booked: false,
        postcode: 'ME1 1AA',
      },
    },
    artifact: {
      recordingUrl: 'https://example.com/recordings/call_sample_1.wav',
      messages: [
        {
          role: 'tool_call_result',
          name: 'get_price',
          result: '1x Sofa / Armchair: £70 all-in (labour, loading, disposal and VAT included).',
        },
      ],
    },
  },
}

function withEnv(values: Record<string, string | undefined>, fn: () => Promise<void> | void): Promise<void> | void {
  const keys = Object.keys(values)
  const previous: Record<string, string | undefined> = {}
  for (const key of keys) previous[key] = process.env[key]
  for (const key of keys) {
    const value = values[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  const restore = () => {
    for (const key of keys) {
      const value = previous[key]
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
  try {
    const result = fn()
    if (result && typeof (result as Promise<void>).then === 'function') {
      return (result as Promise<void>).finally(restore)
    }
    restore()
    return result
  } catch (err) {
    restore()
    throw err
  }
}

test('a sample end-of-call-report becomes an owner email', () => {
  const report = buildOwnerCallReport(sampleEndOfCallReport)
  assert.equal(report.callId, 'call_sample_1')
  assert.equal(report.caller, '+447700900123')
  assert.equal(report.callerName, 'Ada')
  assert.equal(report.duration, '3m 4s')
  assert.equal(report.endedReason, 'customer-ended-call')
  assert.equal(report.recordingUrl, 'https://example.com/recordings/call_sample_1.wav')
  assert.equal(
    report.summary,
    'Ada called about collecting a sofa. Quoted £70. She did not book a slot.',
  )
  assert.equal(
    report.subject,
    'Swift Clear call: +447700900123 — Ada called about collecting a sofa. Quoted £70. She did not book a slot.',
  )
  assert.match(report.text, /Caller: \+447700900123/)
  assert.match(report.text, /Name: Ada/)
  assert.match(report.text, /Duration: 3m 4s/)
  assert.match(report.text, /Ended: customer-ended-call/)
  assert.match(report.text, /Job: a sofa/)
  assert.match(report.text, /Price quoted: £70/)
  assert.match(report.text, /Booked: no/)
  assert.match(report.text, /Postcode: ME1 1AA/)
  assert.match(report.text, /get_price: 1x Sofa \/ Armchair: £70/)
  assert.match(report.text, /https:\/\/example.com\/recordings\/call_sample_1.wav/)
  assert.match(report.html, /Ada called about collecting a sofa/)
  assert.match(report.html, /href="https:\/\/example.com\/recordings\/call_sample_1.wav"/)
})

test('analysis.summary wins, then message.summary, and a long line is clipped', () => {
  const fallback = buildOwnerCallReport({
    message: {
      type: 'end-of-call-report',
      summary: 'Callback requested for a 2-bed clearance.',
      endedReason: 'assistant-ended-call',
      artifact: { stereoRecordingUrl: 'https://example.com/stereo.wav' },
    },
  })
  assert.equal(fallback.caller, 'unknown caller')
  assert.equal(fallback.duration, 'not recorded')
  assert.equal(
    fallback.subject,
    'Swift Clear call: unknown caller — Callback requested for a 2-bed clearance.',
  )
  assert.equal(fallback.recordingUrl, 'https://example.com/stereo.wav')
  assert.match(fallback.text, /No booking or quote details were captured/)

  const long = 'A'.repeat(180)
  const clipped = buildOwnerCallReport({
    message: { type: 'end-of-call-report', analysis: { summary: long }, call: { customer: { number: '+441' } } },
  })
  assert.equal(clipped.subject, `Swift Clear call: +441 — ${'A'.repeat(117)}…`)
  assert.equal(clipped.subject.includes('\n'), false)
})

test('missing fields and odd shapes do not throw', () => {
  const empty = buildOwnerCallReport({ message: { type: 'end-of-call-report' } })
  assert.equal(empty.subject, 'Swift Clear call: unknown caller — no summary')
  assert.equal(empty.duration, 'not recorded')
  assert.equal(empty.endedReason, 'not recorded')
  assert.equal(empty.recordingUrl, '')
  assert.match(empty.text, /Duration: not recorded/)
  assert.match(empty.text, /Ended: not recorded/)
  assert.match(empty.text, /Recording: not recorded/)
  assert.match(empty.text, /No booking or quote details were captured/)

  const timed = buildOwnerCallReport({
    type: 'end-of-call-report',
    startedAt: '2026-11-26T10:00:00.000Z',
    endedAt: '2026-11-26T10:01:05.000Z',
    call: { endedReason: 'silence-timed-out' },
    artifact: { recording: { mono: { combinedUrl: 'https://example.com/mono.wav' } } },
    analysis: {
      summary: 'Quoted <script> & "sofas".',
      structuredData: { booked: true, job: 'two sofas', priceQuoted: '140', day: 'Thu', slot: '10am' },
    },
  })
  assert.equal(timed.duration, '1m 5s')
  assert.equal(timed.endedReason, 'silence-timed-out')
  assert.equal(timed.recordingUrl, 'https://example.com/mono.wav')
  assert.match(timed.text, /Booked: yes/)
  assert.match(timed.text, /Day: Thu/)
  assert.match(timed.text, /Slot: 10am/)
  assert.equal(timed.html.includes('<script>'), false)
  assert.match(timed.html, /&lt;script&gt;/)
  assert.match(timed.html, /&amp;/)

  const fromMs = buildOwnerCallReport({ durationMs: 42000, summary: 'Short call.' })
  assert.equal(fromMs.duration, '42s')
  assert.equal(fromMs.caller, 'unknown caller')
})

test('owner email defaults to hello@nodusai.io', () => {
  withEnv({ OWNER_NOTIFY_EMAIL: undefined }, () => {
    assert.equal(ownerNotifyEmail(), 'hello@nodusai.io')
  })
  withEnv({ OWNER_NOTIFY_EMAIL: '   ' }, () => {
    assert.equal(ownerNotifyEmail(), 'hello@nodusai.io')
  })
  withEnv({ OWNER_NOTIFY_EMAIL: '  owner@example.com  ' }, () => {
    assert.equal(ownerNotifyEmail(), 'owner@example.com')
  })
})

test('the sample report is emailed, and SMS is skipped when no owner phone is set', async () => {
  await withEnv({ OWNER_NOTIFY_EMAIL: undefined, OWNER_NOTIFY_PHONE: undefined }, async () => {
    const sent: Array<{ to: string; subject: string; text: string; idempotencyKey?: string }> = []
    let smsCalls = 0
    const result = await deliverOwnerCallReport(sampleEndOfCallReport, {
      sendEmail: async (input) => {
        sent.push(input)
        return { sent: true, id: 'email_1' }
      },
      sendSms: async () => {
        smsCalls += 1
        return { delivery: 'sent' }
      },
    })
    assert.equal(sent.length, 1)
    assert.equal(sent[0].to, 'hello@nodusai.io')
    assert.equal(
      sent[0].subject,
      'Swift Clear call: +447700900123 — Ada called about collecting a sofa. Quoted £70. She did not book a slot.',
    )
    assert.match(sent[0].text, /Quoted £70/)
    assert.equal(sent[0].idempotencyKey, 'end-of-call/call_sample_1')
    assert.equal(result.email.sent, true)
    assert.equal(result.email.to, 'hello@nodusai.io')
    assert.equal(result.sms, 'skipped')
    assert.equal(smsCalls, 0)
  })
})

test('a failed email is recorded and does not throw', async () => {
  await withEnv({ OWNER_NOTIFY_EMAIL: 'owner@example.com', OWNER_NOTIFY_PHONE: undefined }, async () => {
    const result = await deliverOwnerCallReport(sampleEndOfCallReport, {
      sendEmail: async () => {
        throw new Error('resend down')
      },
    })
    assert.equal(result.email.sent, false)
    assert.equal(result.email.to, 'owner@example.com')
    assert.match(result.email.error ?? '', /resend down/)
    assert.equal(result.sms, 'skipped')
  })
})

test('OWNER_NOTIFY_PHONE is texted only when a live SMS provider is configured', async () => {
  const provider = {
    OWNER_NOTIFY_PHONE: '+447700900999',
    OWNER_NOTIFY_EMAIL: 'owner@example.com',
    TWILIO_ACCOUNT_SID: 'ACtest',
    TWILIO_AUTH_TOKEN: 'token',
    TWILIO_FROM_NUMBER: '+441234567890',
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    DEMO_MODE: undefined,
  }
  await withEnv(provider, async () => {
    let sms: { to: string; body: string } | undefined
    const result = await deliverOwnerCallReport(
      { message: { type: 'end-of-call-report', summary: 'Quoted a sofa at £70.', call: { customer: { number: '+447700900123' } } } },
      {
        sendEmail: async () => ({ sent: true }),
        sendSms: async (to, body) => {
          sms = { to, body }
          return { delivery: 'sent' }
        },
      },
    )
    assert.equal(result.sms, 'sent')
    assert.equal(sms?.to, '+447700900999')
    assert.match(sms?.body ?? '', /\+447700900123/)
    assert.match(sms?.body ?? '', /Quoted a sofa at £70/)
    assert.ok((sms?.body.length ?? 0) <= 320)
  })

  await withEnv(
    {
      OWNER_NOTIFY_PHONE: '+447700900999',
      TWILIO_ACCOUNT_SID: undefined,
      TWILIO_AUTH_TOKEN: undefined,
      TWILIO_FROM_NUMBER: undefined,
    },
    async () => {
      let smsCalls = 0
      const result = await deliverOwnerCallReport(sampleEndOfCallReport, {
        sendEmail: async () => ({ sent: true }),
        sendSms: async () => {
          smsCalls += 1
          return { delivery: 'sent' }
        },
      })
      assert.equal(result.sms, 'skipped')
      assert.equal(smsCalls, 0)
    },
  )
})
