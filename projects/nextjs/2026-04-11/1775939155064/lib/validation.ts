import { z } from "zod"

// Country codes supported
export const SUPPORTED_COUNTRIES = ["US", "CA", "MX"] as const
export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number]

// ZIP code regex patterns per country
const ZIP_PATTERNS: Record<CountryCode, RegExp> = {
  US: /^\d{5}(-\d{4})?$/,
  CA: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
  MX: /^\d{5}$/,
}

// ZIP code error messages per country
const ZIP_ERROR_MESSAGES: Record<CountryCode, string> = {
  US: "ZIP code must be 5 digits (e.g., 12345) or ZIP+4 (e.g., 12345-6789)",
  CA: "Postal code must be in Canadian format (e.g., A1A 1A1)",
  MX: "Código postal must be 5 digits (e.g., 01000)",
}

// Phone regex patterns
const PHONE_PATTERNS: Record<CountryCode, RegExp> = {
  US: /^\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
  CA: /^\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
  MX: /^\+?52?[-.\s]?\(?\d{2,3}\)?[-.\s]?\d{4}[-.\s]?\d{4}$/,
}

// Phone error messages
const PHONE_ERROR_MESSAGES: Record<CountryCode, string> = {
  US: "Phone number must be a valid US number (e.g., 555-123-4567)",
  CA: "Phone number must be a valid Canadian number (e.g., 555-123-4567)",
  MX: "Phone number must be a valid Mexican number (e.g., 55-1234-5678)",
}

// Location types
export const LOCATION_TYPES = ["commercial", "residential"] as const
export type LocationType = (typeof LOCATION_TYPES)[number]

// Base address fields schema
const baseAddressSchema = {
  originName: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  originCompany: z
    .string()
    .max(100, "Company name must not exceed 100 characters")
    .optional(),
  originLine1: z
    .string()
    .min(1, "Street address is required")
    .min(5, "Street address must be at least 5 characters")
    .max(100, "Street address must not exceed 100 characters"),
  originLine2: z
    .string()
    .max(50, "Suite/Apt must not exceed 50 characters")
    .optional(),
  originCity: z
    .string()
    .min(1, "City is required")
    .min(2, "City must be at least 2 characters")
    .max(50, "City must not exceed 50 characters"),
  originState: z.string().min(1, "State/Province is required"),
  originPostal: z
    .string()
    .min(1, "ZIP/Postal code is required"),
  originCountry: z.enum(SUPPORTED_COUNTRIES, {
    errorMap: () => ({ message: "Country must be US, CA, or MX" }),
  }),
  originLocationType: z.enum(LOCATION_TYPES, {
    errorMap: () => ({ message: "Location type is required" }),
  }),
  originPhone: z
    .string()
    .min(1, "Phone number is required"),
  originExtension: z
    .string()
    .max(10, "Extension must not exceed 10 characters")
    .optional(),
  originEmail: z
    .string()
    .min(1, "Email is required")
    .email("Email must be a valid email address"),
  destinationName: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  destinationCompany: z
    .string()
    .max(100, "Company name must not exceed 100 characters")
    .optional(),
  destinationLine1: z
    .string()
    .min(1, "Street address is required")
    .min(5, "Street address must be at least 5 characters")
    .max(100, "Street address must not exceed 100 characters"),
  destinationLine2: z
    .string()
    .max(50, "Suite/Apt must not exceed 50 characters")
    .optional(),
  destinationCity: z
    .string()
    .min(1, "City is required")
    .min(2, "City must be at least 2 characters")
    .max(50, "City must not exceed 50 characters"),
  destinationState: z.string().min(1, "State/Province is required"),
  destinationPostal: z
    .string()
    .min(1, "ZIP/Postal code is required"),
  destinationCountry: z.enum(SUPPORTED_COUNTRIES, {
    errorMap: () => ({ message: "Country must be US, CA, or MX" }),
  }),
  destinationLocationType: z.enum(LOCATION_TYPES, {
    errorMap: () => ({ message: "Location type is required" }),
  }),
  destinationPhone: z
    .string()
    .min(1, "Phone number is required"),
  destinationExtension: z
    .string()
    .max(10, "Extension must not exceed 10 characters")
    .optional(),
  destinationEmail: z
    .string()
    .min(1, "Email is required")
    .email("Email must be a valid email address"),
}

// Complete shipment step 1 schema with cross-field validation
export const shipmentStep1Schema = z.object(baseAddressSchema).superRefine((data, ctx) => {
  // Validate origin ZIP based on country
  const originCountry = data.originCountry
  const originPostal = data.originPostal
  const originPhone = data.originPhone

  if (originCountry && originPostal) {
    const pattern = ZIP_PATTERNS[originCountry]
    if (pattern && !pattern.test(originPostal)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: ZIP_ERROR_MESSAGES[originCountry],
        path: ["originPostal"],
      })
    }
  }

  // Validate origin phone based on country
  if (originCountry && originPhone) {
    const pattern = PHONE_PATTERNS[originCountry]
    if (pattern && !pattern.test(originPhone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PHONE_ERROR_MESSAGES[originCountry],
        path: ["originPhone"],
      })
    }
  }

  // Validate destination ZIP based on country
  const destCountry = data.destinationCountry
  const destPostal = data.destinationPostal
  const destPhone = data.destinationPhone

  if (destCountry && destPostal) {
    const pattern = ZIP_PATTERNS[destCountry]
    if (pattern && !pattern.test(destPostal)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: ZIP_ERROR_MESSAGES[destCountry],
        path: ["destinationPostal"],
      })
    }
  }

  // Validate destination phone based on country
  if (destCountry && destPhone) {
    const pattern = PHONE_PATTERNS[destCountry]
    if (pattern && !pattern.test(destPhone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PHONE_ERROR_MESSAGES[destCountry],
        path: ["destinationPhone"],
      })
    }
  }

  // Cross-field validation: origin !== destination
  const originKey = `${data.originLine1}-${data.originCity}-${data.originState}-${data.originPostal}`.toLowerCase().replace(/\s/g, '')
  const destKey = `${data.destinationLine1}-${data.destinationCity}-${data.destinationState}-${data.destinationPostal}`.toLowerCase().replace(/\s/g, '')
  
  if (originKey === destKey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Destination address cannot be the same as origin address",
      path: ["destinationLine1"],
    })
  }
})

// Type for the form data
export type ShipmentStep1FormData = z.infer<typeof shipmentStep1Schema>

// State/Province data by country
export const STATES_BY_COUNTRY: Record<CountryCode, { code: string; name: string }[]> = {
  US: [
    { code: "AL", name: "Alabama" },
    { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" },
    { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" },
    { code: "DE", name: "Delaware" },
    { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" },
    { code: "HI", name: "Hawaii" },
    { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" },
    { code: "IN", name: "Indiana" },
    { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" },
    { code: "KY", name: "Kentucky" },
    { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" },
    { code: "MD", name: "Maryland" },
    { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" },
    { code: "MN", name: "Minnesota" },
    { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" },
    { code: "MT", name: "Montana" },
    { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" },
    { code: "NH", name: "New Hampshire" },
    { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" },
    { code: "NY", name: "New York" },
    { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" },
    { code: "OH", name: "Ohio" },
    { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" },
    { code: "PA", name: "Pennsylvania" },
    { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" },
    { code: "SD", name: "South Dakota" },
    { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" },
    { code: "UT", name: "Utah" },
    { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" },
    { code: "WA", name: "Washington" },
    { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" },
    { code: "WY", name: "Wyoming" },
    { code: "DC", name: "District of Columbia" },
  ],
  CA: [
    { code: "AB", name: "Alberta" },
    { code: "BC", name: "British Columbia" },
    { code: "MB", name: "Manitoba" },
    { code: "NB", name: "New Brunswick" },
    { code: "NL", name: "Newfoundland and Labrador" },
    { code: "NS", name: "Nova Scotia" },
    { code: "ON", name: "Ontario" },
    { code: "PE", name: "Prince Edward Island" },
    { code: "QC", name: "Quebec" },
    { code: "SK", name: "Saskatchewan" },
    { code: "NT", name: "Northwest Territories" },
    { code: "NU", name: "Nunavut" },
    { code: "YT", name: "Yukon" },
  ],
  MX: [
    { code: "AGU", name: "Aguascalientes" },
    { code: "BCN", name: "Baja California" },
    { code: "BCS", name: "Baja California Sur" },
    { code: "CAM", name: "Campeche" },
    { code: "CHP", name: "Chiapas" },
    { code: "CHH", name: "Chihuahua" },
    { code: "CMX", name: "Ciudad de México" },
    { code: "COA", name: "Coahuila" },
    { code: "COL", name: "Colima" },
    { code: "DUR", name: "Durango" },
    { code: "GUA", name: "Guanajuato" },
    { code: "GRO", name: "Guerrero" },
    { code: "HID", name: "Hidalgo" },
    { code: "JAL", name: "Jalisco" },
    { code: "MEX", name: "México" },
    { code: "MIC", name: "Michoacán" },
    { code: "MOR", name: "Morelos" },
    { code: "NAY", name: "Nayarit" },
    { code: "NLE", name: "Nuevo León" },
    { code: "OAX", name: "Oaxaca" },
    { code: "PUE", name: "Puebla" },
    { code: "QUE", name: "Querétaro" },
    { code: "ROO", name: "Quintana Roo" },
    { code: "SLP", name: "San Luis Potosí" },
    { code: "SIN", name: "Sinaloa" },
    { code: "SON", name: "Sonora" },
    { code: "TAB", name: "Tabasco" },
    { code: "TAM", name: "Tamaulipas" },
    { code: "TLA", name: "Tlaxcala" },
    { code: "VER", name: "Veracruz" },
    { code: "YUC", name: "Yucatán" },
    { code: "ZAC", name: "Zacatecas" },
  ],
}

// Country display names
export const COUNTRY_NAMES: Record<CountryCode, string> = {
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
}

// Location type labels
export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  commercial: "Commercial/Business",
  residential: "Residential/Home",
}

// Package configuration types
export const PACKAGE_TYPES = [
  "envelope",
  "small-box",
  "medium-box",
  "large-box",
  "extra-large",
  "pallet",
  "custom",
] as const
export type PackageTypeId = (typeof PACKAGE_TYPES)[number]

export const DIMENSION_UNITS = ["in", "cm"] as const
export type DimensionUnit = (typeof DIMENSION_UNITS)[number]

export const WEIGHT_UNITS = ["lbs", "kg"] as const
export type WeightUnit = (typeof WEIGHT_UNITS)[number]

export const CURRENCY_CODES = ["USD", "CAD", "MXN"] as const
export type CurrencyCode = (typeof CURRENCY_CODES)[number]

// Package type limits (in cm and kg - same as form-config)
export const PACKAGE_TYPE_LIMITS: Record<
  PackageTypeId,
  { maxWeight: number; maxLength: number; maxWidth: number; maxHeight: number }
> = {
  envelope: { maxWeight: 0.5, maxLength: 38, maxWidth: 30, maxHeight: 2 },
  "small-box": { maxWeight: 5, maxLength: 30, maxWidth: 25, maxHeight: 20 },
  "medium-box": { maxWeight: 15, maxLength: 45, maxWidth: 35, maxHeight: 30 },
  "large-box": { maxWeight: 25, maxLength: 60, maxWidth: 50, maxHeight: 40 },
  "extra-large": { maxWeight: 35, maxLength: 80, maxWidth: 60, maxHeight: 50 },
  pallet: { maxWeight: 500, maxLength: 120, maxWidth: 100, maxHeight: 150 },
  custom: { maxWeight: 1000, maxLength: 200, maxWidth: 150, maxHeight: 150 },
}

// Package configuration schema
export const packageConfigSchema = z.object({
  packageTypeId: z.enum(PACKAGE_TYPES, {
    errorMap: () => ({ message: "Package type is required" }),
  }),
  length: z.number().positive("Length must be greater than 0"),
  width: z.number().positive("Width must be greater than 0"),
  height: z.number().positive("Height must be greater than 0"),
  dimensionUnit: z.enum(DIMENSION_UNITS),
  weight: z.number().positive("Weight must be greater than 0"),
  weightUnit: z.enum(WEIGHT_UNITS),
  declaredValue: z.number().min(1, "Declared value must be at least $1"),
  currency: z.enum(CURRENCY_CODES),
  contentsDescription: z
    .string()
    .min(1, "Contents description is required")
    .min(3, "Description must be at least 3 characters")
    .max(500, "Description must not exceed 500 characters"),
})

// Extended schema with cross-field validation for package limits
export const packageConfigSchemaWithLimits = packageConfigSchema.superRefine((data, ctx) => {
  const limits = PACKAGE_TYPE_LIMITS[data.packageTypeId]
  if (!limits) return

  // Convert dimensions to cm for validation if in inches
  let lengthInCm = data.length
  let widthInCm = data.width
  let heightInCm = data.height

  if (data.dimensionUnit === "in") {
    lengthInCm = data.length * 2.54
    widthInCm = data.width * 2.54
    heightInCm = data.height * 2.54
  }

  // Validate dimensions against limits
  if (lengthInCm > limits.maxLength) {
    const maxDisplay =
      data.dimensionUnit === "in" ? Math.round((limits.maxLength / 2.54) * 10) / 10 : limits.maxLength
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Length exceeds maximum of ${maxDisplay} ${data.dimensionUnit} for this package type`,
      path: ["length"],
    })
  }

  if (widthInCm > limits.maxWidth) {
    const maxDisplay =
      data.dimensionUnit === "in" ? Math.round((limits.maxWidth / 2.54) * 10) / 10 : limits.maxWidth
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Width exceeds maximum of ${maxDisplay} ${data.dimensionUnit} for this package type`,
      path: ["width"],
    })
  }

  if (heightInCm > limits.maxHeight) {
    const maxDisplay =
      data.dimensionUnit === "in" ? Math.round((limits.maxHeight / 2.54) * 10) / 10 : limits.maxHeight
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Height exceeds maximum of ${maxDisplay} ${data.dimensionUnit} for this package type`,
      path: ["height"],
    })
  }

  // Convert weight to kg for validation if in lbs
  let weightInKg = data.weight
  if (data.weightUnit === "lbs") {
    weightInKg = data.weight / 2.20462
  }

  if (weightInKg > limits.maxWeight) {
    const maxDisplay =
      data.weightUnit === "lbs" ? Math.round(limits.maxWeight * 2.20462 * 10) / 10 : limits.maxWeight
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Weight exceeds maximum of ${maxDisplay} ${data.weightUnit} for this package type`,
      path: ["weight"],
    })
  }

  // Validate declared value max ($100k USD equivalent)
  const exchangeRates: Record<CurrencyCode, number> = {
    USD: 1,
    CAD: 1.35,
    MXN: 17.5,
  }
  const valueInUSD = data.declaredValue / exchangeRates[data.currency]
  if (valueInUSD > 100000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Declared value cannot exceed $100,000 USD equivalent",
      path: ["declaredValue"],
    })
  }
})

export type PackageConfigFormData = z.infer<typeof packageConfigSchema>
export type PackageConfigFormDataWithLimits = z.infer<typeof packageConfigSchemaWithLimits>

// ==========================================
// Special Handling & Delivery Preferences
// ==========================================

// Special handling option types
export const SPECIAL_HANDLING_OPTIONS = [
  "fragile",
  "this-side-up",
  "temperature-controlled",
  "hazmat",
  "white-glove",
  "inside-delivery",
  "liftgate-pickup",
  "liftgate-delivery",
] as const
export type SpecialHandlingOption = (typeof SPECIAL_HANDLING_OPTIONS)[number]

// Delivery preference option types
export const DELIVERY_PREFERENCE_OPTIONS = [
  "signature",
  "adult-signature",
  "sms-confirmation",
  "photo-proof",
  "saturday-delivery",
  "hold-at-location",
] as const
export type DeliveryPreferenceOption = (typeof DELIVERY_PREFERENCE_OPTIONS)[number]

// Hazmat data schema
export const hazmatSchema = z.object({
  unNumber: z
    .string()
    .min(1, "UN Number is required")
    .regex(/^UN\d{4}$/i, "UN Number must be in format UN1234"),
  properShippingName: z
    .string()
    .min(1, "Proper shipping name is required")
    .min(2, "Name must be at least 2 characters"),
  hazardClass: z
    .string()
    .min(1, "Hazard class is required"),
  packingGroup: z
    .string()
    .min(1, "Packing group is required"),
  quantity: z
    .number()
    .positive("Quantity must be greater than 0"),
  unit: z
    .enum(["kg", "lbs", "L", "gal"]),
  emergencyContactName: z
    .string()
    .min(1, "Emergency contact name is required")
    .min(2, "Name must be at least 2 characters"),
  emergencyContactPhone: z
    .string()
    .min(1, "Emergency contact phone is required")
    .regex(/^\+?[\d\s\-\(\)]{10,}$/, "Invalid phone number format"),
})

export type HazmatFormData = z.infer<typeof hazmatSchema>

// Piece type for multi-piece shipments
export const PIECE_TYPES = ["box", "envelope", "pallet", "tube", "other"] as const
export type PieceType = (typeof PIECE_TYPES)[number]

// Piece schema
export const pieceSchema = z.object({
  id: z.string(),
  type: z.enum(PIECE_TYPES),
  description: z.string().max(200, "Description must not exceed 200 characters").optional(),
  length: z.number().min(0, "Length must be 0 or greater"),
  width: z.number().min(0, "Width must be 0 or greater"),
  height: z.number().min(0, "Height must be 0 or greater"),
  weight: z.number().min(0, "Weight must be 0 or greater"),
})

export type PieceFormData = z.infer<typeof pieceSchema>

// Multi-piece schema
export const multiPieceSchema = z.object({
  pieces: z
    .array(pieceSchema)
    .min(1, "At least one piece is required")
    .max(20, "Maximum 20 pieces allowed"),
})

export type MultiPieceFormData = z.infer<typeof multiPieceSchema>

// Special handling data schema
export const specialHandlingDataSchema = z.object({
  selectedOptions: z.array(z.enum(SPECIAL_HANDLING_OPTIONS)),
  totalFee: z.number().min(0),
})

export type SpecialHandlingData = z.infer<typeof specialHandlingDataSchema>

// Delivery preferences data schema
export const deliveryPreferencesDataSchema = z.object({
  selectedOptions: z.array(z.enum(DELIVERY_PREFERENCE_OPTIONS)),
  totalFee: z.number().min(0),
})

export type DeliveryPreferencesData = z.infer<typeof deliveryPreferencesDataSchema>

// Combined special handling section schema
export const specialHandlingSectionSchema = z.object({
  specialHandling: specialHandlingDataSchema,
  deliveryPreferences: deliveryPreferencesDataSchema,
  hazmatDetails: hazmatSchema.optional(),
  multiPiece: multiPieceSchema.optional(),
}).superRefine((data, ctx) => {
  // If hazmat is selected, hazmat details are required
  if (data.specialHandling.selectedOptions.includes("hazmat")) {
    if (!data.hazmatDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hazmat details are required when hazmat is selected",
        path: ["hazmatDetails"],
      })
    }
  }
})

export type SpecialHandlingSectionData = z.infer<typeof specialHandlingSectionSchema>

// Extended shipment schema including special handling
export const shipmentStep1WithSpecialHandlingSchema = z.intersection(
  shipmentStep1Schema,
  specialHandlingSectionSchema
)

export type ShipmentStep1WithSpecialHandlingFormData = z.infer<typeof shipmentStep1WithSpecialHandlingSchema>

// ==========================================
// Payment Method Types
// ==========================================

export const PAYMENT_METHODS = [
  "purchase_order",
  "bill_of_lading", 
  "third_party",
  "net_terms",
  "corporate_account",
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  purchase_order: "Purchase Order",
  bill_of_lading: "Bill of Lading",
  third_party: "Third-Party Billing",
  net_terms: "Net Terms",
  corporate_account: "Corporate Account",
}

export const PAYMENT_METHOD_FEES: Record<PaymentMethod, number> = {
  purchase_order: 0,
  bill_of_lading: 0,
  third_party: 2.5,
  net_terms: 1.5,
  corporate_account: 0,
}

// ==========================================
// Purchase Order Validation
// ==========================================

export const purchaseOrderSchema = z.object({
  poNumber: z
    .string()
    .min(1, "PO number is required")
    .min(3, "PO number must be at least 3 characters")
    .max(50, "PO number must not exceed 50 characters"),
  poAmount: z
    .number()
    .min(0.01, "PO amount must be greater than 0"),
  expirationDate: z
    .string()
    .min(1, "Expiration date is required")
    .refine((date) => {
      const parsed = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return parsed >= today
    }, "Expiration date must be today or in the future"),
  approvalContact: z
    .string()
    .min(1, "Approval contact is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  department: z
    .string()
    .min(1, "Department is required")
    .min(2, "Department must be at least 2 characters")
    .max(100, "Department must not exceed 100 characters"),
}).superRefine((data, ctx) => {
  // Additional validation: PO amount should be >= shipment total
  // This is validated at the form level with context
})

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>

// ==========================================
// Bill of Lading Validation
// ==========================================

export const billOfLadingSchema = z.object({
  bolNumber: z
    .string()
    .min(1, "BOL number is required")
    .regex(/^BOL-\d{4}-\d{6}$/i, "BOL number must be in format BOL-YYYY-XXXXXX"),
  bolDate: z
    .string()
    .min(1, "BOL date is required")
    .refine((date) => {
      const parsed = new Date(date)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      return parsed <= today
    }, "BOL date cannot be in the future"),
  shipperReference: z
    .string()
    .max(50, "Shipper reference must not exceed 50 characters")
    .optional(),
  freightTerms: z
    .enum(["prepaid", "collect", "third_party"], {
      errorMap: () => ({ message: "Freight terms are required" }),
    }),
})

export type BillOfLadingFormData = z.infer<typeof billOfLadingSchema>

// ==========================================
// Third Party Billing Validation
// ==========================================

export const thirdPartyBillingSchema = z.object({
  accountNumber: z
    .string()
    .min(1, "Account number is required")
    .min(5, "Account number must be at least 5 characters")
    .max(50, "Account number must not exceed 50 characters"),
  companyName: z
    .string()
    .min(1, "Company name is required")
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must not exceed 100 characters"),
  contactName: z
    .string()
    .min(1, "Contact name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  contactPhone: z
    .string()
    .min(1, "Contact phone is required")
    .regex(/^\+?[\d\s\-\(\)]{10,}$/, "Invalid phone number format"),
  contactEmail: z
    .string()
    .min(1, "Contact email is required")
    .email("Invalid email address"),
  authorizationCode: z
    .string()
    .max(50, "Authorization code must not exceed 50 characters")
    .optional(),
})

export type ThirdPartyBillingFormData = z.infer<typeof thirdPartyBillingSchema>

// ==========================================
// Net Terms Validation
// ==========================================

export const NET_TERMS_OPTIONS = [15, 30, 45, 60] as const
export type NetTermOption = (typeof NET_TERMS_OPTIONS)[number]

export const tradeReferenceSchema = z.object({
  companyName: z.string().min(1, "Company name is required").min(2, "Must be at least 2 characters"),
  contactName: z.string().min(1, "Contact name is required").min(2, "Must be at least 2 characters"),
  phone: z.string().min(1, "Phone is required").regex(/^\+?[\d\s\-\(\)]{10,}$/, "Invalid phone format"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  relationship: z.string().min(1, "Relationship is required"),
})

export type TradeReferenceFormData = z.infer<typeof tradeReferenceSchema>

export const netTermsSchema = z.object({
  paymentPeriod: z
    .number()
    .refine((val) => NET_TERMS_OPTIONS.includes(val as NetTermOption), {
      message: "Payment period must be 15, 30, 45, or 60 days",
    }),
  creditApplicationFile: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= 10 * 1024 * 1024, "File must be 10MB or smaller")
    .refine(
      (file) => !file || ["application/pdf", "image/jpeg", "image/png"].includes(file.type),
      "File must be PDF, JPEG, or PNG"
    ),
  creditApplicationUrl: z.string().optional(),
  tradeReferences: z
    .array(tradeReferenceSchema)
    .min(3, "At least 3 trade references are required"),
  annualRevenue: z
    .number()
    .min(1, "Annual revenue is required")
    .min(0, "Annual revenue must be positive"),
})

export type NetTermsFormData = z.infer<typeof netTermsSchema>

// ==========================================
// Corporate Account Validation
// ==========================================

export const corporateAccountSchema = z.object({
  accountNumber: z
    .string()
    .min(1, "Account number is required")
    .min(5, "Account number must be at least 5 characters")
    .max(50, "Account number must not exceed 50 characters"),
  pin: z
    .string()
    .min(1, "PIN is required")
    .regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
})

export type CorporateAccountFormData = z.infer<typeof corporateAccountSchema>

// ==========================================
// Payment Method Selection Schema
// ==========================================

export const paymentMethodSelectionSchema = z.object({
  method: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: "Please select a payment method" }),
  }),
  purchaseOrder: purchaseOrderSchema.optional(),
  billOfLading: billOfLadingSchema.optional(),
  thirdParty: thirdPartyBillingSchema.optional(),
  netTerms: netTermsSchema.optional(),
  corporateAccount: corporateAccountSchema.optional(),
}).superRefine((data, ctx) => {
  // Validate method-specific data based on selected method
  if (data.method === "purchase_order") {
    if (!data.purchaseOrder) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Purchase order details are required",
        path: ["purchaseOrder"],
      })
    }
  } else if (data.method === "bill_of_lading") {
    if (!data.billOfLading) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bill of lading details are required",
        path: ["billOfLading"],
      })
    }
  } else if (data.method === "third_party") {
    if (!data.thirdParty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Third-party billing details are required",
        path: ["thirdParty"],
      })
    }
  } else if (data.method === "net_terms") {
    if (!data.netTerms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Net terms details are required",
        path: ["netTerms"],
      })
    }
  } else if (data.method === "corporate_account") {
    if (!data.corporateAccount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Corporate account details are required",
        path: ["corporateAccount"],
      })
    }
  }
})

export type PaymentMethodSelectionData = z.infer<typeof paymentMethodSelectionSchema>


// ==========================================
// Billing Information Validation
// ==========================================

// Invoice delivery methods
export const INVOICE_DELIVERY_METHODS = [
  "email",
  "mail",
  "edi",
  "portal",
] as const
export type InvoiceDeliveryMethod = (typeof INVOICE_DELIVERY_METHODS)[number]

export const INVOICE_DELIVERY_METHOD_LABELS: Record<InvoiceDeliveryMethod, string> = {
  email: "Email",
  mail: "Postal Mail",
  edi: "EDI (Electronic Data Interchange)",
  portal: "Customer Portal",
}

// Invoice formats
export const INVOICE_FORMATS = [
  "standard",
  "itemized",
  "summary",
  "custom",
] as const
export type InvoiceFormat = (typeof INVOICE_FORMATS)[number]

export const INVOICE_FORMAT_LABELS: Record<InvoiceFormat, string> = {
  standard: "Standard",
  itemized: "Itemized",
  summary: "Summary",
  custom: "Custom",
}

// Invoice frequencies
export const INVOICE_FREQUENCIES = [
  "per_shipment",
  "weekly",
  "monthly",
] as const
export type InvoiceFrequency = (typeof INVOICE_FREQUENCIES)[number]

export const INVOICE_FREQUENCY_LABELS: Record<InvoiceFrequency, string> = {
  per_shipment: "Per Shipment",
  weekly: "Weekly",
  monthly: "Monthly",
}

// Business types
export const BUSINESS_TYPES = [
  "corporation",
  "llc",
  "partnership",
  "sole_proprietorship",
  "nonprofit",
  "government",
  "cooperative",
  "trust",
  "other",
] as const
export type BusinessType = (typeof BUSINESS_TYPES)[number]

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  corporation: "Corporation (C-Corp, S-Corp)",
  llc: "Limited Liability Company (LLC)",
  partnership: "Partnership (LP, LLP)",
  sole_proprietorship: "Sole Proprietorship",
  nonprofit: "Non-Profit Organization",
  government: "Government Entity",
  cooperative: "Cooperative",
  trust: "Trust/Estate",
  other: "Other",
}

// Shipping volume ranges
export const SHIPPING_VOLUME_RANGES = [
  "1-100",
  "101-500",
  "501-1000",
  "1001-5000",
  "5001-10000",
  "10001-50000",
  "50001+",
] as const
export type ShippingVolumeRange = (typeof SHIPPING_VOLUME_RANGES)[number]

// Billing address schema (reuses base address fields with billing prefix)
export const billingAddressSchema = z.object({
  billingLine1: z
    .string()
    .min(1, "Street address is required")
    .min(5, "Street address must be at least 5 characters")
    .max(100, "Street address must not exceed 100 characters"),
  billingLine2: z
    .string()
    .max(50, "Suite/Apt must not exceed 50 characters")
    .optional(),
  billingCity: z
    .string()
    .min(1, "City is required")
    .min(2, "City must be at least 2 characters")
    .max(50, "City must not exceed 50 characters"),
  billingState: z.string().min(1, "State/Province is required"),
  billingPostal: z.string().min(1, "ZIP/Postal code is required"),
  billingCountry: z.enum(SUPPORTED_COUNTRIES, {
    errorMap: () => ({ message: "Country must be US, CA, or MX" }),
  }),
  billingLocationType: z.enum(LOCATION_TYPES, {
    errorMap: () => ({ message: "Location type is required" }),
  }),
  sameAsOrigin: z.boolean().optional(),
})

// Billing contact schema
export const billingContactSchema = z.object({
  billingContactName: z
    .string()
    .min(1, "Contact name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  billingContactTitle: z
    .string()
    .min(1, "Job title is required")
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must not exceed 100 characters"),
  billingContactPhone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+?[\d\s\-\(\)]{10,}$/, "Invalid phone number format"),
  billingContactEmail: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  billingContactDepartment: z
    .string()
    .max(100, "Department must not exceed 100 characters")
    .optional(),
  billingGLCode: z
    .string()
    .max(50, "GL code must not exceed 50 characters")
    .optional(),
  billingTaxId: z
    .string()
    .max(50, "Tax ID must not exceed 50 characters")
    .optional()
    .refine((val) => {
      if (!val) return true
      // EIN format: XX-XXXXXXX or XXXXXXXXX
      return /^\d{2}-?\d{7}$/.test(val) || /^\d{9}$/.test(val)
    }, "Tax ID must be a valid EIN format (XX-XXXXXXX or XXXXXXXXX)"),
})

// Company info schema
export const companyInfoSchema = z.object({
  companyLegalName: z
    .string()
    .min(1, "Legal company name is required")
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must not exceed 200 characters"),
  companyDBA: z
    .string()
    .max(200, "DBA must not exceed 200 characters")
    .optional(),
  companyBusinessType: z.enum(BUSINESS_TYPES, {
    errorMap: () => ({ message: "Business type is required" }),
  }),
  companyIndustry: z
    .string()
    .min(1, "Industry is required"),
  companyShippingVolume: z
    .enum(SHIPPING_VOLUME_RANGES)
    .optional(),
})

// Invoice preferences schema
export const invoicePreferencesSchema = z.object({
  invoiceDeliveryMethod: z.enum(INVOICE_DELIVERY_METHODS, {
    errorMap: () => ({ message: "Delivery method is required" }),
  }),
  invoiceFormat: z.enum(INVOICE_FORMATS, {
    errorMap: () => ({ message: "Invoice format is required" }),
  }),
  invoiceFrequency: z.enum(INVOICE_FREQUENCIES, {
    errorMap: () => ({ message: "Invoice frequency is required" }),
  }),
})

// Combined billing information schema
export const billingInformationSchema = z
  .object({
    // Payment method (already defined separately)
    paymentMethod: z.enum(PAYMENT_METHODS),
    paymentMethodData: paymentMethodSelectionSchema.optional(),
  })
  .merge(billingAddressSchema)
  .merge(billingContactSchema)
  .merge(companyInfoSchema)
  .merge(invoicePreferencesSchema)
  .superRefine((data, ctx) => {
    // Validate billing postal code based on country
    if (data.billingCountry && data.billingPostal) {
      const pattern = ZIP_PATTERNS[data.billingCountry]
      if (pattern && !pattern.test(data.billingPostal)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: ZIP_ERROR_MESSAGES[data.billingCountry],
          path: ["billingPostal"],
        })
      }
    }

    // If not same as origin, require all billing address fields
    if (!data.sameAsOrigin) {
      if (!data.billingLine1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Street address is required",
          path: ["billingLine1"],
        })
      }
      if (!data.billingCity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "City is required",
          path: ["billingCity"],
        })
      }
      if (!data.billingState) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "State is required",
          path: ["billingState"],
        })
      }
      if (!data.billingPostal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Postal code is required",
          path: ["billingPostal"],
        })
      }
    }
  })

// Export types
export type BillingAddressData = z.infer<typeof billingAddressSchema>
export type BillingContactData = z.infer<typeof billingContactSchema>
export type CompanyInfoData = z.infer<typeof companyInfoSchema>
export type InvoicePreferencesData = z.infer<typeof invoicePreferencesSchema>
export type BillingInformationData = z.infer<typeof billingInformationSchema>

// Industries list (40+ options) - for validation reference
export const INDUSTRIES_LIST = [
  "aerospace",
  "agriculture",
  "apparel",
  "automotive",
  "biotechnology",
  "chemicals",
  "construction",
  "consulting",
  "consumer_goods",
  "ecommerce",
  "education",
  "electronics",
  "energy",
  "entertainment",
  "financial",
  "food_beverage",
  "healthcare",
  "hospitality",
  "insurance",
  "legal",
  "logistics",
  "manufacturing",
  "mining",
  "nonprofit",
  "publishing",
  "real_estate",
  "renewable_energy",
  "research",
  "sports",
  "technology",
  "telecommunications",
  "textiles",
  "transportation",
  "utilities",
  "wholesale",
  "wine_spirits",
  "wood_paper",
  "other",
] as const

export type Industry = (typeof INDUSTRIES_LIST)[number]

export const INDUSTRY_LABELS: Record<Industry, string> = {
  aerospace: "Aerospace & Defense",
  agriculture: "Agriculture & Farming",
  apparel: "Apparel & Fashion",
  automotive: "Automotive",
  biotechnology: "Biotechnology",
  chemicals: "Chemicals",
  construction: "Construction",
  consulting: "Consulting & Professional Services",
  consumer_goods: "Consumer Goods",
  ecommerce: "E-commerce & Retail",
  education: "Education",
  electronics: "Electronics & Technology",
  energy: "Energy & Utilities",
  entertainment: "Entertainment & Media",
  financial: "Financial Services",
  food_beverage: "Food & Beverage",
  healthcare: "Healthcare & Pharmaceuticals",
  hospitality: "Hospitality & Tourism",
  insurance: "Insurance",
  legal: "Legal Services",
  logistics: "Logistics & Transportation",
  manufacturing: "Manufacturing",
  mining: "Mining & Metals",
  nonprofit: "Non-Profit",
  publishing: "Publishing & Printing",
  real_estate: "Real Estate",
  renewable_energy: "Renewable Energy",
  research: "Research & Development",
  sports: "Sports & Recreation",
  technology: "Technology & Software",
  telecommunications: "Telecommunications",
  textiles: "Textiles",
  transportation: "Transportation & Warehousing",
  utilities: "Utilities",
  wholesale: "Wholesale & Distribution",
  wine_spirits: "Wine & Spirits",
  wood_paper: "Wood, Paper & Forestry",
  other: "Other",
}

// ==========================================
// Pickup Location Validation
// ==========================================

export const PICKUP_LOCATION_TYPES = [
  "loading_dock",
  "ground_level",
  "residential",
  "storage_facility",
  "construction_site",
  "other",
] as const
export type PickupLocationType = (typeof PICKUP_LOCATION_TYPES)[number]

export const PICKUP_LOCATION_TYPE_LABELS: Record<PickupLocationType, string> = {
  loading_dock: "Loading Dock",
  ground_level: "Ground Level",
  residential: "Residential",
  storage_facility: "Storage Facility",
  construction_site: "Construction Site",
  other: "Other",
}

export const PICKUP_LOCATION_TYPE_FEES: Record<PickupLocationType, number> = {
  loading_dock: 0,
  ground_level: 0,
  residential: 15,
  storage_facility: 0,
  construction_site: 25,
  other: 0,
}

// Pickup location schema
export const pickupLocationSchema = z.object({
  locationType: z.enum(PICKUP_LOCATION_TYPES, {
    errorMap: () => ({ message: "Location type is required" }),
  }),
  dockNumber: z
    .string()
    .max(50, "Dock number must not exceed 50 characters")
    .optional(),
  otherDescription: z
    .string()
    .max(200, "Description must not exceed 200 characters")
    .optional(),
}).superRefine((data, ctx) => {
  // Dock number required for loading dock
  if (data.locationType === "loading_dock" && !data.dockNumber) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Dock number is required for loading dock locations",
      path: ["dockNumber"],
    })
  }
  // Description required for other location type
  if (data.locationType === "other" && !data.otherDescription) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Description is required for other location types",
      path: ["otherDescription"],
    })
  }
})

export type PickupLocationData = z.infer<typeof pickupLocationSchema>

// ==========================================
// Access Requirements Validation
// ==========================================

export const ACCESS_REQUIREMENTS = [
  "call_upon_arrival",
  "security_checkin",
  "gate_code",
  "appointment_required",
  "limited_parking",
  "forklift_available",
  "liftgate_service",
] as const
export type AccessRequirement = (typeof ACCESS_REQUIREMENTS)[number]

export const ACCESS_REQUIREMENT_LABELS: Record<AccessRequirement, string> = {
  call_upon_arrival: "Call Upon Arrival",
  security_checkin: "Security Check-in",
  gate_code: "Gate Code Required",
  appointment_required: "Appointment Required",
  limited_parking: "Limited Parking",
  forklift_available: "Forklift Available",
  liftgate_service: "Liftgate Service",
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

// Access requirements schema
export const accessRequirementsSchema = z.object({
  requirements: z.array(z.enum(ACCESS_REQUIREMENTS)).default([]),
  gateCode: z
    .string()
    .max(200, "Gate code must not exceed 200 characters")
    .optional(),
  parkingInstructions: z
    .string()
    .max(200, "Parking instructions must not exceed 200 characters")
    .optional(),
}).superRefine((data, ctx) => {
  // Gate code required if gate_code requirement selected
  if (data.requirements.includes("gate_code") && !data.gateCode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Gate code or access instructions are required",
      path: ["gateCode"],
    })
  }
  // Parking instructions required if limited_parking selected
  if (data.requirements.includes("limited_parking") && !data.parkingInstructions) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Parking instructions are required",
      path: ["parkingInstructions"],
    })
  }
})

export type AccessRequirementsData = z.infer<typeof accessRequirementsSchema>

// ==========================================
// Pickup Equipment Validation
// ==========================================

export const PICKUP_EQUIPMENT = [
  "standard_dolly",
  "appliance_dolly",
  "furniture_pads",
  "straps",
  "pallet_jack",
  "two_person_team",
] as const
export type PickupEquipment = (typeof PICKUP_EQUIPMENT)[number]

export const PICKUP_EQUIPMENT_LABELS: Record<PickupEquipment, string> = {
  standard_dolly: "Standard Dolly",
  appliance_dolly: "Appliance Dolly",
  furniture_pads: "Furniture Pads",
  straps: "Straps",
  pallet_jack: "Pallet Jack",
  two_person_team: "Two-Person Team",
}

export const PICKUP_EQUIPMENT_FEES: Record<PickupEquipment, number> = {
  standard_dolly: 0,
  appliance_dolly: 0,
  furniture_pads: 0,
  straps: 0,
  pallet_jack: 0,
  two_person_team: 45,
}

// Pickup equipment schema
export const pickupEquipmentSchema = z.object({
  equipment: z.array(z.enum(PICKUP_EQUIPMENT)).default([]),
})

export type PickupEquipmentData = z.infer<typeof pickupEquipmentSchema>

// ==========================================
// Loading Assistance Validation
// ==========================================

export const LOADING_ASSISTANCE_TYPES = [
  "customer_load",
  "driver_assistance",
  "full_service",
] as const
export type LoadingAssistanceType = (typeof LOADING_ASSISTANCE_TYPES)[number]

export const LOADING_ASSISTANCE_LABELS: Record<LoadingAssistanceType, string> = {
  customer_load: "Customer Will Load",
  driver_assistance: "Driver Assistance",
  full_service: "Full Service",
}

export const LOADING_ASSISTANCE_FEES: Record<LoadingAssistanceType, number> = {
  customer_load: 0,
  driver_assistance: 25,
  full_service: 65,
}

// Loading assistance schema
export const loadingAssistanceSchema = z.object({
  assistanceType: z.enum(LOADING_ASSISTANCE_TYPES, {
    errorMap: () => ({ message: "Loading assistance type is required" }),
  }),
})

export type LoadingAssistanceData = z.infer<typeof loadingAssistanceSchema>

// ==========================================
// Special Instructions Validation
// ==========================================

export const specialInstructionsSchema = z.object({
  gateCode: z
    .string()
    .max(200, "Gate code must not exceed 200 characters")
    .optional(),
  parkingLoading: z
    .string()
    .max(200, "Parking/loading instructions must not exceed 200 characters")
    .optional(),
  packageLocation: z
    .string()
    .max(100, "Package location must not exceed 100 characters")
    .optional(),
  driverInstructions: z
    .string()
    .max(300, "Driver instructions must not exceed 300 characters")
    .optional(),
})

export type SpecialInstructionsData = z.infer<typeof specialInstructionsSchema>

// ==========================================
// Complete Pickup Details Validation
// ==========================================

export const pickupDetailsSchema = z.object({
  location: pickupLocationSchema,
  access: accessRequirementsSchema,
  equipment: pickupEquipmentSchema,
  loading: loadingAssistanceSchema,
  specialInstructions: specialInstructionsSchema,
})

export type PickupDetailsData = z.infer<typeof pickupDetailsSchema>

// ==========================================
// Pickup Contact Validation
// ==========================================

export const PREFERRED_CONTACT_METHODS = ["phone", "email", "text"] as const
export type PreferredContactMethod = (typeof PREFERRED_CONTACT_METHODS)[number]

export const PREFERRED_CONTACT_METHOD_LABELS: Record<PreferredContactMethod, string> = {
  phone: "Phone Call",
  email: "Email",
  text: "Text Message",
}

// Primary contact schema
export const primaryContactSchema = z.object({
  name: z
    .string()
    .min(1, "Primary contact name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  jobTitle: z
    .string()
    .max(100, "Job title must not exceed 100 characters")
    .optional(),
  mobilePhone: z
    .string()
    .min(1, "Mobile phone is required")
    .regex(/^\+?[\d\s\-\(\)]{10,}$/, "Invalid phone number format"),
  altPhone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]{10,}$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  preferredMethod: z.enum(PREFERRED_CONTACT_METHODS, {
    errorMap: () => ({ message: "Preferred contact method is required" }),
  }),
})

export type PrimaryContactData = z.infer<typeof primaryContactSchema>

// Backup contact schema
export const backupContactSchema = z.object({
  name: z
    .string()
    .min(1, "Backup contact name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  phone: z
    .string()
    .min(1, "Backup phone is required")
    .regex(/^\+?[\d\s\-\(\)]{10,}$/, "Invalid phone number format"),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
})

export type BackupContactData = z.infer<typeof backupContactSchema>

// Combined contact schema with cross-validation
export const pickupContactSchema = z.object({
  primary: primaryContactSchema,
  backup: backupContactSchema,
}).superRefine((data, ctx) => {
  // Backup contact cannot be the same as primary
  if (data.primary.name.toLowerCase().trim() === data.backup.name.toLowerCase().trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Backup contact cannot be the same person as primary contact",
      path: ["backup", "name"],
    })
  }
  
  // Backup phone cannot be the same as primary mobile
  const primaryPhone = data.primary.mobilePhone.replace(/\D/g, "")
  const backupPhone = data.backup.phone.replace(/\D/g, "")
  if (primaryPhone === backupPhone && primaryPhone.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Backup phone cannot be the same as primary mobile phone",
      path: ["backup", "phone"],
    })
  }
})

export type PickupContactData = z.infer<typeof pickupContactSchema>

// ==========================================
// Authorized Personnel Validation
// ==========================================

export const AUTHORIZATION_LEVELS = ["full", "limited", "notification_only"] as const
export type AuthorizationLevel = (typeof AUTHORIZATION_LEVELS)[number]

export const AUTHORIZATION_LEVEL_LABELS: Record<AuthorizationLevel, string> = {
  full: "Full Authorization",
  limited: "Limited Authorization",
  notification_only: "Notification Only",
}

export const authorizedPersonSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  authorizationLevel: z.enum(AUTHORIZATION_LEVELS, {
    errorMap: () => ({ message: "Authorization level is required" }),
  }),
})

export type AuthorizedPersonData = z.infer<typeof authorizedPersonSchema>

export const authorizedPersonnelSchema = z.object({
  anyoneAtLocation: z.boolean().default(false),
  personnelList: z.array(authorizedPersonSchema).default([]),
}).superRefine((data, ctx) => {
  // If "anyone at location" is not selected, at least one person is recommended
  // (but we'll make it optional - just a warning at UI level)
})

export type AuthorizedPersonnelData = z.infer<typeof authorizedPersonnelSchema>

// ==========================================
// Special Authorization Validation (High-Value)
// ==========================================

export const specialAuthorizationSchema = z.object({
  idVerificationRequired: z.boolean().default(false),
  signatureRequired: z.boolean().default(false),
  photoIdMatching: z.boolean().default(false),
})

export type SpecialAuthorizationData = z.infer<typeof specialAuthorizationSchema>

// ==========================================
// Notification Preferences Validation
// ==========================================

export const notificationPreferencesSchema = z.object({
  emailReminder24h: z.boolean().default(true),
  smsReminder2h: z.boolean().default(true),
  callReminder30m: z.boolean().default(false),
  driverEnroute: z.boolean().default(true),
  pickupCompletion: z.boolean().default(true),
  transitUpdates: z.boolean().default(true),
})

export type NotificationPreferencesData = z.infer<typeof notificationPreferencesSchema>

// ==========================================
// Complete Pickup Contacts & Notifications Schema
// ==========================================

export const pickupContactsNotificationsSchema = z.object({
  contacts: pickupContactSchema,
  authorizedPersonnel: authorizedPersonnelSchema,
  specialAuthorization: specialAuthorizationSchema.optional(),
  notifications: notificationPreferencesSchema,
})

export type PickupContactsNotificationsData = z.infer<typeof pickupContactsNotificationsSchema>
