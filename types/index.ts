export type TimeSlot = '8am' | '10am' | '12pm' | '2pm' | '4pm'

export const TIME_SLOTS: TimeSlot[] = ['8am', '10am', '12pm', '2pm', '4pm']

export type ServiceCategory = 'furniture' | 'garden' | 'rubble' | 'junk' | 'appliances'

export interface FurnitureItem {
  type: string
  quantity: number
}

export interface ServiceDetails {
  category: ServiceCategory
  // furniture
  items?: FurnitureItem[]
  // garden / rubble / junk
  loadSize?: 'small' | 'half' | 'full'
  // appliances
  applianceTypes?: string[]
}

export interface Booking {
  id: string
  name: string
  email: string
  phone: string
  address: string
  service_details: ServiceDetails
  price: number
  date: string
  time_slot: TimeSlot
  created_at: string
}

export interface BlockedSlot {
  id: string
  date: string
  time_slot: TimeSlot
}

export interface QuoteState {
  // Step 1
  serviceDetails: ServiceDetails | null
  // Step 2 (price is computed)
  price: number
  // Step 3
  date: string
  timeSlot: TimeSlot | null
  address: string
  // Step 4
  name: string
  email: string
  phone: string
}
