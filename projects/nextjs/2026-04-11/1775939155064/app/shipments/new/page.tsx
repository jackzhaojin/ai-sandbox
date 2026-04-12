'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShippingLayout } from '@/components/shipping/ShippingLayout'
import { OriginSection } from '@/components/shipping/OriginSection'
import { DestinationSection } from '@/components/shipping/DestinationSection'
import { 
  PackageConfigurationSection, 
  type PackageConfigurationData 
} from '@/components/shipping/PackageConfigurationSection'
import { 
  SpecialHandlingSection,
  type SpecialHandlingSectionData 
} from '@/components/shipping/SpecialHandlingSection'
import { shipmentStep1Schema, type ShipmentStep1FormData } from '@/lib/validation'
import { z } from 'zod'

// Package configuration schema
const packageConfigSchema = z.object({
  packageTypeId: z.string().min(1, 'Package type is required'),
  length: z.number().positive('Length must be greater than 0'),
  width: z.number().positive('Width must be greater than 0'),
  height: z.number().positive('Height must be greater than 0'),
  dimensionUnit: z.enum(['in', 'cm']),
  weight: z.number().positive('Weight must be greater than 0'),
  weightUnit: z.enum(['lbs', 'kg']),
  declaredValue: z.number().min(1, 'Declared value is required'),
  currency: z.enum(['USD', 'CAD', 'MXN']),
  contentsDescription: z.string().min(1, 'Contents description is required').min(3, 'Description must be at least 3 characters'),
})

// Combined type for the full form
type ExtendedFormData = ShipmentStep1FormData & z.infer<typeof packageConfigSchema>

export default function NewShipmentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [sameAsOrigin, setSameAsOrigin] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Special handling state (managed separately since it's a complex nested object)
  const [specialHandlingData, setSpecialHandlingData] = useState<SpecialHandlingSectionData>({
    specialHandling: {
      selectedOptions: [],
      totalFee: 0,
    },
    deliveryPreferences: {
      selectedOptions: [],
      totalFee: 0,
    },
  })

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExtendedFormData>({
    resolver: async (data) => {
      // Validate address schema
      const addressResult = await shipmentStep1Schema.safeParseAsync(data)
      // Validate package schema
      const packageResult = await packageConfigSchema.safeParseAsync(data)
      
      const allErrors: Record<string, { message: string; type: string }> = {}
      
      if (!addressResult.success) {
        addressResult.error.errors.forEach((err) => {
          const path = err.path.join('.')
          allErrors[path] = { message: err.message, type: err.code }
        })
      }
      
      if (!packageResult.success) {
        packageResult.error.errors.forEach((err) => {
          const path = err.path.join('.')
          allErrors[path] = { message: err.message, type: err.code }
        })
      }
      
      return {
        values: addressResult.success && packageResult.success ? data : {},
        errors: allErrors,
      }
    },
    mode: 'onBlur',
    defaultValues: {
      // Origin defaults
      originCountry: 'US',
      originLocationType: 'commercial',
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
      // Destination defaults
      destinationCountry: 'US',
      destinationLocationType: 'commercial',
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
      // Package defaults
      packageTypeId: '',
      length: 0,
      width: 0,
      height: 0,
      dimensionUnit: 'in',
      weight: 0,
      weightUnit: 'lbs',
      declaredValue: 0,
      currency: 'USD',
      contentsDescription: '',
    },
  })

  const handleSaveDraft = async () => {
    const formData = watch()
    setIsSavingDraft(true)
    setSubmitError(null)
    setSaveMessage(null)

    try {
      // Call API to create shipment as draft
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: {
            name: formData.originName,
            company: formData.originCompany,
            line1: formData.originLine1,
            line2: formData.originLine2,
            city: formData.originCity,
            state: formData.originState,
            postalCode: formData.originPostal,
            country: formData.originCountry,
            locationType: formData.originLocationType,
            phone: formData.originPhone,
            extension: formData.originExtension,
            email: formData.originEmail,
          },
          destination: {
            name: formData.destinationName,
            company: formData.destinationCompany,
            line1: formData.destinationLine1,
            line2: formData.destinationLine2,
            city: formData.destinationCity,
            state: formData.destinationState,
            postalCode: formData.destinationPostal,
            country: formData.destinationCountry,
            locationType: formData.destinationLocationType,
            phone: formData.destinationPhone,
            extension: formData.destinationExtension,
            email: formData.destinationEmail,
          },
          package: {
            type: formData.packageTypeId,
            length: formData.length,
            width: formData.width,
            height: formData.height,
            dimensionUnit: formData.dimensionUnit,
            weight: formData.weight,
            weightUnit: formData.weightUnit,
            declaredValue: formData.declaredValue,
            currency: formData.currency,
            contentsDescription: formData.contentsDescription,
          },
          specialHandling: specialHandlingData.specialHandling.selectedOptions,
          specialHandlingFee: specialHandlingData.specialHandling.totalFee,
          deliveryPreferences: specialHandlingData.deliveryPreferences.selectedOptions,
          deliveryFee: specialHandlingData.deliveryPreferences.totalFee,
          hazmatDetails: specialHandlingData.hazmatDetails,
          multiPiece: specialHandlingData.multiPiece,
          saveAsDraft: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save draft')
      }

      const result = await response.json()
      setSaveMessage(`Draft saved successfully! Tracking: ${result.trackingNumber}`)
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Failed to save draft:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to save draft. Please try again.')
    } finally {
      setIsSavingDraft(false)
    }
  }

  const onSubmit = async (data: ExtendedFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSaveMessage(null)

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
          package: {
            type: data.packageTypeId,
            length: data.length,
            width: data.width,
            height: data.height,
            dimensionUnit: data.dimensionUnit,
            weight: data.weight,
            weightUnit: data.weightUnit,
            declaredValue: data.declaredValue,
            currency: data.currency,
            contentsDescription: data.contentsDescription,
          },
          specialHandling: specialHandlingData.specialHandling.selectedOptions,
          specialHandlingFee: specialHandlingData.specialHandling.totalFee,
          deliveryPreferences: specialHandlingData.deliveryPreferences.selectedOptions,
          deliveryFee: specialHandlingData.deliveryPreferences.totalFee,
          hazmatDetails: specialHandlingData.hazmatDetails,
          multiPiece: specialHandlingData.multiPiece,
          saveAsDraft: false,
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

  // Get current package config values for the section
  const packageConfigValue: PackageConfigurationData = {
    packageTypeId: watch('packageTypeId') || '',
    length: watch('length') || 0,
    width: watch('width') || 0,
    height: watch('height') || 0,
    dimensionUnit: watch('dimensionUnit') || 'in',
    weight: watch('weight') || 0,
    weightUnit: watch('weightUnit') || 'lbs',
    declaredValue: watch('declaredValue') || 0,
    currency: watch('currency') || 'USD',
    contentsDescription: watch('contentsDescription') || '',
  }

  const handlePackageConfigChange = (data: PackageConfigurationData) => {
    setValue('packageTypeId', data.packageTypeId, { shouldValidate: false })
    setValue('length', data.length, { shouldValidate: false })
    setValue('width', data.width, { shouldValidate: false })
    setValue('height', data.height, { shouldValidate: false })
    setValue('dimensionUnit', data.dimensionUnit, { shouldValidate: false })
    setValue('weight', data.weight, { shouldValidate: false })
    setValue('weightUnit', data.weightUnit, { shouldValidate: false })
    setValue('declaredValue', data.declaredValue, { shouldValidate: false })
    setValue('currency', data.currency, { shouldValidate: false })
    setValue('contentsDescription', data.contentsDescription, { shouldValidate: false })
  }

  const handleSpecialHandlingChange = (data: SpecialHandlingSectionData) => {
    setSpecialHandlingData(data)
  }

  return (
    <ShippingLayout
      step={1}
      headerProps={{
        showBackButton: true,
        backHref: '/',
        onSaveDraft: handleSaveDraft,
        isSavingDraft,
      }}
      navigationProps={{
        onNext: handleSubmit(onSubmit),
        isNextLoading: isSubmitting,
        isNextDisabled: isSubmitting || isSavingDraft,
        nextLabel: 'Continue to Rates',
        showPrevious: false,
      }}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Shipment</h1>
          <p className="text-gray-600 mt-1">
            Enter the shipment details below. All fields marked with * are required.
          </p>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {saveMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{saveMessage}</p>
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

          <PackageConfigurationSection
            value={packageConfigValue}
            onChange={handlePackageConfigChange}
            disabled={isSubmitting || isSavingDraft}
            errors={{
              packageTypeId: errors.packageTypeId?.message,
              length: errors.length?.message,
              width: errors.width?.message,
              height: errors.height?.message,
              weight: errors.weight?.message,
              declaredValue: errors.declaredValue?.message,
              contentsDescription: errors.contentsDescription?.message,
            }}
          />

          <SpecialHandlingSection
            value={specialHandlingData}
            onChange={handleSpecialHandlingChange}
            packageConfig={packageConfigValue}
            disabled={isSubmitting || isSavingDraft}
          />
        </form>
      </div>
    </ShippingLayout>
  )
}
