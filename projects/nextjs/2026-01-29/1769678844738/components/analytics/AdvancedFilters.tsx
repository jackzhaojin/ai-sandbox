'use client'

import React, { useState } from 'react'
import { RetroCard } from '@/components/ui/RetroCard'
import { RetroButton } from '@/components/ui/RetroButton'
import { RetroInput } from '@/components/ui/RetroInput'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { DateRangePicker } from '@/components/ui/DateRangePicker'

interface AdvancedFiltersProps {
  onApply: (filters: FilterValues) => void
  onClear: () => void
}

export interface FilterValues {
  eventTypes: string[]
  searchTerm: string
  startDate: string
  endDate: string
  pathFilter: string
}

const EVENT_TYPE_OPTIONS = [
  { value: 'page_view', label: 'Page View' },
  { value: 'click', label: 'Click' },
  { value: 'form_submit', label: 'Form Submit' },
  { value: 'custom', label: 'Custom' }
]

export function AdvancedFilters({ onApply, onClear }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Filter state
  const [eventTypes, setEventTypes] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [pathFilter, setPathFilter] = useState('')

  // Date range state
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const [startDateStr, setStartDateStr] = useState(
    startDate.toISOString().split('T')[0]
  )
  const [endDateStr, setEndDateStr] = useState(endDate.toISOString().split('T')[0])

  function handleApply() {
    onApply({
      eventTypes,
      searchTerm,
      startDate: startDateStr,
      endDate: endDateStr,
      pathFilter
    })
    setIsExpanded(false)
  }

  function handleClear() {
    setEventTypes([])
    setSearchTerm('')
    setPathFilter('')
    const newEndDate = new Date()
    const newStartDate = new Date()
    newStartDate.setDate(newStartDate.getDate() - 30)
    setStartDateStr(newStartDate.toISOString().split('T')[0])
    setEndDateStr(newEndDate.toISOString().split('T')[0])
    onClear()
    setIsExpanded(false)
  }

  const activeFiltersCount =
    eventTypes.length +
    (searchTerm ? 1 : 0) +
    (pathFilter ? 1 : 0)

  if (!isExpanded) {
    return (
      <div className="flex gap-4 items-center">
        <RetroButton onClick={() => setIsExpanded(true)} variant="secondary">
          ADVANCED FILTERS
          {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
        </RetroButton>
      </div>
    )
  }

  return (
    <RetroCard title="ADVANCED FILTERS">
      <div className="space-y-4">
        <MultiSelect
          label="Event Types"
          options={EVENT_TYPE_OPTIONS}
          value={eventTypes}
          onChange={setEventTypes}
          placeholder="Select event types..."
        />

        <RetroInput
          label="Search Events"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by event name..."
        />

        <RetroInput
          label="Path Filter"
          value={pathFilter}
          onChange={(e) => setPathFilter(e.target.value)}
          placeholder="Filter by path (e.g., /dashboard)..."
        />

        <DateRangePicker
          label="Custom Date Range"
          startDate={startDateStr}
          endDate={endDateStr}
          onStartDateChange={setStartDateStr}
          onEndDateChange={setEndDateStr}
        />

        <div className="flex gap-4 pt-4 border-t-2 border-green-700">
          <RetroButton onClick={handleApply} variant="primary" className="flex-1">
            APPLY FILTERS
          </RetroButton>
          <RetroButton onClick={handleClear} variant="secondary" className="flex-1">
            CLEAR ALL
          </RetroButton>
          <RetroButton
            onClick={() => setIsExpanded(false)}
            variant="secondary"
            className="flex-1"
          >
            CLOSE
          </RetroButton>
        </div>
      </div>
    </RetroCard>
  )
}
