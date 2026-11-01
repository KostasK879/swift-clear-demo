import type { HouseSize } from '@/types'
import {
  anyHousePriceSet,
  APPLIANCE_PRICES,
  FURNITURE_LABELS,
  FURNITURE_PRICES,
  houseClearancePrice,
  HOUSE_SIZE_LABELS,
  LOAD_PRICES,
} from './pricing'
import {
  BEREAVEMENT_LINE,
  GIBBERISH_REPLY,
  HOUSE_CALLBACK,
  nextUnclearIndex,
  UNCLEAR_REPLIES,
} from './ellie-copy'
import { publicPhoneNumber } from './site-phone'

export type Reply = { text: string; chips?: string[]; link?: { href: string; label: string }; unclearIndex?: number }

export const GREETING: Reply = {
  text: "Hi, I'm Ellie. I'm the AI assistant on the Swift Clear website, not a real person, and I'm happy to help. I can price a collection, check availability or help you book. What do you need cleared?",
  chips: ['Get a price', 'Same-day collection?', 'What do you take?', 'Book a collection'],
}

const QUOTE = { href: '/quote', label: 'Get my exact quote →' }
const FALLBACK_CHIPS = ['Get a price', 'Same-day collection?', 'Book a collection']

const has = (s: string, ...w: string[]) => w.some((x) => s.includes(x))

function withNumber(whenSet: (number: string) => string, whenUnset: string): string {
  const number = publicPhoneNumber()
  return number ? whenSet(number) : whenUnset
}

function wantsHuman(s: string): boolean {
  return has(
    s,
    'representative',
    'real person',
    'real human',
    'human',
    'manager',
    'operator',
    'customer service',
    'customer support',
    'talk to someone',
    'speak to someone',
    'talk to a',
    'speak to a',
    'talk to the',
    'speak to the',
    'talk to person',
    'speak to person',
    'put me through',
    'transfer me',
    'live agent',
    'live person',
    'staff',
    'advisor',
  ) || (has(s, 'talk to', 'speak to', 'speak with', 'talk with') && has(s, 'someone', 'somebody', 'person', 'human', 'agent', 'team', 'rep'))
}

function isBereavement(s: string): boolean {
  if (has(s, 'bereavement', 'passed away', 'passed on', 'deceased', 'probate', 'funeral')) return true
  return has(s, 'died', 'death', 'passed')
    && has(s, 'mum', 'mom', 'dad', 'mother', 'father', 'parent', 'husband', 'wife', 'partner', 'nan', 'gran', 'grandma', 'grandad', 'uncle', 'aunt', 'brother', 'sister', 'family', 'relative')
}

function mentionedHouseSize(s: string): HouseSize | null {
  if (/\b(per room|each room|room by room|by the room)\b/.test(s)) return 'room'
  if (/\b(1-bed|1 bedroom|one bedroom|one-bedroom)\b/.test(s) || (/\b(1|one) bed\b/.test(s) && /\b(house|flat|home|property|clearance)\b/.test(s))) return '1_bed'
  if (/\b(2-bed|2 bedroom|two bedroom|two-bedroom)\b/.test(s) || (/\b(2|two) bed\b/.test(s) && /\b(house|flat|home|property|clearance)\b/.test(s))) return '2_bed'
  if (/\b(3-bed|3 bedroom|three bedroom|three-bedroom)\b/.test(s) || (/\b(3|three) bed\b/.test(s) && /\b(house|flat|home|property|clearance)\b/.test(s))) return '3_bed'
  return null
}

function isWholeHouse(s: string): boolean {
  return mentionedHouseSize(s) != null || /\b(whole house|full house|entire house|house clearance|house clear|clear the house|clear my house|clear a house|home clearance)\b/.test(s)
}

function houseReply(s: string): Reply {
  const size = mentionedHouseSize(s)
  if (size) {
    const price = houseClearancePrice(size)
    if (price != null) {
      return {
        text: `${HOUSE_SIZE_LABELS[size]}: £${price}. Collection and disposal included.`,
        link: QUOTE,
      }
    }
  }
  if (!anyHousePriceSet() || size) return { text: HOUSE_CALLBACK }
  return {
    text: 'Whole-house prices depend on the size. Is it a 1-bed, 2-bed, 3-bed, or are we pricing it per room?',
  }
}

const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

function isKeyboardMash(token: string): boolean {
  if (token.length < 4) return false
  if (KEY_ROWS.some((row) => row.includes(token))) return true
  let steps = 0
  for (let i = 1; i < token.length; i++) {
    const prev = token[i - 1]
    const curr = token[i]
    const rowA = KEY_ROWS.findIndex((row) => row.includes(prev))
    const rowB = KEY_ROWS.findIndex((row) => row.includes(curr))
    if (rowA === -1 || rowB === -1 || rowA !== rowB) continue
    if (Math.abs(KEY_ROWS[rowA].indexOf(prev) - KEY_ROWS[rowB].indexOf(curr)) <= 2) steps++
  }
  return steps >= token.length - 2
}

function looksLikeRealWord(token: string): boolean {
  if (token.length < 2) return false
  if (!/[aeiouy]/.test(token)) return false
  if (/^(.)\1+$/.test(token)) return false
  if (isKeyboardMash(token)) return false
  return true
}

/** True when the visitor typed no real words (keyboard mash, symbols, repeated characters). */
export function isGibberish(raw: string): boolean {
  const s = raw.toLowerCase().trim()
  if (!s) return false
  const tokens = s.split(/[^a-z]+/).filter(Boolean)
  if (tokens.length === 0) return true
  return tokens.every((token) => !looksLikeRealWord(token))
}

/**
 * Keyword receptionist. Used when no AI key is set, and if the model call fails.
 * Pass lastUnclear so the "didn't follow" lines rotate and never repeat back to back.
 */
export function reply(input: string, opts?: { lastUnclear?: number }): Reply {
  const s = input.toLowerCase().trim()

  if (isBereavement(s)) return { text: BEREAVEMENT_LINE }

  if (wantsHuman(s) || has(s, 'phone', 'call me', 'phone number', 'your number', 'contact number')) {
    return {
      text: withNumber(
        (number) => `Of course — you can reach the team on ${number}. Happy to keep helping here too if you'd like a quick price or booking.`,
        'The phone line is not connected on this demo yet. Happy to keep helping here if you would like a quick price or booking.',
      ),
      link: QUOTE,
      chips: ['Get a price', 'Same-day collection?'],
    }
  }

  if (has(s, 'complaint', 'complain', 'unhappy', 'refund', 'terrible', 'awful', 'disgusted', 'ripoff', 'rip-off')) {
    return {
      text: withNumber(
        (number) => `Sorry to hear that. Please call us on ${number} and ask for the duty manager — we'll sort it. You can also leave details on the quote form and we'll call you back.`,
        "Sorry to hear that. Leave details on the quote form and we'll call you back. Ask for the duty manager.",
      ),
      link: QUOTE,
    }
  }

  if (has(s, 'cancel', 'cancellation', 'postpone', 'reschedule', 'change my booking', 'change booking')) {
    return {
      text: withNumber(
        (number) => `No problem. Call ${number} with your booking reference and we'll cancel or move it. Same-day changes are usually fine if the crew hasn't left yet.`,
        "No problem. Leave your booking reference on the quote form and we'll cancel or move it. Same-day changes are usually fine if the crew hasn't left yet.",
      ),
      chips: ['Book a collection', 'Get a price'],
    }
  }

  if (has(s, 'hello', 'hi ', 'hey') && s.length < 12) return GREETING
  if (s === 'hi' || s === 'hello' || s === 'hey') return GREETING

  if (isWholeHouse(s)) return houseReply(s)

  if (has(s, 'book', 'quote', 'get a price', 'price me')) {
    if (s === 'get a price') {
      return { text: 'Happy to help. What are we clearing?', chips: ['Furniture', 'Garden waste', 'Rubble', 'General junk', 'Appliances'] }
    }
    return { text: "Easiest way is our 60-second quote tool: pick your items, choose a slot and you're booked. No call-outs, no surprises.", link: QUOTE }
  }
  if (has(s, 'same day', 'same-day', 'today', 'tomorrow', 'urgent', 'how soon', 'when')) {
    return { text: 'Yes, we offer same-day collection across London when there is a slot free. Pick your time in the quote tool and you will see live availability.', link: QUOTE, chips: ['Get a price'] }
  }
  if (has(s, 'furniture', 'sofa', 'bed', 'wardrobe', 'table', 'chair', 'mattress', 'desk')) {
    const list = Object.keys(FURNITURE_PRICES).filter((k) => k !== 'other').map((k) => `${FURNITURE_LABELS[k]} £${FURNITURE_PRICES[k]}`).join(', ')
    return { text: `Furniture is priced per item: ${list}. Prices include collection and eco disposal.`, link: QUOTE }
  }
  if (has(s, 'garden', 'green waste', 'hedge', 'lawn')) return load('Garden waste', LOAD_PRICES.garden)
  if (has(s, 'rubble', 'builder', 'construction', 'brick', 'soil')) return load('Construction rubble', LOAD_PRICES.rubble)
  if (has(s, 'junk', 'clearance', 'general junk', 'rubbish')) return load('General junk', LOAD_PRICES.junk)
  if (has(s, 'general waste', 'general clear')) return load('General junk', LOAD_PRICES.junk)
  if (has(s, 'appliance', 'fridge', 'washing', 'freezer', 'oven', 'dishwasher', 'dryer')) {
    return { text: `Appliances: fridge £${APPLIANCE_PRICES.fridge}, washing machine £${APPLIANCE_PRICES.washing_machine}, dishwasher £${APPLIANCE_PRICES.dishwasher}, oven £${APPLIANCE_PRICES.oven}, tumble dryer £${APPLIANCE_PRICES.tumble_dryer}. We handle fridge-safe disposal too.`, link: QUOTE }
  }
  if (has(s, 'accept', 'what do you', 'services', 'hazard', 'asbestos') || (has(s, 'take') && has(s, 'what', 'do you', 'can you'))) {
    return { text: 'We take furniture, garden waste, construction rubble, general junk and appliances. We cannot take asbestos or other hazardous waste. Whole-house clearances are priced once we know what is there.', chips: ['Furniture', 'Garden waste', 'Rubble', 'Appliances'] }
  }
  if (has(s, 'insured', 'licen', 'legal', 'eco', 'recycl')) {
    return { text: "We're fully licensed and insured, and we aim to recycle or reuse as much as possible. Waste carrier details are available on request." }
  }
  if (has(s, 'phone', 'call', 'number', 'speak', 'contact')) {
    return {
      text: withNumber(
        (number) => `You can ring the team on ${number}, or leave your number via the quote form and we will call you back.`,
        'The phone line is not connected on this demo yet. Leave your number via the quote form and we will call you back.',
      ),
      link: QUOTE,
    }
  }
  if (has(s, 'thank', 'thanks', 'cheers')) return { text: "You're welcome! Anything else I can help with?" }

  if (isGibberish(s)) {
    return { text: GIBBERISH_REPLY, chips: FALLBACK_CHIPS }
  }

  const unclearIndex = nextUnclearIndex(opts?.lastUnclear)
  return { text: UNCLEAR_REPLIES[unclearIndex], chips: FALLBACK_CHIPS, unclearIndex }
}

function load(name: string, p: { small: number; half: number; full: number }): Reply {
  return {
    text: `${name}: small load (quarter van) £${p.small}, half load £${p.half}, full load £${p.full}. Collection and disposal included.`,
    link: QUOTE,
  }
}
