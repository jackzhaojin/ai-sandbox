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
  status: string
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
  // Sender contact info
  sender_contact_name?: string
  sender_company?: string
  sender_contact_phone?: string
  sender_contact_email?: string
  // Recipient contact info
  recipient_contact_name?: string
  recipient_company?: string
  recipient_contact_phone?: string
  recipient_contact_email?: string
  // Package data
  package_type?: string
  weight?: number
  length?: number
  width?: number
  height?: number
  declared_value?: number
  contents_description?: string
  currency?: string
  // Pricing
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
  // Related data
  packages?: unknown[]
  specialHandling?: unknown[]
  deliveryPreferences?: unknown
  hazmatDetails?: unknown
  payment?: unknown
  pickup?: unknown
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
 * - Pickup details with contacts, access, equipment, personnel, notifications
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

    // Fetch shipment with all related data
    const { data: shipment, error: shipmentError } = await supabaseServer
      .from('shipments')
      .select(`
        id,
        status,
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
      console.error('Error fetching shipment:', shipmentError)
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Fetch sender address
    const { data: senderAddress } = await supabaseServer
      .from('addresses')
      .select('line1, line2, city, state, postal_code, country, address_type')
      .eq('id', shipment.sender_address_id)
      .single()

    // Fetch recipient address
    const { data: recipientAddress } = await supabaseServer
      .from('addresses')
      .select('line1, line2, city, state, postal_code, country')
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
      .single()

    // Fetch hazmat details
    const { data: hazmatDetails } = await supabaseServer
      .from('hazmat_details')
      .select('*')
      .eq('shipment_id', id)
      .single()

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
      .single()

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

    const response: ShipmentResponse = {
      id: shipment.id,
      status: shipment.status,
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
      sender_contact_name: shipment.sender_contact_name,
      sender_contact_phone: shipment.sender_contact_phone,
      sender_contact_email: shipment.sender_contact_email,
      recipient_contact_name: shipment.recipient_contact_name,
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

/**
 * PATCH /api/shipments/:id
 * 
 * Updates shipment data (used for saving draft with terms acceptance)
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

    // Update shipment
    const { data: shipment, error } = await supabaseServer
      .from('shipments')
      .update({
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating shipment:', error)
      return NextResponse.json(
        { error: 'Failed to update shipment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, shipment })
  } catch (error) {
    console.error('Error in PATCH /api/shipments/[id]:', error)
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

    // Delete shipment (cascade will handle related records)
    const { error } = await supabaseServer
      .from('shipments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting shipment:', error)
      return NextResponse.json(
        { error: 'Failed to delete shipment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/shipments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
