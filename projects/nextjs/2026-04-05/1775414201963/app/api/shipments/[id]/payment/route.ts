/**
 * B2B Postal Checkout Flow - Payment API
 * POST /api/shipments/[id]/payment - Process payment for a shipment
 * 
 * Supports 5 payment methods:
 * - purchase_order: Purchase Order payment
 * - bill_of_lading: Bill of Lading payment
 * - third_party_billing: Third-Party Billing
 * - net_terms: Net Terms (15, 30, 45, 60, 90 days)
 * - corporate_account: Corporate Account
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  successResponse,
  createdResponse,
  errors,
  parseJsonBody,
  zodValidationResponse,
  noCacheHeaders,
} from '@/lib/api/response';
import { paymentRequestSchema, shipmentIdParamSchema } from '@/lib/validation/api-schemas';
import type { PaymentData } from '@/types/api';
import type { PaymentInfo, PaymentPurchaseOrder, PaymentBillOfLading, PaymentThirdParty, PaymentNetTerms, PaymentNetTermsReference, PaymentCorporateAccount, Shipment } from '@/types/database';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================
// PAYMENT METHOD HANDLERS
// ============================================

type PaymentMethodType = 'purchase_order' | 'billing_account' | 'third_party' | 'net_terms' | 'corporate_account';

interface PaymentMethodResult {
  paymentInfoId: string;
  paymentType: PaymentMethodType;
  displayName: string;
}

/**
 * Handle Purchase Order payment method
 */
async function handlePurchaseOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  poData: {
    po_number: string;
    authorized_amount: number;
    po_expiry_date?: string;
    department?: string;
    cost_center?: string;
    gl_account?: string;
    approver_name?: string;
    approver_email?: string;
  }
): Promise<PaymentMethodResult> {
  // Create payment_info record
  const { data: paymentInfo, error: paymentInfoError } = await supabase
    .from('payment_info')
    .insert({
      organization_id: organizationId,
      payment_type: 'purchase_order' as PaymentMethodType,
      display_name: `PO: ${poData.po_number}`,
      is_default: false,
      is_verified: false,
      status: 'pending',
      billing_address_id: null,
    } as Omit<PaymentInfo, 'id' | 'created_at' | 'updated_at'>)
    .select()
    .single();

  if (paymentInfoError) {
    console.error('Failed to create payment_info for PO:', paymentInfoError);
    throw new Error('Failed to create purchase order payment record');
  }

  // Create payment_purchase_orders record
  const { error: poError } = await supabase
    .from('payment_purchase_orders')
    .insert({
      payment_info_id: paymentInfo.id,
      po_number: poData.po_number,
      po_expiry_date: poData.po_expiry_date || null,
      authorized_amount: poData.authorized_amount,
      remaining_amount: poData.authorized_amount,
      department: poData.department || null,
      cost_center: poData.cost_center || null,
      gl_account: poData.gl_account || null,
      approver_name: poData.approver_name || null,
      approver_email: poData.approver_email || null,
    } as Omit<PaymentPurchaseOrder, 'id' | 'created_at' | 'updated_at'>);

  if (poError) {
    console.error('Failed to create purchase order details:', poError);
    throw new Error('Failed to create purchase order details');
  }

  return {
    paymentInfoId: paymentInfo.id,
    paymentType: 'purchase_order',
    displayName: `PO: ${poData.po_number}`,
  };
}

/**
 * Handle Bill of Lading payment method
 */
async function handleBillOfLading(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  bolData: {
    bol_number: string;
    carrier_id?: string;
    account_number?: string;
    authorized_amount?: number;
    expiry_date?: string;
  }
): Promise<PaymentMethodResult> {
  // Create payment_info record
  const { data: paymentInfo, error: paymentInfoError } = await supabase
    .from('payment_info')
    .insert({
      organization_id: organizationId,
      payment_type: 'billing_account' as PaymentMethodType,
      display_name: `BOL: ${bolData.bol_number}`,
      is_default: false,
      is_verified: false,
      status: 'pending',
      billing_address_id: null,
    } as Omit<PaymentInfo, 'id' | 'created_at' | 'updated_at'>)
    .select()
    .single();

  if (paymentInfoError) {
    console.error('Failed to create payment_info for BOL:', paymentInfoError);
    throw new Error('Failed to create bill of lading payment record');
  }

  // Create payment_bills_of_lading record
  const { error: bolError } = await supabase
    .from('payment_bills_of_lading')
    .insert({
      payment_info_id: paymentInfo.id,
      bol_number: bolData.bol_number,
      carrier_id: bolData.carrier_id || null,
      account_number: bolData.account_number || null,
      authorized_amount: bolData.authorized_amount || null,
      expiry_date: bolData.expiry_date || null,
    } as Omit<PaymentBillOfLading, 'id' | 'created_at' | 'updated_at'>);

  if (bolError) {
    console.error('Failed to create bill of lading details:', bolError);
    throw new Error('Failed to create bill of lading details');
  }

  return {
    paymentInfoId: paymentInfo.id,
    paymentType: 'billing_account',
    displayName: `BOL: ${bolData.bol_number}`,
  };
}

/**
 * Handle Third Party Billing payment method
 */
async function handleThirdPartyBilling(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  tpData: {
    company_name: string;
    account_number: string;
    address_id?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    authorization_on_file?: boolean;
  }
): Promise<PaymentMethodResult> {
  // Create payment_info record
  const { data: paymentInfo, error: paymentInfoError } = await supabase
    .from('payment_info')
    .insert({
      organization_id: organizationId,
      payment_type: 'third_party' as PaymentMethodType,
      display_name: `3rd Party: ${tpData.company_name}`,
      is_default: false,
      is_verified: false,
      status: 'pending',
      billing_address_id: tpData.address_id || null,
    } as Omit<PaymentInfo, 'id' | 'created_at' | 'updated_at'>)
    .select()
    .single();

  if (paymentInfoError) {
    console.error('Failed to create payment_info for third party:', paymentInfoError);
    throw new Error('Failed to create third party billing payment record');
  }

  // Create payment_third_party record
  const { error: tpError } = await supabase
    .from('payment_third_party')
    .insert({
      payment_info_id: paymentInfo.id,
      company_name: tpData.company_name,
      account_number: tpData.account_number,
      address_id: tpData.address_id || null,
      contact_name: tpData.contact_name || null,
      contact_phone: tpData.contact_phone || null,
      contact_email: tpData.contact_email || null,
      authorization_on_file: tpData.authorization_on_file || false,
    } as Omit<PaymentThirdParty, 'id' | 'created_at' | 'updated_at'>);

  if (tpError) {
    console.error('Failed to create third party billing details:', tpError);
    throw new Error('Failed to create third party billing details');
  }

  return {
    paymentInfoId: paymentInfo.id,
    paymentType: 'third_party',
    displayName: `3rd Party: ${tpData.company_name}`,
  };
}

/**
 * Handle Net Terms payment method
 */
async function handleNetTerms(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  ntData: {
    terms_days: number;
    credit_limit?: number;
    early_payment_discount_percent?: number;
    early_payment_discount_days?: number;
    trade_references?: Array<{
      company_name: string;
      contact_name: string;
      contact_phone: string;
      relationship_length_months: number;
    }>;
  }
): Promise<PaymentMethodResult> {
  // Create payment_info record
  const { data: paymentInfo, error: paymentInfoError } = await supabase
    .from('payment_info')
    .insert({
      organization_id: organizationId,
      payment_type: 'net_terms' as PaymentMethodType,
      display_name: `Net ${ntData.terms_days}`,
      is_default: false,
      is_verified: false,
      status: 'pending',
      billing_address_id: null,
    } as Omit<PaymentInfo, 'id' | 'created_at' | 'updated_at'>)
    .select()
    .single();

  if (paymentInfoError) {
    console.error('Failed to create payment_info for net terms:', paymentInfoError);
    throw new Error('Failed to create net terms payment record');
  }

  // Calculate payment due date based on terms
  const paymentDueDate = new Date();
  paymentDueDate.setDate(paymentDueDate.getDate() + ntData.terms_days);

  // Create payment_net_terms record
  const { data: netTerms, error: ntError } = await supabase
    .from('payment_net_terms')
    .insert({
      payment_info_id: paymentInfo.id,
      terms_days: ntData.terms_days,
      credit_limit: ntData.credit_limit || null,
      current_balance: 0,
      available_credit: ntData.credit_limit || null,
      credit_approved_by: null,
      credit_approved_date: null,
      payment_due_date: paymentDueDate.toISOString().split('T')[0],
      early_payment_discount_percent: ntData.early_payment_discount_percent || 0,
      early_payment_discount_days: ntData.early_payment_discount_days || 0,
      late_fee_percent: 1.5, // Default late fee
    } as Omit<PaymentNetTerms, 'id' | 'created_at' | 'updated_at'>)
    .select()
    .single();

  if (ntError) {
    console.error('Failed to create net terms details:', ntError);
    throw new Error('Failed to create net terms details');
  }

  // Create trade references if provided
  if (ntData.trade_references && ntData.trade_references.length > 0) {
    const referenceInserts = ntData.trade_references.map((ref) => ({
      net_terms_id: netTerms.id,
      reference_type: 'trade_reference' as const,
      reference_id: paymentInfo.id, // Using payment_info_id as reference
      reference_number: null,
      amount: 0, // No specific amount for trade references
    }));

    const { error: refError } = await supabase
      .from('payment_net_terms_references')
      .insert(referenceInserts as Omit<PaymentNetTermsReference, 'id' | 'created_at'>[]);

    if (refError) {
      console.error('Failed to create trade references:', refError);
      // Don't throw, just log - trade references are optional
    }
  }

  return {
    paymentInfoId: paymentInfo.id,
    paymentType: 'net_terms',
    displayName: `Net ${ntData.terms_days}`,
  };
}

/**
 * Handle Corporate Account payment method
 */
async function handleCorporateAccount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  caData: {
    account_number: string;
    department_code?: string;
    cost_center?: string;
    project_code?: string;
    monthly_limit?: number;
  }
): Promise<PaymentMethodResult> {
  // Create payment_info record
  const { data: paymentInfo, error: paymentInfoError } = await supabase
    .from('payment_info')
    .insert({
      organization_id: organizationId,
      payment_type: 'corporate_account' as PaymentMethodType,
      display_name: `Corp: ${caData.account_number}`,
      is_default: false,
      is_verified: false,
      status: 'pending',
      billing_address_id: null,
    } as Omit<PaymentInfo, 'id' | 'created_at' | 'updated_at'>)
    .select()
    .single();

  if (paymentInfoError) {
    console.error('Failed to create payment_info for corporate account:', paymentInfoError);
    throw new Error('Failed to create corporate account payment record');
  }

  // Create payment_corporate_accounts record
  const { error: caError } = await supabase
    .from('payment_corporate_accounts')
    .insert({
      payment_info_id: paymentInfo.id,
      account_number: caData.account_number,
      department_code: caData.department_code || null,
      cost_center: caData.cost_center || null,
      project_code: caData.project_code || null,
      authorized_users: null, // Will be populated later
      monthly_limit: caData.monthly_limit || null,
      current_month_spend: 0,
    } as Omit<PaymentCorporateAccount, 'id' | 'created_at' | 'updated_at'>);

  if (caError) {
    console.error('Failed to create corporate account details:', caError);
    throw new Error('Failed to create corporate account details');
  }

  return {
    paymentInfoId: paymentInfo.id,
    paymentType: 'corporate_account',
    displayName: `Corp: ${caData.account_number}`,
  };
}

// ============================================
// MAIN HANDLER
// ============================================

/**
 * POST /api/shipments/[id]/payment
 * Process payment for a shipment
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
  const validationResult = paymentRequestSchema.safeParse(parseResult.data);
  if (!validationResult.success) {
    return zodValidationResponse(validationResult.error);
  }

  const data = validationResult.data;

  try {
    const supabase = await createClient();

    // Fetch shipment to verify it exists and get organization_id
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id, organization_id, status, total_cost')
      .eq('id', id)
      .single();

    if (shipmentError) {
      if (shipmentError.code === 'PGRST116') {
        return errors.shipmentNotFound();
      }
      console.error('Failed to fetch shipment:', shipmentError);
      return errors.database('Failed to fetch shipment');
    }

    const typedShipment = shipment as Shipment;

    // Check if shipment can accept payment
    if (typedShipment.status === 'paid') {
      return errors.cannotUpdateShipment('Shipment has already been paid');
    }

    if (typedShipment.status === 'cancelled') {
      return errors.cannotUpdateShipment('Cannot process payment for cancelled shipment');
    }

    // TODO: Get actual user from session once auth is implemented
    const userId = '00000000-0000-0000-0000-000000000000';

    // Process payment based on method
    let paymentResult: PaymentMethodResult;

    switch (data.payment_method) {
      case 'purchase_order':
        if (!data.purchase_order) {
          return errors.validation('Purchase order details are required');
        }
        paymentResult = await handlePurchaseOrder(
          supabase,
          typedShipment.organization_id,
          data.purchase_order
        );
        break;

      case 'bill_of_lading':
        if (!data.bill_of_lading) {
          return errors.validation('Bill of lading details are required');
        }
        paymentResult = await handleBillOfLading(
          supabase,
          typedShipment.organization_id,
          data.bill_of_lading
        );
        break;

      case 'third_party_billing':
        if (!data.third_party) {
          return errors.validation('Third party billing details are required');
        }
        paymentResult = await handleThirdPartyBilling(
          supabase,
          typedShipment.organization_id,
          data.third_party
        );
        break;

      case 'net_terms':
        if (!data.net_terms) {
          return errors.validation('Net terms details are required');
        }
        paymentResult = await handleNetTerms(
          supabase,
          typedShipment.organization_id,
          data.net_terms
        );
        break;

      case 'corporate_account':
        if (!data.corporate_account) {
          return errors.validation('Corporate account details are required');
        }
        paymentResult = await handleCorporateAccount(
          supabase,
          typedShipment.organization_id,
          data.corporate_account
        );
        break;

      default:
        return errors.validation('Invalid payment method');
    }

    // Create payment record
    const shipmentTotal = typedShipment.total_cost || 0;
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        organization_id: typedShipment.organization_id,
        payment_method_id: null,
        payment_info_id: paymentResult.paymentInfoId,
        amount: shipmentTotal,
        currency: 'USD',
        provider: 'internal',
        provider_payment_intent_id: null,
        provider_charge_id: null,
        status: 'pending',
        failure_message: null,
        invoice_number: null,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
      return errors.database('Failed to create payment record');
    }

    // Update shipment with payment_id and status
    const { error: updateError } = await supabase
      .from('shipments')
      .update({
        payment_id: paymentResult.paymentInfoId,
        status: 'pending_payment',
        updated_at: new Date().toISOString(),
      } as Partial<Shipment>)
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update shipment:', updateError);
      return errors.database('Failed to update shipment');
    }

    const responseData: PaymentData = {
      payment: {
        id: payment.id,
        shipment_id: id,
        payment_info_id: paymentResult.paymentInfoId,
        payment_type: paymentResult.paymentType,
        status: 'pending',
        amount: shipmentTotal,
        currency: 'USD',
        created_at: payment.created_at,
      },
      message: `Payment method '${paymentResult.displayName}' saved successfully. Payment is pending verification.`,
    };

    return createdResponse(responseData, noCacheHeaders);
  } catch (error) {
    console.error('Unexpected error processing payment:', error);
    if (error instanceof Error) {
      return errors.internal(error.message);
    }
    return errors.internal('Failed to process payment');
  }
}

/**
 * GET /api/shipments/[id]/payment
 * Get payment information for a shipment
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

    // Fetch shipment with payment info
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id, payment_id, status, total_cost')
      .eq('id', id)
      .single();

    if (shipmentError) {
      if (shipmentError.code === 'PGRST116') {
        return errors.shipmentNotFound();
      }
      console.error('Failed to fetch shipment:', shipmentError);
      return errors.database('Failed to fetch shipment');
    }

    const typedShipment = shipment as Shipment;

    if (!typedShipment.payment_id) {
      return successResponse({
        payment: null,
        message: 'No payment information found for this shipment',
      }, 200, noCacheHeaders);
    }

    // Fetch payment info
    const { data: paymentInfo, error: paymentInfoError } = await supabase
      .from('payment_info')
      .select('*')
      .eq('id', typedShipment.payment_id)
      .single();

    if (paymentInfoError) {
      console.error('Failed to fetch payment info:', paymentInfoError);
      return errors.database('Failed to fetch payment information');
    }

    // Fetch payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_info_id', typedShipment.payment_id)
      .maybeSingle();

    if (paymentError) {
      console.error('Failed to fetch payment:', paymentError);
      return errors.database('Failed to fetch payment record');
    }

    return successResponse({
      payment: payment || null,
      payment_info: paymentInfo,
      shipment_status: typedShipment.status,
    }, 200, noCacheHeaders);
  } catch (error) {
    console.error('Unexpected error fetching payment:', error);
    return errors.internal('Failed to fetch payment information');
  }
}
