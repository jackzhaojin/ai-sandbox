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

interface QuoteSelectRequest {
  shipment_id: string
  quote_id: string
}

/**
 * POST /api/quote/select
 * 
 * Selects a quote for a shipment:
 * 1. Clears any previously selected quote
 * 2. Sets is_selected=true for the selected quote
 * 3. Updates shipment status to 'payment' and current_step to 3
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as QuoteSelectRequest
    const { shipment_id, quote_id } = body

    // Validate required fields
    if (!shipment_id) {
      return NextResponse.json(
        { error: 'shipment_id is required' },
        { status: 400 }
      )
    }

    if (!quote_id) {
      return NextResponse.json(
        { error: 'quote_id is required' },
        { status: 400 }
      )
    }

    // First, verify the shipment exists
    const { data: shipment, error: shipmentError } = await supabaseServer
      .from('shipments')
      .select('id, status')
      .eq('id', shipment_id)
      .single()

    if (shipmentError || !shipment) {
      console.error('Shipment not found:', shipmentError)
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Verify the quote exists and belongs to this shipment
    const { data: quote, error: quoteError } = await supabaseServer
      .from('quotes')
      .select('id, carrier_id, service_type_id, total_cost, estimated_delivery')
      .eq('id', quote_id)
      .eq('shipment_id', shipment_id)
      .single()

    if (quoteError || !quote) {
      console.error('Quote not found:', quoteError)
      return NextResponse.json(
        { error: 'Quote not found for this shipment' },
        { status: 404 }
      )
    }

    // Step 1: Clear any previously selected quotes for this shipment
    const { error: clearError } = await supabaseServer
      .from('quotes')
      .update({ is_selected: false })
      .eq('shipment_id', shipment_id)

    if (clearError) {
      console.error('Error clearing previous selections:', clearError)
      return NextResponse.json(
        { error: 'Failed to clear previous quote selections' },
        { status: 500 }
      )
    }

    // Step 2: Set the selected quote as is_selected=true
    const { error: selectError } = await supabaseServer
      .from('quotes')
      .update({ is_selected: true })
      .eq('id', quote_id)

    if (selectError) {
      console.error('Error selecting quote:', selectError)
      return NextResponse.json(
        { error: 'Failed to select quote' },
        { status: 500 }
      )
    }

    // Step 3: Update shipment status to 'payment' and current_step to 3
    const { error: updateError } = await supabaseServer
      .from('shipments')
      .update({
        status: 'payment',
        current_step: 3,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipment_id)

    if (updateError) {
      console.error('Error updating shipment status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update shipment status' },
        { status: 500 }
      )
    }

    // Step 4: Create shipment event for quote selection
    const { error: eventError } = await supabaseServer
      .from('shipment_events')
      .insert({
        shipment_id: shipment_id,
        event_type: 'quote_selected',
        event_description: `Quote selected: Carrier ${quote.carrier_id}, Service ${quote.service_type_id}`,
        metadata: {
          quote_id: quote_id,
          carrier_id: quote.carrier_id,
          service_type_id: quote.service_type_id,
          total_cost: quote.total_cost,
          estimated_delivery: quote.estimated_delivery,
        },
      })

    if (eventError) {
      console.error('Error creating shipment event:', eventError)
      // Non-fatal error, continue
    }

    return NextResponse.json({
      success: true,
      shipment_id,
      quote_id,
      message: 'Quote selected successfully',
      next_step: 3,
      next_status: 'payment',
    }, { status: 200 })

  } catch (error) {
    console.error('Error processing quote selection:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
