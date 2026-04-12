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
} from '@/components/review'
import { Loader2, AlertCircle } from 'lucide-react'

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
    locationType: (data.origin?.locationType as string) || 'commercial',
    phone: (data.sender_contact_phone as string) || '',
    email: (data.sender_contact_email as string) || '',
    pickupInstructions: (data.pickup_instructions as string) || undefined,
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
    locationType: (data.destination?.locationType as string) || 'commercial',
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
  const pricing: PricingData = {
    carrierName: (data.selectedRate?.carrierName as string) || 'Not selected',
    serviceName: (data.selectedRate?.serviceName as string) || '',
    transitDaysMin: (data.selectedRate?.transitDaysMin as number) || 1,
    transitDaysMax: (data.selectedRate?.transitDaysMax as number) || 5,
    distance: (data.selectedRate?.distance as number) || undefined,
    billableWeight: (data.selectedRate?.billableWeight as number) || undefined,
    dimWeight: (data.selectedRate?.dimWeight as number) || undefined,
    baseRate: parseFloat(data.base_rate as string) || (data.selectedRate?.total as number) || 0,
    fuelSurcharge: (data.selectedRate?.fuelSurcharge as number) || 0,
    fuelSurchargePercent: (data.selectedRate?.fuelSurchargePercent as number) || 0.15,
    insurance: (data.selectedRate?.insurance as number) || 0,
    insuranceRate: (data.selectedRate?.insuranceRate as number) || 0.004,
    specialHandlingFees: (data.selectedRate?.specialHandlingFees as SpecialHandlingItem[]) || [],
    specialHandlingTotal: (data.selectedRate?.specialHandlingTotal as number) || 0,
    deliveryConfirmationFees: (data.selectedRate?.deliveryConfirmationFees as DeliveryPreferenceItem[]) || [],
    deliveryConfirmationTotal: (data.selectedRate?.deliveryConfirmationTotal as number) || 0,
    handlingFees: (data.selectedRate?.handlingFees as number) || undefined,
    deliveryFees: (data.selectedRate?.deliveryFees as number) || undefined,
    tax: (data.selectedRate?.tax as number) || 0,
    taxRate: (data.selectedRate?.taxRate as number) || 0.085,
    total: (data.selectedRate?.total as number) || parseFloat(data.total_cost as string) || 0,
    currency: (data.selectedRate?.currency as string) || (data.currency as string) || 'USD',
  }

  // Build payment data
  const payment: PaymentMethodData = {
    method: (data.payment?.method as string) || '',
    methodLabel: (data.payment?.methodLabel as string) || '',
    poNumber: (data.payment?.poNumber as string) || undefined,
    poAmount: (data.payment?.poAmount as number) || undefined,
    poExpirationDate: (data.payment?.poExpirationDate as string) || undefined,
    poApprovalContact: (data.payment?.poApprovalContact as string) || undefined,
    poDepartment: (data.payment?.poDepartment as string) || undefined,
    bolNumber: (data.payment?.bolNumber as string) || undefined,
    bolDate: (data.payment?.bolDate as string) || undefined,
    bolShipperReference: (data.payment?.bolShipperReference as string) || undefined,
    bolFreightTerms: (data.payment?.bolFreightTerms as string) || undefined,
    tpAccountNumber: (data.payment?.tpAccountNumber as string) || undefined,
    tpCompanyName: (data.payment?.tpCompanyName as string) || undefined,
    tpContactName: (data.payment?.tpContactName as string) || undefined,
    tpContactPhone: (data.payment?.tpContactPhone as string) || undefined,
    tpContactEmail: (data.payment?.tpContactEmail as string) || undefined,
    tpAuthorizationCode: (data.payment?.tpAuthorizationCode as string) || undefined,
    netTermDays: (data.payment?.netTermDays as number) || undefined,
    netTermAnnualRevenue: (data.payment?.netTermAnnualRevenue as number) || undefined,
    corpAccountNumber: (data.payment?.corpAccountNumber as string) || undefined,
  }

  // Build billing data
  const billing: BillingData = {
    address: {
      line1: (data.billing?.address?.line1 as string) || '',
      line2: (data.billing?.address?.line2 as string) || undefined,
      city: (data.billing?.address?.city as string) || '',
      state: (data.billing?.address?.state as string) || '',
      postal: (data.billing?.address?.postal as string) || '',
      country: (data.billing?.address?.country as string) || 'US',
      locationType: (data.billing?.address?.locationType as string) || 'commercial',
      sameAsOrigin: (data.billing?.address?.sameAsOrigin as boolean) || false,
    },
    contact: {
      name: (data.billing?.contact?.name as string) || '',
      title: (data.billing?.contact?.title as string) || '',
      phone: (data.billing?.contact?.phone as string) || '',
      email: (data.billing?.contact?.email as string) || '',
      department: (data.billing?.contact?.department as string) || undefined,
      glCode: (data.billing?.contact?.glCode as string) || undefined,
      taxId: (data.billing?.contact?.taxId as string) || undefined,
    },
    company: {
      legalName: (data.billing?.company?.legalName as string) || '',
      dba: (data.billing?.company?.dba as string) || undefined,
      businessType: (data.billing?.company?.businessType as string) || '',
      industry: (data.billing?.company?.industry as string) || '',
      shippingVolume: (data.billing?.company?.shippingVolume as string) || undefined,
    },
    invoicePreferences: {
      deliveryMethod: (data.billing?.invoicePreferences?.deliveryMethod as string) || '',
      format: (data.billing?.invoicePreferences?.format as string) || '',
      frequency: (data.billing?.invoicePreferences?.frequency as string) || '',
    },
  }

  // Build pickup data
  const pickup: PickupData = {
    selectedPickup: {
      date: (data.pickup?.selectedPickup?.date as string) || '',
      timeSlot: {
        date: (data.pickup?.selectedPickup?.timeSlot?.date as string) || '',
        timeWindow: (data.pickup?.selectedPickup?.timeSlot?.label as string) || 
                    (data.pickup?.selectedPickup?.timeSlot?.timeWindow as string) || '',
        fee: (data.pickup?.selectedPickup?.timeSlot?.fee as number) || 0,
      },
      readyTime: (data.pickup?.selectedPickup?.readyTime as string) || '',
    },
    location: {
      locationType: (data.pickup?.location?.locationType as string) || '',
      locationTypeLabel: (data.pickup?.location?.locationTypeLabel as string) || '',
      dockNumber: (data.pickup?.location?.dockNumber as string) || undefined,
      otherDescription: (data.pickup?.location?.otherDescription as string) || undefined,
    },
    access: {
      requirements: (data.pickup?.access?.requirements as string[]) || [],
      requirementLabels: (data.pickup?.access?.requirementLabels as string[]) || undefined,
      gateCode: (data.pickup?.access?.gateCode as string) || undefined,
      parkingInstructions: (data.pickup?.access?.parkingInstructions as string) || undefined,
    },
    equipment: {
      equipment: (data.pickup?.equipment?.equipment as string[]) || [],
      equipmentLabels: (data.pickup?.equipment?.equipmentLabels as string[]) || undefined,
    },
    loading: {
      assistanceType: (data.pickup?.loading?.assistanceType as string) || '',
      assistanceTypeLabel: (data.pickup?.loading?.assistanceTypeLabel as string) || '',
    },
    specialInstructions: {
      gateCode: (data.pickup?.specialInstructions?.gateCode as string) || undefined,
      parkingLoading: (data.pickup?.specialInstructions?.parkingLoading as string) || undefined,
      packageLocation: (data.pickup?.specialInstructions?.packageLocation as string) || undefined,
      driverInstructions: (data.pickup?.specialInstructions?.driverInstructions as string) || undefined,
    },
    contacts: {
      primary: {
        name: (data.pickup?.contacts?.primary?.name as string) || '',
        jobTitle: (data.pickup?.contacts?.primary?.jobTitle as string) || undefined,
        mobilePhone: (data.pickup?.contacts?.primary?.mobilePhone as string) || '',
        altPhone: (data.pickup?.contacts?.primary?.altPhone as string) || undefined,
        email: (data.pickup?.contacts?.primary?.email as string) || '',
        preferredMethod: (data.pickup?.contacts?.primary?.preferredMethod as string) || 'email',
      },
      backup: {
        name: (data.pickup?.contacts?.backup?.name as string) || '',
        phone: (data.pickup?.contacts?.backup?.phone as string) || '',
        email: (data.pickup?.contacts?.backup?.email as string) || undefined,
      },
    },
    authorizedPersonnel: {
      anyoneAtLocation: (data.pickup?.authorizedPersonnel?.anyoneAtLocation as boolean) || false,
      personnelList: (data.pickup?.authorizedPersonnel?.personnelList as PickupData['authorizedPersonnel']['personnelList']) || [],
    },
    specialAuthorization: data.pickup?.specialAuthorization ? {
      idVerificationRequired: (data.pickup.specialAuthorization.idVerificationRequired as boolean) || false,
      signatureRequired: (data.pickup.specialAuthorization.signatureRequired as boolean) || false,
      photoIdMatching: (data.pickup.specialAuthorization.photoIdMatching as boolean) || false,
    } : undefined,
    notifications: {
      emailReminder24h: (data.pickup?.notifications?.emailReminder24h as boolean) ?? true,
      smsReminder2h: (data.pickup?.notifications?.smsReminder2h as boolean) ?? true,
      callReminder30m: (data.pickup?.notifications?.callReminder30m as boolean) || false,
      driverEnroute: (data.pickup?.notifications?.driverEnroute as boolean) ?? true,
      pickupCompletion: (data.pickup?.notifications?.pickupCompletion as boolean) ?? true,
      transitUpdates: (data.pickup?.notifications?.transitUpdates as boolean) ?? true,
    },
    fees: {
      timeSlotFee: (data.pickup?.fees?.timeSlotFee as number) || 0,
      locationFee: (data.pickup?.fees?.locationFee as number) || 0,
      equipmentFee: (data.pickup?.fees?.equipmentFee as number) || 0,
      loadingFee: (data.pickup?.fees?.loadingFee as number) || 0,
      accessFee: (data.pickup?.fees?.accessFee as number) || 0,
      totalFee: (data.pickup?.fees?.totalFee as number) || 0,
    },
  }

  return {
    id: (data.id as string) || '',
    origin,
    destination,
    package: packageData,
    specialHandling: (data.specialHandling as SpecialHandlingItem[]) || [],
    deliveryPreferences: (data.deliveryPreferences as DeliveryPreferenceItem[]) || [],
    pricing,
    payment,
    billing,
    pickup,
  }
}

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const shipmentId = params.id as string

  const [shipment, setShipment] = useState<ShipmentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      const transformedData = transformShipmentData(data)
      setShipment(transformedData)
    } catch (err) {
      console.error('Error fetching shipment:', err)
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
            department: 'Finance',
            glCode: 'GL-001-EXP',
          },
          company: {
            legalName: 'Acme Corporation',
            dba: 'Acme Shipping',
            businessType: 'corporation',
            industry: 'manufacturing',
            shippingVolume: '501-1000',
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
            personnelList: [
              { name: 'John Smith', authorizationLevel: 'full', authorizationLevelLabel: 'Full Authorization' },
              { name: 'Mike Brown', authorizationLevel: 'limited', authorizationLevelLabel: 'Limited Authorization' },
            ],
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

  // Handle continue to confirmation
  const handleContinue = () => {
    router.push(`/shipments/${shipmentId}/confirm`)
  }

  // Handle back to pickup
  const handleBack = () => {
    router.push(`/shipments/${shipmentId}/pickup`)
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
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading shipment details...</p>
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
        onNext: handleContinue,
        onPrevious: handleBack,
        nextLabel: 'Confirm Shipment',
        previousLabel: 'Back to Pickup',
        isNextDisabled: false,
        showPrevious: true,
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Review Shipment
          </h1>
          <p className="text-gray-600">
            Please review all details before confirming your shipment. Click Edit on any section to make changes.
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

        {/* Review Sections */}
        <div className="space-y-4">
          {shipment && (
            <>
              <OriginReviewSection 
                data={shipment.origin} 
                shipmentId={shipmentId} 
              />
              
              <DestinationReviewSection 
                data={shipment.destination} 
                shipmentId={shipmentId} 
              />
              
              <PackageReviewSection 
                data={shipment.package}
                specialHandling={shipment.specialHandling}
                deliveryPreferences={shipment.deliveryPreferences}
                shipmentId={shipmentId}
              />
              
              <PricingReviewSection 
                data={shipment.pricing}
                shipmentId={shipmentId}
              />
              
              <PaymentReviewSection 
                payment={shipment.payment}
                billing={shipment.billing}
                shipmentId={shipmentId}
              />
              
              <PickupReviewSection 
                data={shipment.pickup}
                shipmentId={shipmentId}
              />
            </>
          )}
        </div>

        {/* Terms Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            By confirming this shipment, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:underline">Shipping Conditions</a>.
            Please review our <a href="#" className="text-blue-600 hover:underline">Cancellation Policy</a> for information about refunds and changes.
          </p>
        </div>
      </div>
    </ShippingLayout>
  )
}
