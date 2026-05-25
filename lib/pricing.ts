import type { ServiceDetails } from '@/types'

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
  return 'Waste removal'
}
