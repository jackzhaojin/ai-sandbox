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

// Required terms acknowledgments
const REQUIRED_ACKNOWLEDGMENTS = [
  'declared_value_accurate',
  'insurance_understood',
  'contents_compliant',
  'carrier_authorized',
  'terms_accepted'
]

interface SubmitRequestBody {
  terms_accepted: boolean
  acknowledgments?: string[]
}

interface ShipmentWithRelations {
  id: string
  status: string
  sender_address_id: string
  recipient_address_id: string
  carrier_id: string | null
  service_type_id: string | null
  payment_id: string | null
  selected_quote_id: string | null
  weight: number
  package_type: string
  total_cost: number
  currency: string
  estimated_delivery: string | null
}

interface QuoteData {
  id: string
  expires_at: string
  carrier_id: string
  service_type_id: string
  total_cost: number
  estimated_delivery: string
}

interface PaymentData {
  id: string
  status: string
  payment_info_id: string | null
}

interface PaymentInfoData {
  id: string
  type: string
}

interface PurchaseOrderData {
  id: string
  payment_info_id: string
  po_number: string
  expires_at: string | null
}

interface CarrierData {
  id: string
  display_name: string
  tracking_url_template: string | null
}

interface ServiceTypeData {
  id: string
  name: string
  transit_days_min: number
  transit_days_max: number
}

interface PickupDetailsData {
  id: string
  pickup_slot_id: string
}

/**
 * Generate confirmation number in format SHP-YYYY-XXXXXX
 * YYYY = current year, XXXXXX = zero-padded 6-digit sequential/random number
 */
function generateConfirmationNumber(): string {
  const year = new Date().getFullYear()
  const randomDigits = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0')
  return `SHK-${year}-${randomDigits}`
}

/**
 * Calculate estimated tracking available at (submitted_at + 2-4 hours)
 */
function calculateTrackingAvailableAt(submittedAt: Date): Date {
  // Random between 2-4 hours (in milliseconds)
  const hoursToAdd = 2 + Math.random() * 2
  return new Date(submittedAt.getTime() + hoursToAdd * 60 * 60 * 1000)
}

/**
 * Validate all required terms are accepted
 */
function validateTerms(acknowledgments: string[] | undefined): { valid: boolean; missing: string[] } {
  if (!acknowledgments || !Array.isArray(acknowledgments)) {
    return { valid: false, missing: REQUIRED_ACKNOWLEDGMENTS }
  }
  
  const missing = REQUIRED_ACKNOWLEDGMENTS.filter(
    term => !acknowledgments.includes(term)
  )
  
  return { valid: missing.length === 0, missing }
}

/**
 * POST /api/shipments/:id/submit
 * 
 * Submits a shipment for processing:
 * 1. Validates all terms are accepted (4-5 required)
 * 2. Fetches shipment with all relations to verify completeness
 * 3. Validates quote not expired (expires_at > now)
 * 4. Validates PO not expired if payment method is PO
 * 5. Generates confirmation number in format SHP-YYYY-XXXXXX
 * 6. Updates shipments table: confirmation_number, status='confirmed', submitted_at=now()
 * 7. Creates 'submitted' event in shipment_events with full shipment snapshot
 * 8. Calculates estimated tracking_available_at (submitted_at + 2-4 hours)
 * 9. Returns response with confirmation_number, tracking_number, tracking_available_at, 
 *     estimated_delivery, status, carrier info with tracking_url_template, total_cost
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

    // Validate all required acknowledgments
    const termsValidation = validateTerms(body.acknowledgments)
    if (!termsValidation.valid) {
      return NextResponse.json(
        { 
          error: 'All required terms must be acknowledged', 
          code: 'VALIDATION_FAILED',
          details: termsValidation.missing.map(term => ({ 
            field: 'acknowledgments',
            message: `Missing required acknowledgment: ${term}` 
          }))
        },
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
        package_type,
        total_cost,
        currency,
        estimated_delivery
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
    if (!shipment.selected_quote_id) {
      validationErrors.push('Shipping rate must be selected')
    }

    // Check payment method
    if (!shipment.payment_id) {
      validationErrors.push('Payment method must be selected')
    }

    // Check pickup details
    const { data: pickupDetails, error: pickupError } = await supabaseServer
      .from('pickup_details')
      .select('id, pickup_slot_id')
      .eq('shipment_id', id)
      .single()

    if (pickupError || !pickupDetails) {
      validationErrors.push('Pickup must be scheduled')
    }

    // If validation errors exist, return them
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Shipment is incomplete', 
          code: 'INCOMPLETE_SHIPMENT',
          details: validationErrors.map(message => ({ message }))
        },
        { status: 400 }
      )
    }

    // Validate quote not expired
    let selectedQuote: QuoteData | null = null
    if (shipment.selected_quote_id) {
      const { data: quote, error: quoteError } = await supabaseServer
        .from('quotes')
        .select('id, expires_at, carrier_id, service_type_id, total_cost, estimated_delivery')
        .eq('id', shipment.selected_quote_id)
        .single()

      if (quoteError || !quote) {
        return NextResponse.json(
          { error: 'Selected quote not found', code: 'QUOTE_NOT_FOUND' },
          { status: 400 }
        )
      }

      selectedQuote = quote

      // Check if quote is expired
      if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
        return NextResponse.json(
          { 
            error: 'Selected quote has expired. Please select a new rate.', 
            code: 'QUOTE_EXPIRED',
            expired_at: quote.expires_at
          },
          { status: 400 }
        )
      }
    }

    // Validate PO not expired if payment method is PO
    if (shipment.payment_id) {
      const { data: payment, error: paymentError } = await supabaseServer
        .from('payments')
        .select('id, status, payment_info_id')
        .eq('id', shipment.payment_id)
        .single()

      if (paymentError || !payment) {
        return NextResponse.json(
          { error: 'Payment information not found', code: 'PAYMENT_NOT_FOUND' },
          { status: 400 }
        )
      }

      // Check if payment method is PO
      if (payment.payment_info_id) {
        const { data: paymentInfo, error: paymentInfoError } = await supabaseServer
          .from('payment_info')
          .select('id, type')
          .eq('id', payment.payment_info_id)
          .single()

        if (!paymentInfoError && paymentInfo && paymentInfo.type === 'purchase_order') {
          const { data: poData, error: poError } = await supabaseServer
            .from('payment_purchase_orders')
            .select('id, payment_info_id, po_number, expires_at')
            .eq('payment_info_id', payment.payment_info_id)
            .single()

          if (!poError && poData && poData.expires_at) {
            if (new Date(poData.expires_at) < new Date()) {
              return NextResponse.json(
                { 
                  error: 'Purchase Order has expired. Please update payment method.', 
                  code: 'PO_EXPIRED',
                  po_number: poData.po_number,
                  expired_at: poData.expires_at
                },
                { status: 400 }
              )
            }
          }
        }
      }
    }

    // Generate confirmation number
    const confirmationNumber = generateConfirmationNumber()
    const submittedAt = new Date()
    const trackingAvailableAt = calculateTrackingAvailableAt(submittedAt)

    // Fetch carrier and service type info for response
    let carrier: CarrierData | null = null
    let serviceType: ServiceTypeData | null = null

    if (shipment.carrier_id) {
      const { data: carrierData } = await supabaseServer
        .from('carriers')
        .select('id, display_name, tracking_url_template')
        .eq('id', shipment.carrier_id)
        .single()
      carrier = carrierData
    }

    if (shipment.service_type_id) {
      const { data: serviceTypeData } = await supabaseServer
        .from('service_types')
        .select('id, name, transit_days_min, transit_days_max')
        .eq('id', shipment.service_type_id)
        .single()
      serviceType = serviceTypeData
    }

    // Create full shipment snapshot for event payload
    const shipmentSnapshot = {
      id: shipment.id,
      status: 'confirmed',
      origin_address_id: shipment.sender_address_id,
      destination_address_id: shipment.recipient_address_id,
      carrier_id: shipment.carrier_id,
      service_type_id: shipment.service_type_id,
      selected_quote_id: shipment.selected_quote_id,
      payment_id: shipment.payment_id,
      package_type: shipment.package_type,
      weight: shipment.weight,
      total_cost: shipment.total_cost,
      currency: shipment.currency,
      confirmation_number: confirmationNumber,
      submitted_at: submittedAt.toISOString(),
      pickup_details_id: pickupDetails?.id,
      terms_accepted: body.terms_accepted,
      acknowledgments: body.acknowledgments || [],
      carrier: carrier ? {
        id: carrier.id,
        display_name: carrier.display_name,
        tracking_url_template: carrier.tracking_url_template
      } : null,
      service_type: serviceType ? {
        id: serviceType.id,
        name: serviceType.name,
        transit_days_min: serviceType.transit_days_min,
        transit_days_max: serviceType.transit_days_max
      } : null
    }

    // Update shipment with submission data
    const { data: updatedShipment, error: updateError } = await supabaseServer
      .from('shipments')
      .update({
        confirmation_number: confirmationNumber,
        status: 'confirmed',
        submitted_at: submittedAt.toISOString(),
        updated_at: submittedAt.toISOString(),
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

    // Create shipment event for submission with full snapshot
    const { error: eventError } = await supabaseServer
      .from('shipment_events')
      .insert({
        shipment_id: id,
        event_type: 'submitted',
        event_description: 'Shipment submitted and confirmed',
        metadata: {
          confirmation_number: confirmationNumber,
          terms_accepted: body.terms_accepted,
          acknowledgments: body.acknowledgments || [],
          previous_status: shipment.status,
          new_status: 'confirmed',
          submitted_at: submittedAt.toISOString(),
          tracking_available_at: trackingAvailableAt.toISOString(),
          shipment_snapshot: shipmentSnapshot
        },
      })

    if (eventError) {
      console.error('Error creating shipment event:', eventError)
      // Don't fail the submission if event logging fails
    }

    // Calculate estimated delivery from selected quote or service type
    let estimatedDelivery: string | null = null
    if (selectedQuote?.estimated_delivery) {
      estimatedDelivery = selectedQuote.estimated_delivery
    } else if (serviceType) {
      // Calculate based on transit days
      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + serviceType.transit_days_max)
      estimatedDelivery = deliveryDate.toISOString()
    }

    // Return success response
    return NextResponse.json({
      success: true,
      shipmentId: id,
      confirmation_number: confirmationNumber,
      tracking_number: null,
      tracking_available_at: trackingAvailableAt.toISOString(),
      estimated_delivery: estimatedDelivery,
      status: 'confirmed',
      carrier: carrier ? {
        id: carrier.id,
        name: carrier.display_name,
        tracking_url_template: carrier.tracking_url_template || 'https://track.carrier.com/?tracking={tracking_number}'
      } : null,
      service_type: serviceType ? {
        id: serviceType.id,
        name: serviceType.name,
        transit_days_min: serviceType.transit_days_min,
        transit_days_max: serviceType.transit_days_max
      } : null,
      total_cost: shipment.total_cost,
      currency: shipment.currency || 'USD',
      submitted_at: submittedAt.toISOString(),
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
