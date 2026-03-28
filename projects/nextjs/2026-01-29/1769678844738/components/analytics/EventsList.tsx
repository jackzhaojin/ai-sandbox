'use client'

import React, { useState } from 'react'
import { RetroTable } from '@/components/ui/RetroTable'
import { RetroSelect } from '@/components/ui/RetroSelect'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ExportMenu } from './ExportMenu'
import { useAnalyticsEvents } from '@/lib/queries/analytics'

interface Event {
  id: string
  eventType: string
  eventName: string
  path?: string
  createdAt: string
}

interface EventsListProps {
  limit?: number
}

const EVENT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'page_view', label: 'Page Views' },
  { value: 'click', label: 'Clicks' },
  { value: 'form_submit', label: 'Form Submits' },
  { value: 'custom', label: 'Custom Events' }
]

export function EventsList({ limit = 50 }: EventsListProps) {
  const [eventType, setEventType] = useState('all')

  // Build query params
  const params = {
    limit,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
    ...(eventType !== 'all' && { eventType }),
  }

  const { data: events = [], isLoading, error } = useAnalyticsEvents(params)

  const columns = [
    {
      key: 'eventType',
      header: 'Type',
      render: (value: string) => (
        <span className="uppercase text-cyan-400">{value}</span>
      )
    },
    {
      key: 'eventName',
      header: 'Event Name'
    },
    {
      key: 'path',
      header: 'Path',
      render: (value: string) => value || '-'
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (value: string) => new Date(value).toLocaleString()
    }
  ]

  if (isLoading) {
    return <LoadingSpinner message="LOADING EVENTS" />
  }

  if (error) {
    return (
      <div className="border-2 border-red-500 bg-black p-6 shadow-[0_0_20px_rgba(255,0,0,0.3)]">
        <div className="text-red-500 font-mono">
          <div className="text-xl mb-2">&gt; ERROR</div>
          <div className="text-sm">
            {error instanceof Error ? error.message : 'Failed to load events'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="text-green-400 font-mono text-sm">
          &gt; {events.length} events found
        </div>
        <div className="flex gap-4">
          <ExportMenu data={events} filename="analytics-events" />
          <RetroSelect
            options={EVENT_TYPE_OPTIONS}
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      <RetroTable columns={columns} data={events} />
    </div>
  )
}
