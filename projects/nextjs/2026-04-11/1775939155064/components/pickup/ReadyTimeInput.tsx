'use client'

import React, { useMemo } from 'react'
import { Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimeSlot } from '@/types/pickup'

interface ReadyTimeInputProps {
  selectedSlot: TimeSlot | null
  value: string
  onChange: (time: string) => void
  disabled?: boolean
}

export function ReadyTimeInput({
  selectedSlot,
  value,
  onChange,
  disabled = false,
}: ReadyTimeInputProps) {
  // Generate 30-minute increment options based on selected slot
  const timeOptions = useMemo(() => {
    if (!selectedSlot) return []

    const options: { value: string; label: string; disabled: boolean }[] = []
    
    const [startHour, startMinute] = selectedSlot.startTime.split(':').map(Number)
    const slotStartTime = startHour * 60 + startMinute
    
    // Calculate the minimum ready time (30 min before slot start)
    const minReadyTime = slotStartTime - 30
    
    // Generate options from 12:00 AM to the slot start time
    // Start from a reasonable early time (e.g., 6 AM = 360 minutes)
    const earliestOption = Math.max(0, 360) // 6 AM or midnight if slot starts early
    
    for (let minutes = earliestOption; minutes <= slotStartTime; minutes += 30) {
      const hour = Math.floor(minutes / 60)
      const minute = minutes % 60
      const timeValue = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      
      // Format label
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      const label = `${displayHour}:${String(minute).padStart(2, '0')} ${ampm}`
      
      // Check if this option is valid (must be at least 30 min before slot)
      const isValid = minutes <= minReadyTime
      
      options.push({
        value: timeValue,
        label,
        disabled: !isValid,
      })
    }
    
    return options
  }, [selectedSlot])

  // Get default value (30 min before slot start)
  const defaultValue = useMemo(() => {
    if (!selectedSlot) return ''
    
    const [startHour, startMinute] = selectedSlot.startTime.split(':').map(Number)
    const slotStartMinutes = startHour * 60 + startMinute
    const defaultMinutes = slotStartMinutes - 30
    
    const hour = Math.floor(defaultMinutes / 60)
    const minute = defaultMinutes % 60
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }, [selectedSlot])

  // Set default value when slot changes
  React.useEffect(() => {
    if (selectedSlot && !value) {
      onChange(defaultValue)
    }
  }, [selectedSlot, defaultValue, value, onChange])

  if (!selectedSlot) {
    return (
      <div className={cn(
        "rounded-lg border border-gray-200 p-4 bg-gray-50",
        disabled && "opacity-50"
      )}>
        <div className="flex items-center gap-3 text-gray-500">
          <Clock className="w-5 h-5" />
          <p className="text-sm">Select a time slot first to set ready time</p>
        </div>
      </div>
    )
  }

  const [startHour, startMinute] = selectedSlot.startTime.split(':').map(Number)
  const slotStartLabel = `${startHour % 12 || 12}:${String(startMinute).padStart(2, '0')} ${startHour >= 12 ? 'PM' : 'AM'}`

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          Package Ready Time
        </h4>
        <span className="text-xs text-gray-500">
          Must be ready by {slotStartLabel}
        </span>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 bg-white">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-2">
              When will your package be ready for pickup?
            </label>
            
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className={cn(
                "w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <option value="">Select a time...</option>
              {timeOptions.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label} {option.disabled ? '(Too late)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-4 flex items-start gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
          <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Your package must be ready at least 30 minutes before the pickup window starts. 
            The driver may arrive anytime during the selected time window.
          </p>
        </div>

        {/* Validation warning */}
        {value && !timeOptions.find(o => o.value === value)?.disabled === false && (
          <div className="mt-3 flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Selected time may not provide enough buffer. Please ensure your package 
              will be ready before the pickup window begins.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
