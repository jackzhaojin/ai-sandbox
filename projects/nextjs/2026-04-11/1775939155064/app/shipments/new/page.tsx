'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShippingLayout } from '@/components/shipping/ShippingLayout'
import { OriginSection } from '@/components/shipping/OriginSection'
import { DestinationSection } from '@/components/shipping/DestinationSection'
import { shipmentStep1Schema, type ShipmentStep1FormData } from '@/lib/validation'

export default function NewShipmentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sameAsOrigin, setSameAsOrigin] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShipmentStep1FormData>({
    resolver: zodResolver(shipmentStep1Schema),
    mode: 'onBlur',
    defaultValues: {
      originCountry: 'US',
      originLocationType: 'commercial',
      destinationCountry: 'US',
      destinationLocationType: 'commercial',
      originName: '',
      originCompany: '',
      originLine1: '',
      originLine2: '',
      originCity: '',
      originState: '',
      originPostal: '',
      originPhone: '',
      originExtension: '',
      originEmail: '',
      destinationName: '',
      destinationCompany: '',
      destinationLine1: '',
      destinationLine2: '',
      destinationCity: '',
      destinationState: '',
      destinationPostal: '',
      destinationPhone: '',
      destinationExtension: '',
      destinationEmail: '',
    },
  })

  const handleSaveDraft = () => {
    const formData = watch()
    console.log('Saving draft:', formData)
    alert('Draft saved (placeholder)')
  }

  const onSubmit = async (data: ShipmentStep1FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Call API to create shipment
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: {
            name: data.originName,
            company: data.originCompany,
            line1: data.originLine1,
            line2: data.originLine2,
            city: data.originCity,
            state: data.originState,
            postalCode: data.originPostal,
            country: data.originCountry,
            locationType: data.originLocationType,
            phone: data.originPhone,
            extension: data.originExtension,
            email: data.originEmail,
          },
          destination: {
            name: data.destinationName,
            company: data.destinationCompany,
            line1: data.destinationLine1,
            line2: data.destinationLine2,
            city: data.destinationCity,
            state: data.destinationState,
            postalCode: data.destinationPostal,
            country: data.destinationCountry,
            locationType: data.destinationLocationType,
            phone: data.destinationPhone,
            extension: data.destinationExtension,
            email: data.destinationEmail,
          },
          status: 'draft',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create shipment')
      }

      const result = await response.json()
      
      // Navigate to rates page with the created shipment ID
      router.push(`/shipments/${result.id}/rates`)
    } catch (error) {
      console.error('Failed to create shipment:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to create shipment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ShippingLayout
      step={1}
      headerProps={{
        showBackButton: true,
        backHref: '/',
        onSaveDraft: handleSaveDraft,
      }}
      navigationProps={{
        onNext: handleSubmit(onSubmit),
        isNextLoading: isSubmitting,
        isNextDisabled: isSubmitting,
        nextLabel: 'Continue to Rates',
        showPrevious: false,
      }}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Shipment</h1>
          <p className="text-gray-600 mt-1">
            Enter the origin and destination addresses. All fields marked with * are required.
          </p>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <OriginSection control={control} errors={errors} setValue={setValue} />
          
          <DestinationSection
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            sameAsOrigin={sameAsOrigin}
            onSameAsOriginChange={setSameAsOrigin}
          />
        </form>
      </div>
    </ShippingLayout>
  )
}
