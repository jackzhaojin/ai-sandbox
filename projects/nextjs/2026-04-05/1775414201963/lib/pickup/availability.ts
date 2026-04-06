/**
 * B2B Postal Checkout Flow - Pickup Availability Engine
 * Business logic for calculating pickup availability based on ZIP code, service level, and business rules
 */

import {
  DateAvailabilityInfo,
  DateAvailabilityStatus,
  TimeSlotGroup,
  TimeSlot,
  CalendarConfig,
  PickupAvailabilityResponse,
  TimeSlotsResponse,
} from "@/types/pickup";
import {
  formatDate,
  parseDate,
  isWeekend,
  isFederalHoliday,
  getFederalHolidays,
  isBusinessDay,
  addBusinessDays,
  getMinimumPickupDate,
  getMaximumPickupDate,
  getDateAvailability,
  AvailabilityOptions,
} from "./date-utils";

// ============================================
// SERVICE AREA ZONES
// ============================================

/**
 * Service area zones based on ZIP code prefixes
 */
export type ServiceAreaZone = "local" | "regional" | "national" | "remote";

export interface ServiceAreaConfig {
  zone: ServiceAreaZone;
  minLeadTimeDays: number;
  weekendPickupAvailable: boolean;
  eveningPickupAvailable: boolean;
  weekendFee: number;
  eveningFee: number;
  remoteAreaFee: number;
  description: string;
}

// ZIP code prefixes for zone determination
const ZONE_PREFIXES: Record<ServiceAreaZone, string[]> = {
  local: [], // Determined by proximity to major hubs
  regional: [], // Determined by state/region
  national: [], // Standard coverage
  remote: [], // Special handling areas
};

// ZIP code ranges for remote areas (Alaska, Hawaii, territories)
const REMOTE_ZIP_PREFIXES = ["995", "996", "997", "998", "999", "967", "968", "006", "007", "008", "009"];

// Major metro areas with local service (first 2-3 digits)
const LOCAL_ZIP_AREAS = [
  "100", "101", "102", // NYC
  "902", "903", "904", "905", // LA
  "606", "607", // Chicago
  "770", "771", "772", // Houston
  "850", "851", "852", "853", // Phoenix
  "191", "192", // Philadelphia
  "782", "783", "784", // San Antonio
  "921", "922", // San Diego
  "752", "753", // Dallas
  "951", "952", // San Jose
  "940", "941", "942", "943", "944", "945", "946", "947", "948", // Bay Area
  "981", "982", // Seattle
  "802", "803", "804", // Denver
  "303", "304", // Atlanta
  "282", "283", // Charlotte
  "221", "222", // DC/Virginia
  "331", "332", // Miami
  "022", "021", "024", // Boston
  "554", "555", // Minneapolis
  "336", "337", // Tampa
  "891", "892", // Vegas
  "641", "642", // Kansas City
  "432", "433", // Columbus
  "972", "973", // Portland
  "275", "276", // Raleigh
  "462", "463", // Indianapolis
  "372", "373", // Nashville
  "532", "533", // Milwaukee
  "837", "838", // Boise
  "591", "592", // Billings
  "571", "572", // Sioux Falls
];

/**
 * Determine service area zone based on ZIP code
 */
export function getServiceAreaZone(zipCode: string): ServiceAreaZone {
  const cleanZip = zipCode.replace(/\D/g, "").substring(0, 5);
  
  if (cleanZip.length < 5) {
    return "national"; // Default for invalid ZIP
  }
  
  const prefix3 = cleanZip.substring(0, 3);
  const prefix2 = cleanZip.substring(0, 2);
  
  // Check for remote areas
  if (REMOTE_ZIP_PREFIXES.includes(prefix3)) {
    return "remote";
  }
  
  // Check for local areas
  if (LOCAL_ZIP_AREAS.includes(prefix3) || LOCAL_ZIP_AREAS.includes(prefix2)) {
    return "local";
  }
  
  // Default to national
  return "national";
}

/**
 * Get service area configuration based on zone
 */
export function getServiceAreaConfig(zone: ServiceAreaZone): ServiceAreaConfig {
  const configs: Record<ServiceAreaZone, ServiceAreaConfig> = {
    local: {
      zone: "local",
      minLeadTimeDays: 2,
      weekendPickupAvailable: true,
      eveningPickupAvailable: true,
      weekendFee: 15,
      eveningFee: 25,
      remoteAreaFee: 0,
      description: "Major metropolitan area with enhanced service",
    },
    regional: {
      zone: "regional",
      minLeadTimeDays: 3,
      weekendPickupAvailable: true,
      eveningPickupAvailable: true,
      weekendFee: 25,
      eveningFee: 25,
      remoteAreaFee: 0,
      description: "Regional coverage area",
    },
    national: {
      zone: "national",
      minLeadTimeDays: 3,
      weekendPickupAvailable: false,
      eveningPickupAvailable: true,
      weekendFee: 35,
      eveningFee: 25,
      remoteAreaFee: 0,
      description: "Standard nationwide coverage",
    },
    remote: {
      zone: "remote",
      minLeadTimeDays: 5,
      weekendPickupAvailable: false,
      eveningPickupAvailable: false,
      weekendFee: 0,
      eveningFee: 0,
      remoteAreaFee: 50,
      description: "Remote area with limited service availability",
    },
  };
  
  return configs[zone];
}

// ============================================
// TIME SLOT GENERATION
// ============================================

export interface TimeSlotConfig {
  id: string;
  period: "morning" | "afternoon" | "evening";
  startTime: string;
  endTime: string;
  label: string;
  baseFee: number;
}

const DEFAULT_TIME_SLOT_CONFIGS: TimeSlotConfig[] = [
  {
    id: "morning",
    period: "morning",
    startTime: "08:00",
    endTime: "12:00",
    label: "8:00 AM - 12:00 PM",
    baseFee: 0,
  },
  {
    id: "afternoon",
    period: "afternoon",
    startTime: "12:00",
    endTime: "17:00",
    label: "12:00 PM - 5:00 PM",
    baseFee: 0,
  },
  {
    id: "evening",
    period: "evening",
    startTime: "17:00",
    endTime: "19:00",
    label: "5:00 PM - 7:00 PM",
    baseFee: 25,
  },
];

/**
 * Generate time slots for a specific date and service area
 */
export function generateTimeSlots(
  date: Date,
  zipCode: string,
  serviceLevel?: string
): TimeSlotGroup[] {
  const zone = getServiceAreaZone(zipCode);
  const config = getServiceAreaConfig(zone);
  const isWeekendDate = isWeekend(date);
  
  const groups: TimeSlotGroup[] = [
    {
      period: "morning",
      label: "Morning",
      slots: [],
    },
    {
      period: "afternoon",
      label: "Afternoon",
      slots: [],
    },
    {
      period: "evening",
      label: "Evening",
      slots: [],
    },
  ];
  
  for (const slotConfig of DEFAULT_TIME_SLOT_CONFIGS) {
    let available = true;
    let fee = slotConfig.baseFee;
    let reason: string | undefined;
    
    // Check remote area restrictions
    if (zone === "remote") {
      if (slotConfig.period === "evening") {
        available = false;
        reason = "Evening pickup not available in remote areas";
      }
    }
    
    // Check weekend restrictions
    if (isWeekendDate) {
      if (!config.weekendPickupAvailable) {
        available = false;
        reason = "Weekend pickup not available in your service area";
      } else {
        // Add weekend fee for non-evening slots (evening already has premium fee)
        if (slotConfig.period !== "evening") {
          fee += config.weekendFee;
        }
      }
      
      // Evening not available on weekends
      if (slotConfig.period === "evening") {
        available = false;
        reason = "Evening pickup not available on weekends";
      }
    }
    
    // Check evening availability (evening fee is already in baseFee)
    if (slotConfig.period === "evening" && !config.eveningPickupAvailable) {
      available = false;
      reason = "Evening pickup not available in your service area";
    }
    
    // Add remote area fee if applicable
    if (zone === "remote" && available) {
      fee += config.remoteAreaFee;
    }
    
    // Premium service level gets reduced fees
    if (serviceLevel === "premium" && fee > 0) {
      fee = Math.floor(fee * 0.5); // 50% discount
    }
    
    const slot: TimeSlot = {
      id: slotConfig.id,
      startTime: slotConfig.startTime,
      endTime: slotConfig.endTime,
      label: slotConfig.label,
      available,
    };
    
    const group = groups.find((g) => g.period === slotConfig.period);
    if (group) {
      // Add fee info to the slot (extending the type)
      (slot as TimeSlot & { fee: number; reason?: string }).fee = fee;
      (slot as TimeSlot & { fee: number; reason?: string }).reason = reason;
      group.slots.push(slot);
    }
  }
  
  return groups;
}

// ============================================
// AVAILABILITY CALCULATION
// ============================================

export interface AvailabilityCalculationOptions {
  zipCode: string;
  serviceLevel?: string;
  referenceDate?: Date;
  maxAdvanceDays?: number;
}

/**
 * Calculate pickup availability for a date range
 */
export function calculatePickupAvailability(
  options: AvailabilityCalculationOptions
): PickupAvailabilityResponse {
  const {
    zipCode,
    serviceLevel = "standard",
    referenceDate = new Date(),
    maxAdvanceDays = 90,
  } = options;
  
  const zone = getServiceAreaZone(zipCode);
  const config = getServiceAreaConfig(zone);
  const year = referenceDate.getFullYear();
  const federalHolidays = [...getFederalHolidays(year), ...getFederalHolidays(year + 1)];
  
  // Calculate date range
  const minDate = getMinimumPickupDate(config.minLeadTimeDays, referenceDate);
  const maxDate = getMaximumPickupDate(maxAdvanceDays, referenceDate);
  
  // Generate availability for each date
  const availableDates: DateAvailabilityInfo[] = [];
  const current = new Date(minDate);
  
  while (current <= maxDate) {
    const availabilityOptions: AvailabilityOptions = {
      minLeadTimeDays: config.minLeadTimeDays,
      maxAdvanceDays,
      weekendPickupAvailable: config.weekendPickupAvailable,
      premiumWeekendAllowed: serviceLevel === "premium",
      federalHolidays,
    };
    
    const { status, reason } = getDateAvailability(current, availabilityOptions, referenceDate);
    
    // Calculate time slot count
    let timeSlotCount: number | undefined;
    if (status === "limited" || status === "available") {
      const slots = generateTimeSlots(current, zipCode, serviceLevel);
      timeSlotCount = slots.reduce((count, group) => 
        count + group.slots.filter((s) => s.available).length, 0
      );
    }
    
    availableDates.push({
      date: formatDate(current),
      status,
      reason,
      timeSlotCount: timeSlotCount && timeSlotCount > 0 ? timeSlotCount : undefined,
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  const calendarConfig: CalendarConfig = {
    minLeadTimeDays: config.minLeadTimeDays,
    maxAdvanceDays,
    weekendPickupAvailable: config.weekendPickupAvailable,
    weekendPremium: !config.weekendPickupAvailable || serviceLevel !== "premium",
    federalHolidays,
  };
  
  return {
    availableDates,
    config: calendarConfig,
  };
}

/**
 * Get time slots for a specific date
 */
export function getTimeSlotsForDate(
  date: string,
  zipCode: string,
  serviceLevel?: string
): TimeSlotsResponse {
  const dateObj = parseDate(date);
  const slots = generateTimeSlots(dateObj, zipCode, serviceLevel);
  
  return {
    date,
    slots,
  };
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate if a ZIP code is serviceable
 */
export function isValidServiceArea(zipCode: string): boolean {
  const cleanZip = zipCode.replace(/\D/g, "");
  return cleanZip.length === 5 && /^\d{5}$/.test(cleanZip);
}

/**
 * Validate a pickup date selection
 */
export function validatePickupDate(
  date: string,
  zipCode: string,
  timeSlotId: string,
  serviceLevel?: string,
  referenceDate?: Date
): { valid: boolean; error?: string } {
  const zone = getServiceAreaZone(zipCode);
  const config = getServiceAreaConfig(zone);
  const dateObj = parseDate(date);
  const today = referenceDate || new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if date is in the past
  if (dateObj < today) {
    return { valid: false, error: "Pickup date cannot be in the past" };
  }
  
  // Check minimum lead time
  const minDate = getMinimumPickupDate(config.minLeadTimeDays, today);
  if (dateObj < minDate) {
    return { 
      valid: false, 
      error: `Pickup must be scheduled at least ${config.minLeadTimeDays} business days in advance` 
    };
  }
  
  // Check if weekend
  if (isWeekend(dateObj) && !config.weekendPickupAvailable) {
    return { valid: false, error: "Weekend pickup not available in your service area" };
  }
  
  // Check if federal holiday
  if (isFederalHoliday(dateObj)) {
    return { valid: false, error: "Pickup not available on federal holidays" };
  }
  
  // Validate time slot
  const slots = generateTimeSlots(dateObj, zipCode, serviceLevel);
  const allSlots = slots.flatMap((g) => g.slots);
  const selectedSlot = allSlots.find((s) => s.id === timeSlotId);
  
  if (!selectedSlot) {
    return { valid: false, error: "Invalid time slot selected" };
  }
  
  if (!selectedSlot.available) {
    const reason = (selectedSlot as TimeSlot & { reason?: string }).reason;
    return { valid: false, error: reason || "Selected time slot is not available" };
  }
  
  return { valid: true };
}

// ============================================
// FEE CALCULATION
// ============================================

export interface PickupFees {
  baseFee: number;
  weekendFee: number;
  eveningFee: number;
  remoteAreaFee: number;
  totalFee: number;
}

/**
 * Calculate fees for a pickup
 */
export function calculatePickupFees(
  date: string,
  timeSlotId: string,
  zipCode: string,
  serviceLevel?: string
): PickupFees {
  const zone = getServiceAreaZone(zipCode);
  const config = getServiceAreaConfig(zone);
  const dateObj = parseDate(date);
  const isWeekendDate = isWeekend(dateObj);
  
  let baseFee = 0;
  let weekendFee = 0;
  let eveningFee = 0;
  let remoteAreaFee = 0;
  
  // Time slot fees
  const slotConfig = DEFAULT_TIME_SLOT_CONFIGS.find((s) => s.id === timeSlotId);
  if (slotConfig) {
    baseFee = slotConfig.baseFee;
    // Evening fee is already included in baseFee for evening slots
  }
  
  // Weekend fee (only for non-evening slots on weekends)
  if (isWeekendDate && config.weekendPickupAvailable && slotConfig?.period !== "evening") {
    weekendFee = config.weekendFee;
  }
  
  // Remote area fee
  if (zone === "remote") {
    remoteAreaFee = config.remoteAreaFee;
  }
  
  // Calculate total
  let totalFee = baseFee + weekendFee + eveningFee + remoteAreaFee;
  
  // Premium service discount
  if (serviceLevel === "premium" && totalFee > 0) {
    totalFee = Math.floor(totalFee * 0.5);
    // Adjust proportional fees
    const discountFactor = 0.5;
    weekendFee = Math.floor(weekendFee * discountFactor);
    eveningFee = Math.floor(eveningFee * discountFactor);
    remoteAreaFee = Math.floor(remoteAreaFee * discountFactor);
  }
  
  return {
    baseFee,
    weekendFee,
    eveningFee,
    remoteAreaFee,
    totalFee,
  };
}
