import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// ============================================
// TYPES
// ============================================

interface TimeSlot {
  id: string
  label: string
  startTime: string
  endTime: string
  availability: 'available' | 'limited' | 'unavailable'
  fee: number
  description: string
}

interface DateAvailability {
  date: string // ISO date string YYYY-MM-DD
  dayOfWeek: number // 0 = Sunday, 6 = Saturday
  isWeekend: boolean
  isHoliday: boolean
  isAvailable: boolean
  slots: TimeSlot[]
  notes?: string
}

interface ServiceArea {
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

interface WeekendOption {
  type: 'saturday' | 'sunday'
  available: boolean
  fee: number
  description: string
}

interface PickupAvailabilityResponse {
  zipCode: string
  serviceArea: ServiceArea
  availableDates: DateAvailability[]
  weekendOptions: WeekendOption[]
  metadata: {
    minLeadDays: number
    maxAdvanceDays: number
    sameDayCutoff: string // HH:mm format
    requestDate: string
    totalDates: number
    availableCount: number
    limitedCount: number
    unavailableCount: number
  }
}

// ============================================
// FEDERAL HOLIDAYS (2024-2025)
// ============================================

interface Holiday {
  name: string
  date: string // MM-DD format
  observedOnWeekend: 'friday' | 'monday' | 'none'
}

const FEDERAL_HOLIDAYS: Holiday[] = [
  { name: "New Year's Day", date: '01-01', observedOnWeekend: 'monday' },
  { name: 'Martin Luther King Jr. Day', date: '01-20', observedOnWeekend: 'none' }, // Third Monday in Jan
  { name: 'Presidents Day', date: '02-17', observedOnWeekend: 'none' }, // Third Monday in Feb
  { name: 'Memorial Day', date: '05-26', observedOnWeekend: 'none' }, // Last Monday in May
  { name: 'Juneteenth', date: '06-19', observedOnWeekend: 'monday' },
  { name: 'Independence Day', date: '07-04', observedOnWeekend: 'monday' },
  { name: 'Labor Day', date: '09-01', observedOnWeekend: 'none' }, // First Monday in Sep
  { name: 'Columbus Day', date: '10-13', observedOnWeekend: 'none' }, // Second Monday in Oct
  { name: 'Veterans Day', date: '11-11', observedOnWeekend: 'friday' },
  { name: 'Thanksgiving Day', date: '11-27', observedOnWeekend: 'none' }, // Fourth Thursday in Nov
  { name: 'Christmas Day', date: '12-25', observedOnWeekend: 'monday' },
]

// Calculate floating holidays (MLK, Presidents, Memorial, Labor, Columbus, Thanksgiving)
function getFloatingHolidayDate(year: number, holidayName: string): string | null {
  switch (holidayName) {
    case 'Martin Luther King Jr. Day':
      // Third Monday in January
      return getNthWeekdayOfMonth(year, 0, 3, 1) // January, Monday (1), 3rd occurrence
    case 'Presidents Day':
      // Third Monday in February
      return getNthWeekdayOfMonth(year, 1, 3, 1) // February, Monday (1), 3rd occurrence
    case 'Memorial Day':
      // Last Monday in May
      return getLastWeekdayOfMonth(year, 4, 1) // May, Monday (1)
    case 'Labor Day':
      // First Monday in September
      return getNthWeekdayOfMonth(year, 8, 1, 1) // September, Monday (1), 1st occurrence
    case 'Columbus Day':
      // Second Monday in October
      return getNthWeekdayOfMonth(year, 9, 2, 1) // October, Monday (1), 2nd occurrence
    case 'Thanksgiving Day':
      // Fourth Thursday in November
      return getNthWeekdayOfMonth(year, 10, 4, 4) // November, Thursday (4), 4th occurrence
    default:
      return null
  }
}

function getNthWeekdayOfMonth(year: number, month: number, n: number, weekday: number): string {
  const firstDay = new Date(year, month, 1)
  let count = 0
  for (let day = 1; day <= 31; day++) {
    const date = new Date(year, month, day)
    if (date.getMonth() !== month) break
    if (date.getDay() === weekday) {
      count++
      if (count === n) {
        return `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }
    }
  }
  return ''
}

function getLastWeekdayOfMonth(year: number, month: number, weekday: number): string {
  const lastDay = new Date(year, month + 1, 0)
  for (let day = lastDay.getDate(); day >= 1; day--) {
    const date = new Date(year, month, day)
    if (date.getDay() === weekday) {
      return `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  return ''
}

// ============================================
// SERVICE AREA DETERMINATION
// ============================================

function getServiceArea(zipCode: string): ServiceArea {
  const prefix = zipCode.substring(0, 3)
  const prefixNum = parseInt(prefix, 10)

  // Metropolitan: Major metro areas (NYC, LA, Chicago, Houston, etc.)
  const metropolitanPrefixes = [
    // NYC area
    '100', '101', '102', '103', '104', '110', '111', '112', '113', '114',
    // LA area
    '900', '901', '902', '903', '904', '905', '906', '907', '908',
    // Chicago
    '606', '607', '608',
    // Houston
    '770', '771', '772',
    // Phoenix
    '850', '851',
    // Philadelphia
    '191', '192',
    // San Antonio
    '782',
    // San Diego
    '921',
    // Dallas
    '752', '753',
    // San Jose
    '951',
  ]

  // Remote: Alaska, Hawaii, rural areas
  const remotePrefixes = [
    // Alaska
    '995', '996', '997', '998', '999',
    // Hawaii
    '967', '968',
    // Rural Mountain West
    '590', '591', '592', '593', '594', '595', '596', '597', '598', '599',
    // Rural desert/plains
    '880', '881', '882', '883', '884',
  ]

  // Limited: Smaller metros, outskirts
  const limitedPrefixes = [
    // Secondary cities
    '200', '201', '202', '203', '204', '205', // DC area
    '303', '304', '305', '306', // Atlanta
    '331', '332', '333', // Miami
    '482', '483', // Detroit
    '532', '533', // Milwaukee
    '554', '555', // Minneapolis
  ]

  if (metropolitanPrefixes.includes(prefix)) {
    return {
      zone: 'metropolitan',
      zipPrefix: prefix,
      description: 'Metropolitan area - Full service availability',
      restrictions: {
        morningOnly: false,
        noWeekend: false,
        reducedEquipment: false,
        additionalLeadDays: 0,
      },
    }
  }

  if (remotePrefixes.includes(prefix) || prefixNum >= 995) {
    return {
      zone: 'remote',
      zipPrefix: prefix,
      description: 'Remote area - Limited service, morning only, weekdays only',
      restrictions: {
        morningOnly: true,
        noWeekend: true,
        reducedEquipment: true,
        additionalLeadDays: 2,
      },
    }
  }

  if (limitedPrefixes.includes(prefix)) {
    return {
      zone: 'limited',
      zipPrefix: prefix,
      description: 'Limited service area - Morning only, no weekend service',
      restrictions: {
        morningOnly: true,
        noWeekend: true,
        reducedEquipment: true,
        additionalLeadDays: 1,
      },
    }
  }

  // Standard: Everything else
  return {
    zone: 'standard',
    zipPrefix: prefix,
    description: 'Standard service area - Full weekday service, limited weekend',
    restrictions: {
      morningOnly: false,
      noWeekend: false,
      reducedEquipment: false,
      additionalLeadDays: 0,
    },
  }
}

// ============================================
// BUSINESS DAYS & HOLIDAYS
// ============================================

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

function isFederalHoliday(date: Date): { isHoliday: boolean; name?: string } {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const dayOfWeek = date.getDay()
  const dateStr = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  for (const holiday of FEDERAL_HOLIDAYS) {
    // Get actual holiday date for this year
    let holidayDateStr: string
    if (['Martin Luther King Jr. Day', 'Presidents Day', 'Memorial Day', 'Labor Day', 'Columbus Day', 'Thanksgiving Day'].includes(holiday.name)) {
      const floatingDate = getFloatingHolidayDate(year, holiday.name)
      if (!floatingDate) continue
      holidayDateStr = floatingDate
    } else {
      holidayDateStr = holiday.date
    }

    // Check if this is the actual holiday
    if (dateStr === holidayDateStr) {
      return { isHoliday: true, name: holiday.name }
    }

    // Check for observed holidays (when holiday falls on weekend)
    if (holiday.observedOnWeekend !== 'none') {
      const [holidayMonth, holidayDay] = holidayDateStr.split('-').map(Number)
      const holidayDate = new Date(year, holidayMonth - 1, holidayDay)
      const holidayDayOfWeek = holidayDate.getDay()

      // If holiday is Saturday and this is the preceding Friday
      if (holidayDayOfWeek === 6 && holiday.observedOnWeekend === 'friday') {
        const fridayBefore = new Date(holidayDate)
        fridayBefore.setDate(holidayDate.getDate() - 1)
        if (date.getTime() === fridayBefore.getTime()) {
          return { isHoliday: true, name: `${holiday.name} (Observed)` }
        }
      }

      // If holiday is Sunday and this is the following Monday
      if (holidayDayOfWeek === 0 && holiday.observedOnWeekend === 'monday') {
        const mondayAfter = new Date(holidayDate)
        mondayAfter.setDate(holidayDate.getDate() + 1)
        if (date.getTime() === mondayAfter.getTime()) {
          return { isHoliday: true, name: `${holiday.name} (Observed)` }
        }
      }
    }
  }

  return { isHoliday: false }
}

function addBusinessDays(startDate: Date, days: number): Date {
  const date = new Date(startDate)
  let addedDays = 0

  while (addedDays < days) {
    date.setDate(date.getDate() + 1)
    if (!isWeekend(date) && !isFederalHoliday(date).isHoliday) {
      addedDays++
    }
  }

  return date
}

function calculateMinLeadTime(serviceArea: ServiceArea): number {
  const baseLeadDays = 3
  return baseLeadDays + serviceArea.restrictions.additionalLeadDays
}

// ============================================
// TIME SLOTS GENERATION
// ============================================

function generateTimeSlots(
  date: Date,
  serviceArea: ServiceArea,
  isWeekend: boolean,
  isPremiumSaturday: boolean
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const isSaturday = date.getDay() === 6

  // Morning slot (8am-12pm) - always available
  slots.push({
    id: `morning-${date.toISOString().split('T')[0]}`,
    label: 'Morning',
    startTime: '08:00',
    endTime: '12:00',
    availability: generateRandomAvailability(),
    fee: 0,
    description: '8:00 AM - 12:00 PM',
  })

  // Limited/remote areas only get morning slot
  if (serviceArea.restrictions.morningOnly) {
    return slots
  }

  // Afternoon slot (12pm-5pm)
  slots.push({
    id: `afternoon-${date.toISOString().split('T')[0]}`,
    label: 'Afternoon',
    startTime: '12:00',
    endTime: '17:00',
    availability: generateRandomAvailability(),
    fee: 0,
    description: '12:00 PM - 5:00 PM',
  })

  // Evening slot (5pm-7pm) - not available on weekends
  if (!isWeekend) {
    slots.push({
      id: `evening-${date.toISOString().split('T')[0]}`,
      label: 'Evening',
      startTime: '17:00',
      endTime: '19:00',
      availability: generateRandomAvailability(),
      fee: 25, // Evening fee
      description: '5:00 PM - 7:00 PM (+$25 fee)',
    })
  }

  // Saturday premium option
  if (isSaturday && isPremiumSaturday) {
    // Add Saturday surcharge to all slots
    slots.forEach(slot => {
      slot.fee += 50
    })
  }

  return slots
}

function generateRandomAvailability(): 'available' | 'limited' | 'unavailable' {
  const random = Math.random()
  // 85% available, 10% limited, 5% unavailable
  if (random < 0.85) return 'available'
  if (random < 0.95) return 'limited'
  return 'unavailable'
}

// ============================================
// MAIN AVAILABILITY GENERATION
// ============================================

function generateAvailability(
  zipCode: string,
  requestedDate?: string,
  serviceLevel?: string
): PickupAvailabilityResponse {
  const serviceArea = getServiceArea(zipCode)
  const minLeadDays = calculateMinLeadTime(serviceArea)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate earliest available date (min lead time from today)
  const earliestDate = addBusinessDays(today, minLeadDays)

  // Generate dates for next 90 days
  const maxAdvanceDays = 90
  const availableDates: DateAvailability[] = []

  // Check if premium Saturday option is requested/available
  const isPremiumSaturday = serviceLevel === 'premium' || serviceLevel === 'express'

  let currentDate = new Date(earliestDate)
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + maxAdvanceDays)

  let availableCount = 0
  let limitedCount = 0
  let unavailableCount = 0

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const weekend = isWeekend(currentDate)
    const holiday = isFederalHoliday(currentDate)
    const isSaturday = currentDate.getDay() === 6

    // Determine if date is available
    let isAvailable = true
    let notes: string | undefined

    // Weekend restrictions
    if (weekend && serviceArea.restrictions.noWeekend) {
      isAvailable = false
      notes = 'Weekend pickup not available in this service area'
    }

    // Holiday check
    if (holiday.isHoliday) {
      isAvailable = false
      notes = `Federal holiday: ${holiday.name}`
    }

    // Generate time slots
    const slots = isAvailable
      ? generateTimeSlots(currentDate, serviceArea, weekend, isPremiumSaturday && isSaturday)
      : []

    // Check overall availability based on slots
    let overallAvailability: DateAvailability['availability'] = 'available'
    const availableSlots = slots.filter(s => s.availability === 'available').length
    const limitedSlots = slots.filter(s => s.availability === 'limited').length
    const unavailableSlots = slots.filter(s => s.availability === 'unavailable').length

    if (availableSlots === 0 && limitedSlots === 0) {
      overallAvailability = 'unavailable'
    } else if (availableSlots === 0 || unavailableSlots > availableSlots) {
      overallAvailability = 'limited'
    }

    // Update counters
    if (!isAvailable) {
      unavailableCount++
    } else if (overallAvailability === 'limited') {
      limitedCount++
    } else {
      availableCount++
    }

    availableDates.push({
      date: dateStr,
      dayOfWeek: currentDate.getDay(),
      isWeekend: weekend,
      isHoliday: holiday.isHoliday,
      isAvailable,
      slots: slots.map(s => ({
        ...s,
        // If date is unavailable, mark all slots as unavailable
        availability: isAvailable ? s.availability : 'unavailable',
      })),
      notes,
    })

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Weekend options
  const weekendOptions: WeekendOption[] = [
    {
      type: 'saturday',
      available: !serviceArea.restrictions.noWeekend,
      fee: 50,
      description: serviceArea.restrictions.noWeekend
        ? 'Saturday pickup not available in this service area'
        : 'Saturday pickup available (+$50 fee)',
    },
    {
      type: 'sunday',
      available: false,
      fee: 0,
      description: 'Sunday pickup not available',
    },
  ]

  return {
    zipCode,
    serviceArea,
    availableDates,
    weekendOptions,
    metadata: {
      minLeadDays,
      maxAdvanceDays,
      sameDayCutoff: '14:00', // 2 PM cutoff for same-day scheduling
      requestDate: new Date().toISOString(),
      totalDates: availableDates.length,
      availableCount,
      limitedCount,
      unavailableCount,
    },
  }
}

// ============================================
// API HANDLER
// ============================================

/**
 * GET /api/pickup-availability
 * 
 * Returns available pickup dates and time slots for a given ZIP code.
 * 
 * Query Parameters:
 * - zip_code: Origin ZIP code (required)
 * - date: Specific date to check (optional, ISO format YYYY-MM-DD)
 * - service_level: Service tier - standard, premium, express (optional)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const zipCode = searchParams.get('zip_code')
    const date = searchParams.get('date') || undefined
    const serviceLevel = searchParams.get('service_level') || undefined

    // Validate required parameters
    if (!zipCode) {
      return NextResponse.json(
        { error: 'zip_code is required' },
        { status: 400 }
      )
    }

    // Validate ZIP code format (US ZIP: 5 digits, or ZIP+4: 5-4 digits)
    const zipRegex = /^\d{5}(-\d{4})?$/
    if (!zipRegex.test(zipCode)) {
      return NextResponse.json(
        { error: 'Invalid ZIP code format. Expected: 12345 or 12345-6789' },
        { status: 400 }
      )
    }

    // Validate service level if provided
    const validServiceLevels = ['standard', 'premium', 'express']
    if (serviceLevel && !validServiceLevels.includes(serviceLevel)) {
      return NextResponse.json(
        { error: `Invalid service_level. Must be one of: ${validServiceLevels.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate date format if provided
    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(date)) {
        return NextResponse.json(
          { error: 'Invalid date format. Expected: YYYY-MM-DD' },
          { status: 400 }
        )
      }
    }

    // Generate availability
    const availability = generateAvailability(zipCode, date, serviceLevel)

    // If specific date requested, filter results
    if (date) {
      const specificDate = availability.availableDates.find(d => d.date === date)
      if (!specificDate) {
        return NextResponse.json(
          { error: 'Date out of range', message: `Date ${date} is beyond the ${availability.metadata.maxAdvanceDays}-day booking window` },
          { status: 404 }
        )
      }
      return NextResponse.json({
        zipCode: availability.zipCode,
        serviceArea: availability.serviceArea,
        date: specificDate,
        weekendOptions: availability.weekendOptions,
        metadata: availability.metadata,
      }, { status: 200 })
    }

    return NextResponse.json(availability, { status: 200 })

  } catch (error) {
    console.error('Error processing pickup availability request:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
