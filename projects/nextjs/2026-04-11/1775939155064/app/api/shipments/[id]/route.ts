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

// Valid shipment statuses
const SHIPMENT_STATUSES = [
  'draft',
  'pending_payment',
  'paid',
  'label_generated',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled'
] as const

type ShipmentStatus = typeof SHIPMENT_STATUSES[number]

// Status transition rules - defines which statuses can transition to which
const VALID_STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  'draft': ['pending_payment', 'cancelled'],
  'pending_payment': ['paid', 'cancelled'],
  'paid': ['label_generated', 'cancelled'],
  'label_generated': ['picked_up', 'cancelled'],
  'picked_up': ['in_transit'],
  'in_transit': ['delivered'],
  'delivered': [], // Terminal state
  'cancelled': []  // Terminal state
}

// Valid steps in the wizard
const VALID_STEPS = [1, 2, 3, 4, 5, 6] as const
type WizardStep = typeof VALID_STEPS[number]

interface AddressInput {
  name?: string
  company?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  locationType?: string
  phone?: string
  extension?: string
  email?: string
}

interface ServicePreference {
  carrierId?: string
  serviceTypeId?: string
  baseRate?: number
  fuelSurcharge?: number
  totalCost?: number
}

interface ShipmentResponse {
  id: string
  status: string
  confirmation_number?: string
  tracking_number?: string
  submitted_at?: string
  estimated_delivery?: string
  tracking_available_at?: string
  current_step?: number
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
    locationType?: string
  }
  sender_contact_name?: string
  sender_company?: string
  sender_contact_phone?: string
  sender_contact_email?: string
  recipient_contact_name?: string
  recipient_company?: string
  recipient_contact_phone?: string
  recipient_contact_email?: string
  package_type?: string
  weight?: number
  length?: number
  width?: number
  height?: number
  declared_value?: number
  contents_description?: string
  currency?: string
  base_rate?: number
  fuel_surcharge?: number
  insurance_cost?: number
  total_cost?: number
  selectedRate?: {
    id: string
    carrierName: string
    serviceName: string
    total: number
    currency: string
    baseRate: number
    fuelSurcharge: number
    insurance: number
    tax: number
    transitDaysMin: number
    transitDaysMax: number
  }
  packages?: unknown[]
  specialHandling?: unknown[]
  deliveryPreferences?: unknown
  hazmatDetails?: unknown
  payment?: unknown
  pickup?: unknown
  events?: unknown[]
}

/**
 * Validates if a status transition is allowed
 */
function isValidStatusTransition(fromStatus: ShipmentStatus, toStatus: ShipmentStatus): boolean {
  if (fromStatus === toStatus) return true // Same status is always valid
  const allowedTransitions = VALID_STATUS_TRANSITIONS[fromStatus] || []
  return allowedTransitions.includes(toStatus)
}

/**
 * Gets a human-readable error message for invalid status transition
 */
function getStatusTransitionError(fromStatus: ShipmentStatus, toStatus: ShipmentStatus): string {
  const allowedTransitions = VALID_STATUS_TRANSITIONS[fromStatus] || []
  if (allowedTransitions.length === 0) {
    return `Cannot transition from '${fromStatus}' - it is a terminal state`
  }
  return `Invalid status transition from '${fromStatus}' to '${toStatus}'. Allowed transitions: ${allowedTransitions.join(', ')}`
}

/**
 * GET /api/shipments/:id
 * 
 * Fetches comprehensive shipment details including:
 * - Origin and destination addresses
 * - Package configuration
 * - Selected rate with full pricing breakdown
 * - Special handling and delivery preferences
 * - Hazmat details
 * - Payment information with method-specific data
 * - Pickup details with all related data
 * - Shipment events (tracking history)
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id) && !id.startsWith('mock-')) {
      return NextResponse.json(
        { error: 'Invalid shipment ID format' },
        { status: 400 }
      )
    }

    // Fetch shipment with all related data
    const { data: shipment, error: shipmentError } = await supabaseServer
      .from('shipments')
      .select(`
        id,
        status,
        confirmation_number,
        tracking_number,
        submitted_at,
        estimated_delivery,
        package_type,
        weight,
        length,
        width,
        height,
        declared_value,
        contents_description,
        currency,
        base_rate,
        fuel_surcharge,
        insurance_cost,
        total_cost,
        sender_address_id,
        recipient_address_id,
        carrier_id,
        service_type_id,
        selected_quote_id,
        payment_id,
        sender_contact_name,
        sender_contact_phone,
        sender_contact_email,
        recipient_contact_name,
        recipient_contact_phone,
        recipient_contact_email
      `)
      .eq('id', id)
      .single()

    if (shipmentError) {
      if (shipmentError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Shipment not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch shipment', details: shipmentError.message },
        { status: 500 }
      )
    }

    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Fetch sender address
    const { data: senderAddress } = await supabaseServer
      .from('addresses')
      .select('line1, line2, city, state, postal_code, country, address_type, recipient_name, recipient_phone')
      .eq('id', shipment.sender_address_id)
      .single()

    // Fetch recipient address
    const { data: recipientAddress } = await supabaseServer
      .from('addresses')
      .select('line1, line2, city, state, postal_code, country, address_type, recipient_name, recipient_phone')
      .eq('id', shipment.recipient_address_id)
      .single()

    // Fetch packages
    const { data: packages } = await supabaseServer
      .from('shipment_packages')
      .select('*')
      .eq('shipment_id', id)

    // Fetch special handling
    const { data: specialHandling } = await supabaseServer
      .from('shipment_special_handling')
      .select('*')
      .eq('shipment_id', id)

    // Fetch delivery preferences
    const { data: deliveryPreferences } = await supabaseServer
      .from('shipment_delivery_preferences')
      .select('*')
      .eq('shipment_id', id)
      .maybeSingle()

    // Fetch hazmat details
    const { data: hazmatDetails } = await supabaseServer
      .from('hazmat_details')
      .select('*')
      .eq('shipment_id', id)
      .maybeSingle()

    // Fetch shipment events (tracking history)
    const { data: events } = await supabaseServer
      .from('shipment_events')
      .select('*')
      .eq('shipment_id', id)
      .order('event_timestamp', { ascending: false })

    // Fetch selected quote with full pricing breakdown
    let selectedRate: ShipmentResponse['selectedRate'] | undefined
    
    if (shipment.selected_quote_id) {
      const { data: quote } = await supabaseServer
        .from('quotes')
        .select(`
          id,
          total_cost,
          currency,
          carrier_id,
          service_type_id,
          base_rate,
          fuel_surcharge
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
          .select('name, transit_days_min, transit_days_max, base_rate')
          .eq('id', quote.service_type_id)
          .single()

        selectedRate = {
          id: quote.id,
          carrierName: carrier?.display_name || 'Unknown Carrier',
          serviceName: serviceType?.name || 'Unknown Service',
          total: parseFloat(quote.total_cost) || 0,
          currency: quote.currency || 'USD',
          baseRate: parseFloat(quote.base_rate) || 0,
          fuelSurcharge: parseFloat(quote.fuel_surcharge) || 0,
          insurance: parseFloat(shipment.insurance_cost) || 0,
          tax: 0,
          transitDaysMin: serviceType?.transit_days_min || 1,
          transitDaysMax: serviceType?.transit_days_max || 5,
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
        .select('name, transit_days_min, transit_days_max')
        .eq('id', shipment.service_type_id)
        .single()

      selectedRate = {
        id: 'shipment-rate',
        carrierName: carrier?.display_name || 'Unknown Carrier',
        serviceName: serviceType?.name || 'Unknown Service',
        total: parseFloat(shipment.total_cost) || 0,
        currency: shipment.currency || 'USD',
        baseRate: parseFloat(shipment.base_rate) || 0,
        fuelSurcharge: parseFloat(shipment.fuel_surcharge) || 0,
        insurance: parseFloat(shipment.insurance_cost) || 0,
        tax: 0,
        transitDaysMin: serviceType?.transit_days_min || 1,
        transitDaysMax: serviceType?.transit_days_max || 5,
      }
    }

    // Fetch payment information with method-specific details
    let payment = null
    if (shipment.payment_id) {
      const { data: paymentRecord } = await supabaseServer
        .from('payments')
        .select(`
          id,
          amount,
          currency,
          status,
          payment_info_id
        `)
        .eq('id', shipment.payment_id)
        .single()

      if (paymentRecord?.payment_info_id) {
        const { data: paymentInfo } = await supabaseServer
          .from('payment_info')
          .select('type')
          .eq('id', paymentRecord.payment_info_id)
          .single()

        // Fetch method-specific details
        let methodDetails = null
        if (paymentInfo?.type) {
          switch (paymentInfo.type) {
            case 'purchase_order':
              const { data: poData } = await supabaseServer
                .from('payment_purchase_orders')
                .select('*')
                .eq('payment_info_id', paymentRecord.payment_info_id)
                .single()
              methodDetails = poData
              break
            case 'net_terms':
              const { data: netData } = await supabaseServer
                .from('payment_net_terms')
                .select('*')
                .eq('payment_info_id', paymentRecord.payment_info_id)
                .single()
              methodDetails = netData
              break
            case 'bill_of_lading':
              const { data: bolData } = await supabaseServer
                .from('payment_bills_of_lading')
                .select('*')
                .eq('payment_info_id', paymentRecord.payment_info_id)
                .single()
              methodDetails = bolData
              break
            case 'third_party':
              const { data: tpData } = await supabaseServer
                .from('payment_third_party')
                .select('*')
                .eq('payment_info_id', paymentRecord.payment_info_id)
                .single()
              methodDetails = tpData
              break
            case 'corporate_account':
              const { data: corpData } = await supabaseServer
                .from('payment_corporate_accounts')
                .select('*')
                .eq('payment_info_id', paymentRecord.payment_info_id)
                .single()
              methodDetails = corpData
              break
          }
        }

        payment = {
          id: paymentRecord.id,
          amount: paymentRecord.amount,
          currency: paymentRecord.currency,
          status: paymentRecord.status,
          method: paymentInfo?.type,
          methodDetails,
        }
      }
    }

    // Fetch pickup details with all related data
    let pickup = null
    const { data: pickupDetails } = await supabaseServer
      .from('pickup_details')
      .select(`
        id,
        pickup_slot_id,
        pickup_address_id,
        instructions,
        status
      `)
      .eq('shipment_id', id)
      .maybeSingle()

    if (pickupDetails) {
      // Fetch pickup slot
      const { data: pickupSlot } = await supabaseServer
        .from('pickup_slots')
        .select('*')
        .eq('id', pickupDetails.pickup_slot_id)
        .single()

      // Fetch pickup contacts
      const { data: pickupContacts } = await supabaseServer
        .from('pickup_contacts')
        .select('*')
        .eq('pickup_details_id', pickupDetails.id)

      // Fetch access requirements
      const { data: accessRequirements } = await supabaseServer
        .from('pickup_access_requirements')
        .select('*')
        .eq('pickup_details_id', pickupDetails.id)

      // Fetch equipment needs
      const { data: equipmentNeeds } = await supabaseServer
        .from('pickup_equipment_needs')
        .select('*')
        .eq('pickup_details_id', pickupDetails.id)

      // Fetch authorized personnel
      const { data: authorizedPersonnel } = await supabaseServer
        .from('pickup_authorized_personnel')
        .select('*')
        .eq('pickup_details_id', pickupDetails.id)

      // Fetch notifications
      const { data: notifications } = await supabaseServer
        .from('pickup_notifications')
        .select('*')
        .eq('pickup_details_id', pickupDetails.id)

      pickup = {
        ...pickupDetails,
        slot: pickupSlot,
        contacts: pickupContacts,
        accessRequirements,
        equipmentNeeds,
        authorizedPersonnel,
        notifications,
      }
    }

    // Calculate current step based on shipment status and data
    let currentStep: WizardStep = 1
    if (shipment.status === 'draft') {
      currentStep = 1
    } else if (shipment.status === 'pending_payment' || !shipment.payment_id) {
      currentStep = 2
    } else if (shipment.status === 'paid' || !pickup) {
      currentStep = 3
    } else if (shipment.status === 'label_generated' || !shipment.confirmation_number) {
      currentStep = 4
    } else if (shipment.status === 'picked_up' || shipment.status === 'in_transit') {
      currentStep = 5
    } else if (shipment.status === 'delivered') {
      currentStep = 6
    }

    const response: ShipmentResponse = {
      id: shipment.id,
      status: shipment.status,
      confirmation_number: shipment.confirmation_number,
      tracking_number: shipment.tracking_number,
      submitted_at: shipment.submitted_at,
      estimated_delivery: shipment.estimated_delivery,
      tracking_available_at: shipment.estimated_delivery,
      current_step: currentStep,
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
        locationType: recipientAddress?.address_type,
      },
      sender_contact_name: shipment.sender_contact_name,
      sender_company: senderAddress?.recipient_name,
      sender_contact_phone: shipment.sender_contact_phone,
      sender_contact_email: shipment.sender_contact_email,
      recipient_contact_name: shipment.recipient_contact_name,
      recipient_company: recipientAddress?.recipient_name,
      recipient_contact_phone: shipment.recipient_contact_phone,
      recipient_contact_email: shipment.recipient_contact_email,
      package_type: shipment.package_type,
      weight: parseFloat(shipment.weight) || 0,
      length: parseFloat(shipment.length) || 0,
      width: parseFloat(shipment.width) || 0,
      height: parseFloat(shipment.height) || 0,
      declared_value: parseFloat(shipment.declared_value) || 0,
      contents_description: shipment.contents_description,
      currency: shipment.currency,
      base_rate: parseFloat(shipment.base_rate) || 0,
      fuel_surcharge: parseFloat(shipment.fuel_surcharge) || 0,
      insurance_cost: parseFloat(shipment.insurance_cost) || 0,
      total_cost: parseFloat(shipment.total_cost) || 0,
      selectedRate,
      packages: packages || [],
      specialHandling: specialHandling || [],
      deliveryPreferences,
      hazmatDetails,
      payment,
      pickup,
      events: events || [],
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/shipments/:id
 * 
 * Updates shipment data with partial updates for:
 * - Step progression
 * - Status changes (with validation)
 * - Address updates
 * - Service preferences
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id) && !id.startsWith('mock-')) {
      return NextResponse.json(
        { error: 'Invalid shipment ID format' },
        { status: 400 }
      )
    }

    // Fetch current shipment to validate transitions
    const { data: currentShipment, error: fetchError } = await supabaseServer
      .from('shipments')
      .select('id, status, sender_address_id, recipient_address_id')
      .eq('id', id)
      .single()

    if (fetchError || !currentShipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    const currentStatus = currentShipment.status as ShipmentStatus
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    // Validate and handle status transition
    if (body.status && body.status !== currentStatus) {
      const newStatus = body.status as ShipmentStatus
      
      if (!SHIPMENT_STATUSES.includes(newStatus)) {
        return NextResponse.json(
          { error: `Invalid status: ${newStatus}. Valid statuses: ${SHIPMENT_STATUSES.join(', ')}` },
          { status: 400 }
        )
      }

      if (!isValidStatusTransition(currentStatus, newStatus)) {
        return NextResponse.json(
          { error: getStatusTransitionError(currentStatus, newStatus) },
          { status: 422 }
        )
      }

      updateData.status = newStatus

      // Create status change event
      const { error: eventError } = await supabaseServer
        .from('shipment_events')
        .insert({
          shipment_id: id,
          event_type: 'status_changed',
          event_description: `Status changed from ${currentStatus} to ${newStatus}`,
          metadata: {
            previous_status: currentStatus,
            new_status: newStatus,
            changed_at: new Date().toISOString()
          }
        })

      if (eventError) {
      }
    }

    // Handle step progression
    if (body.currentStep !== undefined) {
      const requestedStep = body.currentStep as number
      if (!VALID_STEPS.includes(requestedStep as WizardStep)) {
        return NextResponse.json(
          { error: `Invalid step: ${requestedStep}. Valid steps: ${VALID_STEPS.join(', ')}` },
          { status: 400 }
        )
      }
      // Note: current_step might not exist in schema, so we store in metadata/events
      updateData.metadata = { ...(updateData.metadata || {}), current_step: requestedStep }
    }

    // Handle origin address update
    if (body.origin) {
      const origin = body.origin as AddressInput
      const { error: addressError } = await supabaseServer
        .from('addresses')
        .update({
          recipient_name: origin.name,
          line1: origin.line1,
          line2: origin.line2 || null,
          city: origin.city,
          state: origin.state,
          postal_code: origin.postalCode,
          country: origin.country,
          address_type: origin.locationType as 'residential' | 'commercial',
          recipient_phone: origin.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentShipment.sender_address_id)

      if (addressError) {
        return NextResponse.json(
          { error: 'Failed to update origin address', details: addressError.message },
          { status: 422 }
        )
      }

      // Update shipment contact info if provided
      if (origin.name) updateData.sender_contact_name = origin.name
      if (origin.phone) updateData.sender_contact_phone = origin.phone
      if (origin.email) updateData.sender_contact_email = origin.email
    }

    // Handle destination address update
    if (body.destination) {
      const destination = body.destination as AddressInput
      const { error: addressError } = await supabaseServer
        .from('addresses')
        .update({
          recipient_name: destination.name,
          line1: destination.line1,
          line2: destination.line2 || null,
          city: destination.city,
          state: destination.state,
          postal_code: destination.postalCode,
          country: destination.country,
          address_type: destination.locationType as 'residential' | 'commercial',
          recipient_phone: destination.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentShipment.recipient_address_id)

      if (addressError) {
        return NextResponse.json(
          { error: 'Failed to update destination address', details: addressError.message },
          { status: 422 }
        )
      }

      // Update shipment contact info if provided
      if (destination.name) updateData.recipient_contact_name = destination.name
      if (destination.phone) updateData.recipient_contact_phone = destination.phone
      if (destination.email) updateData.recipient_contact_email = destination.email
    }

    // Handle service preference update
    if (body.servicePreference) {
      const pref = body.servicePreference as ServicePreference
      if (pref.carrierId) updateData.carrier_id = pref.carrierId
      if (pref.serviceTypeId) updateData.service_type_id = pref.serviceTypeId
      if (pref.baseRate !== undefined) updateData.base_rate = pref.baseRate
      if (pref.fuelSurcharge !== undefined) updateData.fuel_surcharge = pref.fuelSurcharge
      if (pref.totalCost !== undefined) updateData.total_cost = pref.totalCost
    }

    // Handle tracking number update
    if (body.trackingNumber) {
      updateData.tracking_number = body.trackingNumber
    }

    // Handle confirmation number update
    if (body.confirmationNumber) {
      updateData.confirmation_number = body.confirmationNumber
    }

    // Handle estimated delivery update
    if (body.estimatedDelivery) {
      updateData.estimated_delivery = body.estimatedDelivery
    }

    // Handle label status update
    if (body.labelStatus) {
      updateData.label_status = body.labelStatus
    }

    // Handle submitted_at update
    if (body.submittedAt) {
      updateData.submitted_at = body.submittedAt
    }

    // Update shipment
    const { data: shipment, error } = await supabaseServer
      .from('shipments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update shipment', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      shipment,
      message: 'Shipment updated successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/shipments/:id
 * 
 * Deletes a shipment (used for Start Over functionality)
 * Only allows deletion of draft or pending_payment shipments
 */
export async function DELETE(
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

    // Fetch current shipment to validate deletion is allowed
    const { data: currentShipment, error: fetchError } = await supabaseServer
      .from('shipments')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError || !currentShipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of draft or pending_payment shipments
    const deletableStatuses = ['draft', 'pending_payment']
    if (!deletableStatuses.includes(currentShipment.status)) {
      return NextResponse.json(
        { error: `Cannot delete shipment with status '${currentShipment.status}'. Only draft or pending_payment shipments can be deleted.` },
        { status: 422 }
      )
    }

    // Create deletion event before deleting
    await supabaseServer
      .from('shipment_events')
      .insert({
        shipment_id: id,
        event_type: 'shipment_deleted',
        event_description: `Shipment deleted (status was: ${currentShipment.status})`,
        metadata: {
          deleted_at: new Date().toISOString(),
          previous_status: currentShipment.status
        }
      })

    // Delete shipment (cascade will handle related records)
    const { error } = await supabaseServer
      .from('shipments')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete shipment', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Shipment deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
