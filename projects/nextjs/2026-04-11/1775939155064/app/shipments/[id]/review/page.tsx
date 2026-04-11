'use client'

import { ShippingLayout } from '@/components/shipping/ShippingLayout'
import { useParams } from 'next/navigation'

export default function ReviewPage() {
  const params = useParams()
  const shipmentId = params.id as string

  return (
    <ShippingLayout
      step={5}
      shipmentId={shipmentId}
      navigationProps={{
        nextLabel: 'Confirm Shipment',
        isNextDisabled: false,
      }}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Review Shipment
        </h1>
        <p className="text-gray-600 mb-6">
          Review all details before confirming your shipment.
        </p>
        
        {/* Placeholder for review summary */}
        <div className="space-y-4">
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center py-12">
            <p className="text-gray-500">Review summary will be implemented in Steps 26-28</p>
            <p className="text-sm text-gray-400 mt-2">
              Full shipment details, costs, and pickup information will be displayed here
            </p>
          </div>
        </div>
      </div>
    </ShippingLayout>
  )
}
