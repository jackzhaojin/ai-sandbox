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

interface ShipmentResponse {
  id: string
  origin: {
    city: string
    state: string
    line1?: string
    line2?: string
    postal?: string
    country?: string
    locationType?: string
  }
  destination: {
    city: string
    state: string
    line1?: string
    line2?: string
    postal?: string
    country?: string
  }
  package: {
    weight: number
    weightUnit: string
    length?: number
    width?: number
    height?: number
  }
  selectedRate?: {
    carrierName: string
    serviceName: string
    total: number
    currency: string
  }
  currentStep?: number
  status?: string
}

/**
 * GET /api/shipments/:id
 * 
 * Fetches shipment details including:
 * - Origin and destination addresses
 * - Package configuration
 * - Selected rate (if quote has been selected)
 * - Current step and status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    // Fetch shipment with related data
    const { data: shipment, error: shipmentError } = await supabaseServer
      .from('shipments')
      .select(`
        id,
        status,
        weight,
        length,
        width,
        height,
        total_cost,
        currency,
        sender_address_id,
        recipient_address_id,
        carrier_id,
        service_type_id,
        selected_quote_id
      `)
      .eq('id', id)
      .single()

    if (shipmentError) {
      console.error('Error fetching shipment:', shipmentError)
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Fetch sender address
    const { data: senderAddress, error: senderError } = await supabaseServer
      .from('addresses')
      .select('line1, line2, city, state, postal_code, country, address_type')
      .eq('id', shipment.sender_address_id)
      .single()

    // Fetch recipient address
    const { data: recipientAddress, error: recipientError } = await supabaseServer
      .from('addresses')
      .select('line1, line2, city, state, postal_code, country')
      .eq('id', shipment.recipient_address_id)
      .single()

    // Fetch selected quote details if available
    let selectedRate: ShipmentResponse['selectedRate'] | undefined
    
    if (shipment.selected_quote_id) {
      const { data: quote } = await supabaseServer
        .from('quotes')
        .select(`
          total_cost,
          currency,
          carrier_id,
          service_type_id
        `)
        .eq('id', shipment.selected_quote_id)
        .single()

      if (quote) {
        // Fetch carrier and service type names
        const { data: carrier } = await supabaseServer
          .from('carriers')
          .select('display_name')
          .eq('id', quote.carrier_id)
          .single()

        const { data: serviceType } = await supabaseServer
          .from('service_types')
          .select('name')
          .eq('id', quote.service_type_id)
          .single()

        selectedRate = {
          carrierName: carrier?.display_name || 'Unknown Carrier',
          serviceName: serviceType?.name || 'Unknown Service',
          total: parseFloat(quote.total_cost) || 0,
          currency: quote.currency || 'USD',
        }
      }
    }

    // If no quote is selected but carrier/service is set on shipment
    if (!selectedRate && shipment.carrier_id && shipment.service_type_id) {
      const { data: carrier } = await supabaseServer
        .from('carriers')
        .select('display_name')
        .eq('id', shipment.carrier_id)
        .single()

      const { data: serviceType } = await supabaseServer
        .from('service_types')
        .select('name')
        .eq('id', shipment.service_type_id)
        .single()

      selectedRate = {
        carrierName: carrier?.display_name || 'Unknown Carrier',
        serviceName: serviceType?.name || 'Unknown Service',
        total: parseFloat(shipment.total_cost) || 0,
        currency: shipment.currency || 'USD',
      }
    }

    const response: ShipmentResponse = {
      id: shipment.id,
      origin: {
        city: senderAddress?.city || 'Unknown',
        state: senderAddress?.state || 'XX',
        line1: senderAddress?.line1,
        line2: senderAddress?.line2,
        postal: senderAddress?.postal_code,
        country: senderAddress?.country,
        locationType: senderAddress?.address_type,
      },
      destination: {
        city: recipientAddress?.city || 'Unknown',
        state: recipientAddress?.state || 'XX',
        line1: recipientAddress?.line1,
        line2: recipientAddress?.line2,
        postal: recipientAddress?.postal_code,
        country: recipientAddress?.country,
      },
      package: {
        weight: parseFloat(shipment.weight) || 0,
        weightUnit: 'lbs',
        length: parseFloat(shipment.length) || 0,
        width: parseFloat(shipment.width) || 0,
        height: parseFloat(shipment.height) || 0,
      },
      selectedRate,
      currentStep: 1, // Default to step 1 if column doesn't exist
      status: shipment.status,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/shipments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
