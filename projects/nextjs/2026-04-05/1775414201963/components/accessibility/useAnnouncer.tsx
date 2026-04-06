"use client"

import * as React from "react"

export interface UseAnnouncerOptions {
  /** Delay before announcing (ms) */
  delay?: number
  /** Whether to clear previous announcements */
  clearOnUnmount?: boolean
}

export interface UseAnnouncerReturn {
  /** Announce a message politely (non-urgent) */
  announcePolite: (message: string) => void
  /** Announce a message assertively (urgent) */
  announceAssertive: (message: string) => void
  /** Clear all announcements */
  clear: () => void
}

/**
 * Hook for announcing messages to screen readers
 * 
 * WCAG 2.1 AA Requirement: 4.1.3 Status Messages
 * - Ensures status messages are announced without moving focus
 * 
 * @example
 * const { announcePolite, announceAssertive } = useAnnouncer()
 * 
 * // After loading data
 * announcePolite("Shipping quotes loaded successfully")
 * 
 * // On error
 * announceAssertive("Error: Please fix the form errors before continuing")
 */
export function useAnnouncer(options: UseAnnouncerOptions = {}): UseAnnouncerReturn {
  const { delay = 0 } = options
  const [announcements, setAnnouncements] = React.useState<
    Array<{ id: string; message: string; priority: "polite" | "assertive" }>
  >([])

  const generateId = () =>
    `announce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const announce = React.useCallback(
    (message: string, priority: "polite" | "assertive") => {
      const id = generateId()
      
      const addAnnouncement = () => {
        setAnnouncements((prev) => [...prev, { id, message, priority }])
        
        // Remove announcement after it's been read
        setTimeout(() => {
          setAnnouncements((prev) => prev.filter((a) => a.id !== id))
        }, 1000)
      }

      if (delay > 0) {
        setTimeout(addAnnouncement, delay)
      } else {
        addAnnouncement()
      }
    },
    [delay]
  )

  const announcePolite = React.useCallback(
    (message: string) => announce(message, "polite"),
    [announce]
  )

  const announceAssertive = React.useCallback(
    (message: string) => announce(message, "assertive"),
    [announce]
  )

  const clear = React.useCallback(() => {
    setAnnouncements([])
  }, [])

  // Cleanup on unmount if requested
  React.useEffect(() => {
    return () => {
      if (options.clearOnUnmount) {
        clear()
      }
    }
  }, [options.clearOnUnmount, clear])

  // Return the announcer component along with methods
  return {
    announcePolite,
    announceAssertive,
    clear,
  }
}

/**
 * Announcer component that renders ARIA live regions
 * Use this alongside useAnnouncer to display the announcements
 */
export function Announcer({
  announcements,
}: {
  announcements: Array<{ id: string; message: string; priority: "polite" | "assertive" }>
}) {
  const politeAnnouncements = announcements.filter((a) => a.priority === "polite")
  const assertiveAnnouncements = announcements.filter((a) => a.priority === "assertive")

  return (
    <>
      {/* Assertive announcements - interrupt current speech */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      >
        {assertiveAnnouncements.map((a) => (
          <span key={a.id}>{a.message}</span>
        ))}
      </div>
      
      {/* Polite announcements - wait for current speech to finish */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {politeAnnouncements.map((a) => (
          <span key={a.id}>{a.message}</span>
        ))}
      </div>
    </>
  )
}

export default useAnnouncer
