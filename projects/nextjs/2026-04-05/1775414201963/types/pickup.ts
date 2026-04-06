/**
 * B2B Postal Checkout Flow - Pickup Types
 * Types for pickup scheduling and calendar functionality
 */

// ============================================
// DATE AVAILABILITY
// ============================================

export type DateAvailabilityStatus = 'available' | 'limited' | 'unavailable';

export interface DateAvailabilityInfo {
  date: string; // ISO date string YYYY-MM-DD
  status: DateAvailabilityStatus;
  reason?: string; // Reason for unavailability (for tooltips)
  timeSlotCount?: number; // Number of available time slots (for limited status)
}

// ============================================
// TIME SLOTS
// ============================================

export interface TimeSlot {
  id: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  label: string; // Display label like "9:00 AM - 11:00 AM"
  available: boolean;
}

export interface TimeSlotGroup {
  period: 'morning' | 'afternoon' | 'evening';
  label: string;
  slots: TimeSlot[];
}

// ============================================
// PICKUP LOCATION
// ============================================

export interface PickupLocation {
  id: string;
  addressId: string;
  nickname?: string;
  isDefault: boolean;
}

// ============================================
// PICKUP EQUIPMENT
// ============================================

export type PickupEquipmentType = 
  | 'hand_truck'
  | 'pallet_jack'
  | 'forklift'
  | 'loading_dock'
  | 'liftgate'
  | 'inside_pickup'
  | 'none';

export interface PickupEquipment {
  type: PickupEquipmentType;
  label: string;
  description: string;
  selected: boolean;
}

// ============================================
// PICKUP CONTACT
// ============================================

export type PreferredContactMethod = 'email' | 'phone' | 'sms';

export interface PrimaryContact {
  name: string;
  jobTitle: string;
  mobilePhone: string;
  altPhone?: string;
  email: string;
  preferredContactMethod: PreferredContactMethod;
}

export interface BackupContact {
  name: string;
  phone: string;
  email?: string;
}

export interface AuthorizedPerson {
  id: string;
  name: string;
}

export interface SpecialAuthorization {
  idVerificationRequired: boolean;
  signatureRequired: boolean;
  photoIdMatching: boolean;
}

export interface PickupContact {
  name: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
}

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export interface NotificationPreferenceItem {
  id: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}

export interface NotificationPreferencesData {
  emailReminder24h: boolean;
  smsReminder2h: boolean;
  callReminder30m: boolean;
  driverEnRoute: boolean;
  pickupCompletion: boolean;
  transitUpdates: boolean;
}

export interface NotificationPreferences {
  emailConfirmation: boolean;
  smsReminder: boolean;
  emailReminder: boolean;
  driverArrivalNotification: boolean;
  phoneNumber?: string;
}

// ============================================
// COMPLETE PICKUP REQUEST
// ============================================

export interface PickupRequest {
  shipmentId: string;
  pickupDate: string; // ISO date string YYYY-MM-DD
  timeSlotId: string;
  location: PickupLocation;
  equipment: PickupEquipmentType[];
  contact: PickupContact;
  notifications: NotificationPreferences;
  specialInstructions?: string;
}

// ============================================
// PICKUP RESPONSE
// ============================================

export interface PickupConfirmation {
  pickupId: string;
  confirmationNumber: string;
  scheduledDate: string;
  timeSlot: TimeSlot;
  carrier: {
    name: string;
    phone: string;
  };
  trackingNumber?: string;
}

// ============================================
// CALENDAR CONFIGURATION
// ============================================

export interface CalendarConfig {
  minLeadTimeDays: number;
  maxAdvanceDays: number;
  weekendPickupAvailable: boolean;
  weekendPremium: boolean;
  federalHolidays: string[]; // Array of ISO date strings
}

// ============================================
// API TYPES
// ============================================

export interface PickupAvailabilityRequest {
  shipmentId: string;
  startDate: string;
  endDate: string;
  zipCode: string;
}

export interface PickupAvailabilityResponse {
  availableDates: DateAvailabilityInfo[];
  config: CalendarConfig;
}

export interface TimeSlotsRequest {
  shipmentId: string;
  date: string;
  zipCode: string;
}

export interface TimeSlotsResponse {
  date: string;
  slots: TimeSlotGroup[];
}
