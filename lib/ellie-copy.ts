/**
 * Approved Ellie wording (copy pack, 1 Nov 2026).
 * Sequencer wires these strings into chat, the phone prompt, and owner texts.
 */

export const GIBBERISH_REPLY =
  'Ha, I think the keyboard got away from you there. What are you looking to get rid of?'

export const UNCLEAR_REPLIES = [
  "Sorry, I didn't quite follow that. Is it furniture, garden waste, rubble or just general junk?",
  "Not sure I caught that one. Tell me what needs clearing and I'll get you a price.",
  "Hmm, lost me a bit there! What's the job? A sofa, a garden, a whole house?",
  "Bear with me, I'm better with specifics. What are we shifting, and roughly how much?",
] as const

/** Website chat personality brief, used when a real model is connected. */
export const CHAT_PERSONALITY =
  'You\'re the friendly person on the Swift Clear website. Talk like a helpful local, not a menu. Short replies, one question at a time. React to what they said before you answer ("Oh, a full garage? Done loads of those."). Only quote prices from the price list. If you don\'t know, say so and offer a callback.'

export const REACT_EXAMPLE = 'Oh, a full garden? No problem at all.'

export const MISHEARD_LINE = 'Sorry, you broke up a bit there, say that again?'

export const POSTCODE_ASK = "And what's the postcode for the collection?"

/** Whole-house price is [YOU SET]. Until then Ellie must say this and not guess. */
export const HOUSE_CALLBACK =
  "Whole-house clearances depend on what's there, so I'll get someone to call you back with a proper price today. What's the best number?"

export const BEREAVEMENT_LINE =
  "I'm really sorry for your loss. There's no rush at all. We'll go at whatever pace suits you and the family. Shall I take a few details so we can arrange a time to have a look?"

export function nextUnclearIndex(last: number | undefined): number {
  if (last == null || !Number.isInteger(last) || last < 0 || last >= UNCLEAR_REPLIES.length) return 0
  return (last + 1) % UNCLEAR_REPLIES.length
}

function tidy(value: string, fallback: string): string {
  const cleaned = value.replace(/\s+/g, ' ').trim()
  return cleaned || fallback
}

/** "New call: [Name], [number]. Wants: [job]. Quoted £[price]. Booked [day, slot] at [postcode]." */
export function bookedOwnerText(input: {
  name: string
  number: string
  job: string
  price: string | number
  day: string
  slot: string
  postcode: string
}): string {
  const price = tidy(String(input.price).replace(/^£/, ''), 'unconfirmed')
  return `New call: ${tidy(input.name, 'Unknown')}, ${tidy(input.number, 'unknown number')}. Wants: ${tidy(input.job, 'something unclear')}. Quoted £${price}. Booked ${tidy(input.day, 'unconfirmed day')}, ${tidy(input.slot, 'unconfirmed slot')} at ${tidy(input.postcode, 'postcode not given')}.`
}

/** "Missed booking: [Name], [number] wanted [job]. Didn't book, worth a call back." */
export function missedOwnerText(input: { name: string; number: string; job: string }): string {
  return `Missed booking: ${tidy(input.name, 'Unknown')}, ${tidy(input.number, 'unknown number')} wanted ${tidy(input.job, 'something unclear')}. Didn't book, worth a call back.`
}

export function fitSms(body: string, max = 320): string {
  const text = body.replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}
