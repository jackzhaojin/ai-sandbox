/**
 * B2B Postal Checkout Flow - API Validation Schemas
 * Zod schemas for API request validation
 */

import { z } from 'zod';
import type { PackageType, HandlingType, ShipmentStatus } from '@/types/database';

// ============================================
// COMMON VALIDATORS
// ============================================

const uuidSchema = z.string().uuid('Invalid UUID format');

const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number must not exceed 20 digits')
  .regex(/^[\d\s\-\+\(\)\.]+$/, 'Invalid phone number format');

const emailSchema = z.string()
  .email('Invalid email address')
  .max(255, 'Email must not exceed 255 characters');

const postalCodeSchema = z.string()
  .min(1, 'Postal code is required')
  .max(20, 'Postal code must not exceed 20 characters');

// ============================================
// SHIPMENT CREATE/UPDATE SCHEMAS
// ============================================

export const createShipmentSchema = z.object({
  // Step 1: Sender Information (optional on create, can be added later)
  sender_address_id: uuidSchema.optional(),
  sender_contact_name: z.string().min(1, 'Contact name is required').max(100).optional(),
  sender_contact_phone: phoneSchema.optional(),
  sender_contact_email: emailSchema.optional(),

  // Step 2: Recipient Information
  recipient_address_id: uuidSchema.optional(),
  recipient_contact_name: z.string().min(1, 'Contact name is required').max(100).optional(),
  recipient_contact_phone: phoneSchema.optional(),
  recipient_contact_email: emailSchema.optional(),

  // Step 3: Package Details
  package_type: z.enum(['box', 'envelope', 'tube', 'pallet'] as const).optional(),
  weight: z.number().positive('Weight must be greater than 0').max(1000).optional(),
  length: z.number().positive('Length must be greater than 0').max(500).optional(),
  width: z.number().positive('Width must be greater than 0').max(500).optional(),
  height: z.number().positive('Height must be greater than 0').max(500).optional(),
  declared_value: z.number().nonnegative('Declared value must be non-negative').max(100000).optional(),
  contents_description: z.string().max(500).optional(),

  // Step 4: Shipping Options
  carrier_id: uuidSchema.optional(),
  service_type_id: uuidSchema.optional(),

  // Step 5: Special Handling
  special_handling: z.array(z.object({
    handling_type: z.enum([
      'fragile',
      'hazardous',
      'temperature_controlled',
      'signature_required',
      'adult_signature',
      'hold_for_pickup',
      'appointment_delivery'
    ] as const),
    instructions: z.string().max(500).optional(),
  })).optional(),

  // Step 6: Delivery Preferences
  delivery_preferences: z.object({
    saturday_delivery: z.boolean().optional(),
    sunday_delivery: z.boolean().optional(),
    signature_required: z.boolean().optional(),
    adult_signature_required: z.boolean().optional(),
    leave_without_signature: z.boolean().optional(),
    delivery_instructions: z.string().max(1000).optional(),
  }).optional(),

  // Step 7: Hazmat
  hazmat: z.object({
    is_hazmat: z.boolean(),
    hazmat_class: z.string().optional(),
    un_number: z.string().max(10).optional(),
    proper_shipping_name: z.string().max(200).optional(),
  }).optional(),

  // Reference numbers
  reference_number: z.string().max(50).optional(),
  po_number: z.string().max(50).optional(),
}).strict();

export const updateShipmentSchema = z.object({
  // Sender Information
  sender_address_id: uuidSchema.optional(),
  sender_contact_name: z.string().min(1).max(100).optional(),
  sender_contact_phone: phoneSchema.optional().nullable(),
  sender_contact_email: emailSchema.optional().nullable(),

  // Recipient Information
  recipient_address_id: uuidSchema.optional(),
  recipient_contact_name: z.string().min(1).max(100).optional(),
  recipient_contact_phone: phoneSchema.optional().nullable(),
  recipient_contact_email: emailSchema.optional().nullable(),

  // Package Details
  package_type: z.enum(['box', 'envelope', 'tube', 'pallet'] as const).optional(),
  weight: z.number().positive().max(1000).optional(),
  length: z.number().positive().max(500).optional(),
  width: z.number().positive().max(500).optional(),
  height: z.number().positive().max(500).optional(),
  declared_value: z.number().nonnegative().max(100000).optional().nullable(),
  contents_description: z.string().max(500).optional().nullable(),

  // Shipping Options
  carrier_id: uuidSchema.optional().nullable(),
  service_type_id: uuidSchema.optional().nullable(),
  estimated_delivery: z.string().datetime().optional().nullable(),
  base_rate: z.number().nonnegative().optional().nullable(),
  fuel_surcharge: z.number().nonnegative().optional(),
  insurance_cost: z.number().nonnegative().optional(),
  handling_fees: z.number().nonnegative().optional(),
  taxes: z.number().nonnegative().optional(),
  total_cost: z.number().nonnegative().optional().nullable(),

  // Status
  status: z.enum([
    'draft',
    'pending_payment',
    'paid',
    'label_generated',
    'picked_up',
    'in_transit',
    'delivered',
    'cancelled'
  ] as const).optional(),

  // Reference numbers
  reference_number: z.string().max(50).optional().nullable(),
  po_number: z.string().max(50).optional().nullable(),
  special_instructions: z.string().max(1000).optional().nullable(),
  internal_notes: z.string().max(2000).optional().nullable(),
}).strict();

// ============================================
// SHIPMENT ID PARAM SCHEMA
// ============================================

export const shipmentIdParamSchema = z.object({
  id: uuidSchema,
});

// ============================================
// QUERY PARAMETER SCHEMAS
// ============================================

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().default('created_at'),
  order: z.enum(['asc', 'desc'] as const).default('desc'),
});

export const shipmentListQuerySchema = paginationQuerySchema.extend({
  status: z.enum([
    'draft',
    'pending_payment',
    'paid',
    'label_generated',
    'picked_up',
    'in_transit',
    'delivered',
    'cancelled'
  ] as const).optional(),
  carrier_id: uuidSchema.optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  search: z.string().max(100).optional(),
});

// ============================================
// ADDRESS SCHEMAS
// ============================================

export const createAddressSchema = z.object({
  label: z.string().min(1).max(50),
  recipient_name: z.string().min(1).max(100),
  recipient_phone: phoneSchema.optional(),
  line1: z.string().min(1).max(100),
  line2: z.string().max(100).optional(),
  city: z.string().min(1).max(50),
  state: z.string().min(1).max(50),
  postal_code: postalCodeSchema,
  country: z.string().length(2).toUpperCase().default('US'),
  address_type: z.enum(['residential', 'commercial'] as const).default('commercial'),
  is_default_shipping: z.boolean().default(false),
  is_default_billing: z.boolean().default(false),
}).strict();

export const updateAddressSchema = createAddressSchema.partial();

// ============================================
// RATE CALCULATION SCHEMAS
// ============================================

export const calculateRatesSchema = z.object({
  sender_address_id: uuidSchema,
  recipient_address_id: uuidSchema,
  package: z.object({
    weight: z.number().positive(),
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  declared_value: z.number().nonnegative().optional(),
  special_handling: z.array(z.enum([
    'fragile',
    'hazardous',
    'temperature_controlled',
    'signature_required',
    'adult_signature',
    'hold_for_pickup',
    'appointment_delivery'
  ] as const)).optional(),
}).strict();

// ============================================
// PAYMENT SCHEMAS
// ============================================

export const processPaymentSchema = z.object({
  shipment_id: uuidSchema,
  payment_method_id: uuidSchema,
}).strict();

// Purchase Order payment schema
export const purchaseOrderPaymentSchema = z.object({
  po_number: z.string().min(1, "PO Number is required").max(50),
  authorized_amount: z.number().positive("Authorized amount must be positive"),
  po_expiry_date: z.string().datetime().optional(),
  department: z.string().max(100).optional(),
  cost_center: z.string().max(100).optional(),
  gl_account: z.string().max(100).optional(),
  approver_name: z.string().max(100).optional(),
  approver_email: emailSchema.optional(),
});

// Bill of Lading payment schema
export const billOfLadingPaymentSchema = z.object({
  bol_number: z.string().min(1, "BOL Number is required").max(50),
  carrier_id: uuidSchema.optional(),
  account_number: z.string().max(100).optional(),
  authorized_amount: z.number().positive().optional(),
  expiry_date: z.string().datetime().optional(),
});

// Third Party Billing payment schema
export const thirdPartyPaymentSchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(100),
  account_number: z.string().min(1, "Account number is required").max(100),
  address_id: uuidSchema.optional(),
  contact_name: z.string().max(100).optional(),
  contact_phone: phoneSchema.optional(),
  contact_email: emailSchema.optional(),
  authorization_on_file: z.boolean().default(false),
});

// Net Terms payment schema
export const netTermsReferenceSchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(100),
  contact_name: z.string().min(1, "Contact name is required").max(100),
  contact_phone: phoneSchema,
  relationship_length_months: z.number().int().min(0).max(600),
});

export const netTermsPaymentSchema = z.object({
  terms_days: z.number().int().refine((val) => [15, 30, 45, 60, 90].includes(val), {
    message: "Terms days must be 15, 30, 45, 60, or 90",
  }),
  credit_limit: z.number().positive().optional(),
  early_payment_discount_percent: z.number().min(0).max(100).default(0),
  early_payment_discount_days: z.number().int().min(0).default(0),
  trade_references: z.array(netTermsReferenceSchema).max(3).optional(),
});

// Corporate Account payment schema
export const corporateAccountPaymentSchema = z.object({
  account_number: z.string().min(1, "Account number is required").max(100),
  department_code: z.string().max(50).optional(),
  cost_center: z.string().max(50).optional(),
  project_code: z.string().max(50).optional(),
  monthly_limit: z.number().positive().optional(),
});

// Main payment request schema
export const paymentRequestSchema = z.object({
  payment_method: z.enum([
    "purchase_order",
    "bill_of_lading",
    "third_party_billing",
    "net_terms",
    "corporate_account",
  ] as const),
  purchase_order: purchaseOrderPaymentSchema.optional(),
  bill_of_lading: billOfLadingPaymentSchema.optional(),
  third_party: thirdPartyPaymentSchema.optional(),
  net_terms: netTermsPaymentSchema.optional(),
  corporate_account: corporateAccountPaymentSchema.optional(),
}).refine((data) => {
  // Ensure the correct payment method details are provided
  switch (data.payment_method) {
    case "purchase_order":
      return data.purchase_order !== undefined;
    case "bill_of_lading":
      return data.bill_of_lading !== undefined;
    case "third_party_billing":
      return data.third_party !== undefined;
    case "net_terms":
      return data.net_terms !== undefined;
    case "corporate_account":
      return data.corporate_account !== undefined;
    default:
      return false;
  }
}, {
  message: "Payment method details must match the selected payment method",
  path: ["payment_method"],
});

// ============================================
// PICKUP SCHEMAS
// ============================================

export const pickupEquipmentSchema = z.object({
  equipment_type: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  is_required: z.boolean().default(true),
  notes: z.string().max(200).optional(),
});

export const pickupContactSchema = z.object({
  name: z.string().min(1, "Contact name is required").max(100),
  job_title: z.string().min(1, "Job title is required").max(100),
  mobile_phone: phoneSchema,
  alt_phone: phoneSchema.optional().or(z.literal("")),
  email: emailSchema,
  preferred_contact_method: z.enum(["email", "phone", "sms"]),
});

export const pickupBackupContactSchema = z.object({
  name: z.string().min(1, "Backup contact name is required").max(100),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal("")),
});

export const pickupNotificationsSchema = z.object({
  email_confirmation: z.boolean().default(true),
  sms_reminder: z.boolean().default(false),
  email_reminder: z.boolean().default(true),
  driver_arrival_notification: z.boolean().default(true),
  phone_number: z.string().optional(),
});

export const pickupRequestSchema = z.object({
  // Pickup Details
  pickup_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time_slot_id: z.enum(["morning", "afternoon", "evening"]),
  pickup_address_id: uuidSchema,
  special_instructions: z.string().max(500).optional(),
  driver_instructions: z.string().max(500).optional(),
  
  // Location Details
  location_type: z.enum(["loading_dock", "ground_level", "residential", "storage", "construction", "other"]),
  dock_number: z.string().max(50).optional(),
  package_location: z.string().max(200).optional(),
  
  // Equipment & Services
  equipment_needed: z.array(pickupEquipmentSchema).optional(),
  loading_assistance: z.enum(["customer", "driver_assist", "full_service"]),
  
  // Access Requirements
  access_requirements: z.array(z.string()).optional(),
  gate_code: z.string().max(50).optional(),
  parking_instructions: z.string().max(200).optional(),
  
  // Contacts
  primary_contact: pickupContactSchema,
  backup_contact: pickupBackupContactSchema,
  
  // Authorized Personnel
  authorized_personnel: z.array(z.string().min(1).max(100)).optional(),
  
  // Special Authorization
  special_authorization: z.object({
    id_verification_required: z.boolean().default(false),
    signature_required: z.boolean().default(false),
    photo_id_matching: z.boolean().default(false),
  }).optional(),
  
  // Notifications
  notifications: pickupNotificationsSchema,
  
  // Fees
  time_slot_fee: z.number().nonnegative().default(0),
  location_surcharge: z.number().nonnegative().default(0),
  equipment_fees: z.number().nonnegative().default(0),
  loading_fee: z.number().nonnegative().default(0),
  access_fee: z.number().nonnegative().default(0),
  total_pickup_fee: z.number().nonnegative(),
}).strict();

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type CalculateRatesInput = z.infer<typeof calculateRatesSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type PaymentRequestInput = z.infer<typeof paymentRequestSchema>;
export type PurchaseOrderPaymentInput = z.infer<typeof purchaseOrderPaymentSchema>;
export type BillOfLadingPaymentInput = z.infer<typeof billOfLadingPaymentSchema>;
export type ThirdPartyPaymentInput = z.infer<typeof thirdPartyPaymentSchema>;
export type NetTermsPaymentInput = z.infer<typeof netTermsPaymentSchema>;
export type CorporateAccountPaymentInput = z.infer<typeof corporateAccountPaymentSchema>;
export type ShipmentListQueryInput = z.infer<typeof shipmentListQuerySchema>;
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
export type PickupRequestInput = z.infer<typeof pickupRequestSchema>;
