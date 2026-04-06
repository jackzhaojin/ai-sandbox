/**
 * B2B Postal Checkout Flow - Quote Selection API Endpoint
 * POST /api/quote/select - Select a quote for a shipment
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
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schema for quote selection request
const quoteSelectSchema = z.object({
  shipment_id: z.string().uuid('Invalid shipment ID'),
  quote_id: z.string().uuid('Invalid quote ID'),
});

export type QuoteSelectRequest = z.infer<typeof quoteSelectSchema>;

export interface QuoteSelectData {
  shipment_id: string;
  quote_id: string;
  carrier_id: string;
  service_type_id: string;
  total_cost: number;
  currency: string;
  estimated_delivery: string;
  message: string;
}

/**
 * POST /api/quote/select
 * Select a quote for a shipment
 * 
 * Request Body:
 * - shipment_id: string (required) - The shipment to update
 * - quote_id: string (required) - The quote to select
 * 
 * Response:
 * - Success: Selected quote details with shipment update confirmation
 * - Error: Validation or database error
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Parse JSON body
  const parseResult = await parseJsonBody(request);
  if (!parseResult.success) {
    return parseResult.response;
  }

  // Validate request body
  const validationResult = quoteSelectSchema.safeParse(parseResult.data);
  if (!validationResult.success) {
    return zodValidationResponse(validationResult.error);
  }

  const { shipment_id, quote_id } = validationResult.data;

  try {
    const supabase = await createClient();

    // TODO: Get actual user from session once auth is implemented
    const userId = '00000000-0000-0000-0000-000000000000';
    const organizationId = '00000000-0000-0000-0000-000000000000';

    // Verify the shipment exists and belongs to the organization
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id, status, organization_id')
      .eq('id', shipment_id)
      .single();

    if (shipmentError || !shipment) {
      return errors.notFound('Shipment');
    }

    // Verify ownership
    if (shipment.organization_id !== organizationId) {
      return errors.forbidden('You do not have permission to update this shipment');
    }

    // Verify shipment is in a valid state to select a quote
    if (shipment.status === 'delivered' || shipment.status === 'cancelled') {
      return errors.validation(
        'Cannot select quote for a delivered or cancelled shipment',
        { status: ['Shipment status does not allow quote selection'] }
      );
    }

    // Fetch the quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        id,
        shipment_id,
        carrier_id,
        service_type_id,
        total_cost,
        currency,
        estimated_delivery,
        expires_at
      `)
      .eq('id', quote_id)
      .eq('shipment_id', shipment_id)
      .single();

    if (quoteError || !quote) {
      return errors.notFound('Quote');
    }

    // Verify quote hasn't expired
    const now = new Date();
    const expiresAt = new Date(quote.expires_at || now);
    if (expiresAt < now) {
      return errors.validation(
        'Quote has expired',
        { quote_id: ['This quote has expired. Please recalculate quotes.'] }
      );
    }

    // Begin transaction: deselect all quotes for this shipment, then select the chosen one
    // First, deselect all quotes for this shipment
    const { error: deselectError } = await supabase
      .from('quotes')
      .update({ is_selected: false, updated_at: now.toISOString() })
      .eq('shipment_id', shipment_id);

    if (deselectError) {
      console.error('Failed to deselect quotes:', deselectError);
      return errors.database('Failed to update quote selection');
    }

    // Select the chosen quote
    const { error: selectError } = await supabase
      .from('quotes')
      .update({ is_selected: true, updated_at: now.toISOString() })
      .eq('id', quote_id);

    if (selectError) {
      console.error('Failed to select quote:', selectError);
      return errors.database('Failed to select quote');
    }

    // Update the shipment with selected carrier and service
    const { error: updateShipmentError } = await supabase
      .from('shipments')
      .update({
        carrier_id: quote.carrier_id,
        service_type_id: quote.service_type_id,
        total_cost: quote.total_cost,
        estimated_delivery: quote.estimated_delivery,
        status: 'quoted',
        updated_at: now.toISOString(),
        updated_by: userId,
      })
      .eq('id', shipment_id);

    if (updateShipmentError) {
      console.error('Failed to update shipment:', updateShipmentError);
      return errors.database('Failed to update shipment with selected quote');
    }

    // Build success response
    const responseData: QuoteSelectData = {
      shipment_id,
      quote_id,
      carrier_id: quote.carrier_id,
      service_type_id: quote.service_type_id,
      total_cost: quote.total_cost,
      currency: quote.currency,
      estimated_delivery: quote.estimated_delivery,
      message: 'Quote selected successfully',
    };

    return successResponse(responseData, 200, noCacheHeaders);
  } catch (error) {
    console.error('Unexpected error selecting quote:', error);
    return errors.internal('Failed to select quote');
  }
}

/**
 * GET /api/quote/select
 * Method not allowed - quote selection must be via POST
 */
export async function GET(): Promise<NextResponse> {
  return errors.methodNotAllowed(['POST']);
}
