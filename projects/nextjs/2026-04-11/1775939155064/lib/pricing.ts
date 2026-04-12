/**
 * Pricing Calculation Engine for B2B Postal Checkout Flow
 * 
 * Implements the pricing formula from requirements/04-business-logic.md:
 * 1. Distance & zone from origin/dest ZIP (mock heuristic using ZIP prefix difference × scaling factor)
 * 2. Billable weight = max(actual, DIM weight)
 * 3. Base rate = distance factor × zone mult × weight factor × carrier mult × service mult
 * 4. Fuel surcharge = base × randomized fuel % within carrier range
 * 5. Insurance = declared value × rate (0.003-0.005) × risk factor by category, min $5
 * 6. Special handling fees (sum of selected)
 * 7. Delivery confirmation fees (sum of selected)
 * 8. Taxes = (base + fuel) × 8.5%
 * 9. Total = base + fuel + insurance + handling + delivery + tax
 * 10. Carbon footprint = billable weight × distance × 0.0001 × carrier carbon mult × service mult
 */

// ============================================
// TYPES
// ============================================

export interface PricingInput {
  shipmentId: string
  originZip: string
  destinationZip: string
  weight: number // in lbs
  length: number // in inches
  width: number // in inches
  height: number // in inches
  declaredValue: number
  contentsCategory?: string
  specialHandling: string[]
  deliveryPreferences: string[]
}

export interface Carrier {
  id: string
  code: string
  name: string
  displayName: string
  rateMultiplier: number
  isActive: boolean
  fuelSurchargeRange: { min: number; max: number }
  carbonMultiplier: number
}

export interface ServiceType {
  id: string
  carrierId: string
  code: string
  name: string
  category: 'ground' | 'air' | 'express' | 'freight' | 'international'
  baseRate: number
  transitDaysMin: number
  transitDaysMax: number
  serviceMultiplier: number
  isActive: boolean
}

export interface SpecialHandlingFee {
  type: string
  name: string
  fee: number
}

export interface DeliveryConfirmationFee {
  type: string
  name: string
  fee: number
}

export interface PricingBreakdown {
  distance: number // in miles
  zone: number // 1-8
  billableWeight: number // in lbs
  actualWeight: number
  dimWeight: number
  baseRate: number
  fuelSurcharge: number
  fuelSurchargePercent: number
  insurance: number
  insuranceRate: number
  specialHandlingFees: { type: string; name: string; fee: number }[]
  specialHandlingTotal: number
  deliveryConfirmationFees: { type: string; name: string; fee: number }[]
  deliveryConfirmationTotal: number
  tax: number
  taxRate: number
  total: number
  currency: string
}

export interface QuoteResult {
  carrier: {
    id: string
    code: string
    name: string
    displayName: string
  }
  serviceType: {
    id: string
    code: string
    name: string
    category: string
  }
  transitDays: {
    min: number
    max: number
  }
  pricing: PricingBreakdown
  carbonFootprint: {
    kg: number
    calculation: string
  }
  expiresAt: string
}

// ============================================
// CONSTANTS
// ============================================

const PRICING_CONSTANTS = {
  DIM_DIVISOR: 139, // Dimensional weight divisor (industry standard for domestic)
  TAX_RATE: 0.085, // 8.5% tax rate
  INSURANCE_RATE_MIN: 0.003, // 0.3%
  INSURANCE_RATE_MAX: 0.005, // 0.5%
  INSURANCE_MIN: 5.00, // Minimum $5 insurance
  CARBON_BASE_MULTIPLIER: 0.0001, // Base carbon multiplier
  DISTANCE_SCALE_FACTOR: 2.5, // Distance scaling factor for zone calculation
  WEIGHT_SCALE_FACTOR: 0.15, // Weight factor for pricing
  ZONE_MULTIPLIERS: [1.0, 1.15, 1.25, 1.4, 1.6, 1.85, 2.15, 2.5] as const,
  DISTANCE_FACTORS: [1.0, 1.1, 1.25, 1.45, 1.7, 2.0, 2.35, 2.75] as const,
}

// Risk factors by contents category
const RISK_FACTORS: Record<string, number> = {
  electronics: 1.3,
  fragile: 1.5,
  hazardous: 2.0,
  perishable: 1.4,
  high_value: 1.6,
  documents: 0.8,
  general: 1.0,
  default: 1.0,
}

// Special handling fees lookup
const SPECIAL_HANDLING_FEES: Record<string, SpecialHandlingFee> = {
  fragile: { type: 'fragile', name: 'Fragile Handling', fee: 8.50 },
  'this-side-up': { type: 'this-side-up', name: 'Orientation Handling', fee: 5.00 },
  'temperature-controlled': { type: 'temperature-controlled', name: 'Temperature Control', fee: 25.00 },
  hazmat: { type: 'hazmat', name: 'Hazmat Handling', fee: 45.00 },
  'white-glove': { type: 'white-glove', name: 'White Glove Service', fee: 75.00 },
  'inside-delivery': { type: 'inside-delivery', name: 'Inside Delivery', fee: 35.00 },
  'liftgate-pickup': { type: 'liftgate-pickup', name: 'Liftgate Pickup', fee: 15.00 },
  'liftgate-delivery': { type: 'liftgate-delivery', name: 'Liftgate Delivery', fee: 15.00 },
}

// Delivery confirmation fees lookup
const DELIVERY_CONFIRMATION_FEES: Record<string, DeliveryConfirmationFee> = {
  signature: { type: 'signature', name: 'Signature Required', fee: 3.50 },
  'adult-signature': { type: 'adult-signature', name: 'Adult Signature Required', fee: 6.50 },
  'sms-confirmation': { type: 'sms-confirmation', name: 'SMS Confirmation', fee: 1.00 },
  'photo-proof': { type: 'photo-proof', name: 'Photo Proof of Delivery', fee: 2.00 },
  'saturday-delivery': { type: 'saturday-delivery', name: 'Saturday Delivery', fee: 16.00 },
  'hold-at-location': { type: 'hold-at-location', name: 'Hold at Location', fee: 0.00 },
}

// Carrier configurations with fuel surcharge ranges and carbon multipliers
const CARRIER_CONFIGS: Record<string, { fuelMin: number; fuelMax: number; carbonMult: number }> = {
  pex: { fuelMin: 0.12, fuelMax: 0.18, carbonMult: 1.0 },
  vc: { fuelMin: 0.10, fuelMax: 0.16, carbonMult: 0.95 },
  efl: { fuelMin: 0.14, fuelMax: 0.20, carbonMult: 1.1 },
  default: { fuelMin: 0.12, fuelMax: 0.18, carbonMult: 1.0 },
}

// Service category multipliers
const SERVICE_CATEGORY_MULTIPLIERS: Record<string, number> = {
  ground: 1.0,
  air: 1.8,
  express: 2.5,
  freight: 0.7,
  international: 2.2,
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate zone from ZIP codes using a mock heuristic
 * Zone = (|origin_prefix - dest_prefix| / 1000) × scale, clamped to 1-8
 */
export function calculateZone(originZip: string, destinationZip: string): number {
  const originPrefix = parseInt(originZip.slice(0, 3), 10) || 0
  const destPrefix = parseInt(destinationZip.slice(0, 3), 10) || 0
  const diff = Math.abs(originPrefix - destPrefix)
  
  // Scale and convert to zone (1-8)
  const rawZone = Math.ceil((diff / 1000) * PRICING_CONSTANTS.DISTANCE_SCALE_FACTOR)
  return Math.max(1, Math.min(8, rawZone))
}

/**
 * Estimate distance in miles from zone
 * This is a rough approximation based on USPS zone-to-distance mapping
 */
export function estimateDistance(zone: number): number {
  const zoneDistances = [0, 50, 150, 300, 600, 1000, 1400, 1800, 3000]
  return zoneDistances[zone] || zoneDistances[8]
}

/**
 * Calculate dimensional weight (DIM weight)
 * DIM weight = (length × width × height) / DIM divisor
 */
export function calculateDimWeight(length: number, width: number, height: number): number {
  const volume = length * width * height
  return volume / PRICING_CONSTANTS.DIM_DIVISOR
}

/**
 * Calculate billable weight (max of actual and DIM weight)
 */
export function calculateBillableWeight(
  actualWeight: number,
  length: number,
  width: number,
  height: number
): { billableWeight: number; dimWeight: number } {
  const dimWeight = calculateDimWeight(length, width, height)
  const billableWeight = Math.max(actualWeight, dimWeight)
  return { billableWeight, dimWeight }
}

/**
 * Get zone multiplier based on zone number (1-8)
 */
export function getZoneMultiplier(zone: number): number {
  const index = Math.max(0, Math.min(7, zone - 1))
  return PRICING_CONSTANTS.ZONE_MULTIPLIERS[index]
}

/**
 * Get distance factor based on zone number (1-8)
 */
export function getDistanceFactor(zone: number): number {
  const index = Math.max(0, Math.min(7, zone - 1))
  return PRICING_CONSTANTS.DISTANCE_FACTORS[index]
}

/**
 * Calculate weight factor for pricing
 * Non-linear scaling: heavier packages cost more per pound
 */
export function calculateWeightFactor(weight: number): number {
  const baseFactor = Math.pow(weight, 0.7) * PRICING_CONSTANTS.WEIGHT_SCALE_FACTOR
  // Add slight premium for very heavy packages
  const heavyPremium = weight > 50 ? (weight - 50) * 0.01 : 0
  return baseFactor + heavyPremium
}

/**
 * Generate a deterministic random value based on shipment ID
 * This ensures the same shipment gets consistent fuel surcharge
 */
export function getDeterministicRandom(shipmentId: string, seed: number): number {
  // Simple hash function to generate a seed from shipmentId
  let hash = 0
  for (let i = 0; i < shipmentId.length; i++) {
    const char = shipmentId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Combine with seed and normalize to 0-1
  const combined = Math.abs(hash + seed * 997)
  return (combined % 10000) / 10000
}

/**
 * Calculate fuel surcharge percentage within carrier's range
 */
export function calculateFuelSurchargePercent(
  carrierCode: string,
  shipmentId: string,
  serviceIndex: number
): number {
  const config = CARRIER_CONFIGS[carrierCode] || CARRIER_CONFIGS.default
  const randomFactor = getDeterministicRandom(shipmentId, serviceIndex)
  const range = config.fuelMax - config.fuelMin
  return config.fuelMin + (randomFactor * range)
}

/**
 * Calculate insurance cost
 * Insurance = declared value × rate (0.003-0.005) × risk factor, min $5
 */
export function calculateInsurance(
  declaredValue: number,
  contentsCategory: string = 'default',
  shipmentId: string
): { cost: number; rate: number; riskFactor: number } {
  const riskFactor = RISK_FACTORS[contentsCategory] || RISK_FACTORS.default
  
  // Generate a rate between 0.003 and 0.005 based on shipmentId
  const randomFactor = getDeterministicRandom(shipmentId, 12345)
  const rate = PRICING_CONSTANTS.INSURANCE_RATE_MIN + 
    (randomFactor * (PRICING_CONSTANTS.INSURANCE_RATE_MAX - PRICING_CONSTANTS.INSURANCE_RATE_MIN))
  
  const cost = declaredValue * rate * riskFactor
  const finalCost = Math.max(PRICING_CONSTANTS.INSURANCE_MIN, cost)
  
  return {
    cost: Math.round(finalCost * 100) / 100,
    rate: Math.round(rate * 10000) / 10000,
    riskFactor,
  }
}

/**
 * Calculate special handling fees
 */
export function calculateSpecialHandlingFees(
  specialHandling: string[]
): { fees: { type: string; name: string; fee: number }[]; total: number } {
  const fees = specialHandling
    .map(type => SPECIAL_HANDLING_FEES[type])
    .filter(Boolean)
    .map(fee => ({ ...fee }))
  
  const total = fees.reduce((sum, fee) => sum + fee.fee, 0)
  return { fees, total }
}

/**
 * Calculate delivery confirmation fees
 */
export function calculateDeliveryConfirmationFees(
  deliveryPreferences: string[]
): { fees: { type: string; name: string; fee: number }[]; total: number } {
  const fees = deliveryPreferences
    .map(type => DELIVERY_CONFIRMATION_FEES[type])
    .filter(Boolean)
    .map(fee => ({ ...fee }))
  
  const total = fees.reduce((sum, fee) => sum + fee.fee, 0)
  return { fees, total }
}

/**
 * Calculate carbon footprint
 * Carbon = billable weight × distance × 0.0001 × carrier carbon mult × service mult
 */
export function calculateCarbonFootprint(
  billableWeight: number,
  distance: number,
  carrierCode: string,
  serviceCategory: string
): number {
  const carrierConfig = CARRIER_CONFIGS[carrierCode] || CARRIER_CONFIGS.default
  const serviceMult = SERVICE_CATEGORY_MULTIPLIERS[serviceCategory] || 1.0
  
  const carbon = billableWeight * distance * 
    PRICING_CONSTANTS.CARBON_BASE_MULTIPLIER * 
    carrierConfig.carbonMult * 
    serviceMult
  
  return Math.round(carbon * 1000) / 1000 // Round to 3 decimal places
}

// ============================================
// MAIN PRICING CALCULATION
// ============================================

export interface CalculateQuoteParams {
  shipmentId: string
  originZip: string
  destinationZip: string
  weight: number // lbs
  length: number // inches
  width: number // inches
  height: number // inches
  declaredValue: number
  contentsCategory?: string
  specialHandling: string[]
  deliveryPreferences: string[]
  carrier: Carrier
  serviceType: ServiceType
  serviceIndex: number // For deterministic fuel calculation
}

/**
 * Calculate a complete quote for a carrier + service type combination
 */
export function calculateQuote(params: CalculateQuoteParams): QuoteResult {
  const {
    shipmentId,
    originZip,
    destinationZip,
    weight,
    length,
    width,
    height,
    declaredValue,
    contentsCategory,
    specialHandling,
    deliveryPreferences,
    carrier,
    serviceType,
    serviceIndex,
  } = params

  // 1. Calculate distance and zone
  const zone = calculateZone(originZip, destinationZip)
  const distance = estimateDistance(zone)

  // 2. Calculate billable weight
  const { billableWeight, dimWeight } = calculateBillableWeight(weight, length, width, height)

  // 3. Calculate base rate
  // Base rate = distance factor × zone mult × weight factor × carrier mult × service mult
  const distanceFactor = getDistanceFactor(zone)
  const zoneMult = getZoneMultiplier(zone)
  const weightFactor = calculateWeightFactor(billableWeight)
  const carrierMult = carrier.rateMultiplier
  const serviceMult = serviceType.serviceMultiplier || SERVICE_CATEGORY_MULTIPLIERS[serviceType.category] || 1.0
  
  const baseRate = serviceType.baseRate * distanceFactor * zoneMult * weightFactor * carrierMult * serviceMult
  const roundedBaseRate = Math.round(baseRate * 100) / 100

  // 4. Calculate fuel surcharge
  const fuelSurchargePercent = calculateFuelSurchargePercent(carrier.code, shipmentId, serviceIndex)
  const fuelSurcharge = roundedBaseRate * fuelSurchargePercent
  const roundedFuelSurcharge = Math.round(fuelSurcharge * 100) / 100

  // 5. Calculate insurance
  const { cost: insurance, rate: insuranceRate, riskFactor } = calculateInsurance(
    declaredValue,
    contentsCategory,
    shipmentId
  )

  // 6. Calculate special handling fees
  const { fees: specialHandlingFees, total: specialHandlingTotal } = calculateSpecialHandlingFees(specialHandling)

  // 7. Calculate delivery confirmation fees
  const { fees: deliveryConfirmationFees, total: deliveryConfirmationTotal } = 
    calculateDeliveryConfirmationFees(deliveryPreferences)

  // 8. Calculate taxes (base + fuel) × 8.5%
  const taxableAmount = roundedBaseRate + roundedFuelSurcharge
  const tax = taxableAmount * PRICING_CONSTANTS.TAX_RATE
  const roundedTax = Math.round(tax * 100) / 100

  // 9. Calculate total
  const total = roundedBaseRate + roundedFuelSurcharge + insurance + 
    specialHandlingTotal + deliveryConfirmationTotal + roundedTax
  const roundedTotal = Math.round(total * 100) / 100

  // 10. Calculate carbon footprint
  const carbonKg = calculateCarbonFootprint(billableWeight, distance, carrier.code, serviceType.category)

  // Set expiration to 1 hour from now
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  return {
    carrier: {
      id: carrier.id,
      code: carrier.code,
      name: carrier.name,
      displayName: carrier.displayName,
    },
    serviceType: {
      id: serviceType.id,
      code: serviceType.code,
      name: serviceType.name,
      category: serviceType.category,
    },
    transitDays: {
      min: serviceType.transitDaysMin,
      max: serviceType.transitDaysMax,
    },
    pricing: {
      distance,
      zone,
      billableWeight: Math.round(billableWeight * 100) / 100,
      actualWeight: weight,
      dimWeight: Math.round(dimWeight * 100) / 100,
      baseRate: roundedBaseRate,
      fuelSurcharge: roundedFuelSurcharge,
      fuelSurchargePercent: Math.round(fuelSurchargePercent * 10000) / 10000,
      insurance,
      insuranceRate,
      specialHandlingFees,
      specialHandlingTotal,
      deliveryConfirmationFees,
      deliveryConfirmationTotal,
      tax: roundedTax,
      taxRate: PRICING_CONSTANTS.TAX_RATE,
      total: roundedTotal,
      currency: 'USD',
    },
    carbonFootprint: {
      kg: carbonKg,
      calculation: `${Math.round(billableWeight * 100) / 100} lbs × ${distance} mi × ${PRICING_CONSTANTS.CARBON_BASE_MULTIPLIER} × ${CARRIER_CONFIGS[carrier.code]?.carbonMult || 1.0} × ${serviceMult}`,
    },
    expiresAt,
  }
}

// ============================================
// DATABASE HELPERS
// ============================================

/**
 * Prepare quote record for database insertion
 * Extends the basic quotes schema with full pricing breakdown
 */
export function prepareQuoteRecord(
  shipmentId: string,
  quoteResult: QuoteResult
): Record<string, unknown> {
  return {
    shipment_id: shipmentId,
    carrier_id: quoteResult.carrier.id,
    service_type_id: quoteResult.serviceType.id,
    base_rate: quoteResult.pricing.baseRate,
    fuel_surcharge: quoteResult.pricing.fuelSurcharge,
    total_cost: quoteResult.pricing.total,
    estimated_delivery: new Date(Date.now() + quoteResult.transitDays.min * 24 * 60 * 60 * 1000).toISOString(),
    is_selected: false,
    // Extended fields for calculation basis (stored as JSONB)
    calculation_basis: {
      distance: quoteResult.pricing.distance,
      zone: quoteResult.pricing.zone,
      billable_weight: quoteResult.pricing.billableWeight,
      actual_weight: quoteResult.pricing.actualWeight,
      dim_weight: quoteResult.pricing.dimWeight,
      fuel_surcharge_percent: quoteResult.pricing.fuelSurchargePercent,
      insurance_rate: quoteResult.pricing.insuranceRate,
      tax_rate: quoteResult.pricing.taxRate,
      carbon_footprint_kg: quoteResult.carbonFootprint.kg,
    },
    fee_breakdown: {
      base_rate: quoteResult.pricing.baseRate,
      fuel_surcharge: quoteResult.pricing.fuelSurcharge,
      insurance: quoteResult.pricing.insurance,
      special_handling: quoteResult.pricing.specialHandlingTotal,
      delivery_confirmation: quoteResult.pricing.deliveryConfirmationTotal,
      tax: quoteResult.pricing.tax,
      special_handling_details: quoteResult.pricing.specialHandlingFees,
      delivery_confirmation_details: quoteResult.pricing.deliveryConfirmationFees,
    },
    expires_at: quoteResult.expiresAt,
  }
}

/**
 * Group quotes by service category
 */
export function groupQuotesByCategory(quotes: QuoteResult[]): Record<string, QuoteResult[]> {
  const grouped: Record<string, QuoteResult[]> = {
    ground: [],
    air: [],
    express: [],
    freight: [],
    international: [],
  }
  
  for (const quote of quotes) {
    const category = quote.serviceType.category
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(quote)
  }
  
  // Sort each category by total price
  for (const category of Object.keys(grouped)) {
    grouped[category].sort((a, b) => a.pricing.total - b.pricing.total)
  }
  
  return grouped
}
