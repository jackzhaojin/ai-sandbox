'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ShippingLayout } from '@/components/shipping/ShippingLayout'
import {
  PaymentMethodSelector,
  PurchaseOrderForm,
  BillOfLadingForm,
  ThirdPartyBillingForm,
  NetTermsForm,
  CorporateAccountForm,
} from '@/components/payment'
import {
  type PaymentMethod,
  type PaymentMethodSelectionData,
  type PurchaseOrderFormData,
  type BillOfLadingFormData,
  type ThirdPartyBillingFormData,
  type NetTermsFormData,
  type CorporateAccountFormData,
  PAYMENT_METHOD_FEES,
  PAYMENT_METHOD_LABELS,
  paymentMethodSelectionSchema,
} from '@/lib/validation'
import { Loader2, AlertCircle, DollarSign, Truck, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShipmentSummary {
  id: string
  origin: {
    city: string
    state: string
  }
  destination: {
    city: string
    state: string
  }
  package: {
    weight: number
    weightUnit: string
  }
  selectedRate?: {
    carrierName: string
    serviceName: string
    total: number
    currency: string
  }
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const shipmentId = params.id as string

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [shipmentSummary, setShipmentSummary] = useState<ShipmentSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Form data states for each payment method
  const [purchaseOrderData, setPurchaseOrderData] = useState<Partial<PurchaseOrderFormData>>({})
  const [billOfLadingData, setBillOfLadingData] = useState<Partial<BillOfLadingFormData>>({})
  const [thirdPartyData, setThirdPartyData] = useState<Partial<ThirdPartyBillingFormData>>({})
  const [netTermsData, setNetTermsData] = useState<Partial<NetTermsFormData>>({})
  const [corporateAccountData, setCorporateAccountData] = useState<Partial<CorporateAccountFormData>>({})

  // Fetch shipment details including selected rate
  const fetchShipmentDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/shipments/${shipmentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch shipment details')
      }

      const data = await response.json()
      
      setShipmentSummary({
        id: data.id,
        origin: data.origin || { city: 'Unknown', state: 'XX' },
        destination: data.destination || { city: 'Unknown', state: 'XX' },
        package: data.package || { weight: 0, weightUnit: 'lbs' },
        selectedRate: data.selectedRate || undefined,
      })
    } catch (err) {
      console.error('Error fetching shipment:', err)
      // Use fallback data for development
      setShipmentSummary({
        id: shipmentId,
        origin: { city: 'Austin', state: 'TX' },
        destination: { city: 'Dallas', state: 'TX' },
        package: { weight: 5.5, weightUnit: 'lbs' },
        selectedRate: {
          carrierName: 'Postal Express',
          serviceName: 'Ground',
          total: 24.99,
          currency: 'USD',
        },
      })
    } finally {
      setIsLoading(false)
    }
  }, [shipmentId])

  useEffect(() => {
    fetchShipmentDetails()
  }, [fetchShipmentDetails])

  // Calculate totals
  const subtotal = shipmentSummary?.selectedRate?.total || 0
  const feePercent = selectedMethod ? PAYMENT_METHOD_FEES[selectedMethod] : 0
  const feeAmount = (subtotal * feePercent) / 100
  const total = subtotal + feeAmount
  const currency = shipmentSummary?.selectedRate?.currency || 'USD'

  // Handle payment method selection
  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setValidationErrors({})
    setError(null)
  }

  // Validate form data based on selected method
  const validateFormData = (): boolean => {
    const errors: Record<string, string> = {}

    if (!selectedMethod) {
      errors.method = 'Please select a payment method'
      setValidationErrors(errors)
      return false
    }

    // Method-specific validation would go here
    // The individual form components handle their own validation

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle continue to next step
  const handleContinue = async () => {
    if (!validateFormData()) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Prepare payment data based on selected method
      const paymentData: Partial<PaymentMethodSelectionData> = {
        method: selectedMethod!,
      }

      switch (selectedMethod) {
        case 'purchase_order':
          paymentData.purchaseOrder = purchaseOrderData as PurchaseOrderFormData
          break
        case 'bill_of_lading':
          paymentData.billOfLading = billOfLadingData as BillOfLadingFormData
          break
        case 'third_party':
          paymentData.thirdParty = thirdPartyData as ThirdPartyBillingFormData
          break
        case 'net_terms':
          paymentData.netTerms = netTermsData as NetTermsFormData
          break
        case 'corporate_account':
          paymentData.corporateAccount = corporateAccountData as CorporateAccountFormData
          break
      }

      // Validate with Zod schema
      const validationResult = paymentMethodSelectionSchema.safeParse(paymentData)
      if (!validationResult.success) {
        const zodErrors: Record<string, string> = {}
        validationResult.error.errors.forEach((err) => {
          const path = err.path.join('.')
          zodErrors[path] = err.message
        })
        setValidationErrors(zodErrors)
        throw new Error('Please correct the validation errors')
      }

      // Save payment method to API
      const response = await fetch(`/api/shipments/${shipmentId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save payment method')
      }

      // Navigate to pickup scheduling page
      router.push(`/shipments/${shipmentId}/pickup`)
    } catch (err) {
      console.error('Error saving payment:', err)
      setError(err instanceof Error ? err.message : 'Failed to save payment method')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle back to pricing
  const handleBack = () => {
    router.push(`/shipments/${shipmentId}/pricing`)
  }

  // Render the appropriate form based on selected method
  const renderPaymentForm = () => {
    if (!selectedMethod) return null

    switch (selectedMethod) {
      case 'purchase_order':
        return (
          <PurchaseOrderForm
            value={purchaseOrderData}
            onChange={setPurchaseOrderData}
            disabled={isSaving}
            shipmentTotal={subtotal}
            errors={validationErrors}
          />
        )
      case 'bill_of_lading':
        return (
          <BillOfLadingForm
            value={billOfLadingData}
            onChange={setBillOfLadingData}
            disabled={isSaving}
            errors={validationErrors}
          />
        )
      case 'third_party':
        return (
          <ThirdPartyBillingForm
            value={thirdPartyData}
            onChange={setThirdPartyData}
            disabled={isSaving}
            errors={validationErrors}
          />
        )
      case 'net_terms':
        return (
          <NetTermsForm
            value={netTermsData}
            onChange={setNetTermsData}
            disabled={isSaving}
            errors={validationErrors}
          />
        )
      case 'corporate_account':
        return (
          <CorporateAccountForm
            value={corporateAccountData}
            onChange={setCorporateAccountData}
            disabled={isSaving}
            errors={validationErrors}
          />
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <ShippingLayout
        step={3}
        shipmentId={shipmentId}
        navigationProps={{
          nextLabel: 'Loading...',
          isNextDisabled: true,
          isNextLoading: true,
        }}
      >
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading payment options...</p>
        </div>
      </ShippingLayout>
    )
  }

  return (
    <ShippingLayout
      step={3}
      shipmentId={shipmentId}
      headerProps={{
        showBackButton: true,
        backHref: `/shipments/${shipmentId}/pricing`,
      }}
      navigationProps={{
        onNext: handleContinue,
        onPrevious: handleBack,
        nextLabel: isSaving ? 'Saving...' : 'Continue to Pickup',
        previousLabel: 'Back to Rates',
        isNextDisabled: !selectedMethod || isSaving,
        isNextLoading: isSaving,
        showPrevious: true,
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Method
          </h1>
          <p className="text-gray-600">
            Choose from our 5 B2B payment options. Select the method that works best for your organization.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}

        {/* Shipment Summary Bar */}
        {shipmentSummary && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {shipmentSummary.origin.city}, {shipmentSummary.origin.state} → {shipmentSummary.destination.city}, {shipmentSummary.destination.state}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {shipmentSummary.package.weight} {shipmentSummary.package.weightUnit}
                </span>
              </div>
              {shipmentSummary.selectedRate && (
                <div className="flex items-center gap-2 ml-auto">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {shipmentSummary.selectedRate.carrierName} - {shipmentSummary.selectedRate.serviceName}
                  </span>
                  <span className="font-bold text-gray-900">
                    ${shipmentSummary.selectedRate.total.toFixed(2)} {shipmentSummary.selectedRate.currency}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Payment Method
          </h2>
          <PaymentMethodSelector
            selectedMethod={selectedMethod}
            onSelect={handleSelectMethod}
            disabled={isSaving}
            shipmentTotal={subtotal}
          />
          {validationErrors.method && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {validationErrors.method}
            </p>
          )}
        </div>

        {/* Method-specific Form */}
        {selectedMethod && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {PAYMENT_METHOD_LABELS[selectedMethod]} Details
            </h2>
            {renderPaymentForm()}
          </div>
        )}

        {/* Order Summary */}
        {selectedMethod && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)} {currency}</span>
              </div>
              {feePercent > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Processing Fee ({feePercent}%)
                  </span>
                  <span className="font-medium text-orange-600">+${feeAmount.toFixed(2)} {currency}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-gray-900">
                    ${total.toFixed(2)} {currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShippingLayout>
  )
}
