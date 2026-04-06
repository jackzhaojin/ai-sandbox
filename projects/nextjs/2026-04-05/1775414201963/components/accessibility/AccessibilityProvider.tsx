"use client"

import * as React from "react"

// Announcement types for screen readers
type AnnouncementPriority = "polite" | "assertive"

interface Announcement {
  id: string
  message: string
  priority: AnnouncementPriority
}

interface AccessibilityContextValue {
  /** Announce a message to screen readers */
  announce: (message: string, priority?: AnnouncementPriority) => void
  /** Clear all announcements */
  clearAnnouncements: () => void
}

const AccessibilityContext = React.createContext<AccessibilityContextValue | undefined>(
  undefined
)

export interface AccessibilityProviderProps {
  children: React.ReactNode
}

/**
 * AccessibilityProvider - Manages ARIA live regions for screen reader announcements
 * 
 * WCAG 2.1 AA Requirements:
 * - 4.1.3 Status Messages: Status messages are announced without moving focus
 * 
 * Features:
 * - Polite announcements (non-urgent updates)
 * - Assertive announcements (urgent alerts)
 * - Automatic cleanup of announcements
 * 
 * @example
 * <AccessibilityProvider>
 *   <App />
 * </AccessibilityProvider>
 * 
 * // In a component:
 * const { announce } = useAccessibility()
 * announce("Quote loaded successfully", "polite")
 * announce("Form submission failed", "assertive")
 */
export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([])

  const announce = React.useCallback(
    (message: string, priority: AnnouncementPriority = "polite") => {
      const id = `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      setAnnouncements((prev) => [...prev, { id, message, priority }])
      
      // Remove announcement after it's been read (sufficient time for screen reader)
      setTimeout(() => {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      }, 1000)
    },
    []
  )

  const clearAnnouncements = React.useCallback(() => {
    setAnnouncements([])
  }, [])

  const value = React.useMemo(
    () => ({ announce, clearAnnouncements }),
    [announce, clearAnnouncements]
  )

  const politeAnnouncements = announcements.filter((a) => a.priority === "polite")
  const assertiveAnnouncements = announcements.filter((a) => a.priority === "assertive")

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* ARIA Live Regions - Visually hidden but announced by screen readers */}
      {/* Assertive region for urgent announcements */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {assertiveAnnouncements.map((a) => (
          <span key={a.id}>{a.message}</span>
        ))}
      </div>
      
      {/* Polite region for non-urgent announcements */}
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
    </AccessibilityContext.Provider>
  )
}

/**
 * Hook to access accessibility context
 */
export function useAccessibility(): AccessibilityContextValue {
  const context = React.useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider"
    )
  }
  return context
}

export default AccessibilityProvider
