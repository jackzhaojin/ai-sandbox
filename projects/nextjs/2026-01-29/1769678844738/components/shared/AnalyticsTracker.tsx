'use client'

import { useAnalytics } from '@/lib/hooks/useAnalytics'

/**
 * Analytics Tracker Component
 *
 * Automatically tracks page views when mounted
 * Add this component to your layout or pages
 */
export function AnalyticsTracker() {
  // Hook automatically tracks page views
  useAnalytics()

  // This component doesn't render anything
  return null
}
