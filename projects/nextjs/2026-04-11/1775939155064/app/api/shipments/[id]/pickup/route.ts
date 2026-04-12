import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

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
// VALIDATION SCHEMAS
// ============================================

const timeSlotSchema = z.object({
  id: z.string(),
  label: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  availability: z.enum(['available', 'limited', 'unavailable']),
  fee: z.number(),
  description: z.string(),
})

const selectedPickupSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  timeSlot: timeSlotSchema,
  readyTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
})

const pickupLocationSchema = z.object({
  locationType: z.enum(['loading_dock', 'ground_level', 'residential', 'storage_facility', 'construction_site', 'other']),
  dockNumber: z.string().optional(),
  otherDescription: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.locationType === 'loading_dock' && !data.dockNumber) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Dock number is required for loading dock locations',
      path: ['dockNumber'],
    })
  }
  if (data.locationType === 'other' && !data.otherDescription) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Description is required for other location types',
      path: ['otherDescription'],
    })
  }
})

const accessRequirementsSchema = z.object({
  requirements: z.array(z.enum(['call_upon_arrival', 'security_checkin', 'gate_code', 'appointment_required', 'limited_parking', 'forklift_available', 'liftgate_service'])),
  gateCode: z.string().optional(),
  parkingInstructions: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.requirements.includes('gate_code') && !data.gateCode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Gate code is required when gate code access is selected',
      path: ['gateCode'],
    })
  }
  if (data.requirements.includes('limited_parking') && !data.parkingInstructions) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Parking instructions are required when limited parking is selected',
      path: ['parkingInstructions'],
    })
  }
})

const pickupEquipmentSchema = z.object({
  equipment: z.array(z.enum(['standard_dolly', 'appliance_dolly', 'furniture_pads', 'straps', 'pallet_jack', 'two_person_team'])),
})

const loadingAssistanceSchema = z.object({
  assistanceType: z.enum(['customer_load', 'driver_assistance', 'full_service']),
})

const specialInstructionsSchema = z.object({
  gateCode: z.string().max(200).optional(),
  parkingLoading: z.string().max(200).optional(),
  packageLocation: z.string().max(100).optional(),
  driverInstructions: z.string().max(300).optional(),
})

const primaryContactSchema = z.object({
  name: z.string().min(1, 'Primary contact name is required').min(2, 'Name must be at least 2 characters'),
  jobTitle: z.string().optional(),
  mobilePhone: z.string().min(1, 'Mobile phone is required'),
  altPhone: z.string().optional(),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  preferredMethod: z.enum(['phone', 'email', 'text']),
})

const backupContactSchema = z.object({
  name: z.string().min(1, 'Backup contact name is required').min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(1, 'Backup phone is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
})

const authorizedPersonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  authorizationLevel: z.enum(['full', 'limited', 'notification_only']),
})

const authorizedPersonnelSchema = z.object({
  anyoneAtLocation: z.boolean(),
  personnelList: z.array(authorizedPersonSchema),
})

const specialAuthorizationSchema = z.object({
  idVerificationRequired: z.boolean(),
  signatureRequired: z.boolean(),
  photoIdMatching: z.boolean(),
})

const notificationPreferencesSchema = z.object({
  emailReminder24h: z.boolean(),
  smsReminder2h: z.boolean(),
  callReminder30m: z.boolean(),
  driverEnroute: z.boolean(),
  pickupCompletion: z.boolean(),
  transitUpdates: z.boolean(),
})

// Main pickup request schema
const pickupRequestSchema = z.object({
  selectedPickup: selectedPickupSchema,
  location: pickupLocationSchema,
  access: accessRequirementsSchema,
  equipment: pickupEquipmentSchema,
  loading: loadingAssistanceSchema,
  specialInstructions: specialInstructionsSchema,
  contacts: z.object({
    primary: primaryContactSchema,
    backup: backupContactSchema,
  }),
  authorizedPersonnel: authorizedPersonnelSchema,
  specialAuthorization: specialAuthorizationSchema,
  notifications: notificationPreferencesSchema,
}).superRefine((data, ctx) => {
  // Validate ready time is at least 30 minutes before slot start
  const slotStart = data.selectedPickup.timeSlot.startTime
  const readyTime = data.selectedPickup.readyTime
  
  if (slotStart && readyTime) {
    const [slotHour, slotMin] = slotStart.split(':').map(Number)
    const [readyHour, readyMin] = readyTime.split(':').map(Number)
    
    const slotMinutes = slotHour * 60 + slotMin
    const readyMinutes = readyHour * 60 + readyMin
    
    if (readyMinutes > slotMinutes - 30) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ready time must be at least 30 minutes before the pickup time slot starts',
        path: ['selectedPickup', 'readyTime'],
      })
    }
  }
})

// Fee calculation constants
const LOCATION_TYPE_FEES: Record<string, number> = {
  loading_dock: 0,
  ground_level: 0,
  residential: 15,
  storage_facility: 0,
  construction_site: 25,
  other: 0,
}

const ACCESS_REQUIREMENT_FEES: Record<string, number> = {
  call_upon_arrival: 0,
  security_checkin: 0,
  gate_code: 0,
  appointment_required: 0,
  limited_parking: 0,
  forklift_available: 0,
  liftgate_service: 35,
}

const EQUIPMENT_FEES: Record<string, number> = {
  standard_dolly: 0,
  appliance_dolly: 0,
  furniture_pads: 0,
  straps: 0,
  pallet_jack: 0,
  two_person_team: 45,
}

const LOADING_ASSISTANCE_FEES: Record<string, number> = {
  customer_load: 0,
  driver_assistance: 25,
  full_service: 65,
}

// Calculate all pickup fees
function calculatePickupFees(
  timeSlot: z.infer<typeof timeSlotSchema>,
  locationType: string,
  accessRequirements: string[],
  equipment: string[],
  loadingAssistance: string
) {
  const timeSlotFee = timeSlot.fee || 0
  const locationFee = LOCATION_TYPE_FEES[locationType] || 0
  const accessFee = accessRequirements.reduce((sum, req) => sum + (ACCESS_REQUIREMENT_FEES[req] || 0), 0)
  const equipmentFee = equipment.reduce((sum, item) => sum + (EQUIPMENT_FEES[item] || 0), 0)
  const loadingFee = LOADING_ASSISTANCE_FEES[loadingAssistance] || 0
  
  return {
    timeSlotFee,
    locationFee,
    accessFee,
    equipmentFee,
    loadingFee,
    totalFee: timeSlotFee + locationFee + accessFee + equipmentFee + loadingFee,
  }
}

// ============================================
// API HANDLER
// ============================================

/**
 * POST /api/shipments/:id/pickup
 * 
 * Saves pickup details including:
 * - Pickup date and time slot
 * - Location type and access requirements
 * - Equipment needs and loading assistance
 * - Contact information
 * - Authorized personnel
 * - Notification preferences
 * - Calculates and saves all fees
 * 
 * Updates shipment status and creates pickup_scheduled event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: shipmentId } = await params
    
    if (!shipmentId) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    
    const validationResult = pickupRequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.error('Pickup validation failed:', validationResult.error.errors)
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Calculate fees
    const fees = calculatePickupFees(
      data.selectedPickup.timeSlot,
      data.location.locationType,
      data.access.requirements,
      data.equipment.equipment,
      data.loading.assistanceType
    )

    // Get or create the pickup slot
    const { data: existingSlot, error: slotError } = await supabaseServer
      .from('pickup_slots')
      .select('id')
      .eq('slot_date', data.selectedPickup.date)
      .eq('time_window', `${data.selectedPickup.timeSlot.startTime}-${data.selectedPickup.timeSlot.endTime}`)
      .single()

    let pickupSlotId: string

    if (existingSlot) {
      pickupSlotId = existingSlot.id
      // Increment booked count using raw SQL increment
      const { data: slotData } = await supabaseServer
        .from('pickup_slots')
        .select('booked_count')
        .eq('id', pickupSlotId)
        .single()
      
      if (slotData) {
        await supabaseServer
          .from('pickup_slots')
          .update({ booked_count: (slotData.booked_count || 0) + 1 })
          .eq('id', pickupSlotId)
      }
    } else {
      // Create a new pickup slot
      const { data: newSlot, error: createSlotError } = await supabaseServer
        .from('pickup_slots')
        .insert({
          slot_date: data.selectedPickup.date,
          time_window: `${data.selectedPickup.timeSlot.startTime}-${data.selectedPickup.timeSlot.endTime}`,
          fee: data.selectedPickup.timeSlot.fee,
          is_available: true,
          capacity: 10,
          booked_count: 1,
        })
        .select('id')
        .single()

      if (createSlotError) {
        console.error('Error creating pickup slot:', createSlotError)
        return NextResponse.json(
          { error: 'Failed to create pickup slot' },
          { status: 500 }
        )
      }

      pickupSlotId = newSlot!.id
    }

    // Get shipment sender address for pickup address
    const { data: shipment, error: shipmentError } = await supabaseServer
      .from('shipments')
      .select('sender_address_id')
      .eq('id', shipmentId)
      .single()

    if (shipmentError) {
      console.error('Error fetching shipment:', shipmentError)
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Create pickup details
    const { data: pickupDetails, error: pickupError } = await supabaseServer
      .from('pickup_details')
      .insert({
        shipment_id: shipmentId,
        pickup_slot_id: pickupSlotId,
        pickup_address_id: shipment.sender_address_id,
        instructions: data.specialInstructions.driverInstructions || null,
        status: 'scheduled',
      })
      .select('id')
      .single()

    if (pickupError) {
      console.error('Error creating pickup details:', pickupError)
      return NextResponse.json(
        { error: 'Failed to create pickup details' },
        { status: 500 }
      )
    }

    const pickupDetailsId = pickupDetails.id

    // Insert pickup contacts (primary and backup)
    const contactsToInsert = [
      {
        pickup_details_id: pickupDetailsId,
        contact_name: data.contacts.primary.name,
        contact_phone: data.contacts.primary.mobilePhone,
        contact_email: data.contacts.primary.email,
        is_primary: true,
      },
      {
        pickup_details_id: pickupDetailsId,
        contact_name: data.contacts.backup.name,
        contact_phone: data.contacts.backup.phone,
        contact_email: data.contacts.backup.email || null,
        is_primary: false,
      },
    ]

    const { error: contactsError } = await supabaseServer
      .from('pickup_contacts')
      .insert(contactsToInsert)

    if (contactsError) {
      console.error('Error inserting pickup contacts:', contactsError)
      return NextResponse.json(
        { error: 'Failed to save pickup contacts' },
        { status: 500 }
      )
    }

    // Insert access requirements
    if (data.access.requirements.length > 0) {
      const accessRequirementsToInsert = data.access.requirements.map(req => ({
        pickup_details_id: pickupDetailsId,
        requirement_type: req,
        requirement_value: req === 'gate_code' ? (data.access.gateCode || '') : 
                           req === 'limited_parking' ? (data.access.parkingInstructions || '') : 
                           'true',
        instructions: req === 'gate_code' ? data.access.gateCode :
                      req === 'limited_parking' ? data.access.parkingInstructions :
                      null,
      }))

      const { error: accessError } = await supabaseServer
        .from('pickup_access_requirements')
        .insert(accessRequirementsToInsert)

      if (accessError) {
        console.error('Error inserting access requirements:', accessError)
        return NextResponse.json(
          { error: 'Failed to save access requirements' },
          { status: 500 }
        )
      }
    }

    // Insert equipment needs
    if (data.equipment.equipment.length > 0) {
      const equipmentToInsert = data.equipment.equipment.map(eq => ({
        pickup_details_id: pickupDetailsId,
        equipment_type: eq,
        quantity: 1,
        special_instructions: null,
      }))

      const { error: equipmentError } = await supabaseServer
        .from('pickup_equipment_needs')
        .insert(equipmentToInsert)

      if (equipmentError) {
        console.error('Error inserting equipment needs:', equipmentError)
        return NextResponse.json(
          { error: 'Failed to save equipment needs' },
          { status: 500 }
        )
      }
    }

    // Insert authorized personnel
    if (!data.authorizedPersonnel.anyoneAtLocation && data.authorizedPersonnel.personnelList.length > 0) {
      const personnelToInsert = data.authorizedPersonnel.personnelList.map(person => ({
        pickup_details_id: pickupDetailsId,
        personnel_name: person.name,
        personnel_id: null,
        authorization_type: person.authorizationLevel,
      }))

      const { error: personnelError } = await supabaseServer
        .from('pickup_authorized_personnel')
        .insert(personnelToInsert)

      if (personnelError) {
        console.error('Error inserting authorized personnel:', personnelError)
        return NextResponse.json(
          { error: 'Failed to save authorized personnel' },
          { status: 500 }
        )
      }
    }

    // Insert notification preferences
    const notificationsToInsert = [
      { type: 'email_reminder_24h', is_enabled: data.notifications.emailReminder24h },
      { type: 'sms_reminder_2h', is_enabled: data.notifications.smsReminder2h },
      { type: 'call_reminder_30m', is_enabled: data.notifications.callReminder30m },
      { type: 'driver_enroute', is_enabled: data.notifications.driverEnroute },
      { type: 'pickup_completion', is_enabled: data.notifications.pickupCompletion },
      { type: 'transit_updates', is_enabled: data.notifications.transitUpdates },
    ].filter(n => n.is_enabled).map(n => ({
      pickup_details_id: pickupDetailsId,
      notification_type: n.type,
      recipient_email: data.contacts.primary.email,
      recipient_phone: data.contacts.primary.mobilePhone,
      is_enabled: true,
    }))

    if (notificationsToInsert.length > 0) {
      const { error: notificationsError } = await supabaseServer
        .from('pickup_notifications')
        .insert(notificationsToInsert)

      if (notificationsError) {
        console.error('Error inserting notification preferences:', notificationsError)
        return NextResponse.json(
          { error: 'Failed to save notification preferences' },
          { status: 500 }
        )
      }
    }

    // Update shipment status and current step
    // Note: current_step column may not exist if migrations haven't been applied
    const updateData: Record<string, unknown> = {
      status: 'pending_payment',
    }
    
    // Try to update with current_step, but handle case where column doesn't exist
    try {
      const { error: updateError } = await supabaseServer
        .from('shipments')
        .update({
          ...updateData,
          current_step: 5,
        })
        .eq('id', shipmentId)

      if (updateError) {
        // If current_step column doesn't exist, try updating without it
        if (updateError.message?.includes('current_step')) {
          const { error: simpleUpdateError } = await supabaseServer
            .from('shipments')
            .update(updateData)
            .eq('id', shipmentId)
          
          if (simpleUpdateError) {
            console.error('Error updating shipment (simple):', simpleUpdateError)
            return NextResponse.json(
              { error: 'Failed to update shipment status' },
              { status: 500 }
            )
          }
        } else {
          console.error('Error updating shipment:', updateError)
          return NextResponse.json(
            { error: 'Failed to update shipment status' },
            { status: 500 }
          )
        }
      }
    } catch (error) {
      console.error('Exception updating shipment:', error)
      return NextResponse.json(
        { error: 'Failed to update shipment status' },
        { status: 500 }
      )
    }

    // Create pickup_scheduled event
    const { error: eventError } = await supabaseServer
      .from('shipment_events')
      .insert({
        shipment_id: shipmentId,
        event_type: 'pickup_scheduled',
        event_description: `Pickup scheduled for ${data.selectedPickup.date} at ${data.selectedPickup.timeSlot.label}`,
        location: null,
        metadata: {
          pickup_date: data.selectedPickup.date,
          time_slot: data.selectedPickup.timeSlot,
          ready_time: data.selectedPickup.readyTime,
          location_type: data.location.locationType,
          fees: fees,
        },
      })

    if (eventError) {
      console.error('Error creating shipment event:', eventError)
      // Don't fail the request if event creation fails
    }

    return NextResponse.json({
      success: true,
      pickupDetailsId,
      fees,
      message: 'Pickup scheduled successfully',
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/shipments/[id]/pickup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
