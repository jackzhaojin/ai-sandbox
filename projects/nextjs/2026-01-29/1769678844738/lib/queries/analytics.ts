import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Types
interface AnalyticsEvent {
  id: string
  eventType: string
  eventName: string
  path: string
  metadata: any
  createdAt: string
  userId?: string
}

interface AnalyticsMetrics {
  totalEvents: number
  uniqueEventTypes: number
  uniqueEvents: number
  averagePerDay: number
  eventsByType: { name: string; value: number }[]
  eventsByDay: { date: string; value: number }[]
}

interface EventsQueryParams {
  eventType?: string
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  startDate?: string
  endDate?: string
}

// Fetch analytics metrics
async function fetchAnalyticsMetrics(
  startDate?: string,
  endDate?: string
): Promise<any> {
  const params = new URLSearchParams({ aggregate: 'true' })
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  const response = await fetch(`/api/analytics/metrics?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch analytics metrics')
  }
  const data = await response.json()

  // Transform API response to match component expectations
  if (data.success && data.metrics) {
    const metrics = data.metrics
    return {
      success: true,
      metrics: {
        totalEvents: metrics.total || 0,
        uniqueEventTypes: metrics.byEventType?.length || 0,
        uniqueEvents: metrics.byEventName?.length || 0,
        averagePerDay: 0, // Will be calculated in component
        eventsByType: (metrics.byEventType || []).map((item: any) => ({
          name: item.eventType,
          value: item.count
        })),
        eventsByName: (metrics.byEventName || []).map((item: any) => ({
          name: item.eventName,
          value: item.count
        })),
        eventsOverTime: [], // Will need separate endpoint or calculation
      }
    }
  }

  return data
}

// Fetch analytics events
async function fetchAnalyticsEvents(
  params: EventsQueryParams = {}
): Promise<AnalyticsEvent[]> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value))
    }
  })

  const response = await fetch(`/api/analytics/events?${searchParams}`)
  if (!response.ok) {
    throw new Error('Failed to fetch analytics events')
  }
  const data = await response.json()
  return data.events || []
}

// Create analytics event
async function createAnalyticsEvent(event: {
  eventType: string
  eventName: string
  path: string
  metadata?: any
}): Promise<AnalyticsEvent> {
  const response = await fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  })
  if (!response.ok) {
    throw new Error('Failed to create analytics event')
  }
  return response.json()
}

// Hooks

/**
 * Hook to fetch analytics metrics with optional date range
 */
export function useAnalyticsMetrics(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'metrics', startDate, endDate],
    queryFn: () => fetchAnalyticsMetrics(startDate, endDate),
    // Refetch every 30 seconds for real-time updates
    refetchInterval: 30000,
  })
}

/**
 * Hook to fetch analytics events with filters
 */
export function useAnalyticsEvents(params: EventsQueryParams = {}) {
  return useQuery({
    queryKey: ['analytics', 'events', params],
    queryFn: () => fetchAnalyticsEvents(params),
    // Refetch every 30 seconds for real-time updates
    refetchInterval: 30000,
  })
}

/**
 * Hook to create analytics events
 */
export function useCreateAnalyticsEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAnalyticsEvent,
    onSuccess: () => {
      // Invalidate and refetch analytics queries
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}
