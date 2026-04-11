'use client'

import { ShippingLayout } from '@/components/shipping/ShippingLayout'
import { useParams } from 'next/navigation'

export default function RatesPage() {
  const params = useParams()
  const shipmentId = params.id as string

  return (
    <ShippingLayout
      step={2}
      shipmentId={shipmentId}
      navigationProps={{
        nextLabel: 'Select Rate & Continue',
        isNextDisabled: true,
      }}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Select Shipping Rate
        </h1>
        <p className="text-gray-600 mb-6">
          Compare rates from multiple carriers and select the best option for your shipment.
        </p>
        
        {/* Placeholder for rate cards */}
        <div className="space-y-4">
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center py-12">
            <p className="text-gray-500">Rate comparison will be implemented in Step 11-13</p>
            <p className="text-sm text-gray-400 mt-2">
              Shipment ID: {shipmentId}
            </p>
          </div>
        </div>
      </div>
    </ShippingLayout>
  )
}
