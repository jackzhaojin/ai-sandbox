'use client'

import React, { useState } from 'react'
import { MetricCard } from '@/components/charts/MetricCard'
import { RetroLineChart } from '@/components/charts/RetroLineChart'
import { RetroBarChart } from '@/components/charts/RetroBarChart'
import { RetroPieChart } from '@/components/charts/RetroPieChart'
import { RetroSelect } from '@/components/ui/RetroSelect'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { RetroButton } from '@/components/ui/RetroButton'
import { EventsList } from './EventsList'
import { useAnalyticsMetrics } from '@/lib/queries/analytics'

interface Metrics {
  totalEvents: number
  eventsByType: { name: string; value: number }[]
  eventsByName: { name: string; value: number }[]
  eventsOverTime: { name: string; value: number }[]
}

const DATE_RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' }
]

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('30')

  // Calculate date range
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - parseInt(dateRange))

  // Use React Query hook for fetching metrics
  const { data, isLoading, error, refetch, isRefetching } = useAnalyticsMetrics(
    startDate.toISOString(),
    endDate.toISOString()
  )

  const metrics = data?.metrics as Metrics | undefined

  if (isLoading) {
    return <LoadingSpinner message="LOADING METRICS" />
  }

  if (error) {
    return (
      <div className="border-2 border-red-500 bg-black p-6 shadow-[0_0_20px_rgba(255,0,0,0.3)]">
        <div className="text-red-500 font-mono">
          <div className="text-xl mb-2">&gt; ERROR</div>
          <div className="text-sm">
            {error instanceof Error ? error.message : 'Failed to load metrics'}
          </div>
          <div className="mt-4">
            <RetroButton onClick={() => refetch()} variant="primary">
              RETRY
            </RetroButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-between items-center">
        <div className="text-green-400 font-mono text-sm">
          {isRefetching && (
            <span className="retro-blink">&gt; Refreshing data...</span>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <RetroButton onClick={() => refetch()} variant="secondary" disabled={isRefetching}>
            REFRESH
          </RetroButton>
          <RetroSelect
            options={DATE_RANGE_OPTIONS}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="TOTAL EVENTS"
          value={metrics?.totalEvents || 0}
          subtitle={`Last ${dateRange} days`}
          trend="neutral"
        />
        <MetricCard
          title="EVENT TYPES"
          value={metrics?.eventsByType?.length || 0}
          subtitle="Unique types"
          trend="neutral"
        />
        <MetricCard
          title="UNIQUE EVENTS"
          value={metrics?.eventsByName?.length || 0}
          subtitle="Distinct events"
          trend="neutral"
        />
        <MetricCard
          title="AVG PER DAY"
          value={
            metrics?.totalEvents
              ? Math.round(metrics.totalEvents / parseInt(dateRange))
              : 0
          }
          subtitle="Events/day"
          trend="neutral"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RetroLineChart
          title="EVENTS OVER TIME"
          data={metrics?.eventsOverTime || []}
          dataKey="value"
          xAxisKey="name"
        />
        <RetroPieChart
          title="EVENTS BY TYPE"
          data={metrics?.eventsByType || []}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RetroBarChart
          title="TOP EVENTS BY NAME"
          data={(metrics?.eventsByName || []).slice(0, 10)}
          dataKey="value"
          xAxisKey="name"
        />
      </div>

      {/* Recent Events */}
      <div>
        <h2 className="text-2xl font-bold text-green-500 mb-4 font-mono uppercase retro-glow">
          RECENT EVENTS
        </h2>
        <EventsList limit={20} />
      </div>
    </div>
  )
}
