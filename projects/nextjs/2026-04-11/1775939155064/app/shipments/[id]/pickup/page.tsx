'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ShippingLayout } from '@/components/shipping/ShippingLayout'
import {
  PickupCalendar,
  TimeSlotSelector,
  ReadyTimeInput,
  PickupLocationForm,
  AccessRequirementsSelector,
  PickupEquipmentSelector,
  LoadingAssistanceSelector,
  SpecialInstructionsForm,
  PickupFeesSummary,
  PickupContactForm,
  AuthorizedPersonnelList,
  SpecialAuthorizationSection,
  NotificationPreferencesForm,
  PickupGuidelinesSidebar,
} from '@/components/pickup'
import { Truck, Package, MapPin, Calendar, Clock, AlertCircle, Loader2, Building2, Shield, PackageCheck, HandHelping, MessageSquare, User, Bell, Users } from 'lucide-react'
import type { DateAvailability, TimeSlot, SelectedPickup } from '@/types/pickup'
import type { PickupLocationType, AccessRequirement, PickupEquipment, LoadingAssistanceType } from '@/types/pickup'
import type { PrimaryContact, BackupContact, AuthorizedPerson, SpecialAuthorizationDetails, NotificationPreferences } from '@/types/pickup'
import { pickupContactSchema } from '@/lib/validation'

interface ShipmentSummary {
  id: string
  origin: {
    city: string
    state: string
    postalCode: string
    line1?: string
  }
  destination: {
    city: string
    state: string
  }
  package: {
    weight: number
    weightUnit: string
  }
  declaredValue?: number
  currency?: string
  selectedRate?: {
    carrierName: string
    serviceName: string
    total: number
    currency: string
  }
}

export default function PickupPage() {
  const params = useParams()
  const router = useRouter()
  const shipmentId = params.id as string

  // State
  const [shipmentSummary, setShipmentSummary] = useState<ShipmentSummary | null>(null)
  const [availabilityData, setAvailabilityData] = useState<DateAvailability[]>([])
  
  // Date/Time Selection (from Step 23)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [readyTime, setReadyTime] = useState<string>('')
  
  // Location & Access (new from Step 25)
  const [locationDetails, setLocationDetails] = useState<{
    locationType: PickupLocationType | null
    dockNumber?: string
    otherDescription?: string
  }>({ locationType: null })
  
  const [accessDetails, setAccessDetails] = useState<{
    requirements: AccessRequirement[]
    gateCode?: string
    parkingInstructions?: string
  }>({ requirements: [] })
  
  const [equipmentDetails, setEquipmentDetails] = useState<{
    equipment: PickupEquipment[]
  }>({ equipment: [] })
  
  const [loadingDetails, setLoadingDetails] = useState<{
    assistanceType: LoadingAssistanceType | null
  }>({ assistanceType: null })
  
  const [specialInstructions, setSpecialInstructions] = useState<{
    gateCode?: string
    parkingLoading?: string
    packageLocation?: string
    driverInstructions?: string
  }>({})
  
  // Contact & Authorization (Step 26)
  const [primaryContact, setPrimaryContact] = useState<PrimaryContact>({
    name: '',
    jobTitle: '',
    mobilePhone: '',
    altPhone: '',
    email: '',
    preferredMethod: 'email',
  })
  
  const [backupContact, setBackupContact] = useState<BackupContact>({
    name: '',
    phone: '',
    email: '',
  })
  
  const [authorizedPersonnel, setAuthorizedPersonnel] = useState<{
    anyoneAtLocation: boolean
    personnelList: AuthorizedPerson[]
  }>({
    anyoneAtLocation: false,
    personnelList: [],
  })
  
  const [specialAuthorization, setSpecialAuthorization] = useState<SpecialAuthorizationDetails>({
    idVerificationRequired: false,
    signatureRequired: false,
    photoIdMatching: false,
  })
  
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    emailReminder24h: true,
    smsReminder2h: true,
    callReminder30m: false,
    driverEnroute: true,
    pickupCompletion: true,
    transitUpdates: true,
  })
  
  const [contactErrors, setContactErrors] = useState<{
    primary?: Record<string, string>
    backup?: Record<string, string>
  } | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch shipment details and availability
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch shipment details
      const shipmentRes = await fetch(`/api/shipments/${shipmentId}`)
      if (!shipmentRes.ok) {
        throw new Error('Failed to fetch shipment details')
      }
      const shipmentData = await shipmentRes.json()

      setShipmentSummary({
        id: shipmentData.id,
        origin: {
          city: shipmentData.origin?.city || 'Unknown',
          state: shipmentData.origin?.state || 'XX',
          postalCode: shipmentData.origin?.postalCode || shipmentData.origin?.postal || '',
          line1: shipmentData.origin?.line1,
        },
        destination: {
          city: shipmentData.destination?.city || 'Unknown',
          state: shipmentData.destination?.state || 'XX',
        },
        package: {
          weight: shipmentData.package?.weight || 0,
          weightUnit: shipmentData.package?.weightUnit || 'lbs',
        },
        declaredValue: shipmentData.package?.declaredValue || 0,
        currency: shipmentData.package?.currency || 'USD',
        selectedRate: shipmentData.selectedRate || undefined,
      })

      // Fetch pickup availability using origin ZIP
      const zipCode = shipmentData.origin?.postalCode || shipmentData.origin?.postal
      if (zipCode) {
        const availabilityRes = await fetch(`/api/pickup-availability?zip_code=${zipCode}`)
        if (availabilityRes.ok) {
          const availability = await availabilityRes.json()
          setAvailabilityData(availability.availableDates || [])
        } else {
          console.warn('Failed to fetch availability, using empty data')
          setAvailabilityData([])
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load pickup availability. Please try again.')
      
      // Use fallback data for development
      setShipmentSummary({
        id: shipmentId,
        origin: {
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          line1: '123 Main St',
        },
        destination: { city: 'Dallas', state: 'TX' },
        package: { weight: 5.5, weightUnit: 'lbs' },
        declaredValue: 2500,
        currency: 'USD',
        selectedRate: {
          carrierName: 'Postal Express',
          serviceName: 'Ground',
          total: 24.99,
          currency: 'USD',
        },
      })
      setAvailabilityData([])
    } finally {
      setIsLoading(false)
    }
  }, [shipmentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Get available slots for selected date
  const availableSlotsForDate = useCallback((): TimeSlot[] => {
    if (!selectedDate) return []
    const dateData = availabilityData.find(d => d.date === selectedDate)
    return dateData?.slots || []
  }, [selectedDate, availabilityData])

  // Handle date selection
  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    setReadyTime('')
    setError(null)
  }, [])

  // Handle slot selection
  const handleSelectSlot = useCallback((slot: TimeSlot) => {
    setSelectedSlot(slot)
    setError(null)
  }, [])

  // Validate contact information
  const validateContacts = useCallback(() => {
    const result = pickupContactSchema.safeParse({
      primary: primaryContact,
      backup: backupContact,
    })
    
    if (!result.success) {
      const errors: { primary?: Record<string, string>; backup?: Record<string, string> } = {}
      result.error.errors.forEach((err) => {
        const path = err.path
        if (path[0] === 'primary') {
          errors.primary = errors.primary || {}
          errors.primary[path[1] as string] = err.message
        } else if (path[0] === 'backup') {
          errors.backup = errors.backup || {}
          errors.backup[path[1] as string] = err.message
        }
      })
      setContactErrors(errors)
      return false
    }
    
    setContactErrors(null)
    return true
  }, [primaryContact, backupContact])

  // Check if form is valid
  const isFormValid = useCallback((): boolean => {
    if (!selectedDate) return false
    if (!selectedSlot) return false
    if (!readyTime) return false
    if (!locationDetails.locationType) return false
    if (locationDetails.locationType === 'loading_dock' && !locationDetails.dockNumber) return false
    if (locationDetails.locationType === 'other' && !locationDetails.otherDescription) return false
    if (accessDetails.requirements.includes('gate_code') && !accessDetails.gateCode) return false
    if (accessDetails.requirements.includes('limited_parking') && !accessDetails.parkingInstructions) return false
    if (!loadingDetails.assistanceType) return false
    
    // Contact validation
    if (!primaryContact.name || !primaryContact.mobilePhone || !primaryContact.email) return false
    if (!backupContact.name || !backupContact.phone) return false
    
    return true
  }, [selectedDate, selectedSlot, readyTime, locationDetails, accessDetails, loadingDetails, primaryContact, backupContact])

  // Handle continue to next step
  const handleContinue = async () => {
    if (!isFormValid() || !selectedSlot || !locationDetails.locationType || !loadingDetails.assistanceType) return

    setIsSaving(true)
    setError(null)

    try {
      const pickupData: SelectedPickup = {
        date: selectedDate!,
        timeSlot: selectedSlot,
        readyTime,
      }

      // TODO: Save pickup selection to API (Step 27 will implement persistence)
      console.log('Saving pickup selection:', pickupData)
      console.log('Location details:', locationDetails)
      console.log('Access details:', accessDetails)
      console.log('Equipment details:', equipmentDetails)
      console.log('Loading details:', loadingDetails)
      console.log('Special instructions:', specialInstructions)
      console.log('Primary contact:', primaryContact)
      console.log('Backup contact:', backupContact)
      console.log('Authorized personnel:', authorizedPersonnel)
      console.log('Special authorization:', specialAuthorization)
      console.log('Notification preferences:', notificationPreferences)

      // Navigate to review page
      router.push(`/shipments/${shipmentId}/review`)
    } catch (err) {
      console.error('Error saving pickup:', err)
      setError(err instanceof Error ? err.message : 'Failed to save pickup selection')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle back to payment
  const handleBack = () => {
    router.push(`/shipments/${shipmentId}/payment`)
  }

  if (isLoading) {
    return (
      <ShippingLayout
        step={4}
        shipmentId={shipmentId}
        navigationProps={{
          nextLabel: 'Loading...',
          isNextDisabled: true,
          isNextLoading: true,
        }}
      >
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading pickup availability...</p>
        </div>
      </ShippingLayout>
    )
  }

  return (
    <ShippingLayout
      step={4}
      shipmentId={shipmentId}
      headerProps={{
        showBackButton: true,
        backHref: `/shipments/${shipmentId}/payment`,
      }}
      navigationProps={{
        onNext: handleContinue,
        onPrevious: handleBack,
        nextLabel: isSaving ? 'Saving...' : 'Continue to Review',
        previousLabel: 'Back to Payment',
        isNextDisabled: !isFormValid() || isSaving,
        isNextLoading: isSaving,
        showPrevious: true,
      }}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Schedule Pickup
          </h1>
          <p className="text-gray-600">
            Select a convenient pickup date and time window for your shipment, and provide details about your location.
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
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  Pickup from: {shipmentSummary.origin.city}, {shipmentSummary.origin.state} {shipmentSummary.origin.postalCode}
                </span>
              </div>
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Section 1: Date & Time */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Date & Time
                  </h2>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <PickupCalendar
                    availabilityData={availabilityData}
                    selectedDate={selectedDate}
                    onSelectDate={handleSelectDate}
                    isLoading={isLoading}
                  />
                  
                  <div className="space-y-6">
                    {!selectedDate ? (
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">Select a date first</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Choose an available date to see time slots
                        </p>
                      </div>
                    ) : (
                      <>
                        <TimeSlotSelector
                          slots={availableSlotsForDate()}
                          selectedSlotId={selectedSlot?.id || null}
                          onSelectSlot={handleSelectSlot}
                          disabled={isSaving}
                        />

                        {selectedSlot && (
                          <ReadyTimeInput
                            selectedSlot={selectedSlot}
                            value={readyTime}
                            onChange={setReadyTime}
                            disabled={isSaving}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Location Type */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Pickup Location
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <PickupLocationForm
                  value={locationDetails}
                  onChange={setLocationDetails}
                  disabled={isSaving}
                />
              </div>
            </section>

            {/* Section 3: Access Requirements */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Access Requirements
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <AccessRequirementsSelector
                  value={accessDetails}
                  onChange={setAccessDetails}
                  disabled={isSaving}
                />
              </div>
            </section>

            {/* Section 4: Equipment & Loading */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Equipment & Loading
                  </h2>
                </div>
              </div>
              <div className="p-6 space-y-8">
                <PickupEquipmentSelector
                  value={equipmentDetails}
                  onChange={setEquipmentDetails}
                  disabled={isSaving}
                />
                
                <div className="border-t border-gray-200 pt-8">
                  <LoadingAssistanceSelector
                    value={loadingDetails}
                    onChange={setLoadingDetails}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </section>

            {/* Section 5: Special Instructions */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Special Instructions
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <SpecialInstructionsForm
                  value={specialInstructions}
                  onChange={setSpecialInstructions}
                  disabled={isSaving}
                />
              </div>
            </section>

            {/* Section 6: Contact Information (Step 26) */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Contact Information
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <PickupContactForm
                  primaryContact={primaryContact}
                  backupContact={backupContact}
                  onPrimaryChange={setPrimaryContact}
                  onBackupChange={setBackupContact}
                  errors={contactErrors || undefined}
                  disabled={isSaving}
                />
              </div>
            </section>

            {/* Section 7: Authorized Personnel (Step 26) */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Authorized Personnel
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <AuthorizedPersonnelList
                  anyoneAtLocation={authorizedPersonnel.anyoneAtLocation}
                  personnelList={authorizedPersonnel.personnelList}
                  onAnyoneAtLocationChange={(value) =>
                    setAuthorizedPersonnel({ ...authorizedPersonnel, anyoneAtLocation: value })
                  }
                  onPersonnelListChange={(list) =>
                    setAuthorizedPersonnel({ ...authorizedPersonnel, personnelList: list })
                  }
                  disabled={isSaving}
                />
              </div>
            </section>

            {/* Section 8: Special Authorization (Step 26) - Conditional */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Security Authorization
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <SpecialAuthorizationSection
                  value={specialAuthorization}
                  onChange={setSpecialAuthorization}
                  declaredValue={shipmentSummary?.declaredValue || 0}
                  currency={shipmentSummary?.currency}
                  disabled={isSaving}
                />
              </div>
            </section>

            {/* Section 9: Notification Preferences (Step 26) */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Notification Preferences
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <NotificationPreferencesForm
                  value={notificationPreferences}
                  onChange={setNotificationPreferences}
                  disabled={isSaving}
                />
              </div>
            </section>
          </div>

          {/* Sidebar: Fees Summary & Guidelines */}
          <div className="space-y-6">
            <div className="sticky top-6 space-y-6">
              <PickupFeesSummary
                timeSlot={selectedSlot}
                locationType={locationDetails.locationType}
                accessRequirements={accessDetails.requirements}
                equipment={equipmentDetails.equipment}
                loadingAssistance={loadingDetails.assistanceType}
              />

              {/* Selection Summary */}
              {selectedDate && selectedSlot && (
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">
                    Your Selection
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800">
                        {new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800">
                        {selectedSlot.label}
                      </span>
                    </div>
                    {readyTime && (
                      <div className="flex items-center gap-2">
                        <HandHelping className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-800">
                          Ready by {new Date(`2000-01-01T${readyTime}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pickup Guidelines Sidebar (Step 26) */}
              <PickupGuidelinesSidebar />
            </div>
          </div>
        </div>
      </div>
    </ShippingLayout>
  )
}
