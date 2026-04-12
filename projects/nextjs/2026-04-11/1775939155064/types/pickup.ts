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

// ==========================================
// Pickup Location Types
// ==========================================

export const PICKUP_LOCATION_TYPES = [
  'loading_dock',
  'ground_level',
  'residential',
  'storage_facility',
  'construction_site',
  'other',
] as const

export type PickupLocationType = (typeof PICKUP_LOCATION_TYPES)[number]

export interface PickupLocationTypeOption {
  id: PickupLocationType
  label: string
  description: string
  fee: number
}

export const PICKUP_LOCATION_TYPE_OPTIONS: PickupLocationTypeOption[] = [
  {
    id: 'loading_dock',
    label: 'Loading Dock',
    description: 'Commercial building with dedicated loading dock',
    fee: 0,
  },
  {
    id: 'ground_level',
    label: 'Ground Level',
    description: 'Street level access, no dock required',
    fee: 0,
  },
  {
    id: 'residential',
    label: 'Residential',
    description: 'House, apartment, or residential building',
    fee: 15,
  },
  {
    id: 'storage_facility',
    label: 'Storage Facility',
    description: 'Self-storage or warehouse facility',
    fee: 0,
  },
  {
    id: 'construction_site',
    label: 'Construction Site',
    description: 'Active construction or renovation site',
    fee: 25,
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Other location type (please describe)',
    fee: 0,
  },
]

export const PICKUP_LOCATION_TYPE_LABELS: Record<PickupLocationType, string> = {
  loading_dock: 'Loading Dock',
  ground_level: 'Ground Level',
  residential: 'Residential',
  storage_facility: 'Storage Facility',
  construction_site: 'Construction Site',
  other: 'Other',
}

export const PICKUP_LOCATION_TYPE_FEES: Record<PickupLocationType, number> = {
  loading_dock: 0,
  ground_level: 0,
  residential: 15,
  storage_facility: 0,
  construction_site: 25,
  other: 0,
}

// ==========================================
// Access Requirements Types
// ==========================================

export const ACCESS_REQUIREMENTS = [
  'call_upon_arrival',
  'security_checkin',
  'gate_code',
  'appointment_required',
  'limited_parking',
  'forklift_available',
  'liftgate_service',
] as const

export type AccessRequirement = (typeof ACCESS_REQUIREMENTS)[number]

export interface AccessRequirementOption {
  id: AccessRequirement
  label: string
  description: string
  fee: number
  showsInput?: boolean
  inputLabel?: string
  inputPlaceholder?: string
  maxLength?: number
}

export const ACCESS_REQUIREMENT_OPTIONS: AccessRequirementOption[] = [
  {
    id: 'call_upon_arrival',
    label: 'Call Upon Arrival',
    description: 'Driver must call before pickup',
    fee: 0,
  },
  {
    id: 'security_checkin',
    label: 'Security Check-in',
    description: 'Driver must check in with security',
    fee: 0,
  },
  {
    id: 'gate_code',
    label: 'Gate Code Required',
    description: 'Gated entry requires access code',
    fee: 0,
    showsInput: true,
    inputLabel: 'Gate Code / Access Code',
    inputPlaceholder: 'Enter gate code or access instructions',
    maxLength: 200,
  },
  {
    id: 'appointment_required',
    label: 'Appointment Required',
    description: 'Pickup must be scheduled in advance',
    fee: 0,
  },
  {
    id: 'limited_parking',
    label: 'Limited Parking',
    description: 'Special parking instructions needed',
    fee: 0,
    showsInput: true,
    inputLabel: 'Parking Instructions',
    inputPlaceholder: 'Describe parking and loading area access',
    maxLength: 200,
  },
  {
    id: 'forklift_available',
    label: 'Forklift Available',
    description: 'Forklift on-site for loading assistance',
    fee: 0,
  },
  {
    id: 'liftgate_service',
    label: 'Liftgate Service',
    description: 'Hydraulic liftgate required for pickup',
    fee: 35,
  },
]

export const ACCESS_REQUIREMENT_LABELS: Record<AccessRequirement, string> = {
  call_upon_arrival: 'Call Upon Arrival',
  security_checkin: 'Security Check-in',
  gate_code: 'Gate Code Required',
  appointment_required: 'Appointment Required',
  limited_parking: 'Limited Parking',
  forklift_available: 'Forklift Available',
  liftgate_service: 'Liftgate Service',
}

export const ACCESS_REQUIREMENT_FEES: Record<AccessRequirement, number> = {
  call_upon_arrival: 0,
  security_checkin: 0,
  gate_code: 0,
  appointment_required: 0,
  limited_parking: 0,
  forklift_available: 0,
  liftgate_service: 35,
}

// ==========================================
// Pickup Equipment Types
// ==========================================

export const PICKUP_EQUIPMENT = [
  'standard_dolly',
  'appliance_dolly',
  'furniture_pads',
  'straps',
  'pallet_jack',
  'two_person_team',
] as const

export type PickupEquipment = (typeof PICKUP_EQUIPMENT)[number]

export interface PickupEquipmentOption {
  id: PickupEquipment
  label: string
  description: string
  fee: number
}

export const PICKUP_EQUIPMENT_OPTIONS: PickupEquipmentOption[] = [
  {
    id: 'standard_dolly',
    label: 'Standard Dolly',
    description: 'Standard hand truck for boxes and small items',
    fee: 0,
  },
  {
    id: 'appliance_dolly',
    label: 'Appliance Dolly',
    description: 'Heavy-duty dolly for large appliances',
    fee: 0,
  },
  {
    id: 'furniture_pads',
    label: 'Furniture Pads',
    description: 'Protective padding for furniture transport',
    fee: 0,
  },
  {
    id: 'straps',
    label: 'Straps',
    description: 'Tie-down straps for securing items',
    fee: 0,
  },
  {
    id: 'pallet_jack',
    label: 'Pallet Jack',
    description: 'Manual pallet jack for palletized freight',
    fee: 0,
  },
  {
    id: 'two_person_team',
    label: 'Two-Person Team',
    description: 'Additional handler for heavy/large items',
    fee: 45,
  },
]

export const PICKUP_EQUIPMENT_LABELS: Record<PickupEquipment, string> = {
  standard_dolly: 'Standard Dolly',
  appliance_dolly: 'Appliance Dolly',
  furniture_pads: 'Furniture Pads',
  straps: 'Straps',
  pallet_jack: 'Pallet Jack',
  two_person_team: 'Two-Person Team',
}

export const PICKUP_EQUIPMENT_FEES: Record<PickupEquipment, number> = {
  standard_dolly: 0,
  appliance_dolly: 0,
  furniture_pads: 0,
  straps: 0,
  pallet_jack: 0,
  two_person_team: 45,
}

// ==========================================
// Loading Assistance Types
// ==========================================

export const LOADING_ASSISTANCE_TYPES = [
  'customer_load',
  'driver_assistance',
  'full_service',
] as const

export type LoadingAssistanceType = (typeof LOADING_ASSISTANCE_TYPES)[number]

export interface LoadingAssistanceOption {
  id: LoadingAssistanceType
  label: string
  description: string
  fee: number
}

export const LOADING_ASSISTANCE_OPTIONS: LoadingAssistanceOption[] = [
  {
    id: 'customer_load',
    label: 'Customer Will Load',
    description: 'You or your team will load the packages',
    fee: 0,
  },
  {
    id: 'driver_assistance',
    label: 'Driver Assistance',
    description: 'Driver helps load packages onto truck',
    fee: 25,
  },
  {
    id: 'full_service',
    label: 'Full Service',
    description: 'Driver handles complete loading',
    fee: 65,
  },
]

export const LOADING_ASSISTANCE_LABELS: Record<LoadingAssistanceType, string> = {
  customer_load: 'Customer Will Load',
  driver_assistance: 'Driver Assistance',
  full_service: 'Full Service',
}

export const LOADING_ASSISTANCE_FEES: Record<LoadingAssistanceType, number> = {
  customer_load: 0,
  driver_assistance: 25,
  full_service: 65,
}

// ==========================================
// Special Instructions
// ==========================================

export interface PickupSpecialInstructions {
  gateCode?: string
  parkingLoading?: string
  packageLocation?: string
  driverInstructions?: string
}

// ==========================================
// Complete Pickup Details
// ==========================================

export interface PickupLocationDetails {
  locationType: PickupLocationType
  dockNumber?: string
  otherDescription?: string
}

export interface PickupAccessDetails {
  requirements: AccessRequirement[]
  gateCode?: string
  parkingInstructions?: string
}

export interface PickupEquipmentDetails {
  equipment: PickupEquipment[]
}

export interface PickupLoadingDetails {
  assistanceType: LoadingAssistanceType
}

export interface CompletePickupDetails {
  selectedPickup: SelectedPickup
  location: PickupLocationDetails
  access: PickupAccessDetails
  equipment: PickupEquipmentDetails
  loading: PickupLoadingDetails
  specialInstructions: PickupSpecialInstructions
  fees: {
    timeSlotFee: number
    locationFee: number
    equipmentFee: number
    loadingFee: number
    accessFee: number
    totalFee: number
  }
}
