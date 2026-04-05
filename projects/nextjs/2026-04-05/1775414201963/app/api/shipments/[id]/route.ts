/**
 * B2B Postal Checkout Flow - Shipment Detail API
 * GET /api/shipments/[id] - Fetch complete shipment with all related data
 * PATCH /api/shipments/[id] - Update shipment (used for step progression)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  successResponse,
  errors,
  parseJsonBody,
  zodValidationResponse,
  noCacheHeaders,
} from '@/lib/api/response';
import { updateShipmentSchema, shipmentIdParamSchema } from '@/lib/validation/api-schemas';
import type { ShipmentDetailData, UpdateShipmentData } from '@/types/api';
import type { Shipment, Address, ShipmentPackage, ShipmentSpecialHandling, ShipmentDeliveryPreferences, HazmatDetails, Quote, PaymentInfo } from '@/types/database';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/shipments/[id]
 * Fetch complete shipment with all related data
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

    // Fetch shipment with all related data in parallel
    const [
      shipmentResult,
      packagesResult,
      handlingResult,
      prefsResult,
      hazmatResult,
      quotesResult,
    ] = await Promise.all([
      // Main shipment
      supabase
        .from('shipments')
        .select('*')
        .eq('id', id)
        .single(),
      
      // Packages
      supabase
        .from('shipment_packages')
        .select('*')
        .eq('shipment_id', id),
      
      // Special handling
      supabase
        .from('shipment_special_handling')
        .select('*')
        .eq('shipment_id', id),
      
      // Delivery preferences
      supabase
        .from('shipment_delivery_preferences')
        .select('*')
        .eq('shipment_id', id)
        .maybeSingle(),
      
      // Hazmat details
      supabase
        .from('hazmat_details')
        .select('*')
        .eq('shipment_id', id)
        .maybeSingle(),
      
      // Quotes
      supabase
        .from('quotes')
        .select('*')
        .eq('shipment_id', id),
    ]);

    if (shipmentResult.error) {
      if (shipmentResult.error.code === 'PGRST116') {
        return errors.shipmentNotFound();
      }
      console.error('Failed to fetch shipment:', shipmentResult.error);
      return errors.database('Failed to fetch shipment');
    }

    const shipment = shipmentResult.data as Shipment;

    // Fetch sender and recipient addresses
    const [senderAddressResult, recipientAddressResult, paymentInfoResult] = await Promise.all([
      supabase
        .from('addresses')
        .select('*')
        .eq('id', shipment.sender_address_id)
        .maybeSingle(),
      
      supabase
        .from('addresses')
        .select('*')
        .eq('id', shipment.recipient_address_id)
        .maybeSingle(),
      
      shipment.payment_id
        ? supabase
            .from('payment_info')
            .select('*')
            .eq('id', shipment.payment_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const emptyAddress: Address = {
      id: '',
      organization_id: '',
      label: '',
      recipient_name: '',
      recipient_phone: null,
      line1: '',
      line2: null,
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
      address_type: 'commercial',
      is_verified: false,
      verification_service: null,
      verification_raw_response: null,
      is_default_shipping: false,
      is_default_billing: false,
      created_at: '',
      updated_at: '',
    };

    const responseData: ShipmentDetailData = {
      shipment,
      sender_address: (senderAddressResult.data as Address | null) ?? emptyAddress,
      recipient_address: (recipientAddressResult.data as Address | null) ?? emptyAddress,
      packages: (packagesResult.data as ShipmentPackage[] | null) ?? [],
      special_handling: (handlingResult.data as ShipmentSpecialHandling[] | null) ?? [],
      delivery_preferences: (prefsResult.data as ShipmentDeliveryPreferences | null) ?? null,
      hazmat_details: (hazmatResult.data as HazmatDetails | null) ?? null,
      quotes: (quotesResult.data as Quote[] | null) ?? [],
      payment_info: (paymentInfoResult.data as PaymentInfo | null) ?? null,
    };

    return successResponse(responseData, 200, noCacheHeaders);
  } catch (error) {
    console.error('Unexpected error fetching shipment:', error);
    return errors.internal('Failed to fetch shipment');
  }
}

/**
 * PATCH /api/shipments/[id]
 * Update shipment (used for step progression)
 */
export async function PATCH(
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
  const validationResult = updateShipmentSchema.safeParse(parseResult.data);
  if (!validationResult.success) {
    return zodValidationResponse(validationResult.error);
  }

  const data = validationResult.data;

  try {
    const supabase = await createClient();

    // First, check if shipment exists and can be updated
    const { data: existingShipment, error: fetchError } = await supabase
      .from('shipments')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return errors.shipmentNotFound();
      }
      console.error('Failed to fetch shipment for update:', fetchError);
      return errors.database('Failed to update shipment');
    }

    const typedExistingShipment = existingShipment as Shipment;

    // Check if shipment can be updated (only draft status)
    const nonEditableStatuses = ['picked_up', 'in_transit', 'delivered', 'cancelled'];
    if (nonEditableStatuses.includes(typedExistingShipment.status)) {
      return errors.cannotUpdateShipment(
        `Shipments with status '${typedExistingShipment.status}' cannot be modified`
      );
    }

    // Build update object with only provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    
    // Sender info
    if (data.sender_address_id !== undefined) updateData.sender_address_id = data.sender_address_id;
    if (data.sender_contact_name !== undefined) updateData.sender_contact_name = data.sender_contact_name;
    if (data.sender_contact_phone !== undefined) updateData.sender_contact_phone = data.sender_contact_phone;
    if (data.sender_contact_email !== undefined) updateData.sender_contact_email = data.sender_contact_email;
    
    // Recipient info
    if (data.recipient_address_id !== undefined) updateData.recipient_address_id = data.recipient_address_id;
    if (data.recipient_contact_name !== undefined) updateData.recipient_contact_name = data.recipient_contact_name;
    if (data.recipient_contact_phone !== undefined) updateData.recipient_contact_phone = data.recipient_contact_phone;
    if (data.recipient_contact_email !== undefined) updateData.recipient_contact_email = data.recipient_contact_email;
    
    // Package details
    if (data.package_type !== undefined) updateData.package_type = data.package_type;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.length !== undefined) updateData.length = data.length;
    if (data.width !== undefined) updateData.width = data.width;
    if (data.height !== undefined) updateData.height = data.height;
    if (data.declared_value !== undefined) updateData.declared_value = data.declared_value;
    if (data.contents_description !== undefined) updateData.contents_description = data.contents_description;
    
    // Shipping options
    if (data.carrier_id !== undefined) updateData.carrier_id = data.carrier_id;
    if (data.service_type_id !== undefined) updateData.service_type_id = data.service_type_id;
    if (data.estimated_delivery !== undefined) updateData.estimated_delivery = data.estimated_delivery;
    if (data.base_rate !== undefined) updateData.base_rate = data.base_rate;
    if (data.fuel_surcharge !== undefined) updateData.fuel_surcharge = data.fuel_surcharge;
    if (data.insurance_cost !== undefined) updateData.insurance_cost = data.insurance_cost;
    if (data.handling_fees !== undefined) updateData.handling_fees = data.handling_fees;
    if (data.taxes !== undefined) updateData.taxes = data.taxes;
    if (data.total_cost !== undefined) updateData.total_cost = data.total_cost;
    
    // Status
    if (data.status !== undefined) updateData.status = data.status;
    
    // Reference numbers
    if (data.reference_number !== undefined) updateData.reference_number = data.reference_number;
    if (data.po_number !== undefined) updateData.po_number = data.po_number;
    if (data.special_instructions !== undefined) updateData.special_instructions = data.special_instructions;
    if (data.internal_notes !== undefined) updateData.internal_notes = data.internal_notes;

    // Update shipment
    const { data: shipment, error: updateError } = await supabase
      .from('shipments')
      .update(updateData as unknown as never)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update shipment:', updateError);
      return errors.database('Failed to update shipment');
    }

    const responseData: UpdateShipmentData = {
      shipment: shipment as Shipment,
      message: 'Shipment updated successfully',
    };

    return successResponse(responseData, 200, noCacheHeaders);
  } catch (error) {
    console.error('Unexpected error updating shipment:', error);
    return errors.internal('Failed to update shipment');
  }
}

/**
 * DELETE /api/shipments/[id]
 * Delete/cancel a shipment
 */
export async function DELETE(
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

    // Check if shipment exists
    const { data: existingShipment, error: fetchError } = await supabase
      .from('shipments')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return errors.shipmentNotFound();
      }
      return errors.database('Failed to delete shipment');
    }

    const typedExistingShipment = existingShipment as Shipment;

    // Only allow deletion of draft shipments
    if (typedExistingShipment.status !== 'draft') {
      return errors.cannotUpdateShipment(
        'Only draft shipments can be deleted'
      );
    }

    // Delete shipment (cascading deletes will handle related records)
    const { error: deleteError } = await supabase
      .from('shipments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete shipment:', deleteError);
      return errors.database('Failed to delete shipment');
    }

    return successResponse({ message: 'Shipment deleted successfully' }, 200, noCacheHeaders);
  } catch (error) {
    console.error('Unexpected error deleting shipment:', error);
    return errors.internal('Failed to delete shipment');
  }
}
