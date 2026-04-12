'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
  BillingAddressSection,
  BillingContactSection,
  CompanyInfoSection,
  InvoicePreferencesSection,
  CostSummary,
} from '@/components/billing'
import {
  type PaymentMethod,
  type PaymentMethodSelectionData,
  type PurchaseOrderFormData,
  type BillOfLadingFormData,
  type ThirdPartyBillingFormData,
  type NetTermsFormData,
  type CorporateAccountFormData,
  billingInformationSchema,
  PAYMENT_METHOD_FEES,
  PAYMENT_METHOD_LABELS,
  paymentMethodSelectionSchema,
  SUPPORTED_COUNTRIES,
} from '@/lib/validation'
import { Loader2, AlertCircle, DollarSign, Truck, Package, Building2, User, FileText, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { z } from 'zod'

// Extended form type that includes billing information
 type BillingFormData = {
  // Payment method
  method: PaymentMethod
  purchaseOrder?: Partial<PurchaseOrderFormData>
  billOfLading?: Partial<BillOfLadingFormData>
  thirdParty?: Partial<ThirdPartyBillingFormData>
  netTerms?: Partial<NetTermsFormData>
  corporateAccount?: Partial<CorporateAccountFormData>
  
  // Billing address
  billingLine1: string
  billingLine2?: string
  billingCity: string
  billingState: string
  billingPostal: string
  billingCountry: string
  billingLocationType: string
  sameAsOrigin: boolean
  
  // Billing contact
  billingContactName: string
  billingContactTitle: string
  billingContactPhone: string
  billingContactEmail: string
  billingContactDepartment?: string
  billingGLCode?: string
  billingTaxId?: string
  
  // Company info
  companyLegalName: string
  companyDBA?: string
  companyBusinessType: string
  companyIndustry: string
  companyShippingVolume?: string
  
  // Invoice preferences
  invoiceDeliveryMethod: string
  invoiceFormat: string
  invoiceFrequency: string
}

interface ShipmentSummary {
  id: string
  origin: {
    city: string
    state: string
    line1?: string
    line2?: string
    postal?: string
    country?: string
    locationType?: string
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

// Schema for the extended form
const extendedPaymentSchema = z.object({
  method: z.enum(["purchase_order", "bill_of_lading", "third_party", "net_terms", "corporate_account"]),
  billingLine1: z.string().min(1, "Street address is required"),
  billingLine2: z.string().optional(),
  billingCity: z.string().min(1, "City is required"),
  billingState: z.string().min(1, "State is required"),
  billingPostal: z.string().min(1, "Postal code is required"),
  billingCountry: z.enum(["US", "CA", "MX"]),
  billingLocationType: z.enum(["commercial", "residential"]),
  sameAsOrigin: z.boolean(),
  billingContactName: z.string().min(1, "Contact name is required"),
  billingContactTitle: z.string().min(1, "Job title is required"),
  billingContactPhone: z.string().min(1, "Phone is required"),
  billingContactEmail: z.string().email("Invalid email"),
  billingContactDepartment: z.string().optional(),
  billingGLCode: z.string().optional(),
  billingTaxId: z.string().optional(),
  companyLegalName: z.string().min(1, "Company name is required"),
  companyDBA: z.string().optional(),
  companyBusinessType: z.string().min(1, "Business type is required"),
  companyIndustry: z.string().min(1, "Industry is required"),
  companyShippingVolume: z.string().optional(),
  invoiceDeliveryMethod: z.string().min(1, "Delivery method is required"),
  invoiceFormat: z.string().min(1, "Invoice format is required"),
  invoiceFrequency: z.string().min(1, "Invoice frequency is required"),
})

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const shipmentId = params.id as string

  const [shipmentSummary, setShipmentSummary] = useState<ShipmentSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'payment' | 'billing'>('payment')

  // Form data states for each payment method
  const [purchaseOrderData, setPurchaseOrderData] = useState<Partial<PurchaseOrderFormData>>({})
  const [billOfLadingData, setBillOfLadingData] = useState<Partial<BillOfLadingFormData>>({})
  const [thirdPartyData, setThirdPartyData] = useState<Partial<ThirdPartyBillingFormData>>({})
  const [netTermsData, setNetTermsData] = useState<Partial<NetTermsFormData>>({})
  const [netTermsFile, setNetTermsFile] = useState<File | null>(null)
  const [corporateAccountData, setCorporateAccountData] = useState<Partial<CorporateAccountFormData>>({})

  // React Hook Form for billing information
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BillingFormData>({
    resolver: async (data) => {
      const result = await extendedPaymentSchema.safeParseAsync(data)
      
      if (!result.success) {
        const formErrors: Record<string, { message: string; type: string }> = {}
        result.error.errors.forEach((err) => {
          const path = err.path.join('.')
          formErrors[path] = { message: err.message, type: err.code }
        })
        return { values: {}, errors: formErrors }
      }
      
      return { values: result.data, errors: {} }
    },
    mode: 'onBlur',
    defaultValues: {
      method: undefined as unknown as PaymentMethod,
      billingCountry: 'US',
      billingLocationType: 'commercial',
      sameAsOrigin: false,
      billingLine1: '',
      billingLine2: '',
      billingCity: '',
      billingState: '',
      billingPostal: '',
      billingContactName: '',
      billingContactTitle: '',
      billingContactPhone: '',
      billingContactEmail: '',
      billingContactDepartment: '',
      billingGLCode: '',
      billingTaxId: '',
      companyLegalName: '',
      companyDBA: '',
      companyBusinessType: '',
      companyIndustry: '',
      companyShippingVolume: '',
      invoiceDeliveryMethod: '',
      invoiceFormat: '',
      invoiceFrequency: '',
    },
  })

  const selectedMethod = watch('method')
  const sameAsOrigin = watch('sameAsOrigin')

  // Fetch shipment details including selected rate
  const fetchShipmentDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/shipments/${shipmentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch shipment details')
      }

      const data = await response.json()
      
      // Step enforcement: if current_step < 3, redirect to appropriate step
      if (data.current_step && data.current_step < 3) {
        if (data.current_step === 1) {
          router.push(`/shipments/new?edit=${shipmentId}`)
        } else if (data.current_step === 2) {
          router.push(`/shipments/${shipmentId}/pricing`)
        }
        return
      }
      
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
        origin: { 
          city: 'Austin',
          state: 'TX',
          line1: '123 Main St',
          postal: '78701',
          country: 'US',
          locationType: 'commercial',
        },
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
  }, [shipmentId, router])

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
    setValue('method', method)
    setValidationErrors({})
    setError(null)
  }

  // Validate form data
  const validateFormData = (): boolean => {
    const errors: Record<string, string> = {}

    if (!selectedMethod) {
      errors.method = 'Please select a payment method'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Convert file to base64 for transmission
  const fileToBase64 = (file: File): Promise<{ name: string; type: string; base64: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        resolve({
          name: file.name,
          type: file.type,
          base64: reader.result as string,
        })
      }
      reader.onerror = (error) => reject(error)
    })
  }

  // Handle continue to next step
  const onSubmit = async (data: BillingFormData) => {
    if (!validateFormData()) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Prepare payment data based on selected method
      const paymentData: Partial<PaymentMethodSelectionData> = {
        method: data.method,
      }

      switch (data.method) {
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

      // Validate payment method data with Zod schema
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

      // Combine payment and billing data for API
      const fullPaymentData: Record<string, unknown> = {
        ...paymentData,
        billing: {
          address: {
            line1: data.billingLine1,
            line2: data.billingLine2,
            city: data.billingCity,
            state: data.billingState,
            postal: data.billingPostal,
            country: data.billingCountry,
            locationType: data.billingLocationType,
            sameAsOrigin: data.sameAsOrigin,
          },
          contact: {
            name: data.billingContactName,
            title: data.billingContactTitle,
            phone: data.billingContactPhone,
            email: data.billingContactEmail,
            department: data.billingContactDepartment,
            glCode: data.billingGLCode,
            taxId: data.billingTaxId,
          },
          company: {
            legalName: data.companyLegalName,
            dba: data.companyDBA,
            businessType: data.companyBusinessType,
            industry: data.companyIndustry,
            shippingVolume: data.companyShippingVolume,
          },
          invoicePreferences: {
            deliveryMethod: data.invoiceDeliveryMethod,
            format: data.invoiceFormat,
            frequency: data.invoiceFrequency,
          },
        },
      }

      // Handle Net Terms file upload
      if (data.method === 'net_terms' && netTermsFile) {
        const fileData = await fileToBase64(netTermsFile)
        fullPaymentData.netTerms = {
          ...netTermsData,
          creditApplicationFile: fileData,
        }
      }

      // Save payment method to API
      const response = await fetch(`/api/shipments/${shipmentId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPaymentData),
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

  // Handle save as draft
  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    setError(null)
    setSaveMessage(null)

    try {
      const response = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'draft',
          lastSavedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      setSaveMessage('Draft saved successfully!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      console.error('Error saving draft:', err)
      setError(err instanceof Error ? err.message : 'Failed to save draft')
    } finally {
      setIsSavingDraft(false)
    }
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
            onFileChange={setNetTermsFile}
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
        onSaveDraft: handleSaveDraft,
        isSavingDraft,
      }}
      navigationProps={{
        onNext: handleSubmit(onSubmit),
        onPrevious: handleBack,
        nextLabel: isSaving ? 'Saving...' : 'Continue to Pickup',
        previousLabel: 'Back to Rates',
        isNextDisabled: !selectedMethod || isSaving || isSavingDraft,
        isNextLoading: isSaving,
        showPrevious: true,
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment & Billing
          </h1>
          <p className="text-gray-600">
            Choose your payment method and provide billing information for your shipment.
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

        {/* Save success message */}
        {saveMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-600">{saveMessage}</p>
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

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className={cn(
                "flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                activeTab === 'payment'
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <DollarSign className="h-4 w-4" />
              Payment Method
              {selectedMethod && (
                <span className="ml-1 w-2 h-2 rounded-full bg-green-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={cn(
                "flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                activeTab === 'billing'
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Building2 className="h-4 w-4" />
              Billing Information
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'payment' ? (
              <div className="space-y-6">
                {/* Payment Method Selection */}
                <div>
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
                  <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">
                      {PAYMENT_METHOD_LABELS[selectedMethod]} Details
                    </h3>
                    {renderPaymentForm()}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Billing Address */}
                <BillingAddressSection
                  control={control}
                  errors={errors}
                  setValue={setValue}
                  sameAsOrigin={sameAsOrigin}
                  onSameAsOriginChange={(value) => setValue('sameAsOrigin', value)}
                  originData={{
                    line1: shipmentSummary?.origin.line1,
                    line2: shipmentSummary?.origin.line2,
                    city: shipmentSummary?.origin.city,
                    state: shipmentSummary?.origin.state,
                    postal: shipmentSummary?.origin.postal,
                    country: shipmentSummary?.origin.country,
                    locationType: shipmentSummary?.origin.locationType,
                  }}
                  disabled={isSaving}
                />

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Billing Contact */}
                <BillingContactSection
                  control={control}
                  errors={errors}
                  disabled={isSaving}
                />

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Company Info */}
                <CompanyInfoSection
                  control={control}
                  errors={errors}
                  disabled={isSaving}
                />

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Invoice Preferences */}
                <InvoicePreferencesSection
                  control={control}
                  errors={errors}
                  disabled={isSaving}
                />
              </div>
            )}
          </div>
        </div>

        {/* Cost Summary Sidebar - Always visible on larger screens */}
        <div className="lg:hidden">
          <CostSummary
            subtotal={subtotal}
            currency={currency}
            selectedMethod={selectedMethod}
            shipmentDetails={{
              origin: shipmentSummary?.origin,
              destination: shipmentSummary?.destination,
              package: shipmentSummary?.package,
              carrierName: shipmentSummary?.selectedRate?.carrierName,
              serviceName: shipmentSummary?.selectedRate?.serviceName,
            }}
          />
        </div>
      </form>

      {/* Desktop Cost Summary - Sidebar */}
      <div className="hidden lg:block fixed right-8 top-24 w-80 z-10">
        <CostSummary
          subtotal={subtotal}
          currency={currency}
          selectedMethod={selectedMethod}
          shipmentDetails={{
            origin: shipmentSummary?.origin,
            destination: shipmentSummary?.destination,
            package: shipmentSummary?.package,
            carrierName: shipmentSummary?.selectedRate?.carrierName,
            serviceName: shipmentSummary?.selectedRate?.serviceName,
          }}
        />
      </div>
    </ShippingLayout>
  )
}
