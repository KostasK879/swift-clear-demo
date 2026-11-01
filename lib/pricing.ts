import type { HouseSize, ServiceDetails } from '@/types'

export const FURNITURE_PRICES: Record<string, number> = {
  sofa: 70,
  bed: 70,
  wardrobe: 80,
  table: 50,
  chair: 40,
  mattress: 65,
  desk: 50,
  other: 50,
}

export const FURNITURE_LABELS: Record<string, string> = {
  sofa: 'Sofa / Armchair',
  bed: 'Bed Frame',
  wardrobe: 'Wardrobe',
  table: 'Table',
  chair: 'Dining Chair',
  mattress: 'Mattress',
  desk: 'Desk',
  other: 'Other Item',
}

export const LOAD_PRICES = {
  garden: { small: 50, half: 100, full: 180 },
  rubble: { small: 100, half: 180, full: 300 },
  junk:   { small: 60,  half: 120, full: 200 },
} as const

export const APPLIANCE_PRICES: Record<string, number> = {
  fridge: 70,
  washing_machine: 65,
  dishwasher: 60,
  oven: 55,
  tumble_dryer: 65,
  freezer: 65,
  other: 55,
}

export const APPLIANCE_LABELS: Record<string, string> = {
  fridge: 'Fridge / Fridge-Freezer',
  washing_machine: 'Washing Machine',
  dishwasher: 'Dishwasher',
  oven: 'Oven / Cooker',
  tumble_dryer: 'Tumble Dryer',
  freezer: 'Freezer',
  other: 'Other Appliance',
}

export const LOAD_SIZE_LABELS = {
  small: 'Small load (van quarter-full)',
  half:  'Half load',
  full:  'Full load',
}

/**
 * Whole-house and per-room prices. [YOU SET]
 * Leave these null. Ellie must not guess a figure. Until you set one
 * (here, or with the matching env var) she offers a same-day callback.
 * Env overrides, server-side only, blank means unset:
 *   HOUSE_PRICE_PER_ROOM, HOUSE_PRICE_1_BED, HOUSE_PRICE_2_BED, HOUSE_PRICE_3_BED
 */
export const HOUSE_CLEARANCE_PRICES: Record<HouseSize, number | null> = {
  room: null,
  '1_bed': null,
  '2_bed': null,
  '3_bed': null,
}

export const HOUSE_SIZE_LABELS: Record<HouseSize, string> = {
  room: 'Per room',
  '1_bed': '1-bed house',
  '2_bed': '2-bed house',
  '3_bed': '3-bed house',
}

export const HOUSE_SIZES: HouseSize[] = ['room', '1_bed', '2_bed', '3_bed']

function readOwnerPrice(raw: string | undefined): number | null {
  const text = raw?.trim()
  if (!text) return null
  const amount = Number(text)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return amount
}

export function houseClearancePrice(size: HouseSize | undefined): number | null {
  if (!size) return null
  const fromEnv =
    size === 'room' ? process.env.HOUSE_PRICE_PER_ROOM
    : size === '1_bed' ? process.env.HOUSE_PRICE_1_BED
    : size === '2_bed' ? process.env.HOUSE_PRICE_2_BED
    : process.env.HOUSE_PRICE_3_BED
  return readOwnerPrice(fromEnv) ?? HOUSE_CLEARANCE_PRICES[size]
}

export function anyHousePriceSet(): boolean {
  return HOUSE_SIZES.some((size) => houseClearancePrice(size) != null)
}

export function parseHouseSize(raw: string): HouseSize | null {
  const key = raw.toLowerCase().trim().replace(/[\s-]+/g, '_')
  if (!key) return null
  const map: Record<string, HouseSize> = {
    room: 'room',
    per_room: 'room',
    a_room: 'room',
    '1_bed': '1_bed',
    '1_bedroom': '1_bed',
    one_bed: '1_bed',
    one_bedroom: '1_bed',
    '2_bed': '2_bed',
    '2_bedroom': '2_bed',
    two_bed: '2_bed',
    two_bedroom: '2_bed',
    '3_bed': '3_bed',
    '3_bedroom': '3_bed',
    three_bed: '3_bed',
    three_bedroom: '3_bed',
  }
  if (map[key]) return map[key]
  if (key.endsWith('s') && map[key.slice(0, -1)]) return map[key.slice(0, -1)]
  return null
}

export function calculatePrice(details: ServiceDetails): number {
  const { category } = details

  if (category === 'furniture') {
    return (details.items ?? []).reduce((sum, item) => {
      const unitPrice = FURNITURE_PRICES[item.type] ?? 50
      return sum + unitPrice * item.quantity
    }, 0)
  }

  if (category === 'garden' || category === 'rubble' || category === 'junk') {
    const size = details.loadSize ?? 'small'
    return LOAD_PRICES[category][size]
  }

  if (category === 'appliances') {
    return (details.applianceTypes ?? []).reduce((sum, type) => {
      return sum + (APPLIANCE_PRICES[type] ?? 55)
    }, 0)
  }

  if (category === 'house') {
    return houseClearancePrice(details.houseSize) ?? 0
  }

  return 0
}

export function formatPrice(pence: number): string {
  return `£${pence}`
}

export function serviceSummary(details: ServiceDetails): string {
  const { category } = details
  if (category === 'furniture') {
    const items = details.items ?? []
    return items.map(i => `${i.quantity}x ${FURNITURE_LABELS[i.type] ?? i.type}`).join(', ') || 'Furniture removal'
  }
  if (category === 'garden') return `Garden waste — ${LOAD_SIZE_LABELS[details.loadSize ?? 'small']}`
  if (category === 'rubble') return `Construction rubble — ${LOAD_SIZE_LABELS[details.loadSize ?? 'small']}`
  if (category === 'junk')   return `General junk — ${LOAD_SIZE_LABELS[details.loadSize ?? 'small']}`
  if (category === 'appliances') {
    const types = details.applianceTypes ?? []
    return types.map(t => APPLIANCE_LABELS[t] ?? t).join(', ') || 'Appliance removal'
  }
  if (category === 'house') {
    return details.houseSize
      ? `House clearance — ${HOUSE_SIZE_LABELS[details.houseSize]}`
      : 'House clearance'
  }
  return 'Waste removal'
}
