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

interface SubmitRequestBody {
  terms_accepted: boolean
  acknowledgments?: string[]
}

/**
 * POST /api/shipments/:id/submit
 * 
 * Submits a shipment for processing:
 * 1. Validates all required sections are complete
 * 2. Updates shipment status to 'pending_payment' or 'label_generated'
 * 3. Creates a tracking number
 * 4. Records the submission event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body: SubmitRequestBody = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    // Validate terms were accepted
    if (!body.terms_accepted) {
      return NextResponse.json(
        { error: 'Terms must be accepted before submitting', code: 'TERMS_NOT_ACCEPTED' },
        { status: 400 }
      )
    }

    // Fetch shipment with all related data for validation
    const { data: shipment, error: shipmentError } = await supabaseServer
      .from('shipments')
      .select(`
        id,
        status,
        sender_address_id,
        recipient_address_id,
        carrier_id,
        service_type_id,
        payment_id,
        selected_quote_id,
        weight,
        package_type
      `)
      .eq('id', id)
      .single()

    if (shipmentError || !shipment) {
      console.error('Error fetching shipment:', shipmentError)
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Validation checks
    const validationErrors: string[] = []

    // Check origin address
    if (!shipment.sender_address_id) {
      validationErrors.push('Origin address is required')
    }

    // Check destination address
    if (!shipment.recipient_address_id) {
      validationErrors.push('Destination address is required')
    }

    // Check package
    if (!shipment.weight || !shipment.package_type) {
      validationErrors.push('Package configuration is incomplete')
    }

    // Check rate selection
    if (!shipment.selected_quote_id && !shipment.carrier_id) {
      validationErrors.push('Shipping rate must be selected')
    }

    // Check payment method
    if (!shipment.payment_id) {
      validationErrors.push('Payment method must be selected')
    }

    // Check pickup details
    const { data: pickupDetails } = await supabaseServer
      .from('pickup_details')
      .select('id')
      .eq('shipment_id', id)
      .single()

    if (!pickupDetails) {
      validationErrors.push('Pickup must be scheduled')
    }

    // If validation errors exist, return them
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          code: 'VALIDATION_FAILED',
          details: validationErrors.map(message => ({ message }))
        },
        { status: 400 }
      )
    }

    // Generate tracking number
    const trackingNumber = `TRK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

    // Determine new status based on payment status
    const { data: payment } = await supabaseServer
      .from('payments')
      .select('status')
      .eq('id', shipment.payment_id)
      .single()

    // If payment is already processed, go straight to label_generated
    // Otherwise, set to pending_payment
    const newStatus = payment?.status === 'succeeded' ? 'label_generated' : 'pending_payment'

    // Update shipment with submission data
    const { data: updatedShipment, error: updateError } = await supabaseServer
      .from('shipments')
      .update({
        status: newStatus,
        tracking_number: trackingNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating shipment:', updateError)
      return NextResponse.json(
        { error: 'Failed to submit shipment', code: 'UPDATE_FAILED' },
        { status: 500 }
      )
    }

    // Create shipment event for submission
    await supabaseServer
      .from('shipment_events')
      .insert({
        shipment_id: id,
        event_type: 'submission',
        event_description: 'Shipment submitted for processing',
        metadata: {
          terms_accepted: body.terms_accepted,
          acknowledgments: body.acknowledgments || [],
        },
      })

    // Create shipment event for status change
    await supabaseServer
      .from('shipment_events')
      .insert({
        shipment_id: id,
        event_type: 'status_change',
        event_description: `Status changed to ${newStatus}`,
        metadata: {
          previous_status: shipment.status,
          new_status: newStatus,
        },
      })

    return NextResponse.json({
      success: true,
      shipmentId: id,
      trackingNumber,
      status: newStatus,
      message: 'Shipment submitted successfully',
    })

  } catch (error) {
    console.error('Error in POST /api/shipments/[id]/submit:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
