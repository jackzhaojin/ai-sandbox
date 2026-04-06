/**
 * B2B Postal Checkout Flow - Quote API Validation Schemas
 * Zod schemas for quote request validation
 */

import { z } from 'zod';
import type { HandlingType } from '@/types/database';

// ============================================
// QUOTE REQUEST SCHEMA
// ============================================

export const quoteRequestSchema = z.object({
  // Shipment ID (optional - if provided, uses addresses from existing shipment)
  shipment_id: z.string().uuid('Invalid shipment ID').optional(),

  // Address IDs (required if shipment_id not provided)
  sender_address_id: z.string().uuid('Invalid sender address ID').optional(),
  recipient_address_id: z.string().uuid('Invalid recipient address ID').optional(),

  // Package dimensions
  package: z.object({
    weight: z.number()
      .positive('Weight must be greater than 0')
      .max(10000, 'Weight must not exceed 10,000 kg'),
    length: z.number()
      .positive('Length must be greater than 0')
      .max(1000, 'Length must not exceed 1000 cm'),
    width: z.number()
      .positive('Width must be greater than 0')
      .max(1000, 'Width must not exceed 1000 cm'),
    height: z.number()
      .positive('Height must be greater than 0')
      .max(1000, 'Height must not exceed 1000 cm'),
  }).required(),

  // Declared value for insurance calculation
  declared_value: z.number()
    .nonnegative('Declared value must be non-negative')
    .max(1000000, 'Declared value must not exceed $1,000,000')
    .optional(),

  // Special handling options
  special_handling: z.array(
    z.enum([
      'fragile',
      'hazardous',
      'temperature_controlled',
      'signature_required',
      'adult_signature',
      'hold_for_pickup',
      'appointment_delivery',
    ] as const)
  ).optional(),

  // Signature options
  signature_required: z.boolean().optional(),
  adult_signature_required: z.boolean().optional(),
}).refine(
  (data) => {
    // Either shipment_id OR both address IDs must be provided
    if (data.shipment_id) return true;
    return data.sender_address_id && data.recipient_address_id;
  },
  {
    message: 'Either shipment_id or both sender_address_id and recipient_address_id must be provided',
    path: ['shipment_id'],
  }
);

// ============================================
// QUOTE SELECTION SCHEMA
// ============================================

export const selectQuoteSchema = z.object({
  quote_id: z.string().uuid('Invalid quote ID'),
  shipment_id: z.string().uuid('Invalid shipment ID'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type SelectQuoteInput = z.infer<typeof selectQuoteSchema>;
