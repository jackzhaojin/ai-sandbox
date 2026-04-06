/**
 * B2B Postal Checkout Flow - Quote API Endpoint
 * POST /api/quote - Calculate shipping quotes with full pricing engine
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
import { calculateAllQuotes, organizeQuotesByCategory, type PricingInput } from '@/lib/pricing/engine';
import { quoteRequestSchema } from '@/lib/validation/quote-schemas';
import type { Quote, Carrier, ServiceType, Address, HandlingType } from '@/types/database';

export const dynamic = 'force-dynamic';

/**
 * POST /api/quote
 * Calculate shipping quotes for a shipment
 * 
 * Request Body:
 * - shipment_id: string (optional) - Existing shipment to use addresses from
 * - sender_address_id: string (required if no shipment_id)
 * - recipient_address_id: string (required if no shipment_id)
 * - package: { weight, length, width, height }
 * - declared_value: number (optional)
 * - special_handling: HandlingType[] (optional)
 * - signature_required: boolean (optional)
 * - adult_signature_required: boolean (optional)
 * 
 * Response:
 * - quotes: Organized by category (ground, air, freight, express, international)
 * - Each quote includes full pricing breakdown and carbon footprint
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Parse JSON body
  const parseResult = await parseJsonBody(request);
  if (!parseResult.success) {
    return parseResult.response;
  }

  // Validate request body
  const validationResult = quoteRequestSchema.safeParse(parseResult.data);
  if (!validationResult.success) {
    return zodValidationResponse(validationResult.error);
  }

  const data = validationResult.data;

  try {
    const supabase = await createClient();

    // TODO: Get actual user from session once auth is implemented
    const userId = '00000000-0000-0000-0000-000000000000';
    const organizationId = '00000000-0000-0000-0000-000000000000';

    let senderAddress: Address | null = null;
    let recipientAddress: Address | null = null;
    let existingShipmentId: string | null = null;

    // If shipment_id provided, fetch addresses from shipment
    if (data.shipment_id) {
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .select('sender_address_id, recipient_address_id')
        .eq('id', data.shipment_id)
        .single();

      if (shipmentError || !shipment) {
        return errors.notFound('Shipment');
      }

      existingShipmentId = data.shipment_id;
      const shipmentData = shipment as { sender_address_id: string; recipient_address_id: string };

      // Fetch sender address
      const { data: senderAddr } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', shipmentData.sender_address_id)
        .single();
      senderAddress = senderAddr as Address | null;

      // Fetch recipient address
      const { data: recipientAddr } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', shipmentData.recipient_address_id)
        .single();
      recipientAddress = recipientAddr as Address | null;
    } else {
      // Use provided address IDs
      if (data.sender_address_id) {
        const { data: senderAddr } = await supabase
          .from('addresses')
          .select('*')
          .eq('id', data.sender_address_id)
          .single();
        senderAddress = senderAddr as Address | null;
      }

      if (data.recipient_address_id) {
        const { data: recipientAddr } = await supabase
          .from('addresses')
          .select('*')
          .eq('id', data.recipient_address_id)
          .single();
        recipientAddress = recipientAddr as Address | null;
      }
    }

    if (!senderAddress) {
      return errors.validation('Sender address not found', { sender_address_id: ['Invalid address ID'] });
    }

    if (!recipientAddress) {
      return errors.validation('Recipient address not found', { recipient_address_id: ['Invalid address ID'] });
    }

    // Fetch all active carriers
    const { data: carriers, error: carriersError } = await supabase
      .from('carriers')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (carriersError) {
      console.error('Failed to fetch carriers:', carriersError);
      return errors.database('Failed to fetch carriers');
    }

    // Fetch all active service types
    const { data: serviceTypes, error: serviceTypesError } = await supabase
      .from('service_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (serviceTypesError) {
      console.error('Failed to fetch service types:', serviceTypesError);
      return errors.database('Failed to fetch service types');
    }

    // Build pricing input
    const pricingInput: PricingInput = {
      senderAddress,
      recipientAddress,
      weight: data.package.weight,
      length: data.package.length,
      width: data.package.width,
      height: data.package.height,
      declaredValue: data.declared_value,
      specialHandling: (data.special_handling || []) as HandlingType[],
      signatureRequired: data.signature_required || false,
      adultSignatureRequired: data.adult_signature_required || false,
    };

    // Calculate all quotes
    const calculatedQuotes = calculateAllQuotes(
      carriers as Carrier[],
      serviceTypes as ServiceType[],
      pricingInput
    );

    // Organize quotes by category
    const quotesByCategory = organizeQuotesByCategory(calculatedQuotes);

    // Persist quotes to database
    const persistedQuotes: Quote[] = [];
    const now = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Quotes expire in 24 hours

    for (const quote of calculatedQuotes) {
      const quoteInsert = {
        shipment_id: existingShipmentId,
        organization_id: organizationId,
        carrier_id: quote.carrierId,
        service_type_id: quote.serviceTypeId,
        weight: data.package.weight,
        length: data.package.length,
        width: data.package.width,
        height: data.package.height,
        base_rate: quote.breakdown.baseRate,
        fuel_surcharge: quote.breakdown.fuelSurcharge,
        residential_fee: quote.breakdown.residentialFee,
        extended_area_fee: quote.breakdown.extendedAreaFee,
        handling_fees: quote.breakdown.handlingFees,
        insurance_cost: quote.breakdown.insuranceCost,
        total_cost: quote.breakdown.total,
        currency: quote.currency,
        estimated_delivery: quote.estimatedDelivery.toISOString(),
        is_selected: false,
        expires_at: expiresAt.toISOString(),
      };

      const { data: persistedQuote, error: insertError } = await supabase
        .from('quotes')
        .insert(quoteInsert as unknown as never)
        .select()
        .single();

      if (insertError) {
        console.error('Failed to persist quote:', insertError);
        // Continue even if one quote fails to persist
      } else {
        persistedQuotes.push(persistedQuote as Quote);
      }
    }

    // Build response
    const responseData = {
      quotes: quotesByCategory.map(category => ({
        category: category.category,
        display_name: category.displayName,
        count: category.quotes.length,
        quotes: category.quotes.map(quote => ({
          // Quote identifiers
          carrier_id: quote.carrierId,
          service_type_id: quote.serviceTypeId,
          
          // Carrier info
          carrier: {
            code: quote.carrier.code,
            name: quote.carrier.name,
            display_name: quote.carrier.display_name,
            logo_url: quote.carrier.logo_url,
            reliability_rating: quote.carrier.reliability_rating,
            speed_rating: quote.carrier.speed_rating,
            value_rating: quote.carrier.value_rating,
          },
          
          // Service info
          service: {
            code: quote.serviceType.code,
            name: quote.serviceType.name,
            display_name: quote.serviceType.display_name,
            description: quote.serviceType.description,
            category: quote.serviceType.category,
            is_trackable: quote.serviceType.is_trackable,
            is_insurable: quote.serviceType.is_insurable,
            min_delivery_days: quote.serviceType.min_delivery_days,
            max_delivery_days: quote.serviceType.max_delivery_days,
          },
          
          // Pricing breakdown
          pricing: {
            base_rate: quote.breakdown.baseRate,
            weight_charge: quote.breakdown.weightCharge,
            zone_charge: quote.breakdown.zoneCharge,
            fuel_surcharge: quote.breakdown.fuelSurcharge,
            residential_fee: quote.breakdown.residentialFee,
            extended_area_fee: quote.breakdown.extendedAreaFee,
            handling_fees: quote.breakdown.handlingFees,
            insurance_cost: quote.breakdown.insuranceCost,
            delivery_confirmation_fee: quote.breakdown.deliveryConfirmationFee,
            subtotal: quote.breakdown.subtotal,
            taxes: quote.breakdown.taxes,
            total: quote.breakdown.total,
            currency: quote.currency,
          },
          
          // Delivery estimate
          estimated_delivery: quote.estimatedDelivery.toISOString(),
          
          // Environmental impact
          carbon_footprint: {
            kg_co2: quote.carbonFootprint,
            distance_km: Math.round(
              Math.abs(
                (senderAddress.postal_code.charCodeAt(0) - recipientAddress.postal_code.charCodeAt(0)) * 500
              )
            ),
          },
        })),
      })),
      summary: {
        total_quotes: calculatedQuotes.length,
        categories: quotesByCategory.length,
        cheapest_quote: calculatedQuotes.length > 0 ? {
          carrier: calculatedQuotes[0].carrier.display_name,
          service: calculatedQuotes[0].serviceType.display_name,
          total: calculatedQuotes[0].breakdown.total,
        } : null,
        fastest_quote: calculatedQuotes.length > 0 
          ? calculatedQuotes
              .filter(q => q.serviceType.min_delivery_days !== null)
              .sort((a, b) => (a.serviceType.min_delivery_days || 99) - (b.serviceType.min_delivery_days || 99))[0]
          : null,
        persisted_count: persistedQuotes.length,
      },
      meta: {
        calculated_at: now,
        expires_at: expiresAt.toISOString(),
        shipment_id: existingShipmentId,
      },
    };

    return successResponse(responseData, 200, noCacheHeaders);
  } catch (error) {
    console.error('Unexpected error calculating quotes:', error);
    return errors.internal('Failed to calculate quotes');
  }
}

/**
 * GET /api/quote
 * Method not allowed - quotes must be calculated via POST
 */
export async function GET(): Promise<NextResponse> {
  return errors.methodNotAllowed(['POST']);
}
