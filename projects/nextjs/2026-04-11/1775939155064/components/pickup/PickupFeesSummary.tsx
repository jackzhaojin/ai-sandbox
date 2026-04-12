'use client'

import React from 'react'
import { DollarSign, Clock, MapPin, Package, HandHelping, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimeSlot } from '@/types/pickup'
import {
  type PickupLocationType,
  type AccessRequirement,
  type PickupEquipment,
  type LoadingAssistanceType,
  PICKUP_LOCATION_TYPE_LABELS,
  ACCESS_REQUIREMENT_LABELS,
  PICKUP_EQUIPMENT_LABELS,
  LOADING_ASSISTANCE_LABELS,
} from '@/types/pickup'
import {
  PICKUP_LOCATION_TYPE_FEES,
  ACCESS_REQUIREMENT_FEES,
  PICKUP_EQUIPMENT_FEES,
  LOADING_ASSISTANCE_FEES,
} from '@/lib/validation'

interface PickupFeesSummaryProps {
  timeSlot: TimeSlot | null
  locationType: PickupLocationType | null
  accessRequirements: AccessRequirement[]
  equipment: PickupEquipment[]
  loadingAssistance: LoadingAssistanceType | null
  className?: string
}

interface FeeLineItem {
  id: string
  icon: React.ReactNode
  label: string
  description: string
  fee: number
  highlight?: boolean
}

export function PickupFeesSummary({
  timeSlot,
  locationType,
  accessRequirements,
  equipment,
  loadingAssistance,
  className,
}: PickupFeesSummaryProps) {
  // Build line items
  const lineItems: FeeLineItem[] = []

  // Time slot fee
  if (timeSlot) {
    lineItems.push({
      id: 'time-slot',
      icon: <Clock className="h-4 w-4" />,
      label: 'Time Slot',
      description: timeSlot.label,
      fee: timeSlot.fee,
    })
  }

  // Location fee
  if (locationType) {
    const fee = PICKUP_LOCATION_TYPE_FEES[locationType]
    lineItems.push({
      id: 'location',
      icon: <MapPin className="h-4 w-4" />,
      label: 'Location',
      description: PICKUP_LOCATION_TYPE_LABELS[locationType],
      fee,
      highlight: fee > 0,
    })
  }

  // Access requirements fees
  accessRequirements.forEach((req) => {
    const fee = ACCESS_REQUIREMENT_FEES[req]
    lineItems.push({
      id: `access-${req}`,
      icon: <Shield className="h-4 w-4" />,
      label: 'Access',
      description: ACCESS_REQUIREMENT_LABELS[req],
      fee,
      highlight: fee > 0,
    })
  })

  // Equipment fees
  equipment.forEach((eq) => {
    const fee = PICKUP_EQUIPMENT_FEES[eq]
    lineItems.push({
      id: `equipment-${eq}`,
      icon: <Package className="h-4 w-4" />,
      label: 'Equipment',
      description: PICKUP_EQUIPMENT_LABELS[eq],
      fee,
      highlight: fee > 0,
    })
  })

  // Loading assistance fee
  if (loadingAssistance) {
    const fee = LOADING_ASSISTANCE_FEES[loadingAssistance]
    lineItems.push({
      id: 'loading',
      icon: <HandHelping className="h-4 w-4" />,
      label: 'Loading',
      description: LOADING_ASSISTANCE_LABELS[loadingAssistance],
      fee,
      highlight: fee > 0,
    })
  }

  // Calculate totals
  const totalFees = lineItems.reduce((sum, item) => sum + item.fee, 0)
  const freeItems = lineItems.filter((item) => item.fee === 0).length
  const paidItems = lineItems.filter((item) => item.fee > 0).length

  if (lineItems.length === 0) {
    return (
      <div
        className={cn(
          "bg-gray-50 rounded-lg border border-gray-200 p-6 text-center",
          className
        )}
      >
        <DollarSign className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">
          Complete your pickup selections to see fees
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-blue-600" />
          Pickup Fees Summary
        </h3>
      </div>

      {/* Line Items */}
      <div className="divide-y divide-gray-100">
        {lineItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              "px-4 py-3 flex items-center justify-between",
              item.highlight && "bg-amber-50/30"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-1.5 rounded",
                  item.fee > 0
                    ? "bg-amber-100 text-amber-600"
                    : "bg-gray-100 text-gray-500"
                )}
              >
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {item.description}
                </p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            </div>
            <div className="text-right">
              {item.fee === 0 ? (
                <span className="text-sm font-medium text-green-600">Free</span>
              ) : (
                <span className="text-sm font-medium text-gray-900">
                  +${item.fee.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-gray-50 px-4 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Pickup Fees</p>
            {freeItems > 0 && (
              <p className="text-xs text-gray-500">
                {freeItems} free {freeItems === 1 ? 'service' : 'services'} included
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">
              ${totalFees.toFixed(2)}
            </p>
            {paidItems > 0 && (
              <p className="text-xs text-gray-500">
                {paidItems} optional {paidItems === 1 ? 'add-on' : 'add-ons'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
