import { z } from 'zod'
import type { ValidationError, ValidationErrorType } from '@/components/review/ValidationErrors'
import type { TermsAcceptance } from '@/components/review/TermsAndConditions'

// ==========================================
// Pre-Submission Validation Types
// ==========================================

export interface ShipmentDataForValidation {
  id: string
  origin?: {
    line1?: string
    city?: string
    state?: string
    postal?: string
  }
  destination?: {
    line1?: string
    city?: string
    state?: string
    postal?: string
  }
  package?: {
    type?: string
    weight?: number
    declaredValue?: number
  }
  specialHandling?: string[]
  selectedRate?: {
    id?: string
    carrierName?: string
    total?: number
    expires_at?: string
  } | null
  payment?: {
    method?: string
    poExpirationDate?: string
  }
  pickup?: {
    selectedPickup?: {
      date?: string
      timeSlot?: {
        timeWindow?: string
      }
    }
  }
}

export interface SubmissionValidationContext {
  shipment: ShipmentDataForValidation
  termsAccepted: TermsAcceptance
  now?: Date
}

// ==========================================
// Validation Rules
// ==========================================

const submissionValidationSchema = z.object({
  // Origin must be complete
  origin: z.object({
    line1: z.string().min(1, 'Origin street address is required'),
    city: z.string().min(1, 'Origin city is required'),
    state: z.string().min(1, 'Origin state is required'),
    postal: z.string().min(1, 'Origin postal code is required'),
  }),

  // Destination must be complete
  destination: z.object({
    line1: z.string().min(1, 'Destination street address is required'),
    city: z.string().min(1, 'Destination city is required'),
    state: z.string().min(1, 'Destination state is required'),
    postal: z.string().min(1, 'Destination postal code is required'),
  }),

  // Package must be configured
  package: z.object({
    type: z.string().min(1, 'Package type is required'),
    weight: z.number().positive('Package weight must be greater than 0'),
    declaredValue: z.number().min(0, 'Declared value is required'),
  }),

  // Must have a selected rate (quote)
  selectedRate: z.object({
    id: z.string().min(1, 'Selected rate ID is required'),
    carrierName: z.string().min(1, 'Carrier selection is required'),
    total: z.number().positive('Rate total must be greater than 0'),
  }, {
    message: 'Please select a shipping rate',
  }),

  // Payment method must be selected
  payment: z.object({
    method: z.string().min(1, 'Payment method is required'),
  }),

  // Pickup must be scheduled
  pickup: z.object({
    selectedPickup: z.object({
      date: z.string().min(1, 'Pickup date is required'),
      timeSlot: z.object({
        timeWindow: z.string().min(1, 'Pickup time slot is required'),
      }),
    }),
  }),
})

const termsValidationSchema = z.object({
  declaredValueAccurate: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm that the declared value is accurate' }),
  }),
  insuranceUnderstood: z.literal(true, {
    errorMap: () => ({ message: 'You must acknowledge the insurance terms' }),
  }),
  contentsCompliant: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm contents compliance' }),
  }),
  carrierAuthorized: z.literal(true, {
    errorMap: () => ({ message: 'You must authorize the carrier' }),
  }),
})

const hazmatTermsSchema = z.object({
  hazmatCertification: z.literal(true, {
    errorMap: () => ({ message: 'You must certify hazmat compliance' }),
  }),
})

// ==========================================
// Validation Functions
// ==========================================

/**
 * Validates all shipment data before submission
 */
export function validateSubmission(
  context: SubmissionValidationContext
): { success: true } | { success: false; errors: ValidationError[] } {
  const errors: ValidationError[] = []
  const { shipment, termsAccepted, now = new Date() } = context

  // Validate shipment data structure
  const shipmentResult = submissionValidationSchema.safeParse({
    origin: shipment.origin,
    destination: shipment.destination,
    package: shipment.package,
    selectedRate: shipment.selectedRate,
    payment: shipment.payment,
    pickup: shipment.pickup,
  })

  if (!shipmentResult.success) {
    const zodErrors = shipmentResult.error.errors
    for (const error of zodErrors) {
      const path = error.path
      const field = path[path.length - 1] as string

      // Map Zod paths to ValidationErrorTypes
      let type: ValidationErrorType = 'origin'
      if (path[0] === 'destination') type = 'destination'
      else if (path[0] === 'package') type = 'package'
      else if (path[0] === 'selectedRate') type = 'pricing'
      else if (path[0] === 'payment') type = 'payment'
      else if (path[0] === 'pickup') type = 'pickup'

      errors.push({
        type,
        field,
        message: error.message,
      })
    }
  }

  // Validate quote expiration
  if (shipment.selectedRate?.expires_at) {
    const expiresAt = new Date(shipment.selectedRate.expires_at)
    if (expiresAt <= now) {
      errors.push({
        type: 'quote_expired',
        message: `The selected quote expired at ${expiresAt.toLocaleString()}. Please return to the rates page and select a new quote.`,
      })
    }
  }

  // Validate PO expiration (if PO payment method)
  if (shipment.payment?.method === 'purchase_order' && shipment.payment?.poExpirationDate) {
    const poExpiresAt = new Date(shipment.payment.poExpirationDate)
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    
    if (poExpiresAt < today) {
      errors.push({
        type: 'po_expired',
        message: `The Purchase Order expired on ${poExpiresAt.toLocaleDateString()}. Please update your payment method.`,
      })
    }
  }

  // Validate terms acceptance
  const hasHazmat = shipment.specialHandling?.includes('hazmat') ?? false
  const termsSchema = hasHazmat
    ? termsValidationSchema.merge(hazmatTermsSchema)
    : termsValidationSchema

  const termsResult = termsSchema.safeParse(termsAccepted)

  if (!termsResult.success) {
    const zodErrors = termsResult.error.errors
    for (const error of zodErrors) {
      errors.push({
        type: 'terms',
        field: error.path[0] as string,
        message: error.message,
      })
    }
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true }
}

/**
 * Quick check if all required terms are accepted
 */
export function areTermsAccepted(
  terms: TermsAcceptance,
  hasHazmat: boolean
): boolean {
  if (hasHazmat) {
    return (
      terms.declaredValueAccurate &&
      terms.insuranceUnderstood &&
      terms.contentsCompliant &&
      terms.carrierAuthorized &&
      terms.hazmatCertification === true
    )
  }

  return (
    terms.declaredValueAccurate &&
    terms.insuranceUnderstood &&
    terms.contentsCompliant &&
    terms.carrierAuthorized
  )
}

/**
 * Get the count of accepted terms
 */
export function getTermsAcceptanceCount(
  terms: TermsAcceptance,
  hasHazmat: boolean
): { accepted: number; total: number } {
  const requiredTerms = hasHazmat
    ? [
        terms.declaredValueAccurate,
        terms.insuranceUnderstood,
        terms.contentsCompliant,
        terms.carrierAuthorized,
        terms.hazmatCertification,
      ]
    : [
        terms.declaredValueAccurate,
        terms.insuranceUnderstood,
        terms.contentsCompliant,
        terms.carrierAuthorized,
      ]

  const accepted = requiredTerms.filter(Boolean).length
  const total = requiredTerms.length

  return { accepted, total }
}

/**
 * Creates a shipment validation context from API response data
 */
export function createValidationContext(
  apiData: unknown,
  termsAccepted: TermsAcceptance
): SubmissionValidationContext {
  const data = apiData as Record<string, unknown>

  return {
    shipment: {
      id: (data.id as string) || '',
      origin: {
        line1: ((data.origin as Record<string, string>)?.line1 as string) || '',
        city: (data.origin?.city as string) || '',
        state: (data.origin?.state as string) || '',
        postal: (data.origin?.postal as string) || '',
      },
      destination: {
        line1: (data.destination?.line1 as string) || '',
        city: (data.destination?.city as string) || '',
        state: (data.destination?.state as string) || '',
        postal: (data.destination?.postal as string) || '',
      },
      package: {
        type: (data.package_type as string) || '',
        weight: parseFloat(data.weight as string) || 0,
        declaredValue: parseFloat(data.declared_value as string) || 0,
      },
      specialHandling: (data.special_handling as string[]) || [],
      selectedRate: data.selected_rate as ShipmentDataForValidation['selectedRate'],
      payment: {
        method: (data.payment?.method as string) || '',
        poExpirationDate: (data.payment?.po_expiration_date as string),
      },
      pickup: {
        selectedPickup: {
          date: (data.pickup?.selected_pickup?.date as string) || '',
          timeSlot: {
            timeWindow: (data.pickup?.selected_pickup?.time_slot?.time_window as string) || '',
          },
        },
      },
    },
    termsAccepted,
  }
}
