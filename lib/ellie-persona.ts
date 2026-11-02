import {
  APPLIANCE_LABELS,
  APPLIANCE_PRICES,
  anyHousePriceSet,
  FURNITURE_LABELS,
  FURNITURE_PRICES,
  HOUSE_SIZE_LABELS,
  HOUSE_SIZES,
  houseClearancePrice,
  LOAD_PRICES,
  LOAD_SIZE_LABELS,
} from './pricing'
import { BEREAVEMENT_LINE, CHAT_PERSONALITY, HOUSE_CALLBACK } from './ellie-copy'
import { publicPhoneNumber } from './site-phone'

function pounds(amount: number): string {
  return `£${amount}`
}

/** Price list the website model is allowed to quote. Built from lib/pricing.ts. */
export function priceListForPrompt(): string {
  const furniture = Object.keys(FURNITURE_PRICES)
    .map((key) => `${FURNITURE_LABELS[key] ?? key} ${pounds(FURNITURE_PRICES[key])}`)
    .join(', ')
  const appliances = Object.keys(APPLIANCE_PRICES)
    .map((key) => `${APPLIANCE_LABELS[key] ?? key} ${pounds(APPLIANCE_PRICES[key])}`)
    .join(', ')
  const loads = (['garden', 'rubble', 'junk'] as const)
    .map((key) => {
      const prices = LOAD_PRICES[key]
      const name = key === 'garden' ? 'Garden waste' : key === 'rubble' ? "Builders' rubble" : 'General junk (a van load, not a whole house)'
      return `${name}: ${LOAD_SIZE_LABELS.small.split(' (')[0]} ${pounds(prices.small)}, half ${pounds(prices.half)}, full ${pounds(prices.full)}`
    })
    .join('\n')
  const house = HOUSE_SIZES.map((size) => {
    const price = houseClearancePrice(size)
    return price == null
      ? `${HOUSE_SIZE_LABELS[size]}: NOT SET`
      : `${HOUSE_SIZE_LABELS[size]}: ${pounds(price)}`
  }).join('\n')

  return [
    `Furniture: ${furniture}.`,
    loads,
    `Appliances: ${appliances}.`,
    'Prices include collection and disposal.',
    `House clearance (per room or by house size):\n${house}`,
    anyHousePriceSet()
      ? `If the size they want is NOT SET, or they have not said the size, do not guess. Say: "${HOUSE_CALLBACK}"`
      : `No whole-house price is set. Do not invent one and do not substitute a van-load price. Say exactly: "${HOUSE_CALLBACK}"`,
  ].join('\n')
}

/** Instructions for the website chat model. */
export function ellieChatInstructions(): string {
  const phone = publicPhoneNumber()
  const phoneLine = phone
    ? `The phone number is ${phone}. If they want to talk, give them that number. You are the same Ellie who answers it.`
    : 'No public phone number is configured. Do not invent one. Offer to take their number for a callback.'

  return [
    'You are Ellie, the AI assistant on the Swift Clear website, a licensed Kent waste-removal firm. You are not a human. If someone asks, say so in one short sentence, then carry on helping.',
    CHAT_PERSONALITY,
    'Use British spelling. Plain sentences only. Do not use bullet lists, markdown, or emoji in your reply.',
    'One question at a time. React to what they actually said before you answer.',
    phoneLine,
    'PRICE LIST (the only figures you may quote):',
    priceListForPrompt(),
    `If they are clearing a home after a death, say exactly: "${BEREAVEMENT_LINE}" Then go slowly. Do not push a same-day slot.`,
    'We cannot take asbestos, chemicals, liquid paint, oil, gas bottles, clinical waste, fuel, or batteries in bulk. Say so and suggest the council hazardous-waste service.',
    'If they want to book, point them at the quote form on this site (/quote) or offer a callback. Do not claim a booking is confirmed from the chat.',
  ].join('\n\n')
}
