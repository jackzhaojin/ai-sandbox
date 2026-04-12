'use client'

import React, { useState, useCallback } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  addMonths,
  subMonths,
  eachDayOfInterval,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'
import type { DateAvailability, TimeSlot } from '@/types/pickup'

interface PickupCalendarProps {
  availabilityData: DateAvailability[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
  isLoading?: boolean
}

export function PickupCalendar({
  availabilityData,
  selectedDate,
  onSelectDate,
  isLoading = false,
}: PickupCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate min/max dates (today to 90 days from now)
  const minDate = today
  const maxDate = addDays(today, 90)

  // Build availability map for quick lookup
  const availabilityMap = React.useMemo(() => {
    const map = new Map<string, DateAvailability>()
    availabilityData.forEach((date) => {
      map.set(date.date, date)
    })
    return map
  }, [availabilityData])

  // Navigation handlers
  const goToPreviousMonth = useCallback(() => {
    const newMonth = subMonths(currentMonth, 1)
    // Don't go before the current month
    if (isSameMonth(newMonth, today) || newMonth > today) {
      setCurrentMonth(newMonth)
    }
  }, [currentMonth, today])

  const goToNextMonth = useCallback(() => {
    const newMonth = addMonths(currentMonth, 1)
    // Don't go beyond max date
    const lastDayOfNewMonth = endOfMonth(newMonth)
    if (lastDayOfNewMonth <= maxDate || isSameMonth(newMonth, maxDate)) {
      setCurrentMonth(newMonth)
    }
  }, [currentMonth, maxDate])

  // Get availability for a specific date
  const getAvailability = (date: Date): DateAvailability | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return availabilityMap.get(dateStr)
  }

  // Check if date is disabled (past, beyond 90 days, or unavailable)
  const isDateDisabled = (date: Date): { disabled: boolean; reason?: string } => {
    // Past dates
    if (isBefore(date, minDate) && !isSameDay(date, today)) {
      return { disabled: true, reason: 'Past date' }
    }

    // Beyond 90 days
    if (date > maxDate) {
      return { disabled: true, reason: 'Beyond 90-day booking window' }
    }

    const availability = getAvailability(date)
    if (!availability) {
      return { disabled: true, reason: 'Loading availability...' }
    }

    // Holiday
    if (availability.isHoliday) {
      return { disabled: true, reason: availability.notes || 'Federal holiday' }
    }

    // Weekend with no service
    if (availability.isWeekend && !availability.isAvailable) {
      return { disabled: true, reason: availability.notes || 'Weekend service not available' }
    }

    // Unavailable
    if (!availability.isAvailable) {
      return { disabled: true, reason: availability.notes || 'Not available' }
    }

    return { disabled: false }
  }

  // Get visual state for a date
  const getDateVisualState = (date: Date): {
    bgColor: string
    textColor: string
    borderColor: string
    indicator?: 'available' | 'limited' | 'unavailable'
    isPast: boolean
  } => {
    const isPast = isBefore(date, today) && !isSameDay(date, today)
    const availability = getAvailability(date)
    const isSelected = selectedDate === format(date, 'yyyy-MM-dd')
    const isCurrentDay = isToday(date)

    // Past dates
    if (isPast) {
      return {
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-400',
        borderColor: isSelected ? 'ring-2 ring-blue-500' : '',
        isPast: true,
      }
    }

    // Selected state takes precedence
    if (isSelected) {
      return {
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'ring-2 ring-blue-500',
        isPast: false,
      }
    }

    // Today indicator
    if (isCurrentDay) {
      return {
        bgColor: availability?.isAvailable ? 'bg-white' : 'bg-gray-50',
        textColor: 'text-blue-600 font-semibold',
        borderColor: '',
        indicator: availability && !availability.isAvailable ? undefined : getOverallAvailability(availability),
        isPast: false,
      }
    }

    // No availability data yet
    if (!availability) {
      return {
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-400',
        borderColor: '',
        isPast: false,
      }
    }

    // Disabled/unavailable
    if (!availability.isAvailable) {
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-400',
        borderColor: '',
        isPast: false,
      }
    }

    // Available with color coding
    const overall = getOverallAvailability(availability)
    const bgColors = {
      available: 'bg-green-50 hover:bg-green-100',
      limited: 'bg-yellow-50 hover:bg-yellow-100',
      unavailable: 'bg-gray-100',
    }
    const textColors = {
      available: 'text-gray-900',
      limited: 'text-gray-900',
      unavailable: 'text-gray-400',
    }

    return {
      bgColor: bgColors[overall],
      textColor: textColors[overall],
      borderColor: '',
      indicator: overall,
      isPast: false,
    }
  }

  // Get overall availability for a date based on its slots
  const getOverallAvailability = (availability?: DateAvailability): 'available' | 'limited' | 'unavailable' => {
    if (!availability || !availability.isAvailable) return 'unavailable'
    
    const availableSlots = availability.slots.filter(s => s.availability === 'available').length
    const limitedSlots = availability.slots.filter(s => s.availability === 'limited').length
    const unavailableSlots = availability.slots.filter(s => s.availability === 'unavailable').length

    if (availableSlots === 0 && limitedSlots === 0) return 'unavailable'
    if (availableSlots === 0 || unavailableSlots > availableSlots) return 'limited'
    return 'available'
  }

  // Generate calendar days
  const generateCalendarDays = (): Date[] => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }

  const calendarDays = generateCalendarDays()
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Check navigation button states
  const canGoPrevious = !isSameMonth(currentMonth, today) && startOfMonth(currentMonth) > startOfMonth(today)
  const canGoNext = endOfMonth(currentMonth) < maxDate

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-600">Loading calendar...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <button
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious}
          className={cn(
            "p-2 rounded-md transition-colors",
            canGoPrevious
              ? "hover:bg-gray-200 text-gray-700"
              : "text-gray-300 cursor-not-allowed"
          )}
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={goToNextMonth}
          disabled={!canGoNext}
          className={cn(
            "p-2 rounded-md transition-colors",
            canGoNext
              ? "hover:bg-gray-200 text-gray-700"
              : "text-gray-300 cursor-not-allowed"
          )}
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const { disabled, reason } = isDateDisabled(date)
            const visualState = getDateVisualState(date)
            const isCurrentMonth = isSameMonth(date, currentMonth)
            const isCurrentDay = isToday(date)

            const dayButton = (
              <button
                onClick={() => !disabled && onSelectDate(dateStr)}
                disabled={disabled}
                className={cn(
                  "relative w-full aspect-square flex flex-col items-center justify-center rounded-md transition-all",
                  visualState.bgColor,
                  visualState.textColor,
                  visualState.borderColor,
                  !isCurrentMonth && "opacity-30",
                  disabled && "cursor-not-allowed",
                  !disabled && "cursor-pointer"
                )}
              >
                {/* Day number */}
                <span className={cn(
                  "text-sm font-medium",
                  visualState.isPast && "line-through"
                )}>
                  {format(date, 'd')}
                </span>

                {/* Today indicator dot */}
                {isCurrentDay && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600" />
                )}

                {/* Availability indicator dot */}
                {visualState.indicator && isCurrentMonth && (
                  <span className={cn(
                    "absolute top-1 right-1 w-2 h-2 rounded-full",
                    visualState.indicator === 'available' && "bg-green-500",
                    visualState.indicator === 'limited' && "bg-yellow-500",
                    visualState.indicator === 'unavailable' && "bg-gray-400"
                  )} />
                )}
              </button>
            )

            return (
              <div key={dateStr} className="relative">
                {disabled && reason ? (
                  <Tooltip content={reason} side="top">
                    {dayButton}
                  </Tooltip>
                ) : (
                  dayButton
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-600">Limited</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-gray-600">Unavailable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="text-gray-600">Today</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <Info className="w-3 h-3 text-gray-400" />
            <span className="text-gray-500">Hover over disabled dates for details</span>
          </div>
        </div>
      </div>
    </div>
  )
}
