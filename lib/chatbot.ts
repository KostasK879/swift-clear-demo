import { FURNITURE_PRICES, FURNITURE_LABELS, LOAD_PRICES, APPLIANCE_PRICES } from './pricing'

export type Reply = { text: string; chips?: string[]; link?: { href: string; label: string } }

export const GREETING: Reply = {
  text: "Hi! I'm Clearbot 👋 I can give you a price in seconds, check same-day availability or help you book. What do you need cleared?",
  chips: ['Get a price', 'Same-day collection?', 'What do you take?', 'Book a collection'],
}

const QUOTE = { href: '/quote', label: 'Get my exact quote →' }
const PHONE = '020 7946 0000'
const has = (s: string, ...w: string[]) => w.some(x => s.includes(x))

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

export function reply(input: string): Reply {
  const s = input.toLowerCase().trim()

  // Human / representative — check early so it never falls through to pricing
  if (wantsHuman(s) || has(s, 'phone', 'call me', 'phone number', 'your number', 'contact number')) {
    return {
      text: `Of course — you can reach the team on ${PHONE}. Happy to keep helping here too if you'd like a quick price or booking.`,
      link: QUOTE,
      chips: ['Get a price', 'Same-day collection?'],
    }
  }

  if (has(s, 'complaint', 'complain', 'unhappy', 'refund', 'terrible', 'awful', 'disgusted', 'ripoff', 'rip-off')) {
    return {
      text: `Sorry to hear that. Please call us on ${PHONE} and ask for the duty manager — we'll sort it. You can also leave details on the quote form and we'll call you back.`,
      link: QUOTE,
    }
  }

  if (has(s, 'cancel', 'cancellation', 'postpone', 'reschedule', 'change my booking', 'change booking')) {
    return {
      text: `No problem. Call ${PHONE} with your booking reference and we'll cancel or move it. Same-day changes are usually fine if the crew hasn't left yet.`,
      chips: ['Book a collection', 'Get a price'],
    }
  }

  if (has(s, 'hello', 'hi ', 'hey') && s.length < 12) return GREETING
  if (s === 'hi' || s === 'hello' || s === 'hey') return GREETING

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
    const list = Object.keys(FURNITURE_PRICES).filter(k => k !== 'other').map(k => `${FURNITURE_LABELS[k]} £${FURNITURE_PRICES[k]}`).join(', ')
    return { text: `Furniture is priced per item: ${list}. Prices include collection and eco disposal.`, link: QUOTE }
  }
  if (has(s, 'garden', 'green waste', 'hedge', 'lawn')) return load('Garden waste', LOAD_PRICES.garden)
  if (has(s, 'rubble', 'builder', 'construction', 'brick', 'soil')) return load('Construction rubble', LOAD_PRICES.rubble)
  if (has(s, 'junk', 'clearance', 'house clear', 'general junk', 'rubbish')) return load('General junk', LOAD_PRICES.junk)
  // bare "general" was too broad; keep "general waste" / "general clear"
  if (has(s, 'general waste', 'general clear')) return load('General junk', LOAD_PRICES.junk)
  if (has(s, 'appliance', 'fridge', 'washing', 'freezer', 'oven', 'dishwasher', 'dryer')) {
    return { text: `Appliances: fridge £${APPLIANCE_PRICES.fridge}, washing machine £${APPLIANCE_PRICES.washing_machine}, dishwasher £${APPLIANCE_PRICES.dishwasher}, oven £${APPLIANCE_PRICES.oven}, tumble dryer £${APPLIANCE_PRICES.tumble_dryer}. We handle fridge-safe disposal too.`, link: QUOTE }
  }
  if (has(s, 'accept', 'what do you', 'services', 'hazard', 'asbestos') || (has(s, 'take') && has(s, 'what', 'do you', 'can you'))) {
    return { text: 'We take furniture, garden waste, construction rubble, general junk and appliances. We cannot take asbestos or other hazardous waste.', chips: ['Furniture', 'Garden waste', 'Rubble', 'Appliances'] }
  }
  if (has(s, 'insured', 'licen', 'legal', 'eco', 'recycl')) {
    return { text: "We're fully licensed and insured, and we aim to recycle or reuse as much as possible. Waste carrier details are available on request." }
  }
  // broader call/phone catch (after human intent already handled)
  if (has(s, 'phone', 'call', 'number', 'speak', 'contact')) {
    return {
      text: `You can ring the team on ${PHONE}, or leave your number via the quote form and we will call you back.`,
      link: QUOTE,
    }
  }
  if (has(s, 'thank', 'thanks', 'cheers')) return { text: "You're welcome! Anything else I can help with?" }
  return { text: "I can price a collection, check availability or take a booking. Which would you like?", chips: ['Get a price', 'Same-day collection?', 'Book a collection'] }
}

function load(name: string, p: { small: number; half: number; full: number }): Reply {
  return {
    text: `${name}: small load (quarter van) £${p.small}, half load £${p.half}, full load £${p.full}. Collection and disposal included.`,
    link: QUOTE,
  }
}
