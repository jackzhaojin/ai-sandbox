import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  calculateQuote,
  prepareQuoteRecord,
  groupQuotesByCategory,
  type Carrier,
  type ServiceType,
  type QuoteResult,
} from '@/lib/pricing'

export const dynamic = 'force-dynamic'

// Initialize server-side Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials')
}

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'postal_v2' }
})

// ============================================
// TYPES
// ============================================

interface QuoteRequestBody {
  shipmentId: string
}

// ============================================
// DATABASE HELPERS
// ============================================

/**
 * Fetch shipment details with addresses
 */
async function getShipmentDetails(shipmentId: string) {
  const { data: shipment, error } = await supabaseServer
    .from('shipments')
    .select(`
      id,
      weight,
      length,
      width,
      height,
      declared_value,
      contents_description,
      sender_address_id,
      recipient_address_id,
      sender_addresses:sender_address_id (postal_code),
      recipient_addresses:recipient_address_id (postal_code)
    `)
    .eq('id', shipmentId)
    .single()

  if (error) {
    return null
  }

  return shipment
}

/**
 * Fetch special handling for a shipment
 */
async function getSpecialHandling(shipmentId: string): Promise<string[]> {
  const { data, error } = await supabaseServer
    .from('shipment_special_handling')
    .select('handling_type')
    .eq('shipment_id', shipmentId)

  if (error) {
    return []
  }

  // Map database handling types back to frontend option IDs
  const handlingMap: Record<string, string> = {
    'fragile': 'fragile',
    'temperature_controlled': 'temperature-controlled',
    'hazardous': 'hazmat',
    'appointment_delivery': 'white-glove',
    'hold_for_pickup': 'liftgate-pickup',
    'signature_required': '',
    'adult_signature': '',
  }

  return data
    .map(h => handlingMap[h.handling_type])
    .filter(Boolean) as string[]
}

/**
 * Fetch delivery preferences for a shipment
 */
async function getDeliveryPreferences(shipmentId: string): Promise<string[]> {
  const { data, error } = await supabaseServer
    .from('shipment_delivery_preferences')
    .select('require_signature, delivery_instructions')
    .eq('shipment_id', shipmentId)
    .single()

  if (error) {
    // No delivery preferences found is OK
    return []
  }

  const preferences: string[] = []
  
  if (data.require_signature) {
    preferences.push('signature')
  }

  // Parse delivery instructions for preferences
  if (data.delivery_instructions) {
    if (data.delivery_instructions.includes('adult-signature')) {
      preferences.push('adult-signature')
    }
    if (data.delivery_instructions.includes('sms-confirmation')) {
      preferences.push('sms-confirmation')
    }
    if (data.delivery_instructions.includes('photo-proof')) {
      preferences.push('photo-proof')
    }
    if (data.delivery_instructions.includes('saturday-delivery')) {
      preferences.push('saturday-delivery')
    }
    if (data.delivery_instructions.includes('hold-at-location')) {
      preferences.push('hold-at-location')
    }
  }

  return preferences
}

/**
 * Fetch all active carriers with their configurations
 */
async function getActiveCarriers(): Promise<Carrier[]> {
  const { data, error } = await supabaseServer
    .from('carriers')
    .select('id, code, name, display_name, rate_multiplier, is_active')
    .eq('is_active', true)

  if (error) {
    return []
  }

  // Map to Carrier type with fuel surcharge ranges and carbon multipliers
  const carrierConfigs: Record<string, { fuelMin: number; fuelMax: number; carbonMult: number }> = {
    'pex': { fuelMin: 0.12, fuelMax: 0.18, carbonMult: 1.0 },
    'vc': { fuelMin: 0.10, fuelMax: 0.16, carbonMult: 0.95 },
    'efl': { fuelMin: 0.14, fuelMax: 0.20, carbonMult: 1.1 },
  }

  return data.map(c => ({
    id: c.id,
    code: c.code,
    name: c.name,
    displayName: c.display_name,
    rateMultiplier: c.rate_multiplier,
    isActive: c.is_active,
    fuelSurchargeRange: carrierConfigs[c.code] || carrierConfigs['pex'],
    carbonMultiplier: carrierConfigs[c.code]?.carbonMult || 1.0,
  }))
}

/**
 * Fetch all active service types for carriers
 */
async function getActiveServiceTypes(carrierIds: string[]): Promise<ServiceType[]> {
  if (carrierIds.length === 0) return []

  const { data, error } = await supabaseServer
    .from('service_types')
    .select('id, carrier_id, code, name, category, base_rate, transit_days_min, transit_days_max, is_active')
    .in('carrier_id', carrierIds)
    .eq('is_active', true)

  if (error) {
    return []
  }

  // Service category multipliers
  const categoryMultipliers: Record<string, number> = {
    'ground': 1.0,
    'air': 1.8,
    'express': 2.5,
    'freight': 0.7,
    'international': 2.2,
  }

  return data.map(s => ({
    id: s.id,
    carrierId: s.carrier_id,
    code: s.code,
    name: s.name,
    category: s.category as ServiceType['category'],
    baseRate: s.base_rate,
    transitDaysMin: s.transit_days_min,
    transitDaysMax: s.transit_days_max,
    serviceMultiplier: categoryMultipliers[s.category] || 1.0,
    isActive: s.is_active,
  }))
}

/**
 * Delete existing quotes for a shipment
 */
async function deleteExistingQuotes(shipmentId: string): Promise<void> {
  const { error } = await supabaseServer
    .from('quotes')
    .delete()
    .eq('shipment_id', shipmentId)

  if (error) {
  }
}

/**
 * Insert quotes into database
 */
async function persistQuotes(
  shipmentId: string,
  quotes: QuoteResult[]
): Promise<boolean> {
  try {
    // First delete existing quotes
    await deleteExistingQuotes(shipmentId)

    // Prepare quote records
    const quoteRecords = quotes.map(q => prepareQuoteRecord(shipmentId, q))

    // Insert new quotes - use upsert to handle potential conflicts
    const { error } = await supabaseServer
      .from('quotes')
      .upsert(quoteRecords, {
        onConflict: 'shipment_id,carrier_id,service_type_id',
        ignoreDuplicates: false,
      })

    if (error) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

/**
 * Determine contents category from description
 */
function getContentsCategory(description: string | null): string {
  if (!description) return 'default'
  
  const lowerDesc = description.toLowerCase()
  
  if (lowerDesc.includes('electronic') || lowerDesc.includes('computer') || lowerDesc.includes('device')) {
    return 'electronics'
  }
  if (lowerDesc.includes('fragile') || lowerDesc.includes('glass') || lowerDesc.includes('ceramic')) {
    return 'fragile'
  }
  if (lowerDesc.includes('hazmat') || lowerDesc.includes('hazardous') || lowerDesc.includes('chemical')) {
    return 'hazardous'
  }
  if (lowerDesc.includes('food') || lowerDesc.includes('perishable') || lowerDesc.includes('frozen')) {
    return 'perishable'
  }
  if (lowerDesc.includes('jewelry') || lowerDesc.includes('valuable') || lowerDesc.includes('expensive')) {
    return 'high_value'
  }
  if (lowerDesc.includes('document') || lowerDesc.includes('paper') || lowerDesc.includes('file')) {
    return 'documents'
  }
  
  return 'general'
}

// ============================================
// MOCK MODE HELPERS
// ============================================

const mockCarriers: Carrier[] = [
  { 
    id: 'mock-pex', 
    code: 'pex', 
    name: 'Parcel Express', 
    displayName: 'Parcel Express', 
    rateMultiplier: 0.85, 
    isActive: true,
    fuelSurchargeRange: { min: 0.12, max: 0.18 },
    carbonMultiplier: 1.0,
  },
  { 
    id: 'mock-vc', 
    code: 'vc', 
    name: 'Velocity Couriers', 
    displayName: 'Velocity Couriers', 
    rateMultiplier: 0.90, 
    isActive: true,
    fuelSurchargeRange: { min: 0.10, max: 0.16 },
    carbonMultiplier: 0.95,
  },
  { 
    id: 'mock-efl', 
    code: 'efl', 
    name: 'Express Freight Lines', 
    displayName: 'Express Freight Lines', 
    rateMultiplier: 0.95, 
    isActive: true,
    fuelSurchargeRange: { min: 0.14, max: 0.20 },
    carbonMultiplier: 1.1,
  },
]

const mockServiceTypes: ServiceType[] = [
  // Parcel Express
  { id: 'mock-pex-ground', carrierId: 'mock-pex', code: 'pex-ground', name: 'Ground Standard', category: 'ground', baseRate: 12.99, transitDaysMin: 3, transitDaysMax: 5, serviceMultiplier: 1.0, isActive: true },
  { id: 'mock-pex-air', carrierId: 'mock-pex', code: 'pex-air', name: 'Air Express', category: 'air', baseRate: 24.99, transitDaysMin: 1, transitDaysMax: 2, serviceMultiplier: 1.8, isActive: true },
  { id: 'mock-pex-overnight', carrierId: 'mock-pex', code: 'pex-overnight', name: 'Overnight Priority', category: 'express', baseRate: 45.99, transitDaysMin: 1, transitDaysMax: 1, serviceMultiplier: 2.5, isActive: true },
  { id: 'mock-pex-freight', carrierId: 'mock-pex', code: 'pex-freight', name: 'LTL Freight', category: 'freight', baseRate: 89.99, transitDaysMin: 2, transitDaysMax: 4, serviceMultiplier: 0.7, isActive: true },
  { id: 'mock-pex-intl', carrierId: 'mock-pex', code: 'pex-intl', name: 'International Standard', category: 'international', baseRate: 34.99, transitDaysMin: 5, transitDaysMax: 10, serviceMultiplier: 2.2, isActive: true },
  
  // Velocity Couriers
  { id: 'mock-vc-ground', carrierId: 'mock-vc', code: 'vc-ground', name: 'Economy Ground', category: 'ground', baseRate: 10.99, transitDaysMin: 4, transitDaysMax: 6, serviceMultiplier: 1.0, isActive: true },
  { id: 'mock-vc-expedited', carrierId: 'mock-vc', code: 'vc-expedited', name: 'Expedited', category: 'air', baseRate: 29.99, transitDaysMin: 2, transitDaysMax: 3, serviceMultiplier: 1.8, isActive: true },
  { id: 'mock-vc-same-day', carrierId: 'mock-vc', code: 'vc-same-day', name: 'Same Day', category: 'express', baseRate: 89.99, transitDaysMin: 1, transitDaysMax: 1, serviceMultiplier: 2.5, isActive: true },
  { id: 'mock-vc-freight', carrierId: 'mock-vc', code: 'vc-freight', name: 'Volume Freight', category: 'freight', baseRate: 79.99, transitDaysMin: 3, transitDaysMax: 5, serviceMultiplier: 0.7, isActive: true },
  { id: 'mock-vc-intl', carrierId: 'mock-vc', code: 'vc-intl', name: 'Global Priority', category: 'international', baseRate: 44.99, transitDaysMin: 3, transitDaysMax: 7, serviceMultiplier: 2.2, isActive: true },
  
  // Express Freight Lines
  { id: 'mock-efl-ground', carrierId: 'mock-efl', code: 'efl-ground', name: 'Direct Ground', category: 'ground', baseRate: 14.99, transitDaysMin: 2, transitDaysMax: 4, serviceMultiplier: 1.0, isActive: true },
  { id: 'mock-efl-premium', carrierId: 'mock-efl', code: 'efl-premium', name: 'Premium Air', category: 'air', baseRate: 32.99, transitDaysMin: 1, transitDaysMax: 2, serviceMultiplier: 1.8, isActive: true },
  { id: 'mock-efl-critical', carrierId: 'mock-efl', code: 'efl-critical', name: 'Critical Same Day', category: 'express', baseRate: 125.00, transitDaysMin: 1, transitDaysMax: 1, serviceMultiplier: 2.5, isActive: true },
  { id: 'mock-efl-freight', carrierId: 'mock-efl', code: 'efl-freight', name: 'Full Truckload', category: 'freight', baseRate: 299.99, transitDaysMin: 1, transitDaysMax: 3, serviceMultiplier: 0.7, isActive: true },
  { id: 'mock-efl-intl', carrierId: 'mock-efl', code: 'efl-intl', name: 'Worldwide Express', category: 'international', baseRate: 54.99, transitDaysMin: 2, transitDaysMax: 5, serviceMultiplier: 2.2, isActive: true },
]

// ============================================
// API HANDLER
// ============================================

/**
 * POST /api/quote
 * 
 * Generates shipping quotes for all active carriers × service types.
 * Calculates comprehensive pricing breakdown and persists to database.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as QuoteRequestBody
    const { shipmentId } = body

    // Validate shipment ID
    if (!shipmentId) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    // Fetch shipment details
    const shipment = await getShipmentDetails(shipmentId)

    // If no shipment found, use mock data
    if (!shipment) {
      
      // Parse mock shipment ID to extract details if available
      const mockOriginZip = '78701'
      const mockDestZip = '75201'
      const mockWeight = 5.5
      const mockLength = 12
      const mockWidth = 10
      const mockHeight = 8
      const mockDeclaredValue = 250

      const quotes: QuoteResult[] = []
      let serviceIndex = 0

      for (const carrier of mockCarriers) {
        const carrierServices = mockServiceTypes.filter(s => s.carrierId === carrier.id)
        
        for (const serviceType of carrierServices) {
          const quote = calculateQuote({
            shipmentId,
            originZip: mockOriginZip,
            destinationZip: mockDestZip,
            weight: mockWeight,
            length: mockLength,
            width: mockWidth,
            height: mockHeight,
            declaredValue: mockDeclaredValue,
            contentsCategory: 'general',
            specialHandling: [],
            deliveryPreferences: [],
            carrier,
            serviceType,
            serviceIndex,
          })
          
          quotes.push(quote)
          serviceIndex++
        }
      }

      const groupedQuotes = groupQuotesByCategory(quotes)

      return NextResponse.json({
        success: true,
        shipmentId,
        mode: 'mock',
        quotes,
        groupedByCategory: groupedQuotes,
        summary: {
          totalQuotes: quotes.length,
          carriers: mockCarriers.length,
          categories: Object.keys(groupedQuotes).filter(k => groupedQuotes[k].length > 0),
          priceRange: {
            min: Math.min(...quotes.map(q => q.pricing.total)),
            max: Math.max(...quotes.map(q => q.pricing.total)),
          },
        },
      }, { status: 200 })
    }

    // Extract ZIP codes from addresses
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originZip = (shipment as any).sender_addresses?.postal_code || '00000'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const destZip = (shipment as any).recipient_addresses?.postal_code || '00000'

    // Get special handling and delivery preferences
    const specialHandling = await getSpecialHandling(shipmentId)
    const deliveryPreferences = await getDeliveryPreferences(shipmentId)

    // Determine contents category
    const contentsCategory = getContentsCategory(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (shipment as any).contents_description
    )

    // Fetch active carriers
    const carriers = await getActiveCarriers()
    
    if (carriers.length === 0) {
      return NextResponse.json(
        { error: 'No active carriers available' },
        { status: 500 }
      )
    }

    // Fetch service types for carriers
    const carrierIds = carriers.map(c => c.id)
    const serviceTypes = await getActiveServiceTypes(carrierIds)

    if (serviceTypes.length === 0) {
      return NextResponse.json(
        { error: 'No active service types available' },
        { status: 500 }
      )
    }

    // Generate quotes for all carrier × service combinations
    const quotes: QuoteResult[] = []
    let serviceIndex = 0

    for (const carrier of carriers) {
      const carrierServices = serviceTypes.filter(s => s.carrierId === carrier.id)
      
      for (const serviceType of carrierServices) {
        const quote = calculateQuote({
          shipmentId,
          originZip,
          destinationZip: destZip,
          weight: shipment.weight,
          length: shipment.length,
          width: shipment.width,
          height: shipment.height,
          declaredValue: shipment.declared_value || 0,
          contentsCategory,
          specialHandling,
          deliveryPreferences,
          carrier,
          serviceType,
          serviceIndex,
        })
        
        quotes.push(quote)
        serviceIndex++
      }
    }

    // Persist quotes to database
    const persisted = await persistQuotes(shipmentId, quotes)
    
    if (!persisted) {
    }

    // Group quotes by category
    const groupedQuotes = groupQuotesByCategory(quotes)

    return NextResponse.json({
      success: true,
      shipmentId,
      mode: 'live',
      persisted,
      quotes,
      groupedByCategory: groupedQuotes,
      summary: {
        totalQuotes: quotes.length,
        carriers: carriers.length,
        categories: Object.keys(groupedQuotes).filter(k => groupedQuotes[k].length > 0),
        priceRange: {
          min: Math.min(...quotes.map(q => q.pricing.total)),
          max: Math.max(...quotes.map(q => q.pricing.total)),
        },
      },
    }, { status: 200 })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/quote
 * 
 * Retrieves existing quotes for a shipment
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const shipmentId = searchParams.get('shipmentId')

    if (!shipmentId) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    // Fetch existing quotes with carrier and service type details
    const { data: quotes, error } = await supabaseServer
      .from('quotes')
      .select(`
        id,
        carrier_id,
        service_type_id,
        base_rate,
        fuel_surcharge,
        total_cost,
        estimated_delivery,
        is_selected,
        created_at,
        carriers:carrier_id (code, name, display_name),
        service_types:service_type_id (code, name, category, transit_days_min, transit_days_max)
      `)
      .eq('shipment_id', shipmentId)
      .order('total_cost', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch quotes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      shipmentId,
      quotes: quotes || [],
      count: quotes?.length || 0,
    }, { status: 200 })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
