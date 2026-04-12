'use client'

import React from 'react'
import {
  Clock,
  Calendar,
  MapPin,
  DollarSign,
  Package,
  Truck,
  Info,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PickupGuidelinesSidebarProps {
  minLeadDays?: number
  sameDayCutoff?: string
  serviceAreaDescription?: string
  premiumFees?: {
    morning?: number
    evening?: number
    weekend?: number
  }
  equipmentAvailability?: string[]
  className?: string
}

const DEFAULT_EQUIPMENT = [
  'Standard hand truck (dolly)',
  'Furniture pads and blankets',
  'Tie-down straps',
  'Basic loading assistance',
]

export function PickupGuidelinesSidebar({
  minLeadDays = 1,
  sameDayCutoff = '14:00',
  serviceAreaDescription = 'Metropolitan and surrounding areas',
  premiumFees = { morning: 15, evening: 25, weekend: 35 },
  equipmentAvailability = DEFAULT_EQUIPMENT,
  className,
}: PickupGuidelinesSidebarProps) {
  // Format cutoff time
  const formatCutoffTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10))
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Format lead time
  const formatLeadTime = (days: number) => {
    if (days === 0) return 'Same-day available'
    if (days === 1) return '1 business day'
    return `${days} business days`
  }

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
        <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Pickup Guidelines
        </h3>
      </div>

      <div className="p-4 space-y-6">
        {/* Lead Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <Clock className="h-4 w-4 text-blue-600" />
            Minimum Lead Time
          </div>
          <p className="text-sm text-gray-600 pl-6">
            {formatLeadTime(minLeadDays)} advance notice required for standard pickups.
          </p>
        </div>

        {/* Same-Day Cutoff */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <Calendar className="h-4 w-4 text-blue-600" />
            Same-Day Cutoff
          </div>
          <p className="text-sm text-gray-600 pl-6">
            Requests must be submitted by{' '}
            <strong className="text-gray-900">{formatCutoffTime(sameDayCutoff)}</strong>
            {' '}for same-day service (fees apply).
          </p>
        </div>

        {/* Service Area */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <MapPin className="h-4 w-4 text-blue-600" />
            Service Area
          </div>
          <p className="text-sm text-gray-600 pl-6">
            {serviceAreaDescription}. Extended service available for remote locations
            with additional lead time.
          </p>
        </div>

        {/* Premium Time Slot Fees */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <DollarSign className="h-4 w-4 text-blue-600" />
            Premium Time Slot Fees
          </div>
          <div className="pl-6 space-y-1.5">
            {premiumFees.morning !== undefined && premiumFees.morning > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Early morning (before 9 AM)</span>
                <span className="font-medium text-amber-600">+${premiumFees.morning}</span>
              </div>
            )}
            {premiumFees.evening !== undefined && premiumFees.evening > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Evening (after 5 PM)</span>
                <span className="font-medium text-amber-600">+${premiumFees.evening}</span>
              </div>
            )}
            {premiumFees.weekend !== undefined && premiumFees.weekend > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Weekend pickup</span>
                <span className="font-medium text-amber-600">+${premiumFees.weekend}</span>
              </div>
            )}
          </div>
        </div>

        {/* Equipment Availability */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <Package className="h-4 w-4 text-blue-600" />
            Standard Equipment
          </div>
          <ul className="pl-6 space-y-1">
            {equipmentAvailability.map((item, index) => (
              <li
                key={index}
                className="text-sm text-gray-600 flex items-start gap-2"
              >
                <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Driver Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <Truck className="h-4 w-4 text-blue-600" />
            Driver Information
          </div>
          <p className="text-sm text-gray-600 pl-6">
            Driver details and estimated arrival will be shared 30 minutes before pickup.
            Please ensure someone is available to meet the driver.
          </p>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 px-4 py-3 border-t border-amber-100">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            <strong>Important:</strong> Packages must be properly packaged and labeled
            before driver arrival. Maximum wait time at location is 15 minutes.
          </p>
        </div>
      </div>
    </div>
  )
}
