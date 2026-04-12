'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { ShippingLayout } from '@/components/shipping/ShippingLayout'
import {
  SuccessBanner,
  ShipmentReferenceSection,
  PickupConfirmationSection,
  DeliveryInformationSection,
  TrackingInformationSection,
  PackageDocumentationSection,
  ContactInformationSection,
  NextStepsSection,
  AdditionalServicesSection,
  RecentShipments,
} from '@/components/confirmation'
import type {
  ConfirmationPageData,
  RecentShipmentData,
} from '@/components/confirmation'
import { Loader2, AlertCircle } from 'lucide-react'

interface ConfirmPageData extends ConfirmationPageData {
  recentShipments: RecentShipmentData[]
}

export default function ConfirmPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const shipmentId = params.id as string

  const [data, setData] = useState<ConfirmPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch confirmation data from API
  const fetchConfirmationData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch the shipment data
      const response = await fetch(`/api/shipments/${shipmentId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch shipment details')
      }

      const apiData = await response.json()

      // Transform API data to confirmation page format
      const confirmationData: ConfirmPageData = {
        shipmentId,
        reference: {
          confirmationNumber: apiData.confirmation_number || apiData.confirmationNumber || 'PENDING',
          customerReference: apiData.customer_reference || undefined,
          carrier: apiData.carrier || apiData.selectedRate?.carrier || null,
          serviceType: apiData.service_type || apiData.selectedRate?.service || null,
          totalCost: parseFloat(apiData.total_cost) || 0,
          currency: apiData.currency || 'USD',
        },
        pickup: {
          scheduledDate: apiData.pickup?.date || apiData.pickupDate || new Date().toISOString(),
          timeWindow: apiData.pickup?.timeWindow || apiData.pickup?.time_window || '9:00 AM - 5:00 PM',
          readyTime: apiData.pickup?.readyTime,
          status: 'confirmed',
          whatToExpect: [
            'Driver will arrive within the scheduled time window',
            'Have your package ready at the pickup location',
            'Ensure shipping label is attached to the package',
            'Authorized personnel must be present to release the shipment',
            'You will receive SMS/email notifications when driver is en route',
          ],
        },
        delivery: {
          estimatedDate: apiData.estimated_delivery || apiData.estimatedDelivery || null,
          address: {
            name: apiData.recipient_contact_name || apiData.destination?.name || 'Recipient',
            company: apiData.recipient_company || apiData.destination?.company || undefined,
            line1: apiData.destination?.line1 || apiData.recipient_address?.line1 || '',
            line2: apiData.destination?.line2 || apiData.recipient_address?.line2 || undefined,
            city: apiData.destination?.city || apiData.recipient_address?.city || '',
            state: apiData.destination?.state || apiData.recipient_address?.state || '',
            postal: apiData.destination?.postal || apiData.recipient_address?.postalCode || '',
            country: apiData.destination?.country || apiData.recipient_address?.country || 'US',
          },
          contact: {
            name: apiData.recipient_contact_name || apiData.destination?.name || 'Recipient',
            phone: apiData.recipient_contact_phone || apiData.destination?.phone || '',
            email: apiData.recipient_contact_email || apiData.destination?.email || undefined,
          },
          specialInstructions: apiData.delivery_instructions || apiData.destination?.instructions || undefined,
        },
        tracking: {
          trackingNumber: apiData.tracking_number || null,
          trackingAvailableAt: apiData.tracking_available_at || null,
          carrierTrackingUrl: apiData.carrier?.tracking_url_template
            ?.replace('{tracking_number}', apiData.tracking_number || '')
            || apiData.carrier?.trackingUrlTemplate
            ?.replace('{tracking_number}', apiData.tracking_number || ''),
          smsNotifications: apiData.notifications?.sms !== false,
          emailNotifications: apiData.notifications?.email !== false,
        },
        documentation: {
          labelStatus: apiData.label_status || 'generating',
          requiredDocs: [
            { name: 'Shipping Label', required: true, completed: apiData.label_status === 'ready' },
            { name: 'Commercial Invoice (if international)', required: false, completed: false },
            { name: 'Export Documentation (if applicable)', required: false, completed: false },
          ],
        },
        contacts: {
          support: {
            phone: '1-800-SHIP-NOW',
            email: 'support@b2bshipping.com',
            chatAvailable: true,
            hours: '24/7',
          },
          accountManager: apiData.account_manager || undefined,
          claims: {
            phone: '1-800-CLAIMS-1',
            email: 'claims@b2bshipping.com',
          },
          emergency: {
            phone: '1-800-URGENT-1',
            description: 'For urgent shipment issues outside business hours',
          },
        },
        nextSteps: {
          beforePickup: [
            { task: 'Print and attach shipping label to package', completed: false },
            { task: 'Ensure package is properly sealed', completed: false },
            { task: 'Have authorized personnel available for pickup', completed: false },
            { task: 'Prepare any required documentation', completed: false },
          ],
          afterPickup: [
            { task: 'Track your shipment online', completed: false },
            { task: 'Receive delivery confirmation', completed: false },
            { task: 'Review and rate your experience', completed: false },
          ],
        },
        recentShipments: [], // Will be populated separately
      }

      // Fetch recent shipments
      try {
        const recentResponse = await fetch('/api/shipments?limit=3&status=confirmed')
        if (recentResponse.ok) {
          const recentData = await recentResponse.json()
          confirmationData.recentShipments = (recentData.shipments || [])
            .filter((s: { id: string }) => s.id !== shipmentId)
            .slice(0, 3)
            .map((s: {
              id: string
              confirmation_number?: string
              created_at?: string
              origin?: { city: string; state: string }
              destination?: { city: string; state: string }
              status?: string
              carrier?: { name: string }
            }) => ({
              id: s.id,
              confirmationNumber: s.confirmation_number || s.id.slice(0, 8).toUpperCase(),
              createdAt: s.created_at || new Date().toISOString(),
              origin: {
                city: s.origin?.city || 'Unknown',
                state: s.origin?.state || 'XX',
              },
              destination: {
                city: s.destination?.city || 'Unknown',
                state: s.destination?.state || 'XX',
              },
              status: s.status || 'confirmed',
              carrierName: s.carrier?.name || 'Carrier',
            }))
        }
      } catch (e) {
        confirmationData.recentShipments = []
      }

      setData(confirmationData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load confirmation details')

      // Use fallback data for development
      setData({
        shipmentId,
        reference: {
          confirmationNumber: 'SHK-2026-123456',
          customerReference: 'PO-2024-001234',
          carrier: {
            id: 'carrier-1',
            name: 'Postal Express',
          },
          serviceType: {
            id: 'service-1',
            name: 'Ground',
            transitDaysMin: 2,
            transitDaysMax: 3,
          },
          totalCost: 24.65,
          currency: 'USD',
        },
        pickup: {
          scheduledDate: new Date(Date.now() + 86400000).toISOString(),
          timeWindow: '9:00 AM - 12:00 PM',
          readyTime: '08:00',
          status: 'confirmed',
          whatToExpect: [
            'Driver will arrive within the scheduled time window',
            'Have your package ready at the pickup location',
            'Ensure shipping label is attached to the package',
            'Authorized personnel must be present to release the shipment',
            'You will receive SMS/email notifications when driver is en route',
          ],
        },
        delivery: {
          estimatedDate: new Date(Date.now() + 4 * 86400000).toISOString(),
          address: {
            name: 'Jane Doe',
            company: 'Global Industries',
            line1: '456 Oak Avenue',
            city: 'Dallas',
            state: 'TX',
            postal: '75201',
            country: 'US',
          },
          contact: {
            name: 'Jane Doe',
            phone: '555-987-6543',
            email: 'jane@global.com',
          },
        },
        tracking: {
          trackingNumber: null,
          trackingAvailableAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          carrierTrackingUrl: 'https://track.carrier.com/?tracking=',
          smsNotifications: true,
          emailNotifications: true,
        },
        documentation: {
          labelStatus: 'generating',
          requiredDocs: [
            { name: 'Shipping Label', required: true, completed: false },
            { name: 'Commercial Invoice (if international)', required: false, completed: false },
            { name: 'Export Documentation (if applicable)', required: false, completed: false },
          ],
        },
        contacts: {
          support: {
            phone: '1-800-SHIP-NOW',
            email: 'support@b2bshipping.com',
            chatAvailable: true,
            hours: '24/7',
          },
          claims: {
            phone: '1-800-CLAIMS-1',
            email: 'claims@b2bshipping.com',
          },
          emergency: {
            phone: '1-800-URGENT-1',
            description: 'For urgent shipment issues outside business hours',
          },
        },
        nextSteps: {
          beforePickup: [
            { task: 'Print and attach shipping label to package', completed: false },
            { task: 'Ensure package is properly sealed', completed: false },
            { task: 'Have authorized personnel available for pickup', completed: false },
            { task: 'Prepare any required documentation', completed: false },
          ],
          afterPickup: [
            { task: 'Track your shipment online', completed: false },
            { task: 'Receive delivery confirmation', completed: false },
            { task: 'Review and rate your experience', completed: false },
          ],
        },
        recentShipments: [],
      })
    } finally {
      setIsLoading(false)
    }
  }, [shipmentId])

  useEffect(() => {
    fetchConfirmationData()
  }, [fetchConfirmationData])

  if (isLoading) {
    return (
      <ShippingLayout
        step={6}
        shipmentId={shipmentId}
        showNavigation={false}
        showStepIndicator={false}
      >
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading confirmation details...</p>
        </div>
      </ShippingLayout>
    )
  }

  if (error || !data) {
    return (
      <ShippingLayout
        step={6}
        shipmentId={shipmentId}
        showNavigation={false}
        showStepIndicator={false}
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h2 className="text-lg font-semibold text-red-800">Error Loading Confirmation</h2>
          </div>
          <p className="text-red-700 mb-4">
            {error || 'Unable to load confirmation details. Please try again.'}
          </p>
          <button
            onClick={fetchConfirmationData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </ShippingLayout>
    )
  }

  return (
    <ShippingLayout
      step={6}
      shipmentId={shipmentId}
      showNavigation={false}
      showStepIndicator={false}
      navigationProps={{
        nextLabel: 'View All Shipments',
      }}
    >
      <div className="space-y-6">
        {/* Success Banner with QR Code */}
        <SuccessBanner confirmationNumber={data.reference.confirmationNumber} />

        {/* Error message if any */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}

        {/* Shipment Reference Section */}
        <ShipmentReferenceSection data={data.reference} />

        {/* Pickup Confirmation Section */}
        <PickupConfirmationSection data={data.pickup} />

        {/* Delivery Information Section */}
        <DeliveryInformationSection data={data.delivery} />

        {/* Tracking Information Section */}
        <TrackingInformationSection data={data.tracking} />

        {/* Next Steps Checklist */}
        <NextStepsSection data={data.nextSteps} />

        {/* Package Documentation Section */}
        <PackageDocumentationSection data={data.documentation} />

        {/* Contact Information Section */}
        <ContactInformationSection data={data.contacts} />

        {/* Additional Services */}
        <AdditionalServicesSection shipmentId={shipmentId} />

        {/* Recent Shipments */}
        <RecentShipments shipments={data.recentShipments} />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <a
            href={`/shipments/${shipmentId}`}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Shipment Details
          </a>
          <a
            href="/shipments/new"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Create New Shipment
          </a>
        </div>
      </div>
    </ShippingLayout>
  )
}
