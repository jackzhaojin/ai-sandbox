/**
 * B2B Postal Checkout Flow - Shipment Submission API
 * POST /api/shipments/[id]/submit - Submit a shipment for processing
 * 
 * Features:
 * - Validates terms_accepted and acknowledgments
 * - Runs cross-step validation
 * - Generates confirmation number (format: SHP-YYYY-XXXXXX)
 * - Sets shipments.status to 'confirmed'
 * - Sets shipments.submitted_at timestamp
 * - Creates 'submitted' event in shipment_events
 * - Calculates estimated delivery date based on pickup date + transit days + weekend adjustment
 * - Returns confirmation response with tracking info, carrier details, and cost breakdown
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
import { submitShipmentSchema, shipmentIdParamSchema } from "@/lib/validation/api-schemas";
import type { SubmitShipmentData } from "@/types/api";
import type { Shipment, ShipmentEvent, PickupDetails, Carrier, ServiceType, Address } from "@/types/database";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================
// CONSTANTS
// ============================================

const INSURANCE_THRESHOLD = 2500;

// Tracking availability window (2-4 hours after submission)
const TRACKING_MIN_HOURS = 2;
const TRACKING_MAX_HOURS = 4;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate confirmation number
 * Format: SHP-YYYY-XXXXXX (6-digit sequential number)
 */
function generateConfirmationNumber(year: number, sequence: number): string {
  return `SHP-${year}-${String(sequence).padStart(6, "0")}`;
}

/**
 * Calculate tracking availability time (2-4 hours from now)
 */
function calculateTrackingAvailableAt(): string {
  const now = new Date();
  // Random hours between 2 and 4
  const hoursToAdd = TRACKING_MIN_HOURS + Math.random() * (TRACKING_MAX_HOURS - TRACKING_MIN_HOURS);
  const trackingTime = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  return trackingTime.toISOString();
}

/**
 * Check if a date is a weekend
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Add business days to a date (skipping weekends)
 */
function addBusinessDays(startDate: Date, days: number): Date {
  const result = new Date(startDate);
  let daysAdded = 0;
  
  while (daysAdded < days) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) {
      daysAdded++;
    }
  }
  
  return result;
}

/**
 * Calculate estimated delivery date
 * Based on pickup date + transit days + weekend adjustment
 */
function calculateEstimatedDelivery(
  pickupDate: string,
  minTransitDays: number,
  maxTransitDays: number
): { estimatedDate: string; transitDays: number } {
  const pickup = new Date(pickupDate);
  
  // Use average of min and max for estimate, or min if max not available
  const transitDays = maxTransitDays > 0 
    ? Math.round((minTransitDays + maxTransitDays) / 2)
    : minTransitDays;
  
  // Add business days (skipping weekends)
  const estimatedDelivery = addBusinessDays(pickup, transitDays);
  
  return {
    estimatedDate: estimatedDelivery.toISOString(),
    transitDays,
  };
}

/**
 * Validate that all required terms are accepted
 */
function validateTermsAccepted(
  terms: {
    declaredValueAccurate: boolean;
    insuranceUnderstanding: boolean;
    contentsComply: boolean;
    carrierAuthorized: boolean;
    hazmatCertificationAccurate: boolean;
  },
  declaredValue: number,
  isHazmat: boolean
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!terms.declaredValueAccurate) {
    missing.push("declared_value_accurate");
  }

  if (!terms.contentsComply) {
    missing.push("contents_comply");
  }

  if (!terms.carrierAuthorized) {
    missing.push("carrier_authorized");
  }

  // Insurance understanding required for high-value shipments
  if (declaredValue >= INSURANCE_THRESHOLD && !terms.insuranceUnderstanding) {
    missing.push("insurance_understanding");
  }

  // Hazmat certification required for hazmat shipments
  if (isHazmat && !terms.hazmatCertificationAccurate) {
    missing.push("hazmat_certification_accurate");
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Run cross-step validation
 * Validates that all required steps are complete before submission
 */
async function runCrossStepValidation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shipment: Shipment
): Promise<{ valid: boolean; errors: string[] }> {
  const validationErrors: string[] = [];

  // Check 1: Shipment has sender and recipient addresses
  if (!shipment.sender_address_id) {
    validationErrors.push("Sender address is required");
  }
  if (!shipment.recipient_address_id) {
    validationErrors.push("Recipient address is required");
  }

  // Check 2: Shipment has carrier and service selected
  if (!shipment.carrier_id) {
    validationErrors.push("Carrier selection is required");
  }
  if (!shipment.service_type_id) {
    validationErrors.push("Service type selection is required");
  }

  // Check 3: Shipment has payment method set
  if (!shipment.payment_id) {
    validationErrors.push("Payment method is required");
  }

  // Check 4: Shipment has pickup scheduled
  if (!shipment.pickup_id) {
    validationErrors.push("Pickup scheduling is required");
  }

  // Check 5: Shipment has cost calculated
  if (!shipment.total_cost || shipment.total_cost <= 0) {
    validationErrors.push("Shipment cost must be calculated");
  }

  // Check 6: Verify pickup is in the future
  if (shipment.pickup_id) {
    const { data: pickup } = await supabase
      .from("pickup_details")
      .select("pickup_date")
      .eq("id", shipment.pickup_id)
      .single();

    if (pickup) {
      const pickupDate = new Date(pickup.pickup_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (pickupDate < today) {
        validationErrors.push("Pickup date must be in the future");
      }
    }
  }

  return {
    valid: validationErrors.length === 0,
    errors: validationErrors,
  };
}

// ============================================
// MAIN HANDLER
// ============================================

/**
 * POST /api/shipments/[id]/submit
 * Submit a shipment for processing
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
  const validationResult = submitShipmentSchema.safeParse(parseResult.data);
  if (!validationResult.success) {
    return zodValidationResponse(validationResult.error);
  }

  const data = validationResult.data;

  try {
    const supabase = await createClient();

    // ============================================
    // 1. Fetch complete shipment data
    // ============================================
    const [
      shipmentResult,
      hazmatResult,
      pickupResult,
    ] = await Promise.all([
      supabase
        .from("shipments")
        .select("*")
        .eq("id", id)
        .single(),
      supabase
        .from("hazmat_details")
        .select("is_hazmat")
        .eq("shipment_id", id)
        .maybeSingle(),
      supabase
        .from("pickup_details")
        .select("pickup_date")
        .eq("shipment_id", id)
        .maybeSingle(),
    ]);

    if (shipmentResult.error) {
      if (shipmentResult.error.code === "PGRST116") {
        return errors.shipmentNotFound();
      }
      console.error("Failed to fetch shipment:", shipmentResult.error);
      return errors.database("Failed to fetch shipment");
    }

    const shipment = shipmentResult.data as Shipment;
    const isHazmat = hazmatResult.data?.is_hazmat ?? false;
    const pickupDate = pickupResult.data?.pickup_date;

    // ============================================
    // 2. Check shipment status
    // ============================================
    const validStatusesForSubmission = ["draft", "pending_payment", "paid", "label_generated"];
    if (!validStatusesForSubmission.includes(shipment.status)) {
      return errors.cannotUpdateShipment(
        `Shipments with status '${shipment.status}' cannot be submitted`
      );
    }

    // ============================================
    // 3. Validate terms_accepted
    // ============================================
    const declaredValue = shipment.declared_value ?? 0;
    const termsValidation = validateTermsAccepted(
      data.terms_accepted,
      declaredValue,
      isHazmat
    );

    if (!termsValidation.valid) {
      return errors.validation(
        "All required terms must be accepted",
        { terms: [`Missing required terms: ${termsValidation.missing.join(", ")}`] }
      );
    }

    // ============================================
    // 4. Run cross-step validation
    // ============================================
    const crossStepValidation = await runCrossStepValidation(supabase, shipment);
    if (!crossStepValidation.valid) {
      return errors.validation(
        "Shipment validation failed",
        { validation: crossStepValidation.errors }
      );
    }

    // ============================================
    // 5. Generate confirmation number
    // ============================================
    const now = new Date();
    const year = now.getFullYear();
    
    // Get count of confirmed shipments this year for sequence number
    const { count } = await supabase
      .from("shipments")
      .select("*", { count: "exact", head: true })
      .like("confirmation_number", `SHP-${year}-%`);
    
    const sequence = (count ?? 0) + 1;
    const confirmationNumber = generateConfirmationNumber(year, sequence);

    // ============================================
    // 6. Fetch carrier and service info for response
    // ============================================
    const [
      carrierResult,
      serviceResult,
      senderAddressResult,
      recipientAddressResult,
    ] = await Promise.all([
      shipment.carrier_id
        ? supabase.from("carriers").select("*").eq("id", shipment.carrier_id).single()
        : Promise.resolve({ data: null, error: null }),
      shipment.service_type_id
        ? supabase.from("service_types").select("*").eq("id", shipment.service_type_id).single()
        : Promise.resolve({ data: null, error: null }),
      supabase.from("addresses").select("*").eq("id", shipment.sender_address_id).single(),
      supabase.from("addresses").select("*").eq("id", shipment.recipient_address_id).single(),
    ]);

    const carrier = carrierResult.data as Carrier | null;
    const serviceType = serviceResult.data as ServiceType | null;

    // ============================================
    // 7. Calculate estimated delivery date
    // ============================================
    const minTransitDays = serviceType?.min_delivery_days ?? 1;
    const maxTransitDays = serviceType?.max_delivery_days ?? minTransitDays;
    
    const deliveryCalculation = pickupDate
      ? calculateEstimatedDelivery(pickupDate, minTransitDays, maxTransitDays)
      : { estimatedDate: new Date(Date.now() + minTransitDays * 24 * 60 * 60 * 1000).toISOString(), transitDays: minTransitDays };

    // ============================================
    // 8. Calculate tracking availability
    // ============================================
    const trackingAvailableAt = calculateTrackingAvailableAt();

    // ============================================
    // 9. Update shipment with confirmation data
    // ============================================
    const submittedAt = now.toISOString();
    
    const { error: updateError } = await supabase
      .from("shipments")
      .update({
        confirmation_number: confirmationNumber,
        status: "confirmed",
        submitted_at: submittedAt,
        confirmed_at: submittedAt,
        estimated_delivery: deliveryCalculation.estimatedDate,
        updated_at: submittedAt,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update shipment:", updateError);
      return errors.database("Failed to confirm shipment");
    }

    // ============================================
    // 10. Create 'submitted' event in shipment_events
    // ============================================
    const eventData: Omit<ShipmentEvent, "id" | "created_at"> = {
      shipment_id: id,
      event_code: "submitted",
      event_name: "Shipment Submitted",
      event_description: `Shipment submitted for processing. Confirmation number: ${confirmationNumber}`,
      location_city: senderAddressResult.data?.city ?? null,
      location_state: senderAddressResult.data?.state ?? null,
      location_country: senderAddressResult.data?.country ?? null,
      location_postal_code: senderAddressResult.data?.postal_code ?? null,
      occurred_at: submittedAt,
      recorded_at: submittedAt,
      carrier_status_code: null,
      carrier_status_description: null,
      raw_data: {
        confirmation_number: confirmationNumber,
        terms_accepted: data.terms_accepted,
        acknowledgments: data.acknowledgments,
        client_info: data.client_info,
      },
      is_internal: false,
      created_by: shipment.user_id,
    };

    const { error: eventError } = await supabase
      .from("shipment_events")
      .insert(eventData);

    if (eventError) {
      console.error("Failed to create shipment event:", eventError);
      // Don't fail the request, just log the error
    }

    // ============================================
    // 11. Build and return confirmation response
    // ============================================
    const responseData: SubmitShipmentData = {
      confirmation: {
        confirmation_number: confirmationNumber,
        shipment_id: id,
        status: "confirmed",
        submitted_at: submittedAt,
      },
      tracking: {
        tracking_number: null, // Will be assigned after label generation
        tracking_available_at: trackingAvailableAt,
      },
      delivery: {
        estimated_delivery: deliveryCalculation.estimatedDate,
        transit_days: deliveryCalculation.transitDays,
        pickup_date: pickupDate ?? submittedAt,
      },
      carrier: {
        id: carrier?.id ?? "",
        name: carrier?.name ?? "",
        display_name: carrier?.display_name ?? "",
        service: {
          id: serviceType?.id ?? "",
          name: serviceType?.name ?? "",
          display_name: serviceType?.display_name ?? "",
        },
      },
      cost: {
        total: shipment.total_cost ?? 0,
        currency: shipment.currency,
        breakdown: {
          base_rate: shipment.base_rate ?? 0,
          fuel_surcharge: shipment.fuel_surcharge,
          insurance_cost: shipment.insurance_cost,
          handling_fees: shipment.handling_fees,
          taxes: shipment.taxes,
        },
      },
      message: `Shipment submitted successfully. Your confirmation number is ${confirmationNumber}.`,
    };

    return createdResponse(responseData, noCacheHeaders);
  } catch (error) {
    console.error("Unexpected error submitting shipment:", error);
    if (error instanceof Error) {
      return errors.internal(error.message);
    }
    return errors.internal("Failed to submit shipment");
  }
}

/**
 * GET /api/shipments/[id]/submit
 * Get submission eligibility status for a shipment
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

    // Fetch shipment with related data
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("id, status, total_cost, declared_value, carrier_id, service_type_id, payment_id, pickup_id")
      .eq("id", id)
      .single();

    if (shipmentError) {
      if (shipmentError.code === "PGRST116") {
        return errors.shipmentNotFound();
      }
      return errors.database("Failed to fetch shipment");
    }

    const typedShipment = shipment as Shipment;

    // Check if already submitted
    if (typedShipment.status === "confirmed") {
      return successResponse(
        {
          eligible: false,
          reason: "Shipment has already been submitted",
          status: typedShipment.status,
        },
        200,
        noCacheHeaders
      );
    }

    // Run validation to check eligibility
    const validation = await runCrossStepValidation(supabase, typedShipment);

    // Check hazmat status
    const { data: hazmat } = await supabase
      .from("hazmat_details")
      .select("is_hazmat")
      .eq("shipment_id", id)
      .maybeSingle();

    return successResponse(
      {
        eligible: validation.valid,
        validation_errors: validation.errors,
        requirements: {
          terms_accepted: true,
          insurance_required: (typedShipment.declared_value ?? 0) >= INSURANCE_THRESHOLD,
          hazmat_certification_required: hazmat?.is_hazmat ?? false,
        },
        status: typedShipment.status,
      },
      200,
      noCacheHeaders
    );
  } catch (error) {
    console.error("Unexpected error checking submission eligibility:", error);
    return errors.internal("Failed to check submission eligibility");
  }
}
