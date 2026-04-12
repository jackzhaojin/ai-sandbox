'use client'

import { useState, useEffect, useCallback, useId } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { AlertCircle } from 'lucide-react'
import { useLiveRegion } from '@/lib/accessibility'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { withRetry } from '@/lib/retry'

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
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const cloneId = searchParams.get('clone')
  const { announce } = useLiveRegion()
  const pageId = useId()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isLoadingDraft, setIsLoadingDraft] = useState(false)
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

  // Announce validation errors to screen readers
  useEffect(() => {
    const errorEntries = Object.entries(errors)
    if (errorEntries.length > 0) {
      const errorMessages = errorEntries
        .map(([field, error]) => {
          const fieldName = field.replace(/([A-Z])/g, ' $1').toLowerCase()
          return `${fieldName}: ${error?.message}`
        })
        .join('. ')
      announce(`Form validation failed. ${errorMessages}`, 'assertive')
    }
  }, [errors, announce])

  // Load draft or clone data
  const loadDraftData = useCallback(async (id: string, isClone: boolean) => {
    setIsLoadingDraft(true)
    try {
      const response = await fetch(`/api/shipments/${id}`)
      if (!response.ok) {
        throw new Error('Failed to load shipment data')
      }

      const data = await response.json()
      
      // Populate origin fields
      setValue('originName', data.sender_contact_name || '')
      setValue('originCompany', data.sender_company || '')
      setValue('originLine1', data.origin?.line1 || '')
      setValue('originLine2', data.origin?.line2 || '')
      setValue('originCity', data.origin?.city || '')
      setValue('originState', data.origin?.state || '')
      setValue('originPostal', data.origin?.postal || data.origin?.postalCode || '')
      setValue('originCountry', data.origin?.country || 'US')
      setValue('originLocationType', data.origin?.locationType || 'commercial')
      setValue('originPhone', data.sender_contact_phone || '')
      setValue('originEmail', data.sender_contact_email || '')
      
      // Populate destination fields
      setValue('destinationName', data.recipient_contact_name || '')
      setValue('destinationCompany', data.recipient_company || '')
      setValue('destinationLine1', data.destination?.line1 || '')
      setValue('destinationLine2', data.destination?.line2 || '')
      setValue('destinationCity', data.destination?.city || '')
      setValue('destinationState', data.destination?.state || '')
      setValue('destinationPostal', data.destination?.postal || data.destination?.postalCode || '')
      setValue('destinationCountry', data.destination?.country || 'US')
      setValue('destinationLocationType', data.destination?.locationType || 'commercial')
      setValue('destinationPhone', data.recipient_contact_phone || '')
      setValue('destinationEmail', data.recipient_contact_email || '')
      
      // Populate package fields
      setValue('packageTypeId', data.package_type || 'custom')
      setValue('length', data.length || 0)
      setValue('width', data.width || 0)
      setValue('height', data.height || 0)
      setValue('dimensionUnit', 'in')
      setValue('weight', data.weight || 0)
      setValue('weightUnit', 'lbs')
      setValue('declaredValue', data.declared_value || 0)
      setValue('currency', data.currency || 'USD')
      setValue('contentsDescription', data.contents_description || '')
      
      // Populate special handling
      if (data.specialHandling && data.specialHandling.length > 0) {
        setSpecialHandlingData(prev => ({
          ...prev,
          specialHandling: {
            selectedOptions: data.specialHandling.map((h: { handling_type: string }) => h.handling_type),
            totalFee: data.specialHandling.reduce((sum: number, h: { fee: number }) => sum + (h.fee || 0), 0),
          }
        }))
      }
      
      if (isClone) {
        setSaveMessage('Shipment data cloned successfully! You can now modify and create a new shipment.')
        announce('Shipment data cloned successfully. You can now modify and create a new shipment.', 'polite')
      } else {
        setSaveMessage('Draft loaded successfully!')
        announce('Draft loaded successfully.', 'polite')
      }
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      console.error('Error loading draft:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to load shipment data'
      setSubmitError(errorMsg)
      announce(`Error loading shipment: ${errorMsg}`, 'assertive')
    } finally {
      setIsLoadingDraft(false)
    }
  }, [setValue, announce])

  // Load draft or clone data on mount
  useEffect(() => {
    if (editId) {
      loadDraftData(editId, false)
    } else if (cloneId) {
      loadDraftData(cloneId, true)
    }
  }, [editId, cloneId, loadDraftData])

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
      announce(`Draft saved successfully. Tracking number: ${result.trackingNumber}`, 'polite')
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Failed to save draft:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to save draft. Please try again.'
      setSubmitError(errorMsg)
      announce(`Error saving draft: ${errorMsg}`, 'assertive')
    } finally {
      setIsSavingDraft(false)
    }
  }

  const onSubmit = async (data: ExtendedFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSaveMessage(null)

    try {
      // Call API to create shipment with retry
      const { result } = await withRetry(
        async () => {
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

          return response.json()
        },
        {
          maxRetries: 2,
          initialDelay: 1000,
        }
      )
      
      announce('Shipment created successfully. Redirecting to rates page.', 'polite')
      
      // Navigate to pricing page with the created shipment ID
      router.push(`/shipments/${result.id}/pricing`)
    } catch (error) {
      console.error('Failed to create shipment:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to create shipment. Please try again.'
      setSubmitError(errorMsg)
      announce(`Error creating shipment: ${errorMsg}`, 'assertive')
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

  // Show loading state while loading draft data
  if (isLoadingDraft) {
    return (
      <ShippingLayout
        step={1}
        headerProps={{
          showBackButton: true,
          backHref: '/',
        }}
        navigationProps={{
          nextLabel: 'Loading...',
          isNextDisabled: true,
          isNextLoading: true,
          showPrevious: false,
        }}
      >
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner size="lg" label="Loading shipment data..." centered />
        </div>
      </ShippingLayout>
    )
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
        isNextDisabled: isSubmitting || isSavingDraft || isLoadingDraft,
        nextLabel: 'Continue to Rates',
        showPrevious: false,
      }}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {cloneId ? 'Clone Shipment' : editId ? 'Edit Shipment' : 'Create New Shipment'}
          </h1>
          <p className="text-gray-600 mt-1">
            {cloneId 
              ? 'Review the cloned shipment details and make any changes before creating a new shipment.'
              : editId 
                ? 'Edit your shipment details below. All fields marked with * are required.'
                : 'Enter the shipment details below. All fields marked with * are required.'}
          </p>
        </div>

        {/* Error Alert */}
        {submitError && (
          <div className="mb-6">
            <ErrorAlert
              title="Error"
              message={submitError}
              severity="error"
              onDismiss={() => setSubmitError(null)}
            />
          </div>
        )}

        {/* Success Message */}
        {saveMessage && (
          <div 
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm text-green-700">{saveMessage}</p>
          </div>
        )}

        {/* Form Error Summary */}
        {Object.keys(errors).length > 0 && (
          <div 
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            role="alert"
            aria-live="assertive"
          >
            <h2 className="text-sm font-medium text-red-800 mb-2">
              Please correct the following errors:
            </h2>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>
                  {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {error?.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
