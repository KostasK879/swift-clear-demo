import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ELLIE_CALL_LABEL,
  phoneDisplay,
  phoneTelHref,
  PILOT_PHONE_DISPLAY,
  PILOT_PHONE_TEL,
  publicPhoneNumber,
} from './site-phone.ts'

function withPhone(value: string | undefined, run: () => void) {
  const previous = process.env.NEXT_PUBLIC_PHONE_NUMBER
  if (value === undefined) delete process.env.NEXT_PUBLIC_PHONE_NUMBER
  else process.env.NEXT_PUBLIC_PHONE_NUMBER = value
  try {
    run()
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_PHONE_NUMBER
    else process.env.NEXT_PUBLIC_PHONE_NUMBER = previous
  }
}

test('the site shows the US pilot line when no number is configured', () => {
  withPhone(undefined, () => {
    assert.equal(publicPhoneNumber(), PILOT_PHONE_DISPLAY)
    assert.equal(phoneDisplay(), '+1 (442) 288-0083')
    assert.equal(phoneTelHref(), 'tel:+14422880083')
    assert.equal(PILOT_PHONE_TEL, 'tel:+14422880083')
    assert.equal(ELLIE_CALL_LABEL, 'Call Ellie, our AI receptionist, 24/7')
  })
})

test('a UK number or the drama number is replaced on the site by the pilot line', () => {
  withPhone('020 7946 0000', () => {
    assert.equal(publicPhoneNumber(), '')
    assert.equal(phoneDisplay(), '+1 (442) 288-0083')
    assert.equal(phoneTelHref(), 'tel:+14422880083')
  })
  withPhone('020 1234 5678', () => {
    assert.equal(publicPhoneNumber(), '020 1234 5678')
    assert.equal(phoneDisplay(), '+1 (442) 288-0083')
    assert.equal(phoneTelHref(), 'tel:+14422880083')
  })
  withPhone('+1 (442) 288-0083', () => {
    assert.equal(phoneDisplay(), '+1 (442) 288-0083')
    assert.equal(phoneTelHref(), 'tel:+14422880083')
  })
  withPhone('+14422880083', () => {
    assert.equal(phoneDisplay(), '+1 (442) 288-0083')
    assert.equal(phoneTelHref(), 'tel:+14422880083')
  })
})

test('a different non-UK number still overrides the pilot line', () => {
  withPhone('+1 (555) 010-0199', () => {
    assert.equal(phoneDisplay(), '+1 (555) 010-0199')
    assert.equal(phoneTelHref(), 'tel:+15550100199')
  })
})
