/**
 * B2B Postal Checkout Flow - Pickup Scheduling API
 * POST /api/shipments/[id]/pickup - Schedule pickup for a shipment
 * 
 * Creates records in:
 * - pickup_details: Main pickup information
 * - pickup_contacts: Primary and backup contacts
 * - pickup_access_requirements: Access details (gate codes, etc.)
 * - pickup_equipment_needs: Required equipment
 * - pickup_authorized_personnel: Authorized release personnel
 * - pickup_notifications: Notification preferences
 * 
 * Updates:
 * - shipments: Sets pickup_id and updates status
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  successResponse,
  createdResponse,
  errors,
  parseJsonBody,
  zodValidationResponse,
  noCacheHeaders,
} from "@/lib/api/response";
import { pickupRequestSchema, shipmentIdParamSchema } from "@/lib/validation/api-schemas";
import type { PickupData } from "@/types/api";
import type {
  PickupDetails,
  PickupContact,
  PickupAccessRequirement,
  PickupEquipmentNeed,
  PickupAuthorizedPersonnel,
  PickupNotification,
  Shipment,
} from "@/types/database";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a unique pickup number
 * Format: PUP-YYYYMMDD-XXXX
 */
function generatePickupNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PUP-${dateStr}-${random}`;
}

/**
 * Get time range for time slot
 */
function getTimeSlotRange(timeSlotId: string): { readyTime: string; closeTime: string } {
  switch (timeSlotId) {
    case "morning":
      return { readyTime: "08:00:00", closeTime: "12:00:00" };
    case "afternoon":
      return { readyTime: "12:00:00", closeTime: "17:00:00" };
    case "evening":
      return { readyTime: "17:00:00", closeTime: "19:00:00" };
    default:
      return { readyTime: "08:00:00", closeTime: "17:00:00" };
  }
}

/**
 * Map access requirement type to database enum
 */
function mapAccessType(requirement: string): string {
  const mapping: Record<string, string> = {
    call_upon_arrival: "call_on_arrival",
    security_checkin: "security_gate",
    gate_code: "security_gate",
    buzzer_access: "front_door",
    appointment_required: "call_on_arrival",
    restricted_hours: "call_on_arrival",
  };
  return mapping[requirement] || "call_on_arrival";
}

/**
 * Map equipment type to database enum
 */
function mapEquipmentType(equipmentType: string): string {
  const mapping: Record<string, string> = {
    standard_dolly: "hand_truck",
    two_person_team: "hand_truck",
    pallet_jack: "pallet_jack",
    forklift: "forklift",
    liftgate: "liftgate",
    inside_pickup: "hand_truck",
    pallet_shrink_wrap: "hand_truck",
  };
  return mapping[equipmentType] || "hand_truck";
}

// ============================================
// MAIN HANDLER
// ============================================

/**
 * POST /api/shipments/[id]/pickup
 * Schedule a pickup for a shipment
 */
export async function POST(
  request: Request,
  context: RouteContext
): Promise<NextResponse> {
  const { id } = await context.params;

  // Validate shipment ID
  const idValidation = shipmentIdParamSchema.safeParse({ id });
  if (!idValidation.success) {
    return errors.shipmentNotFound();
  }

  // Parse JSON body
  const parseResult = await parseJsonBody(request);
  if (!parseResult.success) {
    return parseResult.response;
  }

  // Validate request body
  const validationResult = pickupRequestSchema.safeParse(parseResult.data);
  if (!validationResult.success) {
    return zodValidationResponse(validationResult.error);
  }

  const data = validationResult.data;

  try {
    const supabase = await createClient();

    // Fetch shipment to verify it exists and get organization_id
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("id, organization_id, status, sender_address_id, total_cost")
      .eq("id", id)
      .single();

    if (shipmentError) {
      if (shipmentError.code === "PGRST116") {
        return errors.shipmentNotFound();
      }
      console.error("Failed to fetch shipment:", shipmentError);
      return errors.database("Failed to fetch shipment");
    }

    const typedShipment = shipment as Shipment;

    // Check if shipment can have pickup scheduled
    if (typedShipment.status === "cancelled") {
      return errors.cannotUpdateShipment("Cannot schedule pickup for cancelled shipment");
    }

    if (typedShipment.status === "picked_up") {
      return errors.cannotUpdateShipment("Shipment has already been picked up");
    }

    // Check if pickup already exists
    if (typedShipment.pickup_id) {
      return errors.cannotUpdateShipment("Pickup already scheduled for this shipment");
    }

    // Generate pickup number
    const pickupNumber = generatePickupNumber();
    const { readyTime, closeTime } = getTimeSlotRange(data.time_slot_id);

    // ============================================
    // 1. Create pickup_details record
    // ============================================
    const { data: pickupDetails, error: pickupError } = await supabase
      .from("pickup_details")
      .insert({
        shipment_id: id,
        pickup_number: pickupNumber,
        carrier_id: null, // Will be assigned later
        pickup_address_id: data.pickup_address_id,
        pickup_date: data.pickup_date,
        ready_time: readyTime,
        close_time: closeTime,
        status: "pending",
        special_instructions: data.special_instructions || null,
        driver_instructions: data.driver_instructions || null,
        confirmed_at: null,
        confirmed_by: null,
        driver_name: null,
        driver_phone: null,
        vehicle_number: null,
        picked_up_at: null,
        pickup_proof_url: null,
      } as Omit<PickupDetails, "id" | "created_at" | "updated_at">)
      .select()
      .single();

    if (pickupError) {
      console.error("Failed to create pickup details:", pickupError);
      return errors.database("Failed to create pickup");
    }

    const pickupId = pickupDetails.id;

    // ============================================
    // 2. Create pickup_contacts records
    // ============================================

    // Primary contact
    const { error: primaryContactError } = await supabase
      .from("pickup_contacts")
      .insert({
        pickup_id: pickupId,
        contact_name: data.primary_contact.name,
        contact_phone: data.primary_contact.mobile_phone,
        contact_email: data.primary_contact.email,
        is_primary: true,
        available_from: readyTime,
        available_until: closeTime,
      } as Omit<PickupContact, "id" | "created_at">);

    if (primaryContactError) {
      console.error("Failed to create primary contact:", primaryContactError);
      // Continue - not critical
    }

    // Backup contact
    const { error: backupContactError } = await supabase
      .from("pickup_contacts")
      .insert({
        pickup_id: pickupId,
        contact_name: data.backup_contact.name,
        contact_phone: data.backup_contact.phone,
        contact_email: data.backup_contact.email || null,
        is_primary: false,
        available_from: null,
        available_until: null,
      } as Omit<PickupContact, "id" | "created_at">);

    if (backupContactError) {
      console.error("Failed to create backup contact:", backupContactError);
      // Continue - not critical
    }

    // ============================================
    // 3. Create pickup_access_requirements records
    // ============================================
    if (data.access_requirements && data.access_requirements.length > 0) {
      const accessInserts = data.access_requirements.map((req) => ({
        pickup_id: pickupId,
        access_type: mapAccessType(req),
        instructions: data.parking_instructions || null,
        security_code: req === "gate_code" ? (data.gate_code || null) : null,
      }));

      const { error: accessError } = await supabase
        .from("pickup_access_requirements")
        .insert(accessInserts as Omit<PickupAccessRequirement, "id" | "created_at">[]);

      if (accessError) {
        console.error("Failed to create access requirements:", accessError);
        // Continue - not critical
      }
    }

    // ============================================
    // 4. Create pickup_equipment_needs records
    // ============================================
    if (data.equipment_needed && data.equipment_needed.length > 0) {
      const equipmentInserts = data.equipment_needed.map((eq) => ({
        pickup_id: pickupId,
        equipment_type: mapEquipmentType(eq.equipment_type),
        quantity: eq.quantity,
        is_required: eq.is_required,
        notes: eq.notes || null,
      }));

      const { error: equipmentError } = await supabase
        .from("pickup_equipment_needs")
        .insert(equipmentInserts as Omit<PickupEquipmentNeed, "id" | "created_at">[]);

      if (equipmentError) {
        console.error("Failed to create equipment needs:", equipmentError);
        // Continue - not critical
      }
    }

    // ============================================
    // 5. Create pickup_authorized_personnel records
    // ============================================
    if (data.authorized_personnel && data.authorized_personnel.length > 0) {
      const personnelInserts = data.authorized_personnel.map((name, index) => ({
        pickup_id: pickupId,
        person_name: name,
        person_title: index === 0 ? data.primary_contact.job_title : null,
        id_type: data.special_authorization?.id_verification_required ? "government_id" : null,
        id_number: null,
        is_primary_contact: index === 0,
      }));

      const { error: personnelError } = await supabase
        .from("pickup_authorized_personnel")
        .insert(personnelInserts as Omit<PickupAuthorizedPersonnel, "id" | "created_at">[]);

      if (personnelError) {
        console.error("Failed to create authorized personnel:", personnelError);
        // Continue - not critical
      }
    }

    // ============================================
    // 6. Create pickup_notifications records
    // ============================================
    const notificationInserts: Omit<PickupNotification, "id" | "created_at">[] = [];

    // Email confirmation
    if (data.notifications.email_confirmation) {
      notificationInserts.push({
        pickup_id: pickupId,
        notification_type: "email_confirmation",
        recipient: data.primary_contact.email,
        recipient_name: data.primary_contact.name,
        notify_on_confirm: true,
        notify_on_pickup: false,
        notify_on_exception: false,
      });
    }

    // SMS reminder
    if (data.notifications.sms_reminder && data.notifications.phone_number) {
      notificationInserts.push({
        pickup_id: pickupId,
        notification_type: "sms_reminder",
        recipient: data.notifications.phone_number,
        recipient_name: data.primary_contact.name,
        notify_on_confirm: false,
        notify_on_pickup: false,
        notify_on_exception: true,
      });
    }

    // Email reminder
    if (data.notifications.email_reminder) {
      notificationInserts.push({
        pickup_id: pickupId,
        notification_type: "email_reminder",
        recipient: data.primary_contact.email,
        recipient_name: data.primary_contact.name,
        notify_on_confirm: false,
        notify_on_pickup: true,
        notify_on_exception: true,
      });
    }

    // Driver arrival notification
    if (data.notifications.driver_arrival_notification) {
      notificationInserts.push({
        pickup_id: pickupId,
        notification_type: "driver_arrival",
        recipient: data.primary_contact.mobile_phone,
        recipient_name: data.primary_contact.name,
        notify_on_confirm: false,
        notify_on_pickup: true,
        notify_on_exception: false,
      });
    }

    if (notificationInserts.length > 0) {
      const { error: notificationError } = await supabase
        .from("pickup_notifications")
        .insert(notificationInserts);

      if (notificationError) {
        console.error("Failed to create notifications:", notificationError);
        // Continue - not critical
      }
    }

    // ============================================
    // 7. Update shipment with pickup_id
    // ============================================
    const { error: updateError } = await supabase
      .from("shipments")
      .update({
        pickup_id: pickupId,
        status: "label_generated", // Move to next status
        updated_at: new Date().toISOString(),
        special_instructions: data.special_instructions || typedShipment.special_instructions,
      } as Partial<Shipment>)
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update shipment:", updateError);
      return errors.database("Failed to update shipment");
    }

    // ============================================
    // 8. Return success response
    // ============================================
    const responseData: PickupData = {
      pickup: {
        id: pickupId,
        shipment_id: id,
        pickup_number: pickupNumber,
        status: "pending",
        pickup_date: data.pickup_date,
        ready_time: readyTime,
        close_time: closeTime,
        total_fee: data.total_pickup_fee,
        created_at: pickupDetails.created_at,
      },
      confirmation: {
        confirmation_number: pickupNumber,
        estimated_pickup_window: `${readyTime.slice(0, 5)} - ${closeTime.slice(0, 5)}`,
      },
      message: "Pickup scheduled successfully. You will receive a confirmation email shortly.",
    };

    return createdResponse(responseData, noCacheHeaders);
  } catch (error) {
    console.error("Unexpected error scheduling pickup:", error);
    if (error instanceof Error) {
      return errors.internal(error.message);
    }
    return errors.internal("Failed to schedule pickup");
  }
}

/**
 * GET /api/shipments/[id]/pickup
 * Get pickup information for a shipment
 */
export async function GET(
  _request: Request,
  context: RouteContext
): Promise<NextResponse> {
  const { id } = await context.params;

  // Validate shipment ID
  const idValidation = shipmentIdParamSchema.safeParse({ id });
  if (!idValidation.success) {
    return errors.shipmentNotFound();
  }

  try {
    const supabase = await createClient();

    // Fetch shipment with pickup info
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("id, pickup_id, status")
      .eq("id", id)
      .single();

    if (shipmentError) {
      if (shipmentError.code === "PGRST116") {
        return errors.shipmentNotFound();
      }
      console.error("Failed to fetch shipment:", shipmentError);
      return errors.database("Failed to fetch shipment");
    }

    const typedShipment = shipment as Shipment;

    if (!typedShipment.pickup_id) {
      return successResponse(
        {
          pickup: null,
          message: "No pickup scheduled for this shipment",
        },
        200,
        noCacheHeaders
      );
    }

    // Fetch pickup details with related records
    const { data: pickup, error: pickupError } = await supabase
      .from("pickup_details")
      .select("*")
      .eq("id", typedShipment.pickup_id)
      .single();

    if (pickupError) {
      console.error("Failed to fetch pickup details:", pickupError);
      return errors.database("Failed to fetch pickup information");
    }

    // Fetch contacts
    const { data: contacts } = await supabase
      .from("pickup_contacts")
      .select("*")
      .eq("pickup_id", typedShipment.pickup_id);

    // Fetch equipment needs
    const { data: equipment } = await supabase
      .from("pickup_equipment_needs")
      .select("*")
      .eq("pickup_id", typedShipment.pickup_id);

    return successResponse(
      {
        pickup,
        contacts: contacts || [],
        equipment: equipment || [],
        shipment_status: typedShipment.status,
      },
      200,
      noCacheHeaders
    );
  } catch (error) {
    console.error("Unexpected error fetching pickup:", error);
    return errors.internal("Failed to fetch pickup information");
  }
}
