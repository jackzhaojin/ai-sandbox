// Types for pickup scheduling

export interface TimeSlot {
  id: string
  label: string
  startTime: string
  endTime: string
  availability: 'available' | 'limited' | 'unavailable'
  fee: number
  description: string
}

export interface DateAvailability {
  date: string // ISO date string YYYY-MM-DD
  dayOfWeek: number // 0 = Sunday, 6 = Saturday
  isWeekend: boolean
  isHoliday: boolean
  isAvailable: boolean
  slots: TimeSlot[]
  notes?: string
}

export interface ServiceArea {
  zone: 'metropolitan' | 'standard' | 'limited' | 'remote'
  zipPrefix: string
  description: string
  restrictions: {
    morningOnly: boolean
    noWeekend: boolean
    reducedEquipment: boolean
    additionalLeadDays: number
  }
}

export interface WeekendOption {
  type: 'saturday' | 'sunday'
  available: boolean
  fee: number
  description: string
}

export interface PickupAvailabilityResponse {
  zipCode: string
  serviceArea: ServiceArea
  availableDates: DateAvailability[]
  weekendOptions: WeekendOption[]
  metadata: {
    minLeadDays: number
    maxAdvanceDays: number
    sameDayCutoff: string
    requestDate: string
    totalDates: number
    availableCount: number
    limitedCount: number
    unavailableCount: number
  }
}

export interface SelectedPickup {
  date: string
  timeSlot: TimeSlot
  readyTime: string
}
