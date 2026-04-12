'use client'

import { ReviewSection, KeyValuePair, SectionGrid, Subsection, SectionDivider } from './ReviewSection'
import type { PaymentMethodData, BillingData } from './types'
import { PAYMENT_METHOD_LABELS, INVOICE_DELIVERY_METHOD_LABELS, INVOICE_FORMAT_LABELS, INVOICE_FREQUENCY_LABELS, BUSINESS_TYPE_LABELS, INDUSTRY_LABELS } from '@/lib/validation'
import { DollarSign, CreditCard } from 'lucide-react'

interface PaymentReviewSectionProps {
  payment: PaymentMethodData | null
  billing: BillingData | null
  shipmentId: string
}

export function PaymentReviewSection({ payment, billing, shipmentId }: PaymentReviewSectionProps) {
  const isComplete = !!payment && !!payment.method && !!billing && !!billing.contact.name && !!billing.address.line1

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const renderPaymentMethodDetails = () => {
    if (!payment) return null

    switch (payment.method) {
      case 'purchase_order':
        return (
          <SectionGrid>
            <KeyValuePair label="PO Number" value={payment.poNumber} />
            <KeyValuePair label="PO Amount" value={payment.poAmount ? formatCurrency(payment.poAmount, 'USD') : undefined} />
            <KeyValuePair label="Expiration Date" value={payment.poExpirationDate} />
            <KeyValuePair label="Approval Contact" value={payment.poApprovalContact} />
            <KeyValuePair label="Department" value={payment.poDepartment} />
          </SectionGrid>
        )

      case 'bill_of_lading':
        return (
          <SectionGrid>
            <KeyValuePair label="BOL Number" value={payment.bolNumber} />
            <KeyValuePair label="BOL Date" value={payment.bolDate} />
            <KeyValuePair label="Shipper Reference" value={payment.bolShipperReference} />
            <KeyValuePair label="Freight Terms" value={payment.bolFreightTerms} />
          </SectionGrid>
        )

      case 'third_party':
        return (
          <SectionGrid>
            <KeyValuePair label="Account Number" value={payment.tpAccountNumber} />
            <KeyValuePair label="Company Name" value={payment.tpCompanyName} />
            <KeyValuePair label="Contact Name" value={payment.tpContactName} />
            <KeyValuePair label="Contact Phone" value={payment.tpContactPhone} />
            <KeyValuePair label="Contact Email" value={payment.tpContactEmail} />
            {payment.tpAuthorizationCode && (
              <KeyValuePair label="Authorization Code" value={payment.tpAuthorizationCode} />
            )}
          </SectionGrid>
        )

      case 'net_terms':
        return (
          <SectionGrid>
            <KeyValuePair label="Payment Terms" value={payment.netTermDays ? `Net ${payment.netTermDays}` : undefined} />
            <KeyValuePair 
              label="Annual Revenue" 
              value={payment.netTermAnnualRevenue ? formatCurrency(payment.netTermAnnualRevenue, 'USD') : undefined} 
            />
          </SectionGrid>
        )

      case 'corporate_account':
        return (
          <SectionGrid>
            <KeyValuePair label="Account Number" value={payment.corpAccountNumber} />
          </SectionGrid>
        )

      default:
        return null
    }
  }

  return (
    <ReviewSection
      title="Payment & Billing"
      editHref={`/shipments/${shipmentId}/payment`}
      isComplete={isComplete}
      incompleteMessage="Payment and billing information is incomplete. Please complete Step 3."
    >
      {payment && billing ? (
        <div className="space-y-6">
          {/* Payment Method Summary */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {PAYMENT_METHOD_LABELS[payment.method as keyof typeof PAYMENT_METHOD_LABELS] || payment.methodLabel}
                </p>
                <p className="text-sm text-gray-600">Payment Method</p>
              </div>
            </div>
          </div>

          {/* Payment Method Details */}
          <Subsection title="Payment Method Details">
            {renderPaymentMethodDetails()}
          </Subsection>

          <SectionDivider />

          {/* Billing Address */}
          <Subsection title="Billing Address">
            <SectionGrid>
              <KeyValuePair
                label="Address"
                value={
                  billing.address.sameAsOrigin ? (
                    <span className="text-green-600 font-medium">Same as Origin Address</span>
                  ) : (
                    <div>
                      <div>{billing.address.line1}</div>
                      {billing.address.line2 && <div>{billing.address.line2}</div>}
                      <div>{billing.address.city}, {billing.address.state} {billing.address.postal}</div>
                      <div>{billing.address.country}</div>
                    </div>
                  )
                }
              />
              {!billing.address.sameAsOrigin && (
                <KeyValuePair
                  label="Location Type"
                  value={billing.address.locationType === 'commercial' ? 'Commercial/Business' : 'Residential/Home'}
                />
              )}
            </SectionGrid>
          </Subsection>

          <SectionDivider />

          {/* Billing Contact */}
          <Subsection title="Billing Contact">
            <SectionGrid>
              <KeyValuePair label="Name" value={billing.contact.name} />
              <KeyValuePair label="Title" value={billing.contact.title} />
              <KeyValuePair label="Phone" value={billing.contact.phone} />
              <KeyValuePair label="Email" value={billing.contact.email} />
              {billing.contact.department && (
                <KeyValuePair label="Department" value={billing.contact.department} />
              )}
              {billing.contact.glCode && (
                <KeyValuePair label="GL Code" value={billing.contact.glCode} />
              )}
              {billing.contact.taxId && (
                <KeyValuePair label="Tax ID" value={billing.contact.taxId} />
              )}
            </SectionGrid>
          </Subsection>

          <SectionDivider />

          {/* Company Info */}
          <Subsection title="Company Information">
            <SectionGrid>
              <KeyValuePair label="Legal Name" value={billing.company.legalName} />
              {billing.company.dba && (
                <KeyValuePair label="DBA" value={billing.company.dba} />
              )}
              <KeyValuePair 
                label="Business Type" 
                value={BUSINESS_TYPE_LABELS[billing.company.businessType as keyof typeof BUSINESS_TYPE_LABELS]} 
              />
              <KeyValuePair 
                label="Industry" 
                value={INDUSTRY_LABELS[billing.company.industry as keyof typeof INDUSTRY_LABELS] || billing.company.industry} 
              />
              {billing.company.shippingVolume && (
                <KeyValuePair label="Shipping Volume" value={billing.company.shippingVolume} />
              )}
            </SectionGrid>
          </Subsection>

          <SectionDivider />

          {/* Invoice Preferences */}
          <Subsection title="Invoice Preferences">
            <SectionGrid>
              <KeyValuePair 
                label="Delivery Method" 
                value={INVOICE_DELIVERY_METHOD_LABELS[billing.invoicePreferences.deliveryMethod as keyof typeof INVOICE_DELIVERY_METHOD_LABELS]} 
              />
              <KeyValuePair 
                label="Invoice Format" 
                value={INVOICE_FORMAT_LABELS[billing.invoicePreferences.format as keyof typeof INVOICE_FORMAT_LABELS]} 
              />
              <KeyValuePair 
                label="Invoice Frequency" 
                value={INVOICE_FREQUENCY_LABELS[billing.invoicePreferences.frequency as keyof typeof INVOICE_FREQUENCY_LABELS]} 
              />
            </SectionGrid>
          </Subsection>
        </div>
      ) : (
        <p className="text-gray-500 italic">No payment information available</p>
      )}
    </ReviewSection>
  )
}
