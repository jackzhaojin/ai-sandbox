'use client'

import { ShippingLayout } from '@/components/shipping/ShippingLayout'
import { useParams } from 'next/navigation'

export default function PaymentPage() {
  const params = useParams()
  const shipmentId = params.id as string

  return (
    <ShippingLayout
      step={3}
      shipmentId={shipmentId}
      navigationProps={{
        nextLabel: 'Process Payment',
        isNextDisabled: true,
      }}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Method
        </h1>
        <p className="text-gray-600 mb-6">
          Choose from our 5 B2B payment options.
        </p>
        
        {/* Placeholder for payment methods */}
        <div className="space-y-4">
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center py-12">
            <p className="text-gray-500">Payment methods will be implemented in Steps 15-20</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">Purchase Order</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">Net Terms</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">Bill of Lading</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">Third Party</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">Corporate Account</span>
            </div>
          </div>
        </div>
      </div>
    </ShippingLayout>
  )
}
