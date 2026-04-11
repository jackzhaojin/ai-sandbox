'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShippingLayout } from '@/components/shipping/ShippingLayout'
import { cn } from '@/lib/utils'

interface ShipmentFormData {
  originName: string
  originLine1: string
  originCity: string
  originState: string
  originPostal: string
  destinationName: string
  destinationLine1: string
  destinationCity: string
  destinationState: string
  destinationPostal: string
  packageWeight: string
  packageLength: string
  packageWidth: string
  packageHeight: string
  contentsDescription: string
}

export default function NewShipmentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ShipmentFormData>({
    originName: '',
    originLine1: '',
    originCity: '',
    originState: '',
    originPostal: '',
    destinationName: '',
    destinationLine1: '',
    destinationCity: '',
    destinationState: '',
    destinationPostal: '',
    packageWeight: '',
    packageLength: '',
    packageWidth: '',
    packageHeight: '',
    contentsDescription: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveDraft = () => {
    // TODO: Implement draft saving via API
    console.log('Saving draft:', formData)
    alert('Draft saved (placeholder)')
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // TODO: Implement actual API call to POST /api/shipments
      // This will be implemented in Steps 8-10
      console.log('Form submitted:', formData)
      
      // Placeholder: Navigate to rates page with mock shipment ID
      // In real implementation, this will use the actual shipment ID from API response
      const mockShipmentId = 'mock-shipment-id'
      router.push(`/shipments/${mockShipmentId}/rates`)
    } catch (error) {
      console.error('Failed to create shipment:', error)
      alert('Failed to create shipment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return (
      formData.originName &&
      formData.originLine1 &&
      formData.originCity &&
      formData.originState &&
      formData.originPostal &&
      formData.destinationName &&
      formData.destinationLine1 &&
      formData.destinationCity &&
      formData.destinationState &&
      formData.destinationPostal &&
      formData.packageWeight &&
      formData.contentsDescription
    )
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
        onNext: handleSubmit,
        isNextLoading: isSubmitting,
        isNextDisabled: !isFormValid() || isSubmitting,
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

        {/* Origin Address */}
        <div className="border-b border-gray-200 pb-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
            Origin Address
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="originName" className="block text-sm font-medium text-gray-700 mb-1">
                Company/Recipient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="originName"
                name="originName"
                value={formData.originName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Acme Corp"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="originLine1" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="originLine1"
                name="originLine1"
                value={formData.originLine1}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Main St"
              />
            </div>
            <div>
              <label htmlFor="originCity" className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="originCity"
                name="originCity"
                value={formData.originCity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="New York"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="originState" className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="originState"
                  name="originState"
                  value={formData.originState}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="NY"
                  maxLength={2}
                />
              </div>
              <div>
                <label htmlFor="originPostal" className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="originPostal"
                  name="originPostal"
                  value={formData.originPostal}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10001"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Destination Address */}
        <div className="border-b border-gray-200 pb-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">2</span>
            Destination Address
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="destinationName" className="block text-sm font-medium text-gray-700 mb-1">
                Company/Recipient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="destinationName"
                name="destinationName"
                value={formData.destinationName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Widget Inc"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="destinationLine1" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="destinationLine1"
                name="destinationLine1"
                value={formData.destinationLine1}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="456 Oak Ave"
              />
            </div>
            <div>
              <label htmlFor="destinationCity" className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="destinationCity"
                name="destinationCity"
                value={formData.destinationCity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Los Angeles"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="destinationState" className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="destinationState"
                  name="destinationState"
                  value={formData.destinationState}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="CA"
                  maxLength={2}
                />
              </div>
              <div>
                <label htmlFor="destinationPostal" className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="destinationPostal"
                  name="destinationPostal"
                  value={formData.destinationPostal}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="90001"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Package Configuration */}
        <div className="border-b border-gray-200 pb-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">3</span>
            Package Configuration
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="packageWeight" className="block text-sm font-medium text-gray-700 mb-1">
                Weight (lbs) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="packageWeight"
                name="packageWeight"
                value={formData.packageWeight}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5.0"
                step="0.1"
              />
            </div>
            <div>
              <label htmlFor="packageLength" className="block text-sm font-medium text-gray-700 mb-1">
                Length (in)
              </label>
              <input
                type="number"
                id="packageLength"
                name="packageLength"
                value={formData.packageLength}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12"
              />
            </div>
            <div>
              <label htmlFor="packageWidth" className="block text-sm font-medium text-gray-700 mb-1">
                Width (in)
              </label>
              <input
                type="number"
                id="packageWidth"
                name="packageWidth"
                value={formData.packageWidth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10"
              />
            </div>
            <div>
              <label htmlFor="packageHeight" className="block text-sm font-medium text-gray-700 mb-1">
                Height (in)
              </label>
              <input
                type="number"
                id="packageHeight"
                name="packageHeight"
                value={formData.packageHeight}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="8"
              />
            </div>
          </div>
        </div>

        {/* Contents Description */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">4</span>
            Contents Description
          </h2>
          <div>
            <label htmlFor="contentsDescription" className="block text-sm font-medium text-gray-700 mb-1">
              What&apos;s inside? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="contentsDescription"
              name="contentsDescription"
              value={formData.contentsDescription}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Office supplies, documents, electronic equipment, etc."
            />
            <p className="mt-1 text-xs text-gray-500">
              Provide a clear description for customs and shipping purposes.
            </p>
          </div>
        </div>
      </div>
    </ShippingLayout>
  )
}
