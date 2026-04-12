'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ShippingLayout } from '@/components/shipping/ShippingLayout'
import {
  ShipmentSummaryCard,
  OriginReviewSection,
  DestinationReviewSection,
  PackageReviewSection,
  PricingReviewSection,
  PaymentReviewSection,
  PickupReviewSection,
  TermsAndConditions,
  ValidationErrors,
  SubmissionActions,
} from '@/components/review'
import type { 
  OriginData, 
  DestinationData, 
  PackageData, 
  PricingData, 
  PaymentMethodData, 
  BillingData,
  PickupData,
  SpecialHandlingItem,
  DeliveryPreferenceItem,
  TermsAcceptance,
  ValidationError,
} from '@/components/review'
import { validateSubmission, areTermsAccepted } from '@/lib/submissionValidation'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { SkeletonReviewSection } from '@/components/ui/Skeleton'
import { withRetry } from '@/lib/retry'
import { CheckCircle } from 'lucide-react'

interface ShipmentDetails {
  id: string
  origin: OriginData
  destination: DestinationData
  package: PackageData
  specialHandling: SpecialHandlingItem[]
  deliveryPreferences: DeliveryPreferenceItem[]
  pricing: PricingData
  payment: PaymentMethodData
  billing: BillingData
  pickup: PickupData
}

// Helper to convert shipment API response to ReviewPageData
function transformShipmentData(apiData: unknown): ShipmentDetails {
  const data = apiData as Record<string, unknown>
  
  // Extract origin data from sender address
  const origin: OriginData = {
    name: (data.sender_contact_name as string) || 'Not provided',
    company: (data.sender_company as string) || undefined,
    line1: (data.origin?.line1 as string) || '',
    line2: (data.origin?.line2 as string) || undefined,
    city: (data.origin?.city as string) || 'Unknown',
    state: (data.origin?.state as string) || 'XX',
    postal: (data.origin?.postal as string) || (data.origin?.postalCode as string) || '',
    country: (data.origin?.country as string) || 'US',
    locationType: (data.origin?.locationType as string) || (data.origin?.address_type as string) || 'commercial',
    phone: (data.sender_contact_phone as string) || '',
    email: (data.sender_contact_email as string) || '',
    pickupInstructions: (data.pickup?.instructions as string) || undefined,
  }

  // Extract destination data from recipient address
  const destination: DestinationData = {
    name: (data.recipient_contact_name as string) || 'Not provided',
    company: (data.recipient_company as string) || undefined,
    line1: (data.destination?.line1 as string) || '',
    line2: (data.destination?.line2 as string) || undefined,
    city: (data.destination?.city as string) || 'Unknown',
    state: (data.destination?.state as string) || 'XX',
    postal: (data.destination?.postal as string) || (data.destination?.postalCode as string) || '',
    country: (data.destination?.country as string) || 'US',
    locationType: (data.destination?.locationType as string) || (data.destination?.address_type as string) || 'commercial',
    phone: (data.recipient_contact_phone as string) || '',
    email: (data.recipient_contact_email as string) || '',
  }

  // Extract package data
  const packageData: PackageData = {
    type: (data.package_type as string) || 'custom',
    length: parseFloat(data.length as string) || 0,
    width: parseFloat(data.width as string) || 0,
    height: parseFloat(data.height as string) || 0,
    dimensionUnit: 'in',
    weight: parseFloat(data.weight as string) || 0,
    weightUnit: 'lbs',
    declaredValue: parseFloat(data.declared_value as string) || 0,
    currency: (data.currency as string) || 'USD',
    contentsDescription: (data.contents_description as string) || '',
  }

  // Build pricing data from selected rate
  const selectedRate = data.selectedRate as Record<string, unknown> | undefined
  const pricing: PricingData = {
    carrierName: (selectedRate?.carrierName as string) || 'Not selected',
    serviceName: (selectedRate?.serviceName as string) || '',
    transitDaysMin: (selectedRate?.transitDaysMin as number) || 1,
    transitDaysMax: (selectedRate?.transitDaysMax as number) || 5,
    distance: (selectedRate?.distance as number) || undefined,
    billableWeight: (selectedRate?.billableWeight as number) || undefined,
    dimWeight: (selectedRate?.dimWeight as number) || undefined,
    baseRate: parseFloat(selectedRate?.baseRate as string) || parseFloat(data.base_rate as string) || 0,
    fuelSurcharge: parseFloat(selectedRate?.fuelSurcharge as string) || parseFloat(data.fuel_surcharge as string) || 0,
    fuelSurchargePercent: (selectedRate?.fuelSurchargePercent as number) || 0.15,
    insurance: parseFloat(selectedRate?.insurance as string) || parseFloat(data.insurance_cost as string) || 0,
    insuranceRate: (selectedRate?.insuranceRate as number) || 0.004,
    specialHandlingFees: (selectedRate?.specialHandlingFees as SpecialHandlingItem[]) || [],
    specialHandlingTotal: (selectedRate?.specialHandlingTotal as number) || 0,
    deliveryConfirmationFees: (selectedRate?.deliveryConfirmationFees as DeliveryPreferenceItem[]) || [],
    deliveryConfirmationTotal: (selectedRate?.deliveryConfirmationTotal as number) || 0,
    handlingFees: (selectedRate?.handlingFees as number) || undefined,
    deliveryFees: (selectedRate?.deliveryFees as number) || undefined,
    tax: (selectedRate?.tax as number) || 0,
    taxRate: (selectedRate?.taxRate as number) || 0.085,
    total: parseFloat(selectedRate?.total as string) || parseFloat(data.total_cost as string) || 0,
    currency: (selectedRate?.currency as string) || (data.currency as string) || 'USD',
  }

  // Build payment data from payment info
  const paymentInfo = data.payment as Record<string, unknown> | undefined
  const methodDetails = paymentInfo?.methodDetails as Record<string, unknown> | undefined
  
  const payment: PaymentMethodData = {
    method: (paymentInfo?.method as string) || '',
    methodLabel: getPaymentMethodLabel(paymentInfo?.method as string),
    // Purchase Order fields
    poNumber: (methodDetails?.po_number as string) || undefined,
    poAmount: parseFloat(methodDetails?.po_amount as string) || undefined,
    poExpirationDate: (methodDetails?.expiration_date as string) || undefined,
    poApprovalContact: (methodDetails?.approval_contact as string) || undefined,
    poDepartment: (methodDetails?.department as string) || undefined,
    // Bill of Lading fields
    bolNumber: (methodDetails?.bol_number as string) || undefined,
    bolDate: (methodDetails?.bol_date as string) || undefined,
    bolShipperReference: (methodDetails?.shipper_reference as string) || undefined,
    bolFreightTerms: (methodDetails?.freight_terms as string) || undefined,
    // Third Party fields
    tpAccountNumber: (methodDetails?.account_number as string) || undefined,
    tpCompanyName: (methodDetails?.company_name as string) || undefined,
    tpContactName: (methodDetails?.contact_name as string) || undefined,
    tpContactPhone: (methodDetails?.contact_phone as string) || undefined,
    tpContactEmail: (methodDetails?.contact_email as string) || undefined,
    tpAuthorizationCode: (methodDetails?.authorization_code as string) || undefined,
    // Net Terms fields
    netTermDays: (methodDetails?.term_days as number) || undefined,
    netTermAnnualRevenue: (methodDetails?.annual_revenue as number) || undefined,
    // Corporate Account fields
    corpAccountNumber: (methodDetails?.account_number as string) || undefined,
  }

  // Build billing data (simplified - in production would come from billing API)
  const billing: BillingData = {
    address: {
      line1: (data.billing?.address?.line1 as string) || (data.origin?.line1 as string) || '',
      line2: (data.billing?.address?.line2 as string) || (data.origin?.line2 as string) || undefined,
      city: (data.billing?.address?.city as string) || (data.origin?.city as string) || '',
      state: (data.billing?.address?.state as string) || (data.origin?.state as string) || '',
      postal: (data.billing?.address?.postal as string) || (data.origin?.postal as string) || '',
      country: (data.billing?.address?.country as string) || (data.origin?.country as string) || 'US',
      locationType: (data.billing?.address?.locationType as string) || 'commercial',
      sameAsOrigin: (data.billing?.address?.sameAsOrigin as boolean) || true,
    },
    contact: {
      name: (data.billing?.contact?.name as string) || (data.sender_contact_name as string) || '',
      title: (data.billing?.contact?.title as string) || '',
      phone: (data.billing?.contact?.phone as string) || (data.sender_contact_phone as string) || '',
      email: (data.billing?.contact?.email as string) || (data.sender_contact_email as string) || '',
    },
    company: {
      legalName: (data.billing?.company?.legalName as string) || (data.sender_company as string) || '',
      businessType: (data.billing?.company?.businessType as string) || '',
      industry: (data.billing?.company?.industry as string) || '',
    },
    invoicePreferences: {
      deliveryMethod: (data.billing?.invoicePreferences?.deliveryMethod as string) || 'email',
      format: (data.billing?.invoicePreferences?.format as string) || 'standard',
      frequency: (data.billing?.invoicePreferences?.frequency as string) || 'per_shipment',
    },
  }

  // Build pickup data from pickup details
  const pickupData = data.pickup as Record<string, unknown> | undefined
  const pickupSlot = pickupData?.slot as Record<string, unknown> | undefined
  const pickupContacts = (pickupData?.contacts as Record<string, unknown>[]) || []
  
  const primaryContact = pickupContacts.find((c: Record<string, unknown>) => c.is_primary === true) || pickupContacts[0]
  const backupContact = pickupContacts.find((c: Record<string, unknown>) => c.is_primary === false) || pickupContacts[1]

  const pickup: PickupData = {
    selectedPickup: {
      date: (pickupSlot?.slot_date as string) || (pickupData?.slot?.date as string) || '',
      timeSlot: {
        date: (pickupSlot?.slot_date as string) || '',
        timeWindow: (pickupSlot?.time_window as string) || '',
        fee: parseFloat(pickupSlot?.fee as string) || 0,
      },
      readyTime: '', // Would come from pickup details extension
    },
    location: {
      locationType: (pickupData?.location_type as string) || 'ground_level',
      locationTypeLabel: 'Ground Level',
      dockNumber: (pickupData?.dock_number as string) || undefined,
    },
    access: {
      requirements: (pickupData?.accessRequirements as Record<string, unknown>[])?.map(
        (r: Record<string, unknown>) => r.requirement_type as string
      ) || [],
      gateCode: (pickupData?.gate_code as string) || undefined,
      parkingInstructions: (pickupData?.parking_instructions as string) || undefined,
    },
    equipment: {
      equipment: (pickupData?.equipmentNeeds as Record<string, unknown>[])?.map(
        (e: Record<string, unknown>) => e.equipment_type as string
      ) || [],
    },
    loading: {
      assistanceType: (pickupData?.loading_assistance_type as string) || 'customer_load',
      assistanceTypeLabel: 'Customer Will Load',
    },
    specialInstructions: {
      driverInstructions: (pickupData?.instructions as string) || undefined,
    },
    contacts: {
      primary: {
        name: (primaryContact?.contact_name as string) || (data.sender_contact_name as string) || '',
        jobTitle: (primaryContact?.job_title as string) || undefined,
        mobilePhone: (primaryContact?.contact_phone as string) || (data.sender_contact_phone as string) || '',
        email: (primaryContact?.contact_email as string) || (data.sender_contact_email as string) || '',
        preferredMethod: 'email',
      },
      backup: {
        name: (backupContact?.contact_name as string) || '',
        phone: (backupContact?.contact_phone as string) || '',
        email: (backupContact?.contact_email as string) || undefined,
      },
    },
    authorizedPersonnel: {
      anyoneAtLocation: (pickupData?.authorizedPersonnel as Record<string, unknown>[])?.length === 0,
      personnelList: (pickupData?.authorizedPersonnel as Record<string, unknown>[])?.map(
        (p: Record<string, unknown>) => ({
          name: p.personnel_name as string,
          authorizationLevel: p.authorization_type as string,
          authorizationLevelLabel: p.authorization_type as string,
        })
      ) || [],
    },
    notifications: {
      emailReminder24h: true,
      smsReminder2h: true,
      callReminder30m: false,
      driverEnroute: true,
      pickupCompletion: true,
      transitUpdates: true,
    },
    fees: {
      timeSlotFee: parseFloat(pickupSlot?.fee as string) || 0,
      locationFee: 0,
      equipmentFee: 0,
      loadingFee: 0,
      accessFee: 0,
      totalFee: parseFloat(pickupSlot?.fee as string) || 0,
    },
  }

  // Build special handling from API data
  const apiSpecialHandling = (data.specialHandling as Record<string, unknown>[]) || []
  const specialHandling: SpecialHandlingItem[] = apiSpecialHandling.map((item: Record<string, unknown>) => ({
    id: item.handling_type as string,
    name: formatHandlingType(item.handling_type as string),
    fee: parseFloat(item.fee as string) || 0,
  }))

  return {
    id: (data.id as string) || '',
    origin,
    destination,
    package: packageData,
    specialHandling,
    deliveryPreferences: [], // Would be populated from deliveryPreferences data
    pricing,
    payment,
    billing,
    pickup,
  }
}

// Helper function to get payment method label
function getPaymentMethodLabel(method: string | undefined): string {
  if (!method) return ''
  
  const labels: Record<string, string> = {
    purchase_order: 'Purchase Order',
    bill_of_lading: 'Bill of Lading',
    third_party: 'Third-Party Billing',
    net_terms: 'Net Terms',
    corporate_account: 'Corporate Account',
  }
  
  return labels[method] || method
}

// Helper function to format handling type
function formatHandlingType(type: string | undefined): string {
  if (!type) return ''
  
  const labels: Record<string, string> = {
    fragile: 'Fragile Handling',
    hazardous: 'Hazardous Materials',
    temperature_controlled: 'Temperature Controlled',
    signature_required: 'Signature Required',
    adult_signature: 'Adult Signature Required',
    hold_for_pickup: 'Hold for Pickup',
    appointment_delivery: 'Appointment Delivery',
  }
  
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const shipmentId = params.id as string

  const [shipment, setShipment] = useState<ShipmentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Terms and conditions state
  const [termsAccepted, setTermsAccepted] = useState<TermsAcceptance>({
    declaredValueAccurate: false,
    insuranceUnderstood: false,
    contentsCompliant: false,
    carrierAuthorized: false,
    hazmatCertification: false,
  })

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Fetch shipment details from API
  const fetchShipmentDetails = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/shipments/${shipmentId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch shipment details')
      }

      const data = await response.json()
      
      // Step enforcement: if current_step < 5, redirect to appropriate step
      if (data.current_step && data.current_step < 5) {
        if (data.current_step === 1) {
          router.push(`/shipments/new?edit=${shipmentId}`)
        } else if (data.current_step === 2) {
          router.push(`/shipments/${shipmentId}/pricing`)
        } else if (data.current_step === 3) {
          router.push(`/shipments/${shipmentId}/payment`)
        } else if (data.current_step === 4) {
          router.push(`/shipments/${shipmentId}/pickup`)
        }
        return
      }
      
      const transformedData = transformShipmentData(data)
      setShipment(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shipment details')
      
      // Use fallback data for development
      setShipment({
        id: shipmentId,
        origin: {
          name: 'John Smith',
          company: 'Acme Corporation',
          line1: '123 Main Street',
          line2: 'Suite 100',
          city: 'Austin',
          state: 'TX',
          postal: '78701',
          country: 'US',
          locationType: 'commercial',
          phone: '555-123-4567',
          email: 'john@acme.com',
          pickupInstructions: 'Please call upon arrival',
        },
        destination: {
          name: 'Jane Doe',
          company: 'Global Industries',
          line1: '456 Oak Avenue',
          city: 'Dallas',
          state: 'TX',
          postal: '75201',
          country: 'US',
          locationType: 'commercial',
          phone: '555-987-6543',
          email: 'jane@global.com',
        },
        package: {
          type: 'medium-box',
          length: 12,
          width: 10,
          height: 8,
          dimensionUnit: 'in',
          weight: 5.5,
          weightUnit: 'lbs',
          declaredValue: 250,
          currency: 'USD',
          contentsDescription: 'Electronic components and accessories',
        },
        specialHandling: [],
        deliveryPreferences: [],
        pricing: {
          carrierName: 'Postal Express',
          serviceName: 'Ground',
          transitDaysMin: 2,
          transitDaysMax: 3,
          distance: 195,
          baseRate: 18.99,
          fuelSurcharge: 2.85,
          fuelSurchargePercent: 0.15,
          insurance: 1.00,
          insuranceRate: 0.004,
          specialHandlingFees: [],
          specialHandlingTotal: 0,
          deliveryConfirmationFees: [],
          deliveryConfirmationTotal: 0,
          tax: 1.81,
          taxRate: 0.0825,
          total: 24.65,
          currency: 'USD',
        },
        payment: {
          method: 'purchase_order',
          methodLabel: 'Purchase Order',
          poNumber: 'PO-2024-001234',
          poAmount: 5000,
          poExpirationDate: '2024-12-31',
          poApprovalContact: 'Bob Johnson',
          poDepartment: 'Procurement',
        },
        billing: {
          address: {
            line1: '123 Main Street',
            line2: 'Suite 100',
            city: 'Austin',
            state: 'TX',
            postal: '78701',
            country: 'US',
            locationType: 'commercial',
            sameAsOrigin: true,
          },
          contact: {
            name: 'Sarah Williams',
            title: 'Finance Manager',
            phone: '555-123-4568',
            email: 'sarah@acme.com',
          },
          company: {
            legalName: 'Acme Corporation',
            businessType: 'corporation',
            industry: 'manufacturing',
          },
          invoicePreferences: {
            deliveryMethod: 'email',
            format: 'itemized',
            frequency: 'per_shipment',
          },
        },
        pickup: {
          selectedPickup: {
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            timeSlot: {
              date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              timeWindow: '9:00 AM - 12:00 PM',
              fee: 0,
            },
            readyTime: '08:00',
          },
          location: {
            locationType: 'loading_dock',
            locationTypeLabel: 'Loading Dock',
            dockNumber: 'Dock A',
          },
          access: {
            requirements: ['call_upon_arrival', 'security_checkin'],
          },
          equipment: {
            equipment: ['standard_dolly'],
          },
          loading: {
            assistanceType: 'customer_load',
            assistanceTypeLabel: 'Customer Will Load',
          },
          specialInstructions: {},
          contacts: {
            primary: {
              name: 'John Smith',
              jobTitle: 'Warehouse Manager',
              mobilePhone: '555-123-4567',
              email: 'john@acme.com',
              preferredMethod: 'phone',
            },
            backup: {
              name: 'Mike Brown',
              phone: '555-123-4569',
              email: 'mike@acme.com',
            },
          },
          authorizedPersonnel: {
            anyoneAtLocation: false,
            personnelList: [],
          },
          notifications: {
            emailReminder24h: true,
            smsReminder2h: true,
            callReminder30m: false,
            driverEnroute: true,
            pickupCompletion: true,
            transitUpdates: true,
          },
          fees: {
            timeSlotFee: 0,
            locationFee: 0,
            equipmentFee: 0,
            loadingFee: 0,
            accessFee: 0,
            totalFee: 0,
          },
        },
      })
    } finally {
      setIsLoading(false)
    }
  }, [shipmentId])

  useEffect(() => {
    fetchShipmentDetails()
  }, [fetchShipmentDetails])

  // Check if hazmat is selected
  const hasHazmat = shipment?.specialHandling?.some(item => 
    item.id === 'hazardous' || item.id === 'hazmat' || item.name?.toLowerCase().includes('hazmat')
  ) ?? false

  // Handle submit shipment
  const handleSubmit = async () => {
    if (!shipment) return

    // Validate submission
    const validationResult = validateSubmission({
      shipment: {
        id: shipmentId,
        origin: {
          line1: shipment.origin.line1,
          city: shipment.origin.city,
          state: shipment.origin.state,
          postal: shipment.origin.postal,
        },
        destination: {
          line1: shipment.destination.line1,
          city: shipment.destination.city,
          state: shipment.destination.state,
          postal: shipment.destination.postal,
        },
        package: {
          type: shipment.package.type,
          weight: shipment.package.weight,
          declaredValue: shipment.package.declaredValue,
        },
        specialHandling: shipment.specialHandling.map(item => item.id),
        selectedRate: {
          id: shipment.pricing?.carrierName,
          carrierName: shipment.pricing?.carrierName,
          total: shipment.pricing?.total,
        },
        payment: {
          method: shipment.payment?.method,
          poExpirationDate: shipment.payment?.poExpirationDate,
        },
        pickup: {
          selectedPickup: {
            date: shipment.pickup?.selectedPickup?.date,
            timeSlot: {
              timeWindow: shipment.pickup?.selectedPickup?.timeSlot?.timeWindow,
            },
          },
        },
      },
      termsAccepted,
    })

    if (!validationResult.success) {
      setValidationErrors(validationResult.errors)
      setShowValidationErrors(true)
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // All validations passed - proceed to submission with retry
    setIsSubmitting(true)
    setShowValidationErrors(false)
    setError(null)
    
    try {
      await withRetry(
        async () => {
          // Call the submission endpoint
          const response = await fetch(`/api/shipments/${shipmentId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              terms_accepted: true,
              acknowledgments: [
                'declared_value_accurate',
                'insurance_understood',
                'contents_compliant',
                'carrier_authorized',
                ...(hasHazmat ? ['hazmat_certification'] : []),
              ],
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            // Handle validation errors from server (don't retry these)
            if (data.code === 'VALIDATION_FAILED' && data.details) {
              const serverErrors: ValidationError[] = data.details.map((d: { message: string }) => ({
                type: 'terms',
                message: d.message,
              }))
              setValidationErrors(serverErrors)
              setShowValidationErrors(true)
              window.scrollTo({ top: 0, behavior: 'smooth' })
              // Throw a non-retryable error
              const validationError = new Error('Validation failed')
              ;(validationError as Error & { isValidationError: boolean }).isValidationError = true
              throw validationError
            }
            throw new Error(data.error || 'Failed to submit shipment')
          }

          return data
        },
        {
          maxRetries: 2,
          initialDelay: 1000,
          shouldRetry: (err) => {
            // Don't retry validation errors
            if ((err as Error & { isValidationError?: boolean }).isValidationError) {
              return false
            }
            return true
          },
        }
      )

      // Navigate to confirmation page
      router.push(`/shipments/${shipmentId}/confirmation`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit shipment')
      setIsSubmitting(false)
    }
  }

  // Handle back to pickup
  const handleBack = () => {
    router.push(`/shipments/${shipmentId}/pickup`)
  }

  // Handle save as draft
  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    setSaveMessage(null)
    try {
      const response = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'draft',
          terms_accepted: termsAccepted,
          last_saved_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      // Show success message
      setSaveMessage('Draft saved successfully!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft')
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Handle start over - delete shipment and redirect
  const handleStartOver = async () => {
    const response = await fetch(`/api/shipments/${shipmentId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete shipment')
    }

    router.push('/shipments/new')
  }

  // Calculate estimated delivery date based on pickup date and transit time
  const calculateEstimatedDelivery = (): string => {
    if (!shipment?.pickup?.selectedPickup?.date) return ''
    
    const pickupDate = new Date(shipment.pickup.selectedPickup.date)
    const transitDays = shipment.pricing?.transitDaysMax || 3
    
    // Add transit days (business days only - skip weekends)
    let daysAdded = 0
    const deliveryDate = new Date(pickupDate)
    
    while (daysAdded < transitDays) {
      deliveryDate.setDate(deliveryDate.getDate() + 1)
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
        daysAdded++
      }
    }
    
    return deliveryDate.toISOString()
  }

  if (isLoading) {
    return (
      <ShippingLayout
        step={5}
        shipmentId={shipmentId}
        navigationProps={{
          nextLabel: 'Loading...',
          isNextDisabled: true,
          isNextLoading: true,
        }}
      >
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0 space-y-4 md:space-y-6">
            {/* Header skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            </div>
            {/* Section skeletons */}
            <SkeletonReviewSection />
            <SkeletonReviewSection />
            <SkeletonReviewSection />
            <SkeletonReviewSection />
          </div>
          <div className="lg:w-80 shrink-0 order-first lg:order-last">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded w-full animate-pulse mt-4" />
            </div>
          </div>
        </div>
      </ShippingLayout>
    )
  }

  return (
    <ShippingLayout
      step={5}
      shipmentId={shipmentId}
      headerProps={{
        showBackButton: true,
        backHref: `/shipments/${shipmentId}/pickup`,
      }}
      navigationProps={{
        onNext: handleSubmit,
        onPrevious: handleBack,
        nextLabel: isSubmitting ? 'Submitting...' : 'Confirm Shipment',
        previousLabel: 'Back to Pickup',
        isNextDisabled: isSubmitting || !areTermsAccepted(termsAccepted, hasHazmat),
        isNextLoading: isSubmitting,
        showPrevious: true,
      }}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Review Shipment
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Please review all details before confirming your shipment. Click Edit on any section to make changes.
            </p>
          </div>

          {/* Error message with retry */}
          {error && (
            <ErrorAlert
              title="Error"
              message={error}
              severity="error"
              onRetry={() => {
                setError(null)
                fetchShipmentDetails()
              }}
              retryLabel="Retry"
            />
          )}

          {/* Save success message */}
          {saveMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-600">{saveMessage}</p>
            </div>
          )}

          {/* Validation Errors --}}
          {showValidationErrors && validationErrors.length > 0 && (
            <ValidationErrors
              errors={validationErrors}
              onErrorClick={(error) => {
                // Additional handling if needed
              }}
            />
          )}

          {/* Review Sections */}
          <div className="space-y-4">
            {shipment && (
              <>
                <div id="origin-section">
                  <OriginReviewSection 
                    data={shipment.origin} 
                    shipmentId={shipmentId} 
                  />
                </div>
                
                <div id="destination-section">
                  <DestinationReviewSection 
                    data={shipment.destination} 
                    shipmentId={shipmentId} 
                  />
                </div>
                
                <div id="package-section">
                  <PackageReviewSection 
                    data={shipment.package}
                    specialHandling={shipment.specialHandling}
                    deliveryPreferences={shipment.deliveryPreferences}
                    shipmentId={shipmentId}
                  />
                </div>
                
                <div id="pricing-section">
                  <PricingReviewSection 
                    data={shipment.pricing}
                    shipmentId={shipmentId}
                  />
                </div>
                
                <div id="payment-section">
                  <PaymentReviewSection 
                    payment={shipment.payment}
                    billing={shipment.billing}
                    shipmentId={shipmentId}
                  />
                </div>
                
                <div id="pickup-section">
                  <PickupReviewSection 
                    data={shipment.pickup}
                    shipmentId={shipmentId}
                  />
                </div>
              </>
            )}
          </div>

          {/* Terms and Conditions */}
          {shipment && (
            <div id="terms-section">
              <TermsAndConditions
                accepted={termsAccepted}
                onChange={setTermsAccepted}
                declaredValue={shipment.package.declaredValue}
                hasHazmat={hasHazmat}
              />
            </div>
          )}

          {/* Submission Actions */}
          {shipment && (
            <SubmissionActions
              shipmentId={shipmentId}
              isSubmitting={isSubmitting}
              isSaving={isSavingDraft}
              canSubmit={areTermsAccepted(termsAccepted, hasHazmat) && validationErrors.length === 0}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
              onStartOver={handleStartOver}
            />
          )}

          {/* Terms Notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              By confirming this shipment, you agree to our{' '}
              <a href="/terms-and-conditions" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Terms of Service</a>
              {' '}and{' '}
              <a href="/shipping-conditions" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Shipping Conditions</a>.
              Please review our <a href="/cancellation-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Cancellation Policy</a> for information about refunds and changes.
            </p>
          </div>
        </div>

        {/* Sidebar - Shipment Summary Card */}
        <div className="lg:w-80 shrink-0 order-first lg:order-last">
          <div className="lg:sticky lg:top-24 space-y-4">
            {/* Shipment Summary Card */}
            {shipment && (
              <ShipmentSummaryCard
                originCity={shipment.origin.city}
                originState={shipment.origin.state}
                destCity={shipment.destination.city}
                destState={shipment.destination.state}
                distance={shipment.pricing?.distance}
                carrierName={shipment.pricing?.carrierName}
                serviceName={shipment.pricing?.serviceName}
                transitMin={shipment.pricing?.transitDaysMin}
                transitMax={shipment.pricing?.transitDaysMax}
                totalCost={shipment.pricing?.total}
                currency={shipment.pricing?.currency}
                pickupDate={shipment.pickup?.selectedPickup?.date}
                pickupTimeWindow={shipment.pickup?.selectedPickup?.timeSlot?.timeWindow}
                estimatedDelivery={calculateEstimatedDelivery()}
              />
            )}
          </div>
        </div>
      </div>
    </ShippingLayout>
  )
}
