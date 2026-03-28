'use client'

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

interface TrackEventOptions {
  eventType: string
  eventName: string
  path?: string
  metadata?: Record<string, any>
}

export function useAnalytics() {
  const pathname = usePathname()

  // Track page views automatically
  useEffect(() => {
    trackPageView()
  }, [pathname])

  const trackPageView = useCallback(() => {
    trackEvent({
      eventType: 'page_view',
      eventName: `View: ${pathname}`,
      path: pathname
    })
  }, [pathname])

  const trackEvent = useCallback(async (options: TrackEventOptions) => {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })
    } catch (error) {
      // Silent failure - don't disrupt user experience
      console.error('Analytics tracking error:', error)
    }
  }, [])

  const trackClick = useCallback((elementName: string, metadata?: Record<string, any>) => {
    trackEvent({
      eventType: 'click',
      eventName: elementName,
      path: pathname,
      metadata
    })
  }, [pathname, trackEvent])

  const trackFormSubmit = useCallback((formName: string, metadata?: Record<string, any>) => {
    trackEvent({
      eventType: 'form_submit',
      eventName: formName,
      path: pathname,
      metadata
    })
  }, [pathname, trackEvent])

  const trackCustom = useCallback((eventName: string, metadata?: Record<string, any>) => {
    trackEvent({
      eventType: 'custom',
      eventName,
      path: pathname,
      metadata
    })
  }, [pathname, trackEvent])

  return {
    trackEvent,
    trackClick,
    trackFormSubmit,
    trackCustom,
    trackPageView
  }
}
