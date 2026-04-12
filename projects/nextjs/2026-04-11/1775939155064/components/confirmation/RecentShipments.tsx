'use client'

import { useRouter } from 'next/navigation'
import { Package, ChevronRight, Calendar, MapPin, CheckCircle, Clock, Truck } from 'lucide-react'
import type { RecentShipmentData } from './types'
import { cn } from '@/lib/utils'

interface RecentShipmentsProps {
  shipments: RecentShipmentData[]
  className?: string
}

const statusIcons: Record<string, React.ReactNode> = {
  confirmed: <CheckCircle className="w-4 h-4 text-green-600" />,
  pending: <Clock className="w-4 h-4 text-amber-600" />,
  in_transit: <Truck className="w-4 h-4 text-blue-600" />,
  delivered: <CheckCircle className="w-4 h-4 text-gray-600" />,
}

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  in_transit: 'In Transit',
  delivered: 'Delivered',
}

export function RecentShipments({ shipments, className }: RecentShipmentsProps) {
  const router = useRouter()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
  }

  const handleShipmentClick = (shipmentId: string) => {
    router.push(`/shipments/${shipmentId}`)
  }

  // Limit to last 3 shipments
  const recentShipments = shipments.slice(0, 3)

  if (recentShipments.length === 0) {
    return (
      <div
        className={cn(
          'bg-white rounded-lg shadow-sm border border-gray-200 p-6',
          className
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Recent Shipments
        </h3>
        <p className="text-gray-600 text-sm">
          No recent shipments found. Create your first shipment to see it here.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Shipments</h3>
        <p className="text-sm text-gray-600">
          Your last {recentShipments.length} shipment{recentShipments.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Shipment List */}
      <ul className="divide-y divide-gray-200">
        {recentShipments.map((shipment) => (
          <li key={shipment.id}>
            <button
              onClick={() => handleShipmentClick(shipment.id)}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {shipment.confirmationNumber}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm text-gray-500">
                    {shipment.carrierName}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">
                    {shipment.origin.city}, {shipment.origin.state}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">
                    {shipment.destination.city}, {shipment.destination.state}
                  </span>
                </div>
              </div>

              {/* Right side */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  {statusIcons[shipment.status] || statusIcons.pending}
                  <span className="text-xs font-medium text-gray-700">
                    {statusLabels[shipment.status] || statusLabels.pending}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {formatDate(shipment.createdAt)}
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </button>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <a
          href="/shipments"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          View all shipments
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}
