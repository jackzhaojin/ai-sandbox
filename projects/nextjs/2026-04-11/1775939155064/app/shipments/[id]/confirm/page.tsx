'use client'

import { ShippingLayout } from '@/components/shipping/ShippingLayout'
import { useParams } from 'next/navigation'
import { CheckCircle, Package, FileText, Truck } from 'lucide-react'

export default function ConfirmPage() {
  const params = useParams()
  const shipmentId = params.id as string

  return (
    <ShippingLayout
      step={6}
      shipmentId={shipmentId}
      showNavigation={false}
      navigationProps={{
        nextLabel: 'View All Shipments',
      }}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Shipment Confirmed!
          </h1>
          <p className="text-gray-600">
            Your shipment has been successfully created and scheduled for pickup.
          </p>
        </div>

        {/* Tracking info placeholder */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Tracking Information
          </h2>
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Tracking Number</p>
              <p className="text-lg font-mono font-semibold text-gray-900">
                TRK-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-XXXXXXX
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`/shipments/${shipmentId}`}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            View Shipment Details
          </a>
          <a
            href="/shipments/new"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Truck className="w-4 h-4" />
            Create New Shipment
          </a>
        </div>
      </div>
    </ShippingLayout>
  )
}
