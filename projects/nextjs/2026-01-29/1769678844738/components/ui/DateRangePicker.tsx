'use client'

import React from 'react'
import { RetroInput } from './RetroInput'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  label?: string
  className?: string
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label,
  className = ''
}: DateRangePickerProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-green-400 font-mono text-sm mb-2 uppercase">
          {label}
        </label>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-green-600 font-mono text-xs mb-1 uppercase">
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full bg-black text-green-400 border-2 border-green-500 px-4 py-2 font-mono text-sm focus:outline-none focus:border-green-300 focus:shadow-[0_0_10px_rgba(0,255,0,0.3)] transition-all"
          />
        </div>
        <div>
          <label className="block text-green-600 font-mono text-xs mb-1 uppercase">
            To Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full bg-black text-green-400 border-2 border-green-500 px-4 py-2 font-mono text-sm focus:outline-none focus:border-green-300 focus:shadow-[0_0_10px_rgba(0,255,0,0.3)] transition-all"
          />
        </div>
      </div>
    </div>
  )
}
