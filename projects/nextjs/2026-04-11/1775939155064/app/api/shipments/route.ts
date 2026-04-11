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

interface ShipmentCreateInput {
  origin: AddressInput
  destination: AddressInput
  status?: string
}

// Try to find or use an existing organization
async function getOrganizationId(): Promise<string | null> {
  // First try to find an existing organization
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

  // If no organizations exist, return null (we'll use mock mode)
  return null
}

// Try to find or use an existing user
async function getUserId(): Promise<string | null> {
  // First try to find an existing user
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

  // If no users exist, return null (we'll use mock mode)
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

// Mock shipment storage for demo mode (when DB doesn't have required data)
const mockShipments: Map<string, unknown> = new Map()

/**
 * POST /api/shipments
 * 
 * Creates a new shipment with origin and destination addresses.
 * Stores the data in Supabase postal_v2 schema if possible, otherwise uses mock mode.
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

    const { origin, destination, status = 'draft' } = body

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

    // Try to get organization and user IDs
    const orgId = await getOrganizationId()
    const userId = await getUserId()

    // If no organization exists, use mock mode
    if (!orgId || !userId) {
      console.log('Using mock mode - no organization or user found in database')
      
      // Generate a mock shipment ID
      const mockId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const trackingNumber = `TRK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000000 + Math.random() * 9000000)}`
      
      const mockShipment = {
        id: mockId,
        trackingNumber,
        status: status === 'draft' ? 'draft' : 'pending_payment',
        createdAt: new Date().toISOString(),
        origin,
        destination,
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

    // Generate a tracking number (format: TRK-YYYYMMDD-XXXXXXX)
    const now = new Date()
    const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randomSuffix = Math.floor(1000000 + Math.random() * 9000000)
    const trackingNumber = `TRK-${datePrefix}-${randomSuffix}`

    // Insert shipment into database
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
        package_type: 'box',
        weight: 0,
        length: 0,
        width: 0,
        height: 0,
        contents_description: '',
        status: status === 'draft' ? 'draft' : 'pending_payment',
        tracking_number: trackingNumber,
        currency: 'USD',
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

    return NextResponse.json(
      {
        id: shipment.id,
        trackingNumber: shipment.tracking_number,
        status: shipment.status,
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
      // Return mock shipments if no organization exists
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
