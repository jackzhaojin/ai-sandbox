/**
 * B2B Postal Checkout Flow - Shipments API
 * POST /api/shipments - Create new draft shipment
 * GET /api/shipments - List shipments (for future use)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createdResponse,
  errors,
  parseJsonBody,
  zodValidationResponse,
  noCacheHeaders,
} from '@/lib/api/response';
import { createShipmentSchema } from '@/lib/validation/api-schemas';
import type { CreateShipmentData } from '@/types/api';
import type { Shipment } from '@/types/database';

export const dynamic = 'force-dynamic';

/**
 * POST /api/shipments
 * Creates a new draft shipment
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Parse JSON body
  const parseResult = await parseJsonBody(request);
  if (!parseResult.success) {
    return parseResult.response;
  }

  // Validate request body
  const validationResult = createShipmentSchema.safeParse(parseResult.data);
  if (!validationResult.success) {
    return zodValidationResponse(validationResult.error);
  }

  const data = validationResult.data;

  try {
    const supabase = await createClient();

    // TODO: Get actual user from session once auth is implemented
    // For now, we'll use a placeholder that will be replaced
    const userId = '00000000-0000-0000-0000-000000000000';
    const organizationId = '00000000-0000-0000-0000-000000000000';

    // Prepare shipment insert data
    const shipmentInsert = {
      organization_id: organizationId,
      user_id: userId,
      status: 'draft' as const,
      currency: 'USD',
      fuel_surcharge: 0,
      insurance_cost: 0,
      handling_fees: 0,
      taxes: 0,
      
      // Sender info
      sender_address_id: data.sender_address_id ?? null,
      sender_contact_name: data.sender_contact_name ?? '',
      sender_contact_phone: data.sender_contact_phone ?? null,
      sender_contact_email: data.sender_contact_email ?? null,
      
      // Recipient info
      recipient_address_id: data.recipient_address_id ?? null,
      recipient_contact_name: data.recipient_contact_name ?? '',
      recipient_contact_phone: data.recipient_contact_phone ?? null,
      recipient_contact_email: data.recipient_contact_email ?? null,
      
      // Package details
      package_type: data.package_type ?? 'box',
      weight: data.weight ?? 0,
      length: data.length ?? 0,
      width: data.width ?? 0,
      height: data.height ?? 0,
      declared_value: data.declared_value ?? null,
      contents_description: data.contents_description ?? '',
      
      // Shipping options
      carrier_id: data.carrier_id ?? null,
      service_type_id: data.service_type_id ?? null,
      
      // Reference numbers
      reference_number: data.reference_number ?? null,
      po_number: data.po_number ?? null,
    };

    // Insert shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert(shipmentInsert as unknown as never)
      .select()
      .single();

    if (shipmentError) {
      console.error('Failed to create shipment:', shipmentError);
      return errors.database('Failed to create shipment');
    }

    const typedShipment = shipment as Shipment;

    // Insert special handling if provided
    if (data.special_handling && data.special_handling.length > 0) {
      const handlingInserts = data.special_handling.map((h) => ({
        shipment_id: typedShipment.id,
        handling_type: h.handling_type,
        is_applied: true,
        fee: 0, // Fees calculated later
        instructions: h.instructions ?? null,
      }));

      const { error: handlingError } = await supabase
        .from('shipment_special_handling')
        .insert(handlingInserts as unknown as never);

      if (handlingError) {
        console.error('Failed to insert special handling:', handlingError);
        // Don't fail the request, just log the error
      }
    }

    // Insert delivery preferences if provided
    if (data.delivery_preferences) {
      const prefs = data.delivery_preferences;
      const prefsInsert = {
        shipment_id: typedShipment.id,
        delivery_date: null as string | null,
        delivery_time_start: null as string | null,
        delivery_time_end: null as string | null,
        saturday_delivery: prefs.saturday_delivery ?? false,
        sunday_delivery: prefs.sunday_delivery ?? false,
        hold_at_facility: false,
        hold_facility_address_id: null as string | null,
        leave_without_signature: prefs.leave_without_signature ?? false,
        signature_required: prefs.signature_required ?? false,
        adult_signature_required: prefs.adult_signature_required ?? false,
        delivery_instructions: prefs.delivery_instructions ?? null,
      };

      const { error: prefsError } = await supabase
        .from('shipment_delivery_preferences')
        .insert(prefsInsert as unknown as never);

      if (prefsError) {
        console.error('Failed to insert delivery preferences:', prefsError);
        // Don't fail the request, just log the error
      }
    }

    // Insert hazmat details if provided
    if (data.hazmat) {
      const hazmatInsert = {
        shipment_id: typedShipment.id,
        is_hazmat: data.hazmat.is_hazmat,
        hazmat_class: data.hazmat.hazmat_class ?? null,
        un_number: data.hazmat.un_number ?? null,
        proper_shipping_name: data.hazmat.proper_shipping_name ?? null,
        hazard_class: null as string | null,
        packing_group: null as string | null,
        quantity: null as number | null,
        unit_of_measure: null as string | null,
        emergency_contact_name: null as string | null,
        emergency_contact_phone: null as string | null,
        technical_name: null as string | null,
        subsidiary_risk: null as string | null,
        limited_quantity: false,
        reportable_quantity: false,
      };

      const { error: hazmatError } = await supabase
        .from('hazmat_details')
        .insert(hazmatInsert as unknown as never);

      if (hazmatError) {
        console.error('Failed to insert hazmat details:', hazmatError);
        // Don't fail the request, just log the error
      }
    }

    const responseData: CreateShipmentData = {
      shipment: typedShipment,
      message: 'Shipment created successfully',
    };

    return createdResponse(responseData, noCacheHeaders);
  } catch (error) {
    console.error('Unexpected error creating shipment:', error);
    return errors.internal('Failed to create shipment');
  }
}

/**
 * GET /api/shipments
 * List shipments (placeholder for future implementation)
 */
export async function GET(): Promise<NextResponse> {
  // For now, return method not allowed
  // This will be implemented in a future step
  return errors.methodNotAllowed(['POST']);
}
