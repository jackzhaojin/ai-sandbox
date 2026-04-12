import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

interface AddressInput {
  name: string
  company?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  locationType: string
  phone: string
  extension?: string
  email: string
}

interface PackageInput {
  type: string
  length: number
  width: number
  height: number
  dimensionUnit: 'in' | 'cm'
  weight: number
  weightUnit: 'lbs' | 'kg'
  declaredValue: number
  currency: 'USD' | 'CAD' | 'MXN'
  contentsDescription: string
}

interface ShipmentCreateInput {
  origin: AddressInput
  destination: AddressInput
  package: PackageInput
  specialHandling?: string[]
  specialHandlingFee?: number
  deliveryPreferences?: string[]
  deliveryFee?: number
  hazmatDetails?: {
    unNumber: string
    properShippingName: string
    hazardClass: string
    packingGroup: string
    quantity: number
    unit: string
    emergencyContactName: string
    emergencyContactPhone: string
  }
  multiPiece?: {
    pieces: Array<{
      id: string
      type: string
      description?: string
      length: number
      width: number
      height: number
      weight: number
    }>
  }
  status?: 'draft' | 'pricing'
  saveAsDraft?: boolean
}

// Try to find or use an existing organization
async function getOrganizationId(): Promise<string | null> {
  const { data: orgs, error } = await supabaseServer
    .from('organizations')
    .select('id')
    .limit(1)

  if (error) {
    console.error('Error fetching organizations:', error)
    return null
  }

  if (orgs && orgs.length > 0) {
    return orgs[0].id
  }

  return null
}

// Try to find or use an existing user
async function getUserId(): Promise<string | null> {
  const { data: users, error } = await supabaseServer
    .from('users')
    .select('id')
    .limit(1)

  if (error) {
    console.error('Error fetching users:', error)
    return null
  }

  if (users && users.length > 0) {
    return users[0].id
  }

  return null
}

/**
 * Creates an address record in the database
 */
async function createAddress(
  addressData: AddressInput,
  label: string,
  organizationId: string
): Promise<string | null> {
  const { data, error } = await supabaseServer
    .from('addresses')
    .insert({
      organization_id: organizationId,
      label: label,
      recipient_name: addressData.name,
      recipient_phone: addressData.phone,
      line1: addressData.line1,
      line2: addressData.line2 || null,
      city: addressData.city,
      state: addressData.state,
      postal_code: addressData.postalCode,
      country: addressData.country,
      address_type: addressData.locationType === 'commercial' ? 'commercial' : 'residential',
      is_verified: false,
      is_default_shipping: false,
      is_default_billing: false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating address:', error)
    return null
  }

  return data.id
}

/**
 * Maps frontend special handling option to database handling_type enum
 */
function mapSpecialHandlingOption(option: string): string | null {
  const mapping: Record<string, string> = {
    'fragile': 'fragile',
    'this-side-up': 'fragile',
    'temperature-controlled': 'temperature_controlled',
    'hazmat': 'hazardous',
    'white-glove': 'appointment_delivery',
    'inside-delivery': 'appointment_delivery',
    'liftgate-pickup': 'hold_for_pickup',
    'liftgate-delivery': 'hold_for_pickup',
  }
  return mapping[option] || null
}

/**
 * Maps frontend delivery preference to handling_type or preference fields
 */
function mapDeliveryPreference(option: string): { handlingType?: string; preferenceField?: string } {
  const mapping: Record<string, { handlingType?: string; preferenceField?: string }> = {
    'signature': { handlingType: 'signature_required' },
    'adult-signature': { handlingType: 'adult_signature' },
    'sms-confirmation': { preferenceField: 'sms_confirmation' },
    'photo-proof': { preferenceField: 'photo_proof' },
    'saturday-delivery': { preferenceField: 'saturday_delivery' },
    'hold-at-location': { handlingType: 'hold_for_pickup' },
  }
  return mapping[option] || {}
}

// Mock shipment storage for demo mode (when DB doesn't have required data)
const mockShipments: Map<string, unknown> = new Map()

/**
 * POST /api/shipments
 * 
 * Creates a new shipment with all Step 1 data:
 * - Origin and destination addresses
 * - Package configuration  
 * - Special handling options
 * - Delivery preferences
 * - Hazmat details (if applicable)
 * - Multi-piece configuration (if applicable)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as ShipmentCreateInput

    // Validate required fields
    if (!body.origin || !body.destination) {
      return NextResponse.json(
        { error: 'Origin and destination addresses are required' },
        { status: 400 }
      )
    }

    if (!body.package) {
      return NextResponse.json(
        { error: 'Package configuration is required' },
        { status: 400 }
      )
    }

    const { origin, destination, package: packageData, saveAsDraft } = body
    const isDraft = saveAsDraft === true

    // Validate origin address
    if (!origin.line1 || !origin.city || !origin.state || !origin.postalCode || !origin.country) {
      return NextResponse.json(
        { error: 'Origin address is incomplete' },
        { status: 400 }
      )
    }

    // Validate destination address
    if (!destination.line1 || !destination.city || !destination.state || !destination.postalCode || !destination.country) {
      return NextResponse.json(
        { error: 'Destination address is incomplete' },
        { status: 400 }
      )
    }

    // Validate package data
    if (!packageData.type || packageData.weight <= 0 || packageData.length <= 0) {
      return NextResponse.json(
        { error: 'Package configuration is incomplete' },
        { status: 400 }
      )
    }

    // Try to get organization and user IDs
    const orgId = await getOrganizationId()
    const userId = await getUserId()

    // If no organization exists, use mock mode
    if (!orgId || !userId) {
      console.log('Using mock mode - no organization or user found in database')
      
      const mockId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const trackingNumber = `TRK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000000 + Math.random() * 9000000)}`
      
      const mockShipment = {
        id: mockId,
        trackingNumber,
        status: isDraft ? 'draft' : 'pending_payment',
        currentStep: isDraft ? 1 : 2,
        createdAt: new Date().toISOString(),
        origin,
        destination,
        package: packageData,
        specialHandling: body.specialHandling || [],
        deliveryPreferences: body.deliveryPreferences || [],
        mode: 'mock',
      }
      
      mockShipments.set(mockId, mockShipment)
      
      return NextResponse.json(mockShipment, {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create address records for origin and destination
    const originAddressId = await createAddress(origin, 'Origin Address', orgId)
    if (!originAddressId) {
      return NextResponse.json(
        { error: 'Failed to create origin address' },
        { status: 500 }
      )
    }

    const destAddressId = await createAddress(destination, 'Destination Address', orgId)
    if (!destAddressId) {
      return NextResponse.json(
        { error: 'Failed to create destination address' },
        { status: 500 }
      )
    }

    // Generate tracking number
    const now = new Date()
    const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randomSuffix = Math.floor(1000000 + Math.random() * 9000000)
    const trackingNumber = `TRK-${datePrefix}-${randomSuffix}`

    // Map package type to enum
    const packageTypeMap: Record<string, string> = {
      'envelope': 'envelope',
      'small-box': 'box',
      'medium-box': 'box',
      'large-box': 'box',
      'extra-large': 'box',
      'pallet': 'pallet',
      'custom': 'box',
    }

    // Convert dimensions to inches if needed
    let lengthIn = packageData.length
    let widthIn = packageData.width
    let heightIn = packageData.height
    if (packageData.dimensionUnit === 'cm') {
      lengthIn = packageData.length / 2.54
      widthIn = packageData.width / 2.54
      heightIn = packageData.height / 2.54
    }

    // Convert weight to lbs if needed
    let weightLbs = packageData.weight
    if (packageData.weightUnit === 'kg') {
      weightLbs = packageData.weight * 2.20462
    }

    // Insert shipment into database
    const shipmentStatus = isDraft ? 'draft' : 'pending_payment'
    const { data: shipment, error: insertError } = await supabaseServer
      .from('shipments')
      .insert({
        organization_id: orgId,
        user_id: userId,
        sender_address_id: originAddressId,
        sender_contact_name: origin.name,
        sender_contact_phone: origin.phone,
        sender_contact_email: origin.email,
        recipient_address_id: destAddressId,
        recipient_contact_name: destination.name,
        recipient_contact_phone: destination.phone,
        recipient_contact_email: destination.email,
        package_type: packageTypeMap[packageData.type] || 'box',
        weight: weightLbs,
        length: lengthIn,
        width: widthIn,
        height: heightIn,
        declared_value: packageData.declaredValue,
        contents_description: packageData.contentsDescription,
        status: shipmentStatus,
        tracking_number: trackingNumber,
        currency: packageData.currency,
      })
      .select('id, tracking_number, status, created_at')
      .single()

    if (insertError) {
      console.error('Error creating shipment:', insertError)
      return NextResponse.json(
        { error: 'Failed to create shipment', details: insertError.message },
        { status: 500 }
      )
    }

    // Save special handling options
    if (body.specialHandling && body.specialHandling.length > 0) {
      const specialHandlingRecords = body.specialHandling
        .map(option => {
          const handlingType = mapSpecialHandlingOption(option)
          if (!handlingType) return null
          return {
            shipment_id: shipment.id,
            handling_type: handlingType,
            fee: body.specialHandlingFee && body.specialHandling.length > 0 
              ? (body.specialHandlingFee / body.specialHandling.length) 
              : 0,
            instructions: `Selected: ${option}`,
          }
        })
        .filter((record): record is NonNullable<typeof record> => record !== null)

      if (specialHandlingRecords.length > 0) {
        const { error: specialHandlingError } = await supabaseServer
          .from('shipment_special_handling')
          .insert(specialHandlingRecords)

        if (specialHandlingError) {
          console.error('Error saving special handling:', specialHandlingError)
        }
      }
    }

    // Save delivery preferences
    if (body.deliveryPreferences && body.deliveryPreferences.length > 0) {
      const deliveryPrefs: {
        shipment_id: string
        require_signature?: boolean
        delivery_instructions?: string
      } = {
        shipment_id: shipment.id,
        delivery_instructions: `Selected preferences: ${body.deliveryPreferences.join(', ')}`,
      }

      // Check for signature requirements
      if (body.deliveryPreferences.includes('signature') || body.deliveryPreferences.includes('adult-signature')) {
        deliveryPrefs.require_signature = true
      }

      const { error: deliveryPrefsError } = await supabaseServer
        .from('shipment_delivery_preferences')
        .insert(deliveryPrefs)

      if (deliveryPrefsError) {
        console.error('Error saving delivery preferences:', deliveryPrefsError)
      }
    }

    // Save hazmat details if applicable
    if (body.hazmatDetails && body.specialHandling?.includes('hazmat')) {
      const { error: hazmatError } = await supabaseServer
        .from('hazmat_details')
        .insert({
          shipment_id: shipment.id,
          un_number: body.hazmatDetails.unNumber,
          proper_shipping_name: body.hazmatDetails.properShippingName,
          hazard_class: body.hazmatDetails.hazardClass,
          packing_group: body.hazmatDetails.packingGroup,
          emergency_contact_phone: body.hazmatDetails.emergencyContactPhone,
        })

      if (hazmatError) {
        console.error('Error saving hazmat details:', hazmatError)
      }
    }

    // Save multi-piece configuration if applicable
    if (body.multiPiece && body.multiPiece.pieces.length > 0) {
      const packageRecords = body.multiPiece.pieces.map((piece, index) => ({
        shipment_id: shipment.id,
        package_index: index + 1,
        package_type: piece.type === 'box' ? 'box' : piece.type === 'envelope' ? 'envelope' : piece.type === 'pallet' ? 'pallet' : 'tube',
        weight: piece.weight,
        length: piece.length,
        width: piece.width,
        height: piece.height,
        contents_description: piece.description || '',
      }))

      const { error: packagesError } = await supabaseServer
        .from('shipment_packages')
        .insert(packageRecords)

      if (packagesError) {
        console.error('Error saving shipment packages:', packagesError)
      }
    }

    // Create shipment event for step completion (unless draft)
    if (!isDraft) {
      const { error: eventError } = await supabaseServer
        .from('shipment_events')
        .insert({
          shipment_id: shipment.id,
          event_type: 'step_completed',
          event_description: 'Step 1 completed: Shipment details entered',
          metadata: {
            step: 1,
            step_name: 'shipment_details',
            origin_country: origin.country,
            destination_country: destination.country,
            package_type: packageData.type,
          },
        })

      if (eventError) {
        console.error('Error creating shipment event:', eventError)
      }
    } else {
      // Create draft saved event
      const { error: eventError } = await supabaseServer
        .from('shipment_events')
        .insert({
          shipment_id: shipment.id,
          event_type: 'draft_saved',
          event_description: 'Shipment saved as draft',
          metadata: {
            step: 1,
            step_name: 'shipment_details',
          },
        })

      if (eventError) {
        console.error('Error creating draft event:', eventError)
      }
    }

    return NextResponse.json(
      {
        id: shipment.id,
        trackingNumber: shipment.tracking_number,
        status: shipment.status,
        currentStep: isDraft ? 1 : 2,
        createdAt: shipment.created_at,
      },
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  } catch (error) {
    console.error('Error processing shipment creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/shipments
 * 
 * Retrieves a list of shipments (paginated).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const orgId = await getOrganizationId()
    
    if (!orgId) {
      const mockList = Array.from(mockShipments.values()).slice(offset, offset + limit)
      return NextResponse.json(
        {
          shipments: mockList,
          pagination: {
            limit,
            offset,
            total: mockShipments.size,
          }
        },
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const { data: shipments, error, count } = await supabaseServer
      .from('shipments')
      .select('id, tracking_number, status, created_at, sender_address_id, recipient_address_id', { count: 'exact' })
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching shipments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch shipments' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        shipments,
        pagination: {
          limit,
          offset,
          total: count || 0,
        }
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  } catch (error) {
    console.error('Error processing shipments request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
