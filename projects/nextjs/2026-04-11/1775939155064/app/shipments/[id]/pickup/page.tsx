'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ShippingLayout } from '@/components/shipping/ShippingLayout'
import { PickupCalendar, TimeSlotSelector, ReadyTimeInput } from '@/components/pickup'
import { Truck, Package, MapPin, Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react'
import type { DateAvailability, TimeSlot, SelectedPickup } from '@/types/pickup'

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [readyTime, setReadyTime] = useState<string>('')
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

  // Check if form is valid
  const isFormValid = useCallback((): boolean => {
    if (!selectedDate) return false
    if (!selectedSlot) return false
    if (!readyTime) return false
    return true
  }, [selectedDate, selectedSlot, readyTime])

  // Handle continue to next step
  const handleContinue = async () => {
    if (!isFormValid() || !selectedSlot) return

    setIsSaving(true)
    setError(null)

    try {
      const pickupData: SelectedPickup = {
        date: selectedDate!,
        timeSlot: selectedSlot,
        readyTime,
      }

      // TODO: Save pickup selection to API (Step 24 will implement this)
      console.log('Saving pickup selection:', pickupData)

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
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Schedule Pickup
          </h1>
          <p className="text-gray-600">
            Select a convenient pickup date and time window for your shipment.
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

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Select Pickup Date
              </h2>
            </div>
            <PickupCalendar
              availabilityData={availabilityData}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              isLoading={isLoading}
            />
          </div>

          {/* Time Slot Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Select Time Window
              </h2>
            </div>
            
            {!selectedDate ? (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Select a date first</p>
                <p className="text-sm text-gray-500 mt-1">
                  Choose an available date from the calendar to see time slots
                </p>
              </div>
            ) : (
              <div className="space-y-6">
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
              </div>
            )}
          </div>
        </div>

        {/* Selection Summary */}
        {selectedDate && selectedSlot && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Your Pickup Selection
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">
                  {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">
                  {selectedSlot.label} ({selectedSlot.description})
                </span>
              </div>
              {readyTime && (
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">Ready by:</span>
                  <span className="text-blue-800">
                    {new Date(`2000-01-01T${readyTime}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>
              )}
              {selectedSlot.fee > 0 && (
                <div className="ml-auto text-amber-700 font-medium">
                  +${selectedSlot.fee} fee
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ShippingLayout>
  )
}
