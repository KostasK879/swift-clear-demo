import { FURNITURE_PRICES, FURNITURE_LABELS, LOAD_PRICES, APPLIANCE_PRICES } from './pricing'

export type Reply = { text: string; chips?: string[]; link?: { href: string; label: string } }

export const GREETING: Reply = {
  text: "Hi! I'm Clearbot 👋 I can give you a price in seconds, check same-day availability or help you book. What do you need cleared?",
  chips: ['Get a price', 'Same-day collection?', 'What do you take?', 'Book a collection'],
}

const QUOTE = { href: '/quote', label: 'Get my exact quote →' }
const has = (s: string, ...w: string[]) => w.some(x => s.includes(x))

export function reply(input: string): Reply {
  const s = input.toLowerCase().trim()

  if (has(s, 'hello', 'hi ', 'hey') && s.length < 12) return GREETING
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
  if (has(s, 'junk', 'clearance', 'house clear', 'general', 'rubbish')) return load('General junk', LOAD_PRICES.junk)
  if (has(s, 'appliance', 'fridge', 'washing', 'freezer', 'oven', 'dishwasher', 'dryer')) {
    return { text: `Appliances: fridge £${APPLIANCE_PRICES.fridge}, washing machine £${APPLIANCE_PRICES.washing_machine}, dishwasher £${APPLIANCE_PRICES.dishwasher}, oven £${APPLIANCE_PRICES.oven}, tumble dryer £${APPLIANCE_PRICES.tumble_dryer}. We handle fridge-safe disposal too.`, link: QUOTE }
  }
  if (has(s, 'take', 'accept', 'what do you', 'services', 'hazard', 'asbestos')) {
    return { text: 'We take furniture, garden waste, construction rubble, general junk and appliances. We cannot take asbestos or other hazardous waste.', chips: ['Furniture', 'Garden waste', 'Rubble', 'Appliances'] }
  }
  if (has(s, 'insured', 'licen', 'legal', 'eco', 'recycl')) {
    return { text: "We're fully licensed and insured, and we aim to recycle or reuse as much as possible. Waste carrier details are available on request." }
  }
  if (has(s, 'phone', 'call', 'number', 'speak', 'human', 'person')) {
    return { text: 'You can ring the team on 020 7946 0000, or leave your number via the quote form and we will call you back.', link: QUOTE }
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