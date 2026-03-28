'use client'

import { useEffect, useState } from 'react'

export type AriaLivePriority = 'polite' | 'assertive' | 'off'

interface AriaLiveProps {
  message: string
  priority?: AriaLivePriority
  clearOnAnnounce?: boolean
  clearDelay?: number
}

/**
 * AriaLive - Screen reader announcement component
 *
 * Provides live region for screen reader announcements.
 * WCAG 2.1 AA compliant.
 *
 * @param message - The message to announce to screen readers
 * @param priority - 'polite' (default) waits for pause, 'assertive' interrupts
 * @param clearOnAnnounce - Whether to clear message after announcing
 * @param clearDelay - Delay in ms before clearing (default 1000)
 */
export function AriaLive({
  message,
  priority = 'polite',
  clearOnAnnounce = true,
  clearDelay = 1000,
}: AriaLiveProps) {
  const [currentMessage, setCurrentMessage] = useState('')

  useEffect(() => {
    if (message) {
      setCurrentMessage(message)

      if (clearOnAnnounce) {
        const timer = setTimeout(() => {
          setCurrentMessage('')
        }, clearDelay)

        return () => clearTimeout(timer)
      }
    }
  }, [message, clearOnAnnounce, clearDelay])

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {currentMessage}
    </div>
  )
}

/**
 * Hook for managing aria-live announcements
 *
 * Usage:
 * ```tsx
 * const { announce, LiveRegion } = useAriaAnnounce()
 *
 * // Announce a message
 * announce('Page saved successfully')
 *
 * // Render the live region
 * <LiveRegion />
 * ```
 */
export function useAriaAnnounce(priority: AriaLivePriority = 'polite') {
  const [message, setMessage] = useState('')

  const announce = (msg: string) => {
    setMessage(msg)
  }

  const LiveRegion = () => (
    <AriaLive message={message} priority={priority} />
  )

  return { announce, LiveRegion }
}

/**
 * Global status announcer for form submissions, saves, errors, etc.
 * Positioned visually hidden but accessible to screen readers.
 */
export function StatusAnnouncer({
  status,
  error,
}: {
  status?: string
  error?: string
}) {
  return (
    <>
      {/* Success/info messages - polite */}
      {status && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {status}
        </div>
      )}

      {/* Error messages - assertive (interrupts) */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
        >
          Error: {error}
        </div>
      )}
    </>
  )
}
