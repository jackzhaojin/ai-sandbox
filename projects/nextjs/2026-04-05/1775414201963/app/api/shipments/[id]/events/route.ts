/**
 * B2B Postal Checkout Flow - Shipment Events API
 * POST /api/shipments/[id]/events - Create a shipment event
 * GET /api/shipments/[id]/events - List shipment events
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createdResponse,
  successResponse,
  errors,
  parseJsonBody,
  zodValidationResponse,
  noCacheHeaders,
} from '@/lib/api/response';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * Event creation schema
 */
const createEventSchema = z.object({
  event_code: z.string().min(1).max(50),
  event_name: z.string().min(1).max(100),
  event_description: z.string().optional(),
  location_city: z.string().optional(),
  location_state: z.string().optional(),
  location_country: z.string().optional(),
  location_postal_code: z.string().optional(),
  carrier_status_code: z.string().optional(),
  carrier_status_description: z.string().optional(),
  raw_data: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  is_internal: z.boolean().default(true),
});

/**
 * POST /api/shipments/[id]/events
 * Create a new shipment event (for step tracking, etc.)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: shipmentId } = await params;

  // Parse JSON body
  const parseResult = await parseJsonBody(request);
  if (!parseResult.success) {
    return parseResult.response;
  }

  // Validate request body
  const validationResult = createEventSchema.safeParse(parseResult.data);
  if (!validationResult.success) {
    return zodValidationResponse(validationResult.error);
  }

  const data = validationResult.data;

  try {
    const supabase = await createClient();

    // Verify shipment exists
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id')
      .eq('id', shipmentId)
      .single();

    if (shipmentError || !shipment) {
      return errors.notFound('Shipment not found');
    }

    // TODO: Get actual user from session once auth is implemented
    const userId = '00000000-0000-0000-0000-000000000000';

    // Insert event
    const { data: event, error: eventError } = await supabase
      .from('shipment_events')
      .insert({
        shipment_id: shipmentId,
        event_code: data.event_code,
        event_name: data.event_name,
        event_description: data.event_description ?? null,
        location_city: data.location_city ?? null,
        location_state: data.location_state ?? null,
        location_country: data.location_country ?? null,
        location_postal_code: data.location_postal_code ?? null,
        carrier_status_code: data.carrier_status_code ?? null,
        carrier_status_description: data.carrier_status_description ?? null,
        raw_data: data.raw_data ?? data.metadata ?? null,
        is_internal: data.is_internal,
        created_by: userId,
        occurred_at: new Date().toISOString(),
      } as unknown as never)
      .select()
      .single();

    if (eventError) {
      console.error('Failed to create event:', eventError);
      return errors.database('Failed to create event');
    }

    return createdResponse({ event }, noCacheHeaders);
  } catch (error) {
    console.error('Unexpected error creating event:', error);
    return errors.internal('Failed to create event');
  }
}

/**
 * GET /api/shipments/[id]/events
 * List events for a shipment
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: shipmentId } = await params;

  try {
    const supabase = await createClient();

    // Verify shipment exists
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id')
      .eq('id', shipmentId)
      .single();

    if (shipmentError || !shipment) {
      return errors.notFound('Shipment not found');
    }

    // Fetch events
    const { data: events, error: eventsError } = await supabase
      .from('shipment_events')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Failed to fetch events:', eventsError);
      return errors.database('Failed to fetch events');
    }

    return successResponse({ events: events ?? [] }, noCacheHeaders);
  } catch (error) {
    console.error('Unexpected error fetching events:', error);
    return errors.internal('Failed to fetch events');
  }
}
