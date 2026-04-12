'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
import { AlertCircle, Shield, MapPin, Package, FileText } from 'lucide-react'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ConfirmPageData extends ConfirmationPageData {
  recentShipments: RecentShipmentData[]
}

// Copy Button with Tooltip Component
function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setShowTooltip(true)
      setTimeout(() => {
        setCopied(false)
        setShowTooltip(false)
      }, 2000)
    } catch {
      console.error('Failed to copy to clipboard')
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleCopy}
        onMouseEnter={() => !copied && setShowTooltip(true)}
        onMouseLeave={() => !copied && setShowTooltip(false)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
      >
        {copied ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Copied!</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{label}</span>
          </>
        )}
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-nowrap z-10">
          {copied ? 'Copied!' : 'Copy to clipboard'}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  )
}

// Action Button Component
function ActionButton({
  children,
  onClick,
  href,
  variant = 'primary',
  icon,
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary' | 'outline'
  icon?: React.ReactNode
}) {
  const baseClasses = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
  }

  const className = `${baseClasses} ${variantClasses[variant]}`

  if (href) {
    return (
      <a href={href} className={className}>
        {icon}
        {children}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={className}>
      {icon}
      {children}
    </button>
  )
}

// Stub Modal Component
function StubModal({
  isOpen,
  onClose,
  title,
  description,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const shipmentId = params.id as string

  const [data, setData] = useState<ConfirmPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Modal states
  const [insuranceModalOpen, setInsuranceModalOpen] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [holdModalOpen, setHoldModalOpen] = useState(false)

  // Fetch confirmation data from API
  const fetchConfirmationData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch the shipment data
      const response = await fetch(`/api/shipments/${shipmentId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Shipment not found')
        }
        throw new Error('Failed to fetch shipment details')
      }

      const apiData = await response.json()

      // Verify status is 'confirmed' and confirmation_number exists
      if (apiData.status !== 'confirmed' || !apiData.confirmation_number) {
        setIsRedirecting(true)
        // Redirect to review page if not submitted
        router.push(`/shipments/${shipmentId}/review`)
        return
      }

      // Transform API data to confirmation page format
      const confirmationData: ConfirmPageData = {
        shipmentId,
        reference: {
          confirmationNumber: apiData.confirmation_number,
          customerReference: apiData.customer_reference || undefined,
          carrier: apiData.carrier ? {
            id: apiData.carrier.id,
            name: apiData.carrier.name || apiData.carrier.display_name,
            trackingUrlTemplate: apiData.carrier.tracking_url_template,
          } : apiData.selectedRate?.carrier || null,
          serviceType: apiData.service_type ? {
            id: apiData.service_type.id,
            name: apiData.service_type.name,
            transitDaysMin: apiData.service_type.transit_days_min || 1,
            transitDaysMax: apiData.service_type.transit_days_max || 5,
          } : apiData.selectedRate?.service || null,
          totalCost: parseFloat(apiData.total_cost) || 0,
          currency: apiData.currency || 'USD',
        },
        pickup: {
          scheduledDate: apiData.pickup?.date || apiData.pickup?.slot?.date || new Date().toISOString(),
          timeWindow: apiData.pickup?.timeWindow || 
            (apiData.pickup?.slot ? 
              `${apiData.pickup.slot.start_time || '9:00 AM'} - ${apiData.pickup.slot.end_time || '5:00 PM'}` : 
              '9:00 AM - 5:00 PM'),
          readyTime: apiData.pickup?.readyTime || apiData.pickup?.slot?.ready_time,
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
            postal: apiData.destination?.postal || apiData.destination?.postal_code || apiData.recipient_address?.postalCode || '',
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
            { task: 'Print and attach shipping label to package', completed: apiData.label_status === 'ready' },
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

      // Fetch recent shipments (GET /api/shipments?limit=3&status=confirmed&sort=submitted_at:desc)
      try {
        const recentResponse = await fetch('/api/shipments?limit=3&status=confirmed&sort=submitted_at:desc')
        if (recentResponse.ok) {
          const recentData = await recentResponse.json()
          confirmationData.recentShipments = (recentData.shipments || [])
            .filter((s: { id: string }) => s.id !== shipmentId)
            .slice(0, 3)
            .map((s: {
              id: string
              confirmation_number?: string
              created_at?: string
              submitted_at?: string
              origin?: { city: string; state: string }
              destination?: { city: string; state: string }
              status?: string
              carrier?: { name: string }
            }) => ({
              id: s.id,
              confirmationNumber: s.confirmation_number || s.id.slice(0, 8).toUpperCase(),
              createdAt: s.submitted_at || s.created_at || new Date().toISOString(),
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
        console.error('Error fetching recent shipments:', e)
        confirmationData.recentShipments = []
      }

      setData(confirmationData)
    } catch (err) {
      console.error('Error fetching confirmation data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load confirmation details')
    } finally {
      setIsLoading(false)
    }
  }, [shipmentId, router])

  useEffect(() => {
    fetchConfirmationData()
  }, [fetchConfirmationData])

  if (isLoading || isRedirecting) {
    return (
      <ShippingLayout
        step={6}
        shipmentId={shipmentId}
        showNavigation={false}
        showStepIndicator={false}
      >
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner 
            size="lg" 
            label={isRedirecting ? 'Redirecting to review page...' : 'Loading confirmation details...'} 
            centered 
          />
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
        <ErrorAlert
          title="Error Loading Confirmation"
          message={error || 'Unable to load confirmation details. Please try again.'}
          severity="error"
          onRetry={fetchConfirmationData}
          retryLabel="Retry"
        />
      </ShippingLayout>
    )
  }

  return (
    <ShippingLayout
      step={6}
      shipmentId={shipmentId}
      showNavigation={false}
      showStepIndicator={false}
    >
      <div className="space-y-6">
        {/* Success Banner with QR Code and Copy Button */}
        <SuccessBanner confirmationNumber={data.reference.confirmationNumber} />

        {/* Copy Confirmation Number - Additional prominent copy button */}
        <div className="flex justify-center">
          <CopyButton 
            text={data.reference.confirmationNumber} 
            label="Copy Confirmation Number" 
          />
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <ActionButton
              onClick={() => setInsuranceModalOpen(true)}
              variant="outline"
              icon={<Shield className="w-4 h-4" />}
            >
              Add Insurance
            </ActionButton>
            <ActionButton
              onClick={() => setAddressModalOpen(true)}
              variant="outline"
              icon={<MapPin className="w-4 h-4" />}
            >
              Change Address
            </ActionButton>
            <ActionButton
              onClick={() => setHoldModalOpen(true)}
              variant="outline"
              icon={<Package className="w-4 h-4" />}
            >
              Hold at Location
            </ActionButton>
            <ActionButton
              href="/shipments/new"
              variant="secondary"
              icon={<FileText className="w-4 h-4" />}
            >
              Schedule Another
            </ActionButton>
            <ActionButton
              href={`/shipments/new?clone=${shipmentId}`}
              variant="primary"
              icon={<Package className="w-4 h-4" />}
            >
              Repeat This Shipment
            </ActionButton>
          </div>
        </div>

        {/* Error message if any */}
        {error && (
          <ErrorAlert
            title="Error"
            message={error}
            severity="error"
            onRetry={fetchConfirmationData}
          />
        )}

        {/* 8 Confirmation Sections */}
        
        {/* 1. Shipment Reference Section */}
        <ShipmentReferenceSection data={data.reference} />

        {/* 2. Pickup Confirmation Section */}
        <PickupConfirmationSection data={data.pickup} />

        {/* 3. Delivery Information Section */}
        <DeliveryInformationSection data={data.delivery} />

        {/* 4. Tracking Information Section */}
        <TrackingInformationSection data={data.tracking} />

        {/* 5. Package Documentation Section */}
        <PackageDocumentationSection data={data.documentation} />

        {/* 6. Contact Information Section */}
        <ContactInformationSection data={data.contacts} />

        {/* 7. Next Steps Section */}
        <NextStepsSection data={data.nextSteps} />

        {/* 8. Additional Services Section */}
        <AdditionalServicesSection shipmentId={shipmentId} />

        {/* Recent Shipments */}
        <RecentShipments shipments={data.recentShipments} />

        {/* Bottom Action Buttons */}
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

      {/* Stub Modals */}
      <StubModal
        isOpen={insuranceModalOpen}
        onClose={() => setInsuranceModalOpen(false)}
        title="Add Insurance"
        description="Insurance options will be available in a future update. For now, please contact support to add insurance to your shipment."
      />
      <StubModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title="Change Address"
        description="Address changes are not permitted after shipment confirmation. Please contact support for assistance."
      />
      <StubModal
        isOpen={holdModalOpen}
        onClose={() => setHoldModalOpen(false)}
        title="Hold at Location"
        description="Hold at location options will be available once your shipment is in transit. Please check back later."
      />
    </ShippingLayout>
  )
}
