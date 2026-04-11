'use client'

import { useState } from 'react'

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
}

export default function NewShipmentPage() {
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
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Form submission will be implemented in subsequent steps
    console.log('Form submitted:', formData)
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Shipment</h1>
          <p className="text-gray-600 mb-6">Step 1 of 5: Enter shipment details</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Origin Address */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Origin Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="originName" className="block text-sm font-medium text-gray-700 mb-1">
                    Company/Recipient Name
                  </label>
                  <input
                    type="text"
                    id="originName"
                    name="originName"
                    value={formData.originName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="originLine1" className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="originLine1"
                    name="originLine1"
                    value={formData.originLine1}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <label htmlFor="originCity" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="originCity"
                    name="originCity"
                    value={formData.originCity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="New York"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="originState" className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      id="originState"
                      name="originState"
                      value={formData.originState}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <label htmlFor="originPostal" className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP
                    </label>
                    <input
                      type="text"
                      id="originPostal"
                      name="originPostal"
                      value={formData.originPostal}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Destination Address */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Destination Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="destinationName" className="block text-sm font-medium text-gray-700 mb-1">
                    Company/Recipient Name
                  </label>
                  <input
                    type="text"
                    id="destinationName"
                    name="destinationName"
                    value={formData.destinationName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Widget Inc"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="destinationLine1" className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="destinationLine1"
                    name="destinationLine1"
                    value={formData.destinationLine1}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="456 Oak Ave"
                  />
                </div>
                <div>
                  <label htmlFor="destinationCity" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="destinationCity"
                    name="destinationCity"
                    value={formData.destinationCity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Los Angeles"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="destinationState" className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      id="destinationState"
                      name="destinationState"
                      value={formData.destinationState}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="CA"
                    />
                  </div>
                  <div>
                    <label htmlFor="destinationPostal" className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP
                    </label>
                    <input
                      type="text"
                      id="destinationPostal"
                      name="destinationPostal"
                      value={formData.destinationPostal}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:2 focus:ring-blue-500"
                      placeholder="90001"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Package Configuration */}
            <div className="pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Package Configuration</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="packageWeight" className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    id="packageWeight"
                    name="packageWeight"
                    value={formData.packageWeight}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="8"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Continue to Rates
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
