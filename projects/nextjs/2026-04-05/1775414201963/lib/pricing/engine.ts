/**
 * B2B Postal Checkout Flow - Pricing Engine
 * Calculates shipping rates with all fees and surcharges
 */

import type { Carrier, ServiceType, Address, HandlingType } from '@/types/database';

// ============================================
// PRICING CONSTANTS
// ============================================

const TAX_RATE = 0.085; // 8.5% tax on base + fuel

const INSURANCE_RATES: Record<string, { rate: number; riskFactor: number }> = {
  standard: { rate: 0.005, riskFactor: 1.0 },   // 0.5% of declared value
  fragile: { rate: 0.015, riskFactor: 1.5 },    // 1.5% for fragile items
  hazardous: { rate: 0.025, riskFactor: 2.0 },  // 2.5% for hazardous
  high_value: { rate: 0.008, riskFactor: 1.2 }, // 0.8% for high value (> $1000)
};

const HANDLING_FEES: Record<HandlingType, number> = {
  fragile: 12.50,
  hazardous: 35.00,
  temperature_controlled: 25.00,
  signature_required: 5.50,
  adult_signature: 8.50,
  hold_for_pickup: 6.00,
  appointment_delivery: 15.00,
};

const DELIVERY_CONFIRMATION_FEES = {
  standard: 0,
  signature: 5.50,
  adult_signature: 8.50,
};

// ZIP code prefix to zone mapping (simplified heuristic)
const ZIP_ZONE_MAP: Record<string, number> = {
  // Northeast (Zone 1)
  '0': 1, '1': 1,
  // Southeast (Zone 2)
  '2': 2, '3': 2,
  // Midwest (Zone 3)
  '4': 3, '5': 3, '6': 3,
  // Southwest (Zone 4)
  '7': 4,
  // West (Zone 5)
  '8': 5, '9': 5,
};

// Zone multipliers for distance calculation
const ZONE_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.15,
  3: 1.25,
  4: 1.35,
  5: 1.5,
};

// Fuel surcharge ranges by carrier (min, max) percentages
const FUEL_SURCHARGE_RANGES: Record<string, { min: number; max: number }> = {
  pex: { min: 8.5, max: 15.0 },
  vc: { min: 10.0, max: 18.0 },
  efl: { min: 15.0, max: 25.0 },
  fs: { min: 12.0, max: 22.0 },
};

// Carbon footprint factors (kg CO2 per kg of package weight per km)
const CARBON_FACTORS: Record<string, number> = {
  ground: 0.00012,
  air: 0.00085,
  freight: 0.00008,
  express: 0.00045,
  international: 0.00095,
};

// ============================================
// TYPES
// ============================================

export interface PricingInput {
  senderAddress: Address;
  recipientAddress: Address;
  weight: number; // in kg
  length: number; // in cm
  width: number; // in cm
  height: number; // in cm
  declaredValue?: number;
  specialHandling: HandlingType[];
  signatureRequired: boolean;
  adultSignatureRequired: boolean;
}

export interface PricingBreakdown {
  baseRate: number;
  weightCharge: number;
  zoneCharge: number;
  fuelSurcharge: number;
  residentialFee: number;
  extendedAreaFee: number;
  handlingFees: number;
  insuranceCost: number;
  deliveryConfirmationFee: number;
  subtotal: number;
  taxes: number;
  total: number;
}

export interface CalculatedQuote {
  carrierId: string;
  serviceTypeId: string;
  carrier: Carrier;
  serviceType: ServiceType;
  breakdown: PricingBreakdown;
  estimatedDelivery: Date;
  carbonFootprint: number; // kg CO2
  currency: string;
}

export interface QuoteCategory {
  category: string;
  displayName: string;
  quotes: CalculatedQuote[];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get zone from ZIP code prefix
 */
function getZoneFromZip(postalCode: string): number {
  const prefix = postalCode.charAt(0);
  return ZIP_ZONE_MAP[prefix] || 3; // Default to zone 3 (Midwest) if unknown
}

/**
 * Calculate distance-based zone between two addresses
 */
function calculateDistanceZone(senderAddress: Address, recipientAddress: Address): number {
  const senderZone = getZoneFromZip(senderAddress.postal_code);
  const recipientZone = getZoneFromZip(recipientAddress.postal_code);
  
  // Distance is the difference between zones, minimum 1
  return Math.max(1, Math.abs(recipientZone - senderZone) + 1);
}

/**
 * Calculate estimated distance in km (simplified heuristic)
 */
function calculateEstimatedDistance(senderAddress: Address, recipientAddress: Address): number {
  const zone = calculateDistanceZone(senderAddress, recipientAddress);
  // Approximate distance per zone difference
  const baseDistance = 500; // km per zone
  return zone * baseDistance;
}

/**
 * Generate random fuel surcharge within carrier range
 */
function calculateFuelSurcharge(baseRate: number, carrierCode: string): number {
  const range = FUEL_SURCHARGE_RANGES[carrierCode] || FUEL_SURCHARGE_RANGES['pex'];
  // Random percentage between min and max
  const randomPercent = range.min + Math.random() * (range.max - range.min);
  return (baseRate * randomPercent) / 100;
}

/**
 * Calculate dimensional weight
 */
function calculateDimensionalWeight(length: number, width: number, height: number): number {
  // Dimensional weight factor: 5000 (international standard)
  const dimensionalWeight = (length * width * height) / 5000;
  return Math.max(0.1, dimensionalWeight);
}

/**
 * Calculate insurance cost
 */
function calculateInsurance(
  declaredValue: number,
  handlingTypes: HandlingType[],
  serviceCategory: string
): number {
  if (!declaredValue || declaredValue <= 0) return 0;
  
  // Determine insurance rate based on handling types
  let insuranceType = 'standard';
  if (handlingTypes.includes('fragile')) {
    insuranceType = 'fragile';
  } else if (handlingTypes.includes('hazardous')) {
    insuranceType = 'hazardous';
  } else if (declaredValue > 1000) {
    insuranceType = 'high_value';
  }
  
  const insuranceConfig = INSURANCE_RATES[insuranceType];
  let cost = declaredValue * insuranceConfig.rate * insuranceConfig.riskFactor;
  
  // International shipments have higher insurance
  if (serviceCategory === 'international') {
    cost *= 1.25;
  }
  
  return Math.round(cost * 100) / 100;
}

/**
 * Calculate special handling fees
 */
function calculateHandlingFees(handlingTypes: HandlingType[]): number {
  return handlingTypes.reduce((total, type) => {
    return total + (HANDLING_FEES[type] || 0);
  }, 0);
}

/**
 * Calculate delivery confirmation fee
 */
function calculateDeliveryConfirmationFee(
  signatureRequired: boolean,
  adultSignatureRequired: boolean
): number {
  if (adultSignatureRequired) {
    return DELIVERY_CONFIRMATION_FEES.adult_signature;
  }
  if (signatureRequired) {
    return DELIVERY_CONFIRMATION_FEES.signature;
  }
  return DELIVERY_CONFIRMATION_FEES.standard;
}

/**
 * Calculate carbon footprint
 */
function calculateCarbonFootprint(
  weight: number,
  senderAddress: Address,
  recipientAddress: Address,
  serviceCategory: string
): number {
  const distance = calculateEstimatedDistance(senderAddress, recipientAddress);
  const carbonFactor = CARBON_FACTORS[serviceCategory] || CARBON_FACTORS['ground'];
  const footprint = weight * distance * carbonFactor;
  return Math.round(footprint * 1000) / 1000; // Round to 3 decimal places
}

/**
 * Calculate estimated delivery date
 */
function calculateEstimatedDelivery(
  serviceType: ServiceType,
  senderAddress: Address,
  recipientAddress: Address
): Date {
  const now = new Date();
  const distanceZone = calculateDistanceZone(senderAddress, recipientAddress);
  
  let minDays = serviceType.min_delivery_days || 1;
  let maxDays = serviceType.max_delivery_days || minDays + 2;
  
  // Adjust for distance
  if (distanceZone > 3) {
    minDays += 1;
    maxDays += 1;
  }
  
  // Random delivery day within range
  const deliveryDays = minDays + Math.floor(Math.random() * (maxDays - minDays + 1));
  
  const estimatedDelivery = new Date(now);
  estimatedDelivery.setDate(now.getDate() + deliveryDays);
  
  // Adjust for weekends (simplified - just add days if weekend)
  const dayOfWeek = estimatedDelivery.getDay();
  if (dayOfWeek === 0) { // Sunday
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);
  } else if (dayOfWeek === 6) { // Saturday
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);
  }
  
  return estimatedDelivery;
}

// ============================================
// MAIN PRICING CALCULATION
// ============================================

export interface CalculateQuoteOptions {
  carrier: Carrier;
  serviceType: ServiceType;
  input: PricingInput;
}

/**
 * Calculate a single quote for carrier + service type
 */
export function calculateSingleQuote(options: CalculateQuoteOptions): CalculatedQuote {
  const { carrier, serviceType, input } = options;
  
  // Calculate dimensional weight and use the greater of actual or dimensional
  const dimensionalWeight = calculateDimensionalWeight(
    input.length,
    input.width,
    input.height
  );
  const chargeableWeight = Math.max(input.weight, dimensionalWeight);
  
  // Calculate distance zone
  const distanceZone = calculateDistanceZone(
    input.senderAddress,
    input.recipientAddress
  );
  const zoneMultiplier = ZONE_MULTIPLIERS[distanceZone] || 1.25;
  
  // Calculate base rate components
  const carrierMultiplier = carrier.base_rate_multiplier || 1.0;
  const serviceBaseRate = serviceType.base_rate || 0;
  const ratePerKg = serviceType.rate_per_kg || 0;
  
  // Weight charge
  const weightCharge = chargeableWeight * ratePerKg * carrierMultiplier;
  
  // Zone charge (based on distance)
  const zoneCharge = serviceBaseRate * (zoneMultiplier - 1);
  
  // Base rate (service base + weight charge + zone adjustment)
  const baseRate = (serviceBaseRate + weightCharge + zoneCharge) * carrierMultiplier;
  
  // Fuel surcharge (randomized within carrier range)
  const fuelSurcharge = calculateFuelSurcharge(baseRate, carrier.code);
  
  // Residential delivery fee (if applicable)
  const residentialFee = carrier.residential_delivery_fee || 0;
  
  // Extended area surcharge (for remote zones)
  const extendedAreaFee = distanceZone >= 4 ? (carrier.extended_area_surcharge || 0) : 0;
  
  // Special handling fees
  const handlingFees = calculateHandlingFees(input.specialHandling);
  
  // Insurance cost
  const insuranceCost = calculateInsurance(
    input.declaredValue || 0,
    input.specialHandling,
    serviceType.category
  );
  
  // Delivery confirmation fee
  const deliveryConfirmationFee = calculateDeliveryConfirmationFee(
    input.signatureRequired,
    input.adultSignatureRequired
  );
  
  // Subtotal before taxes
  const subtotal = baseRate + fuelSurcharge + residentialFee + extendedAreaFee + 
                   handlingFees + insuranceCost + deliveryConfirmationFee;
  
  // Taxes (8.5% on base + fuel)
  const taxableAmount = baseRate + fuelSurcharge;
  const taxes = taxableAmount * TAX_RATE;
  
  // Total
  const total = subtotal + taxes;
  
  // Carbon footprint
  const carbonFootprint = calculateCarbonFootprint(
    input.weight,
    input.senderAddress,
    input.recipientAddress,
    serviceType.category
  );
  
  // Round all values to 2 decimal places
  const breakdown: PricingBreakdown = {
    baseRate: Math.round(baseRate * 100) / 100,
    weightCharge: Math.round(weightCharge * 100) / 100,
    zoneCharge: Math.round(zoneCharge * 100) / 100,
    fuelSurcharge: Math.round(fuelSurcharge * 100) / 100,
    residentialFee: Math.round(residentialFee * 100) / 100,
    extendedAreaFee: Math.round(extendedAreaFee * 100) / 100,
    handlingFees: Math.round(handlingFees * 100) / 100,
    insuranceCost: Math.round(insuranceCost * 100) / 100,
    deliveryConfirmationFee: Math.round(deliveryConfirmationFee * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    taxes: Math.round(taxes * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
  
  return {
    carrierId: carrier.id,
    serviceTypeId: serviceType.id,
    carrier,
    serviceType,
    breakdown,
    estimatedDelivery: calculateEstimatedDelivery(serviceType, input.senderAddress, input.recipientAddress),
    carbonFootprint,
    currency: 'USD',
  };
}

/**
 * Calculate quotes for all available carrier/service combinations
 */
export function calculateAllQuotes(
  carriers: Carrier[],
  serviceTypes: ServiceType[],
  input: PricingInput
): CalculatedQuote[] {
  const quotes: CalculatedQuote[] = [];
  
  for (const carrier of carriers) {
    if (!carrier.is_active) continue;
    
    // Get service types for this carrier
    const carrierServices = serviceTypes.filter(
      st => st.carrier_id === carrier.id && st.is_active
    );
    
    for (const serviceType of carrierServices) {
      // Skip if package exceeds service limits
      if (serviceType.max_weight && input.weight > serviceType.max_weight) continue;
      if (serviceType.max_length && input.length > serviceType.max_length) continue;
      if (serviceType.max_width && input.width > serviceType.max_width) continue;
      if (serviceType.max_height && input.height > serviceType.max_height) continue;
      
      try {
        const quote = calculateSingleQuote({ carrier, serviceType, input });
        quotes.push(quote);
      } catch (error) {
        console.error(`Failed to calculate quote for ${carrier.code}/${serviceType.code}:`, error);
      }
    }
  }
  
  // Sort by total cost
  return quotes.sort((a, b) => a.breakdown.total - b.breakdown.total);
}

/**
 * Group quotes by service category
 */
export function organizeQuotesByCategory(quotes: CalculatedQuote[]): QuoteCategory[] {
  const categories: Record<string, CalculatedQuote[]> = {};
  
  for (const quote of quotes) {
    const category = quote.serviceType.category;
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(quote);
  }
  
  const categoryDisplayNames: Record<string, string> = {
    ground: 'Ground Shipping',
    air: 'Air Freight',
    freight: 'Freight Services',
    express: 'Express Delivery',
    international: 'International',
  };
  
  return Object.entries(categories).map(([category, categoryQuotes]) => ({
    category,
    displayName: categoryDisplayNames[category] || category,
    quotes: categoryQuotes.sort((a, b) => a.breakdown.total - b.breakdown.total),
  }));
}
