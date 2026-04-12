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

// Storage bucket for credit applications
const CREDIT_APP_BUCKET = 'credit-applications'

// Validation schemas
const paymentMethodSchema = z.enum(['purchase_order', 'bill_of_lading', 'third_party', 'net_terms', 'corporate_account'])

const billingAddressSchema = z.object({
  line1: z.string().min(1, 'Street address is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postal: z.string().min(1, 'Postal code is required'),
  country: z.enum(['US', 'CA', 'MX']),
  locationType: z.enum(['commercial', 'residential']),
  sameAsOrigin: z.boolean().optional(),
})

const billingContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  title: z.string().min(1, 'Job title is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email'),
  department: z.string().optional(),
  glCode: z.string().optional(),
  taxId: z.string().optional(),
})

const companyInfoSchema = z.object({
  legalName: z.string().min(1, 'Legal name is required'),
  dba: z.string().optional(),
  businessType: z.string().min(1, 'Business type is required'),
  industry: z.string().min(1, 'Industry is required'),
  shippingVolume: z.string().optional(),
})

const invoicePreferencesSchema = z.object({
  deliveryMethod: z.string().min(1, 'Delivery method is required'),
  format: z.string().min(1, 'Invoice format is required'),
  frequency: z.string().min(1, 'Invoice frequency is required'),
})

// Payment method specific schemas
const purchaseOrderSchema = z.object({
  poNumber: z.string().min(1, 'PO number is required'),
  poAmount: z.number().min(0.01, 'PO amount must be greater than 0'),
  expirationDate: z.string().min(1, 'Expiration date is required'),
  approvalContact: z.string().min(1, 'Approval contact is required'),
  department: z.string().min(1, 'Department is required'),
})

const billOfLadingSchema = z.object({
  bolNumber: z.string().min(1, 'BOL number is required'),
  bolDate: z.string().min(1, 'BOL date is required'),
  shipperReference: z.string().optional(),
  freightTerms: z.enum(['prepaid', 'collect', 'third_party']),
})

const thirdPartySchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required'),
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  contactPhone: z.string().min(1, 'Contact phone is required'),
  contactEmail: z.string().email('Invalid email'),
  authorizationCode: z.string().optional(),
})

const tradeReferenceSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email'),
  relationship: z.string().min(1, 'Relationship is required'),
})

const netTermsSchema = z.object({
  paymentPeriod: z.number().refine((val) => [15, 30, 45, 60].includes(val), {
    message: 'Payment period must be 15, 30, 45, or 60 days',
  }),
  creditApplicationFile: z.any().optional(), // File will be handled separately
  creditApplicationUrl: z.string().optional(),
  tradeReferences: z.array(tradeReferenceSchema).min(3, 'At least 3 trade references are required'),
  annualRevenue: z.number().min(0, 'Annual revenue must be positive'),
})

const corporateAccountSchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required'),
  pin: z.string().min(4, 'PIN must be at least 4 characters'),
})

const paymentRequestSchema = z.object({
  method: paymentMethodSchema,
  billing: z.object({
    address: billingAddressSchema,
    contact: billingContactSchema,
    company: companyInfoSchema,
    invoicePreferences: invoicePreferencesSchema,
  }),
  purchaseOrder: purchaseOrderSchema.optional(),
  billOfLading: billOfLadingSchema.optional(),
  thirdParty: thirdPartySchema.optional(),
  netTerms: netTermsSchema.optional(),
  corporateAccount: corporateAccountSchema.optional(),
})

/**
 * Get organization ID from shipment
 */
async function getOrganizationIdFromShipment(shipmentId: string): Promise<string | null> {
  const { data, error } = await supabaseServer
    .from('shipments')
    .select('organization_id')
    .eq('id', shipmentId)
    .single()

  if (error) {
    console.error('Error fetching shipment organization:', error)
    return null
  }

  return data?.organization_id || null
}

/**
 * Create or get billing address
 */
async function createBillingAddress(
  addressData: z.infer<typeof billingAddressSchema>,
  organizationId: string
): Promise<string | null> {
  const { data, error } = await supabaseServer
    .from('addresses')
    .insert({
      organization_id: organizationId,
      label: 'Billing Address',
      recipient_name: '', // Will be updated with contact info
      line1: addressData.line1,
      line2: addressData.line2 || null,
      city: addressData.city,
      state: addressData.state,
      postal_code: addressData.postal,
      country: addressData.country,
      address_type: addressData.locationType,
      is_default_billing: false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating billing address:', error)
    return null
  }

  return data.id
}

/**
 * Upload credit application file to Supabase Storage
 */
async function uploadCreditApplication(
  file: { name: string; type: string; base64: string },
  shipmentId: string
): Promise<string | null> {
  try {
    // Extract base64 data
    const base64Data = file.base64.split(',')[1] || file.base64
    const buffer = Buffer.from(base64Data, 'base64')

    const filePath = `credit-apps/${shipmentId}/${Date.now()}_${file.name}`

    const { error } = await supabaseServer.storage
      .from(CREDIT_APP_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      console.error('Error uploading credit application:', error)
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseServer.storage
      .from(CREDIT_APP_BUCKET)
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error uploading credit application:', error)
    return null
  }
}

/**
 * POST /api/shipments/:id/payment
 * 
 * Saves payment method and billing information:
 * 1. Validates payment data with Zod
 * 2. Creates/updates payment_info record
 * 3. Creates method-specific record (payment_purchase_orders, etc.)
 * 4. For Net Terms: uploads credit app, saves trade references
 * 5. Updates shipment status to 'pickup' and current_step to 4
 * 6. Creates 'payment_set' event
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

    // Parse request body
    const body = await request.json()

    // Validate request body
    const validationResult = paymentRequestSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }))
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    const paymentData = validationResult.data

    // Get organization ID from shipment
    const organizationId = await getOrganizationIdFromShipment(shipmentId)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Shipment organization not found' },
        { status: 404 }
      )
    }

    // Create billing address
    let billingAddressId: string | null = null
    if (!paymentData.billing.address.sameAsOrigin) {
      billingAddressId = await createBillingAddress(
        paymentData.billing.address,
        organizationId
      )
    }

    // Create payment_info record
    const { data: paymentInfo, error: paymentInfoError } = await supabaseServer
      .from('payment_info')
      .insert({
        organization_id: organizationId,
        type: paymentData.method,
        status: 'active',
        is_default: false,
      })
      .select('id')
      .single()

    if (paymentInfoError) {
      console.error('Error creating payment_info:', paymentInfoError)
      return NextResponse.json(
        { error: 'Failed to create payment info' },
        { status: 500 }
      )
    }

    const paymentInfoId = paymentInfo.id

    // Create method-specific records
    switch (paymentData.method) {
      case 'purchase_order': {
        if (!paymentData.purchaseOrder) {
          return NextResponse.json(
            { error: 'Purchase order details required' },
            { status: 400 }
          )
        }

        const { error } = await supabaseServer
          .from('payment_purchase_orders')
          .insert({
            payment_info_id: paymentInfoId,
            po_number: paymentData.purchaseOrder.poNumber,
            authorized_by: paymentData.purchaseOrder.approvalContact,
            po_document_url: null,
          })

        if (error) {
          console.error('Error creating purchase order:', error)
          return NextResponse.json(
            { error: 'Failed to create purchase order record' },
            { status: 500 }
          )
        }
        break
      }

      case 'bill_of_lading': {
        if (!paymentData.billOfLading) {
          return NextResponse.json(
            { error: 'Bill of lading details required' },
            { status: 400 }
          )
        }

        const { error } = await supabaseServer
          .from('payment_bills_of_lading')
          .insert({
            payment_info_id: paymentInfoId,
            bol_number: paymentData.billOfLading.bolNumber,
            carrier: paymentData.billOfLading.freightTerms,
          })

        if (error) {
          console.error('Error creating bill of lading:', error)
          return NextResponse.json(
            { error: 'Failed to create bill of lading record' },
            { status: 500 }
          )
        }
        break
      }

      case 'third_party': {
        if (!paymentData.thirdParty) {
          return NextResponse.json(
            { error: 'Third party billing details required' },
            { status: 400 }
          )
        }

        const { error } = await supabaseServer
          .from('payment_third_party')
          .insert({
            payment_info_id: paymentInfoId,
            account_number: paymentData.thirdParty.accountNumber,
            carrier: paymentData.thirdParty.companyName,
            billing_address_id: billingAddressId,
          })

        if (error) {
          console.error('Error creating third party record:', error)
          return NextResponse.json(
            { error: 'Failed to create third party billing record' },
            { status: 500 }
          )
        }
        break
      }

      case 'net_terms': {
        if (!paymentData.netTerms) {
          return NextResponse.json(
            { error: 'Net terms details required' },
            { status: 400 }
          )
        }

        // Handle credit application file upload if provided
        let creditAppUrl: string | null = null
        if (paymentData.netTerms.creditApplicationFile?.base64) {
          creditAppUrl = await uploadCreditApplication(
            paymentData.netTerms.creditApplicationFile,
            shipmentId
          )
        }

        // Create net terms record
        const { data: netTermsRecord, error: netTermsError } = await supabaseServer
          .from('payment_net_terms')
          .insert({
            payment_info_id: paymentInfoId,
            term_days: paymentData.netTerms.paymentPeriod,
            credit_limit: paymentData.netTerms.annualRevenue * 0.1, // 10% of annual revenue as credit limit
            available_credit: paymentData.netTerms.annualRevenue * 0.1,
          })
          .select('id')
          .single()

        if (netTermsError) {
          console.error('Error creating net terms:', netTermsError)
          return NextResponse.json(
            { error: 'Failed to create net terms record' },
            { status: 500 }
          )
        }

        // Create trade references
        if (paymentData.netTerms.tradeReferences?.length > 0) {
          const tradeReferenceInserts = paymentData.netTerms.tradeReferences.map((ref) => ({
            net_terms_id: netTermsRecord.id,
            reference_type: 'trade_reference',
            reference_value: JSON.stringify({
              companyName: ref.companyName,
              contactName: ref.contactName,
              phone: ref.phone,
              email: ref.email,
              relationship: ref.relationship,
            }),
          }))

          const { error: tradeRefError } = await supabaseServer
            .from('payment_net_terms_references')
            .insert(tradeReferenceInserts)

          if (tradeRefError) {
            console.error('Error creating trade references:', tradeRefError)
          }
        }
        break
      }

      case 'corporate_account': {
        if (!paymentData.corporateAccount) {
          return NextResponse.json(
            { error: 'Corporate account details required' },
            { status: 400 }
          )
        }

        const { error } = await supabaseServer
          .from('payment_corporate_accounts')
          .insert({
            payment_info_id: paymentInfoId,
            account_number: paymentData.corporateAccount.accountNumber,
            account_name: paymentData.billing.company.legalName,
          })

        if (error) {
          console.error('Error creating corporate account:', error)
          return NextResponse.json(
            { error: 'Failed to create corporate account record' },
            { status: 500 }
          )
        }
        break
      }
    }

    // Create payment record in payments table
    const { data: paymentRecord, error: paymentError } = await supabaseServer
      .from('payments')
      .insert({
        organization_id: organizationId,
        shipment_id: shipmentId,
        payment_info_id: paymentInfoId,
        amount: 0, // Will be calculated based on quote
        currency: 'USD',
        status: 'pending',
      })
      .select('id')
      .single()

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      )
    }

    // Update shipment with payment info and advance status
    // Note: Using 'pending_payment' status as 'pickup' is not a valid enum value
    // The pickup step is tracked via current_step (4) when the column exists
    const updateData: Record<string, unknown> = {
      payment_id: paymentRecord.id,
      status: 'pending_payment',
    }
    
    // Only add current_step if the column exists
    try {
      const { error: updateError } = await supabaseServer
        .from('shipments')
        .update({
          ...updateData,
          current_step: 4,
        })
        .eq('id', shipmentId)

      if (updateError) {
        // If current_step column doesn't exist, try without it
        if (updateError.message?.includes('current_step')) {
          const { error: retryError } = await supabaseServer
            .from('shipments')
            .update(updateData)
            .eq('id', shipmentId)
          
          if (retryError) {
            console.error('Error updating shipment:', retryError)
            return NextResponse.json(
              { error: 'Failed to update shipment' },
              { status: 500 }
            )
          }
        } else {
          console.error('Error updating shipment:', updateError)
          return NextResponse.json(
            { error: 'Failed to update shipment', details: updateError.message },
            { status: 500 }
          )
        }
      }
    } catch (error) {
      console.error('Error in shipment update:', error)
      return NextResponse.json(
        { error: 'Failed to update shipment' },
        { status: 500 }
      )
    }

    // Create shipment event
    const { error: eventError } = await supabaseServer
      .from('shipment_events')
      .insert({
        shipment_id: shipmentId,
        event_type: 'payment_set',
        event_description: `Payment method set: ${paymentData.method}`,
        metadata: {
          payment_method: paymentData.method,
          payment_info_id: paymentInfoId,
          billing_contact: paymentData.billing.contact.name,
          company: paymentData.billing.company.legalName,
        },
      })

    if (eventError) {
      console.error('Error creating shipment event:', eventError)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment information saved successfully',
      paymentInfoId,
      shipmentId,
      nextStep: 4,
    })
  } catch (error) {
    console.error('Error in POST /api/shipments/[id]/payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
