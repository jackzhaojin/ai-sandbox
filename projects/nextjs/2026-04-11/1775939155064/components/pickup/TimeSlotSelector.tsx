'use client'

import React from 'react'
import { Clock, DollarSign, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'
import type { TimeSlot } from '@/types/pickup'

interface TimeSlotSelectorProps {
  slots: TimeSlot[]
  selectedSlotId: string | null
  onSelectSlot: (slot: TimeSlot) => void
  disabled?: boolean
}

export function TimeSlotSelector({
  slots,
  selectedSlotId,
  onSelectSlot,
  disabled = false,
}: TimeSlotSelectorProps) {
  // Helper to format time display
  const formatTimeRange = (startTime: string, endTime: string): string => {
    const formatTime = (time: string): string => {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours, 10)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes} ${ampm}`
    }
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }

  // Get availability badge
  const getAvailabilityBadge = (availability: TimeSlot['availability']) => {
    switch (availability) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Available
          </span>
        )
      case 'limited':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <AlertCircle className="w-3 h-3" />
            Limited
          </span>
        )
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            Unavailable
          </span>
        )
    }
  }

  // Get reason for unavailability
  const getUnavailabilityReason = (slot: TimeSlot): string => {
    if (slot.availability === 'unavailable') {
      return 'This time slot is fully booked'
    }
    return ''
  }

  if (slots.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
        <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No time slots available for this date</p>
        <p className="text-sm text-gray-500 mt-1">
          Please select a different date
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">
        Select a Time Window
      </h4>

      <div className="grid gap-3">
        {slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id
          const isUnavailable = slot.availability === 'unavailable'
          const hasFee = slot.fee > 0

          const slotButton = (
            <button
              onClick={() => !isUnavailable && !disabled && onSelectSlot(slot)}
              disabled={isUnavailable || disabled}
              className={cn(
                "w-full p-4 rounded-lg border-2 transition-all text-left",
                isSelected && "border-blue-500 bg-blue-50",
                !isSelected && !isUnavailable && "border-gray-200 hover:border-gray-300 bg-white",
                isUnavailable && "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60",
                disabled && !isUnavailable && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">
                      {slot.label}
                    </span>
                    {getAvailabilityBadge(slot.availability)}
                    {isSelected && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mt-1">
                    {formatTimeRange(slot.startTime, slot.endTime)}
                  </p>

                  <p className="text-sm text-gray-500 mt-0.5">
                    {slot.description}
                  </p>
                </div>

                <div className="text-right">
                  {hasFee ? (
                    <div className="flex items-center gap-1 text-amber-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold">+${slot.fee}</span>
                    </div>
                  ) : (
                    <span className="text-green-600 font-medium">Free</span>
                  )}
                </div>
              </div>
            </button>
          )

          return (
            <div key={slot.id}>
              {isUnavailable ? (
                <Tooltip content={getUnavailabilityReason(slot)} side="top">
                  {slotButton}
                </Tooltip>
              ) : (
                slotButton
              )}
            </div>
          )
        })}
      </div>

      {/* Legend/info */}
      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Times shown in your local timezone</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          <span>Evening pickup includes $25 surcharge</span>
        </div>
      </div>
    </div>
  )
}
