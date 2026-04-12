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
