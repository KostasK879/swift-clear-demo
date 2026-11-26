/**
 * The number shown on the site, and the number the chat reads when one is configured.
 * Ellie answers the US pilot line. That is what the site shows unless
 * NEXT_PUBLIC_PHONE_NUMBER is a different non-UK number.
 * 020 7946 0000 is an Ofcom reserved drama number and cannot take calls, so it is rejected.
 */

const OFCOM_DRAMA_DIGITS = '02079460000'
const PILOT_DIGITS = '14422880083'

export const PILOT_PHONE_DISPLAY = '+1 (442) 288-0083'
export const PILOT_PHONE_TEL = 'tel:+14422880083'
export const ELLIE_CALL_LABEL = 'Call Ellie, our AI receptionist, 24/7'

export const PHONE_NUMBER_PLACEHOLDER = 'Add your UK number'

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function isUkNumber(value: string): boolean {
  const compact = value.replace(/[\s()-]/g, '')
  // +1 442… compacts to +1442…, which must stay a US number.
  if (compact.startsWith('+1')) return false
  return compact.startsWith('+44') || compact.startsWith('44') || compact.startsWith('0')
}

function isPilotNumber(value: string): boolean {
  const digits = digitsOnly(value)
  return digits === PILOT_DIGITS || digits === '4422880083'
}

export function publicPhoneNumber(): string {
  const raw = (process.env.NEXT_PUBLIC_PHONE_NUMBER ?? '').trim()
  if (!raw) return PILOT_PHONE_DISPLAY
  const compact = raw.replace(/[\s()-]/g, '')
  const national = compact.replace(/^\+44/, '0')
  if (national === OFCOM_DRAMA_DIGITS || compact === '+442079460000') return ''
  return raw
}

/** Number printed on the site. A UK value or an empty setting uses the US pilot line. */
export function phoneDisplay(): string {
  const number = publicPhoneNumber()
  if (!number || isUkNumber(number) || isPilotNumber(number)) return PILOT_PHONE_DISPLAY
  return number
}

/** tel: link for the number shown on the site. */
export function phoneTelHref(): string {
  const number = publicPhoneNumber()
  if (!number || isUkNumber(number) || isPilotNumber(number)) return PILOT_PHONE_TEL
  const compact = number.replace(/[^\d+]/g, '')
  return compact ? `tel:${compact}` : PILOT_PHONE_TEL
}
