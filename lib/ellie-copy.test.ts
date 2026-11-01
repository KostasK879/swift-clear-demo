import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { summariseCall } from './call-summary.ts'
import { isGibberish, reply } from './chatbot.ts'
import {
  BEREAVEMENT_LINE,
  bookedOwnerText,
  GIBBERISH_REPLY,
  HOUSE_CALLBACK,
  MISHEARD_LINE,
  missedOwnerText,
  POSTCODE_ASK,
  REACT_EXAMPLE,
  UNCLEAR_REPLIES,
} from './ellie-copy.ts'
import { publicPhoneNumber } from './site-phone.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('gibberish uses the approved line', () => {
  assert.equal(isGibberish('asdfghjkl'), true)
  assert.equal(isGibberish('qwerty'), true)
  assert.equal(isGibberish('!!!!'), true)
  assert.equal(reply('asdfghjkl').text, GIBBERISH_REPLY)
})

test('unclear replies rotate and do not repeat back to back', () => {
  let last: number | undefined
  const seen: string[] = []
  for (let i = 0; i < UNCLEAR_REPLIES.length; i++) {
    const turn = reply('purple elephant sandwich', { lastUnclear: last })
    assert.equal(turn.text, UNCLEAR_REPLIES[i])
    assert.notEqual(turn.text, seen[seen.length - 1])
    seen.push(turn.text)
    last = turn.unclearIndex
  }
  assert.equal(new Set(seen).size, UNCLEAR_REPLIES.length)
  assert.equal(reply('purple elephant sandwich').text.includes('I can price a collection, check availability or take a booking'), false)
})

test('whole-house clearance stays unpriced until the owner sets it', () => {
  const previous = process.env.HOUSE_PRICE_2_BED
  delete process.env.HOUSE_PRICE_2_BED
  assert.equal(reply('can you do a whole house clearance').text, HOUSE_CALLBACK)
  assert.equal(reply('book a whole house clearance').text, HOUSE_CALLBACK)
  assert.equal(reply('we need a 2-bed house cleared').text, HOUSE_CALLBACK)
  process.env.HOUSE_PRICE_2_BED = '875'
  assert.match(reply('we need a 2-bed house cleared').text, /£875/)
  assert.equal(reply('can you do a whole house clearance').text.includes('£'), false)
  if (previous === undefined) delete process.env.HOUSE_PRICE_2_BED
  else process.env.HOUSE_PRICE_2_BED = previous
})

test('bereavement uses the gentle line and does not quote', () => {
  const turn = reply('my mum died and we need the house cleared')
  assert.equal(turn.text, BEREAVEMENT_LINE)
  assert.equal(turn.text.includes('£'), false)
})

test('a sofa still gets a real price', () => {
  assert.match(reply('please collect a sofa').text, /£70/)
})

test('the drama number is never shown', () => {
  const previous = process.env.NEXT_PUBLIC_PHONE_NUMBER
  process.env.NEXT_PUBLIC_PHONE_NUMBER = '020 7946 0000'
  assert.equal(publicPhoneNumber(), '')
  assert.equal(reply('what is your phone number').text.includes('7946'), false)
  process.env.NEXT_PUBLIC_PHONE_NUMBER = '020 1234 5678'
  assert.equal(publicPhoneNumber(), '020 1234 5678')
  assert.match(reply('what is your phone number').text, /020 1234 5678/)
  if (previous === undefined) delete process.env.NEXT_PUBLIC_PHONE_NUMBER
  else process.env.NEXT_PUBLIC_PHONE_NUMBER = previous
})

test('owner summary uses the approved wording', () => {
  assert.equal(
    bookedOwnerText({
      name: 'Ada',
      number: '07700900123',
      job: 'a sofa',
      price: 70,
      day: '6 Nov',
      slot: '10am',
      postcode: 'SW1A 1AA',
    }),
    'New call: Ada, 07700900123. Wants: a sofa. Quoted £70. Booked 6 Nov, 10am at SW1A 1AA.',
  )
  assert.equal(
    missedOwnerText({ name: 'Ada', number: '07700900123', job: 'a sofa' }),
    "Missed booking: Ada, 07700900123 wanted a sofa. Didn't book, worth a call back.",
  )
})

test('an ended call that did not book uses the missed line', () => {
  const summary = summariseCall({
    type: 'end-of-call-report',
    call: { id: 'call_1', customer: { number: '+447700900123' } },
    analysis: { structuredData: { callerName: 'Ada', job: 'a sofa', booked: false } },
  })
  assert.equal(summary.kind, 'missed')
  assert.equal(summary.body, "Missed booking: Ada, +447700900123 wanted a sofa. Didn't book, worth a call back.")
  assert.ok(summary.keys.includes('call:call_1'))
})

test('the phone prompt contains the approved manner', () => {
  const assistant = JSON.parse(readFileSync(join(root, 'vapi/assistant.json'), 'utf8'))
  const prompt = assistant.model.messages[0].content as string
  for (const line of [REACT_EXAMPLE, MISHEARD_LINE, POSTCODE_ASK, HOUSE_CALLBACK, BEREAVEMENT_LINE]) {
    assert.ok(prompt.includes(line), line)
  }
  assert.equal(assistant.model.tools.some((tool: { function?: { name?: string } }) => tool.function?.name === 'get_price'), true)
})
