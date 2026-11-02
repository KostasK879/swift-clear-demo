/**
 * The number shown on the site and read by the chat.
 * Set NEXT_PUBLIC_PHONE_NUMBER to a real Twilio/Vapi UK number before launch.
 * 020 7946 0000 is an Ofcom reserved drama number and cannot take calls, so it is rejected.
 */

const OFCOM_DRAMA_DIGITS = '02079460000'

export const PHONE_NUMBER_PLACEHOLDER = 'Add your UK number'

export function publicPhoneNumber(): string {
  const raw = (process.env.NEXT_PUBLIC_PHONE_NUMBER ?? '').trim()
  if (!raw) return ''
  const compact = raw.replace(/[\s()-]/g, '')
  const national = compact.replace(/^\+44/, '0')
  if (national === OFCOM_DRAMA_DIGITS || compact === '+442079460000') return ''
  return raw
}

export function phoneDisplay(): string {
  return publicPhoneNumber() || PHONE_NUMBER_PLACEHOLDER
}

/** tel: link, or null when no real number is configured. */
export function phoneTelHref(): string | null {
  const number = publicPhoneNumber()
  if (!number) return null
  const compact = number.replace(/[^\d+]/g, '')
  return compact ? `tel:${compact}` : null
}
