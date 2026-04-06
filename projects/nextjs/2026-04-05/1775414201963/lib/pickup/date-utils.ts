/**
 * B2B Postal Checkout Flow - Pickup Date Utilities
 * Date calculation utilities for pickup calendar
 */

import { DateAvailabilityStatus, DateAvailabilityInfo } from '@/types/pickup';

// ============================================
// FEDERAL HOLIDAYS (US)
// ============================================

/**
 * Federal holidays that affect pickup availability
 * These are observed by most carriers
 */
const FIXED_HOLIDAYS = [
  '01-01', // New Year's Day
  '07-04', // Independence Day
  '11-11', // Veterans Day
  '12-25', // Christmas Day
];

/**
 * Calculate floating holidays for a given year
 * (Thanksgiving, Memorial Day, Labor Day, etc.)
 */
export function getFloatingHolidays(year: number): string[] {
  const holidays: string[] = [];
  
  // Martin Luther King Jr. Day - 3rd Monday in January
  holidays.push(getNthWeekdayOfMonth(year, 0, 1, 3)); // January, Monday, 3rd
  
  // Presidents Day - 3rd Monday in February
  holidays.push(getNthWeekdayOfMonth(year, 1, 1, 3)); // February, Monday, 3rd
  
  // Memorial Day - Last Monday in May
  holidays.push(getLastWeekdayOfMonth(year, 4, 1)); // May, Monday
  
  // Juneteenth - June 19 (fixed, but may be observed on different day)
  holidays.push(formatDateKey(year, 5, 19)); // June 19
  
  // Labor Day - 1st Monday in September
  holidays.push(getNthWeekdayOfMonth(year, 8, 1, 1)); // September, Monday, 1st
  
  // Columbus Day / Indigenous Peoples' Day - 2nd Monday in October
  holidays.push(getNthWeekdayOfMonth(year, 9, 1, 2)); // October, Monday, 2nd
  
  // Thanksgiving - 4th Thursday in November
  holidays.push(getNthWeekdayOfMonth(year, 10, 4, 4)); // November, Thursday, 4th
  
  return holidays;
}

/**
 * Get all federal holidays for a given year
 */
export function getFederalHolidays(year: number): string[] {
  const fixed = FIXED_HOLIDAYS.map(date => `${year}-${date}`);
  const floating = getFloatingHolidays(year);
  return [...fixed, ...floating].sort();
}

/**
 * Check if a date is a federal holiday
 */
export function isFederalHoliday(date: Date, holidays?: string[]): boolean {
  const year = date.getFullYear();
  const holidayList = holidays || getFederalHolidays(year);
  const dateKey = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
  return holidayList.includes(dateKey);
}

// ============================================
// DATE HELPERS
// ============================================

/**
 * Format a date as YYYY-MM-DD string key
 */
export function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Format a Date object as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Parse a YYYY-MM-DD string to Date object
 */
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get the nth occurrence of a weekday in a month
 */
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): string {
  const firstDay = new Date(year, month, 1);
  let count = 0;
  
  for (let day = 1; day <= 31; day++) {
    const date = new Date(year, month, day);
    if (date.getMonth() !== month) break;
    
    if (date.getDay() === weekday) {
      count++;
      if (count === n) {
        return formatDateKey(year, month, day);
      }
    }
  }
  
  return formatDateKey(year, month, 1); // Fallback
}

/**
 * Get the last occurrence of a weekday in a month
 */
function getLastWeekdayOfMonth(year: number, month: number, weekday: number): string {
  const lastDay = new Date(year, month + 1, 0);
  
  for (let day = lastDay.getDate(); day >= 1; day--) {
    const date = new Date(year, month, day);
    if (date.getDay() === weekday) {
      return formatDateKey(year, month, day);
    }
  }
  
  return formatDateKey(year, month, 1); // Fallback
}

// ============================================
// BUSINESS DAYS
// ============================================

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Check if a date is a business day (not weekend, not holiday)
 */
export function isBusinessDay(date: Date, holidays?: string[]): boolean {
  if (isWeekend(date)) return false;
  if (isFederalHoliday(date, holidays)) return false;
  return true;
}

/**
 * Add business days to a date
 */
export function addBusinessDays(date: Date, days: number, holidays?: string[]): Date {
  const result = new Date(date);
  let added = 0;
  
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result, holidays)) {
      added++;
    }
  }
  
  return result;
}

/**
 * Calculate the minimum pickup date based on lead time
 * (3 business days from today, excluding today)
 */
export function getMinimumPickupDate(leadTimeDays: number = 3, fromDate?: Date): Date {
  const today = fromDate ? new Date(fromDate) : new Date();
  today.setHours(0, 0, 0, 0);
  
  // Add lead time business days
  return addBusinessDays(today, leadTimeDays);
}

/**
 * Calculate the maximum pickup date (90 days from today)
 */
export function getMaximumPickupDate(maxDays: number = 90, fromDate?: Date): Date {
  const today = fromDate ? new Date(fromDate) : new Date();
  today.setHours(0, 0, 0, 0);
  
  const max = new Date(today);
  max.setDate(max.getDate() + maxDays);
  return max;
}

// ============================================
// AVAILABILITY CALCULATION
// ============================================

export interface AvailabilityOptions {
  minLeadTimeDays: number;
  maxAdvanceDays: number;
  weekendPickupAvailable: boolean;
  premiumWeekendAllowed: boolean;
  federalHolidays?: string[];
}

/**
 * Get the availability status and reason for a specific date
 */
export function getDateAvailability(
  date: Date,
  options: AvailabilityOptions,
  today: Date = new Date()
): { status: DateAvailabilityStatus; reason?: string } {
  const {
    minLeadTimeDays,
    maxAdvanceDays,
    weekendPickupAvailable,
    premiumWeekendAllowed,
    federalHolidays,
  } = options;
  
  // Normalize dates to midnight for comparison
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const todayNormalized = new Date(today);
  todayNormalized.setHours(0, 0, 0, 0);
  
  // Calculate date range
  const minDate = getMinimumPickupDate(minLeadTimeDays, todayNormalized);
  const maxDate = getMaximumPickupDate(maxAdvanceDays, todayNormalized);
  
  // Check if date is in the past
  if (checkDate < todayNormalized) {
    return { status: 'unavailable', reason: 'Date is in the past' };
  }
  
  // Check if date is before minimum lead time
  if (checkDate < minDate) {
    const daysUntil = Math.ceil((checkDate.getTime() - todayNormalized.getTime()) / (1000 * 60 * 60 * 24));
    return { 
      status: 'unavailable', 
      reason: `Minimum ${minLeadTimeDays} business days lead time required` 
    };
  }
  
  // Check if date is beyond maximum advance booking
  if (checkDate > maxDate) {
    return { 
      status: 'unavailable', 
      reason: `Cannot book more than ${maxAdvanceDays} days in advance` 
    };
  }
  
  // Check if weekend
  if (isWeekend(checkDate)) {
    if (!weekendPickupAvailable) {
      return { status: 'unavailable', reason: 'Weekend pickup not available' };
    }
    if (!premiumWeekendAllowed) {
      return { 
        status: 'limited', 
        reason: 'Weekend pickup requires premium service' 
      };
    }
  }
  
  // Check if federal holiday
  if (isFederalHoliday(checkDate, federalHolidays)) {
    return { status: 'unavailable', reason: 'Federal holiday - no pickup service' };
  }
  
  // Date is available
  return { status: 'available' };
}

/**
 * Generate availability info for a date range
 */
export function generateAvailabilityForRange(
  startDate: Date,
  endDate: Date,
  options: AvailabilityOptions
): DateAvailabilityInfo[] {
  const results: DateAvailabilityInfo[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const { status, reason } = getDateAvailability(current, options);
    results.push({
      date: formatDate(current),
      status,
      reason,
    });
    current.setDate(current.getDate() + 1);
  }
  
  return results;
}

/**
 * Check if a specific date can be navigated to in the calendar
 * (within the valid date range)
 */
export function isDateNavigable(
  date: Date,
  options: Pick<AvailabilityOptions, 'maxAdvanceDays'>,
  today: Date = new Date()
): boolean {
  const todayNormalized = new Date(today);
  todayNormalized.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const maxDate = getMaximumPickupDate(options.maxAdvanceDays, todayNormalized);
  
  // Cannot go before today
  if (checkDate < todayNormalized) {
    return false;
  }
  
  // Cannot go beyond max advance days
  if (checkDate > maxDate) {
    return false;
  }
  
  return true;
}
