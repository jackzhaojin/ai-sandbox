/**
 * B2B Postal Checkout Flow - Step 1: Shipment Details Validation Schema
 * Zod validation schema for the shipment details form
 */

import { z } from "zod";

// ============================================
// UNIT CONVERSION UTILITIES
// ============================================

export const DIMENSIONS_UNIT = {
  IN: "in",
  CM: "cm",
} as const;

export const WEIGHT_UNIT = {
  LBS: "lbs",
  KG: "kg",
} as const;

export type DimensionsUnit = (typeof DIMENSIONS_UNIT)[keyof typeof DIMENSIONS_UNIT];
export type WeightUnit = (typeof WEIGHT_UNIT)[keyof typeof WEIGHT_UNIT];

// Conversion factors
const IN_TO_CM = 2.54;
const LBS_TO_KG = 0.453592;

export function convertDimensions(
  value: number,
  from: DimensionsUnit,
  to: DimensionsUnit
): number {
  if (from === to) return value;
  if (from === "in" && to === "cm") return value * IN_TO_CM;
  return value / IN_TO_CM;
}

export function convertWeight(
  value: number,
  from: WeightUnit,
  to: WeightUnit
): number {
  if (from === to) return value;
  if (from === "lbs" && to === "kg") return value * LBS_TO_KG;
  return value / LBS_TO_KG;
}

// Calculate dimensional weight (in lbs, using inches)
export function calculateDimensionalWeight(
  length: number,
  width: number,
  height: number,
  unit: DimensionsUnit = "in"
): number {
  // Convert to inches if needed
  const l = unit === "cm" ? length / IN_TO_CM : length;
  const w = unit === "cm" ? width / IN_TO_CM : width;
  const h = unit === "cm" ? height / IN_TO_CM : height;

  // Dimensional weight formula: (L × W × H) / 139 (domestic) or / 166 (international)
  // Using 139 for domestic shipments
  const cubicInches = l * w * h;
  const dimWeight = cubicInches / 139;

  return Math.ceil(dimWeight * 10) / 10; // Round to 1 decimal place
}

// Calculate billable weight (greater of actual or dimensional)
export function calculateBillableWeight(
  actualWeight: number,
  dimensionalWeight: number,
  weightUnit: WeightUnit = "lbs"
): number {
  // Convert actual weight to lbs if needed
  const actualInLbs = weightUnit === "kg" ? actualWeight / LBS_TO_KG : actualWeight;
  return Math.max(actualInLbs, dimensionalWeight);
}

// ============================================
// ADDRESS SCHEMA
// ============================================

export const addressSchema = z.object({
  recipientName: z
    .string()
    .min(1, "Recipient name is required")
    .max(100, "Recipient name must not exceed 100 characters"),
  recipientPhone: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .optional()
    .or(z.literal("")),
  line1: z
    .string()
    .min(1, "Street address is required")
    .max(100, "Street address must not exceed 100 characters"),
  line2: z
    .string()
    .max(100, "Address line 2 must not exceed 100 characters")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .min(1, "City is required")
    .max(50, "City must not exceed 50 characters"),
  state: z.string().min(1, "State is required"),
  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .max(20, "Postal code must not exceed 20 characters"),
  country: z.string().min(1, "Country is required"),
});

// ============================================
// PACKAGE SCHEMA
// ============================================

export const packagePieceSchema = z.object({
  id: z.string(),
  packageType: z.enum(["envelope", "small_box", "medium_box", "large_box", "pallet", "crate", "multiple_pieces"]),
  length: z
    .number({ message: "Length must be a number" })
    .positive("Length must be greater than 0")
    .max(500, "Length must not exceed 500"),
  width: z
    .number({ message: "Width must be a number" })
    .positive("Width must be greater than 0")
    .max(500, "Width must not exceed 500"),
  height: z
    .number({ message: "Height must be a number" })
    .positive("Height must be greater than 0")
    .max(500, "Height must not exceed 500"),
  dimensionsUnit: z.enum(["in", "cm"]).catch("in"),
  weight: z
    .number({ message: "Weight must be a number" })
    .positive("Weight must be greater than 0")
    .max(1000, "Weight must not exceed 1000"),
  weightUnit: z.enum(["lbs", "kg"]).catch("lbs"),
  declaredValue: z
    .number({ message: "Declared value must be a number" })
    .min(0, "Declared value must be at least 0")
    .max(100000, "Declared value must not exceed $100,000")
    .optional(),
  contentsDescription: z
    .string()
    .max(500, "Contents description must not exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

// ============================================
// SPECIAL HANDLING SCHEMA
// ============================================

export const specialHandlingTypeSchema = z.enum([
  "fragile",
  "hazardous",
  "temperature_controlled",
  "signature_required",
  "adult_signature",
  "hold_for_pickup",
  "appointment_delivery",
  "dry_ice",
]);

export const specialHandlingSchema = z.object({
  type: specialHandlingTypeSchema,
  isSelected: z.boolean(),
  instructions: z
    .string()
    .max(500, "Instructions must not exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

// ============================================
// DELIVERY PREFERENCES SCHEMA
// ============================================

export const deliveryPreferencesSchema = z.object({
  saturdayDelivery: z.boolean().catch(false),
  sundayDelivery: z.boolean().catch(false),
  signatureRequired: z.boolean().catch(false),
  adultSignatureRequired: z.boolean().catch(false),
  leaveWithoutSignature: z.boolean().catch(false),
  holdAtFacility: z.boolean().catch(false),
  deliveryInstructions: z
    .string()
    .max(1000, "Delivery instructions must not exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

// ============================================
// HAZMAT SCHEMA
// ============================================

export const hazmatClassSchema = z.enum([
  "class_1",
  "class_2",
  "class_3",
  "class_4",
  "class_5",
  "class_6",
  "class_7",
  "class_8",
  "class_9",
]);

export const packingGroupSchema = z.enum(["I", "II", "III"]);

export const hazmatSchema = z
  .object({
    isHazmat: z.boolean().default(false),
    hazmatClass: hazmatClassSchema.optional(),
    unNumber: z
      .string()
      .max(10, "UN number must not exceed 10 characters")
      .optional()
      .or(z.literal("")),
    properShippingName: z
      .string()
      .max(200, "Proper shipping name must not exceed 200 characters")
      .optional()
      .or(z.literal("")),
    packingGroup: packingGroupSchema.optional(),
    quantity: z
      .number({ message: "Quantity must be a number" })
      .positive("Quantity must be greater than 0")
      .max(99999, "Quantity must not exceed 99,999")
      .optional(),
    quantityUnit: z
      .string()
      .max(20, "Quantity unit must not exceed 20 characters")
      .optional()
      .or(z.literal("")),
    emergencyContactName: z
      .string()
      .max(100, "Emergency contact name must not exceed 100 characters")
      .optional()
      .or(z.literal("")),
    emergencyContactPhone: z
      .string()
      .max(20, "Emergency contact phone must not exceed 20 characters")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.isHazmat) return true;
      return !!data.hazmatClass && !!data.unNumber && !!data.properShippingName;
    },
    {
      message: "Hazmat class, UN number, and proper shipping name are required for hazardous materials",
      path: ["hazmatClass"],
    }
  )
  .refine(
    (data) => {
      if (!data.isHazmat || !data.unNumber) return true;
      // UN Number format: UN#### or NA#### (4 digits required)
      return /^UN\d{4}$|^NA\d{4}$/i.test(data.unNumber);
    },
    {
      message: "UN number must be in format UN#### or NA#### (e.g., UN1203)",
      path: ["unNumber"],
    }
  );

// ============================================
// MAIN SHIPMENT DETAILS SCHEMA
// ============================================

export const shipmentDetailsSchema = z.object({
  // Preset selection (optional - for quick fill)
  presetId: z.string().optional(),

  // Origin address
  origin: addressSchema,

  // Destination address
  destination: addressSchema,

  // Package information
  isMultiPiece: z.boolean().catch(false),
  packages: z.array(packagePieceSchema).min(1, "At least one package is required").max(20, "Maximum 20 packages allowed"),

  // Special handling
  specialHandling: z.array(specialHandlingSchema),

  // Delivery preferences
  deliveryPreferences: deliveryPreferencesSchema,

  // Hazmat information
  hazmat: hazmatSchema,

  // Reference numbers
  referenceNumber: z
    .string()
    .max(50, "Reference number must not exceed 50 characters")
    .optional()
    .or(z.literal("")),
  poNumber: z
    .string()
    .max(50, "PO number must not exceed 50 characters")
    .optional()
    .or(z.literal("")),

  // Currency for declared value
  currency: z.enum(["USD", "CAD", "MXN"]).catch("USD"),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type AddressFormData = z.infer<typeof addressSchema>;
export type PackagePieceFormData = z.infer<typeof packagePieceSchema>;
export type SpecialHandlingFormData = z.infer<typeof specialHandlingSchema>;
export type SpecialHandlingType = z.infer<typeof specialHandlingTypeSchema>;
export type DeliveryPreferencesFormData = z.infer<typeof deliveryPreferencesSchema>;
export type HazmatFormData = z.infer<typeof hazmatSchema>;
export type HazmatClass = z.infer<typeof hazmatClassSchema>;
export type PackingGroup = z.infer<typeof packingGroupSchema>;
export type ShipmentDetailsFormData = z.infer<typeof shipmentDetailsSchema>;

// ============================================
// DEFAULT VALUES
// ============================================

export const defaultAddress: AddressFormData = {
  recipientName: "",
  recipientPhone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

export const defaultPackagePiece = (id: string = "1"): PackagePieceFormData => ({
  id,
  packageType: "medium_box",
  length: 18,
  width: 14,
  height: 12,
  dimensionsUnit: "in",
  weight: 5,
  weightUnit: "lbs",
  declaredValue: undefined,
  contentsDescription: "",
});

export const defaultSpecialHandling: SpecialHandlingFormData[] = [
  { type: "fragile", isSelected: false, instructions: "" },
  { type: "hazardous", isSelected: false, instructions: "" },
  { type: "temperature_controlled", isSelected: false, instructions: "" },
  { type: "signature_required", isSelected: false, instructions: "" },
  { type: "adult_signature", isSelected: false, instructions: "" },
  { type: "hold_for_pickup", isSelected: false, instructions: "" },
  { type: "appointment_delivery", isSelected: false, instructions: "" },
  { type: "dry_ice", isSelected: false, instructions: "" },
];

export const defaultDeliveryPreferences: DeliveryPreferencesFormData = {
  saturdayDelivery: false,
  sundayDelivery: false,
  signatureRequired: false,
  adultSignatureRequired: false,
  leaveWithoutSignature: false,
  holdAtFacility: false,
  deliveryInstructions: "",
};

export const defaultHazmat: HazmatFormData = {
  isHazmat: false,
  hazmatClass: undefined,
  unNumber: "",
  properShippingName: "",
  packingGroup: undefined,
  quantity: undefined,
  quantityUnit: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

export const defaultShipmentDetails: ShipmentDetailsFormData = {
  origin: { ...defaultAddress },
  destination: { ...defaultAddress },
  isMultiPiece: false,
  packages: [defaultPackagePiece("1")],
  specialHandling: defaultSpecialHandling,
  deliveryPreferences: defaultDeliveryPreferences,
  hazmat: defaultHazmat,
  referenceNumber: "",
  poNumber: "",
  currency: "USD",
};
