"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface LiveRegionProps {
  /** The message to announce */
  message?: string
  /** Priority of the announcement */
  priority?: "polite" | "assertive"
  /** Whether the message should be atomic (read as a whole) */
  atomic?: boolean
  /** Whether to clear the message after announcement */
  clearAfter?: number
  /** Additional CSS classes */
  className?: string
  /** Relevant aria-controls ID */
  controls?: string
}

/**
 * LiveRegion - ARIA live region for announcing dynamic content changes
 * 
 * WCAG 2.1 AA Requirement: 4.1.3 Status Messages
 * - Status messages are announced by assistive technologies without moving focus
 * 
 * Use cases:
 * - Loading states ("Loading quotes...")
 * - Success messages ("Shipment created successfully")
 * - Error summaries ("Please fix 3 errors")
 * - Progress updates ("Step 2 of 5 completed")
 * 
 * @example
 * // For loading states
 * <LiveRegion 
 *   message={isLoading ? "Loading shipping quotes..." : ""}
 *   priority="polite"
 * />
 * 
 * // For error announcements
 * <LiveRegion 
 *   message={error ? `Error: ${error.message}` : ""}
 *   priority="assertive"
 *   atomic
 * />
 * 
 * // For progress updates
 * <LiveRegion 
 *   message={`Step ${currentStep} of ${totalSteps}: ${stepName}`}
 *   priority="polite"
 * />
 */
export function LiveRegion({
  message,
  priority = "polite",
  atomic = true,
  clearAfter,
  className,
  controls,
}: LiveRegionProps) {
  const [currentMessage, setCurrentMessage] = React.useState(message)

  React.useEffect(() => {
    if (message) {
      setCurrentMessage(message)
      
      if (clearAfter) {
        const timer = setTimeout(() => {
          setCurrentMessage("")
        }, clearAfter)
        return () => clearTimeout(timer)
      }
    }
  }, [message, clearAfter])

  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant="additions text"
      aria-controls={controls}
      className={cn("sr-only", className)}
      role={priority === "assertive" ? "alert" : "status"}
    >
      {currentMessage}
    </div>
  )
}

export interface LoadingAnnouncementProps {
  /** Whether content is loading */
  isLoading: boolean
  /** Loading message */
  loadingMessage?: string
  /** Success message when loading completes */
  successMessage?: string
  /** Error message if loading fails */
  errorMessage?: string
  /** Current status */
  status?: "idle" | "loading" | "success" | "error"
}

/**
 * LoadingAnnouncement - Announces loading states to screen readers
 * 
 * @example
 * <LoadingAnnouncement 
 *   isLoading={isFetching}
 *   loadingMessage="Fetching shipping quotes..."
 *   successMessage="Quotes loaded successfully"
 * />
 */
export function LoadingAnnouncement({
  isLoading,
  loadingMessage = "Loading...",
  successMessage = "Content loaded successfully",
  errorMessage,
  status = isLoading ? "loading" : "idle",
}: LoadingAnnouncementProps) {
  const getMessage = () => {
    switch (status) {
      case "loading":
        return loadingMessage
      case "success":
        return successMessage
      case "error":
        return errorMessage || ""
      default:
        return ""
    }
  }

  return (
    <LiveRegion
      message={getMessage()}
      priority={status === "error" ? "assertive" : "polite"}
    />
  )
}

export interface FormValidationAnnouncementProps {
  /** Number of errors */
  errorCount: number
  /** Whether the form was just submitted */
  wasSubmitted: boolean
  /** Custom error message */
  errorMessage?: string
}

/**
 * FormValidationAnnouncement - Announces form validation errors
 * 
 * WCAG 2.1 AA Requirement: 3.3.1 Error Identification
 * - Errors are identified and described in text
 * 
 * @example
 * <FormValidationAnnouncement 
 *   errorCount={Object.keys(errors).length}
 *   wasSubmitted={isSubmitting}
 * />
 */
export function FormValidationAnnouncement({
  errorCount,
  wasSubmitted,
  errorMessage,
}: FormValidationAnnouncementProps) {
  const [announced, setAnnounced] = React.useState(false)

  React.useEffect(() => {
    if (wasSubmitted && errorCount > 0 && !announced) {
      setAnnounced(true)
    } else if (!wasSubmitted) {
      setAnnounced(false)
    }
  }, [wasSubmitted, errorCount, announced])

  const message = React.useMemo(() => {
    if (!wasSubmitted || errorCount === 0) return ""
    
    if (errorMessage) return errorMessage
    
    return `Form submission failed. ${errorCount} error${errorCount !== 1 ? "s" : ""} found. Please review and fix ${errorCount !== 1 ? "them" : "it"} before submitting again.`
  }, [wasSubmitted, errorCount, errorMessage])

  return (
    <LiveRegion
      message={message}
      priority="assertive"
      atomic
    />
  )
}

export default LiveRegion
