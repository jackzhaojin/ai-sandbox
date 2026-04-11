'use client'

import { ShippingLayout } from '@/components/shipping/ShippingLayout'
import { useParams } from 'next/navigation'

export default function PickupPage() {
  const params = useParams()
  const shipmentId = params.id as string

  return (
    <ShippingLayout
      step={4}
      shipmentId={shipmentId}
      navigationProps={{
        nextLabel: 'Schedule Pickup',
        isNextDisabled: true,
      }}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Schedule Pickup
        </h1>
        <p className="text-gray-600 mb-6">
          Select a convenient pickup time and provide access instructions.
        </p>
        
        {/* Placeholder for pickup scheduling */}
        <div className="space-y-4">
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center py-12">
            <p className="text-gray-500">Pickup scheduling will be implemented in Steps 22-24</p>
            <p className="text-sm text-gray-400 mt-2">
              Available time windows: 9-11 AM, 11 AM-1 PM, 1-3 PM, 3-5 PM
            </p>
          </div>
        </div>
      </div>
    </ShippingLayout>
  )
}
