"use client"

import { AlertCircle, AlertTriangle, XCircle, RefreshCw, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

type ErrorSeverity = "error" | "warning" | "info"

interface ErrorAlertProps {
  title?: string
  message: string
  severity?: ErrorSeverity
  onRetry?: () => void
  onDismiss?: () => void
  retryLabel?: string
  className?: string
  retryCount?: number
  maxRetries?: number
}

const severityConfig = {
  error: {
    icon: XCircle,
    containerClass: "bg-red-50 border-red-200",
    iconClass: "text-red-600",
    titleClass: "text-red-800",
    messageClass: "text-red-700",
    buttonClass: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: AlertTriangle,
    containerClass: "bg-yellow-50 border-yellow-200",
    iconClass: "text-yellow-600",
    titleClass: "text-yellow-800",
    messageClass: "text-yellow-700",
    buttonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
  },
  info: {
    icon: AlertCircle,
    containerClass: "bg-blue-50 border-blue-200",
    iconClass: "text-blue-600",
    titleClass: "text-blue-800",
    messageClass: "text-blue-700",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
}

/**
 * ErrorAlert Component
 * 
 * Displays error messages with consistent styling and optional retry functionality.
 * Features:
 * - Multiple severity levels (error, warning, info)
 * - Optional retry button with loading state
 * - Dismissible alerts
 * - Accessible with proper ARIA attributes
 * - Shows retry count if applicable
 */
export function ErrorAlert({
  title,
  message,
  severity = "error",
  onRetry,
  onDismiss,
  retryLabel = "Try Again",
  className,
  retryCount = 0,
  maxRetries = 3,
}: ErrorAlertProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const config = severityConfig[severity]
  const Icon = config.icon

  const handleRetry = async () => {
    if (!onRetry) return
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  const showRetryCount = retryCount > 0 && maxRetries > 0

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        config.containerClass,
        className
      )}
      role="alert"
      aria-live={severity === "error" ? "assertive" : "polite"}
    >
      <div className="flex gap-3">
        <Icon
          className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconClass)}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={cn("text-sm font-semibold mb-1", config.titleClass)}>
              {title}
            </h3>
          )}
          <p className={cn("text-sm", config.messageClass)}>
            {message}
          </p>

          {/* Retry section */}
          {(onRetry || showRetryCount) && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              {onRetry && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    config.buttonClass,
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isRetrying && "animate-spin")}
                    aria-hidden="true"
                  />
                  {isRetrying ? "Retrying..." : retryLabel}
                </button>
              )}

              {showRetryCount && (
                <span className={cn("text-xs", config.messageClass)}>
                  Attempt {retryCount} of {maxRetries}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              "flex-shrink-0 p-1 rounded-md transition-colors",
              "hover:bg-black/5",
              config.messageClass
            )}
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * NetworkErrorAlert Component
 * 
 * Specialized error alert for network connectivity issues.
 */
interface NetworkErrorAlertProps {
  onRetry?: () => void
  className?: string
}

export function NetworkErrorAlert({ onRetry, className }: NetworkErrorAlertProps) {
  return (
    <ErrorAlert
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      severity="error"
      onRetry={onRetry}
      retryLabel="Retry Connection"
      className={className}
    />
  )
}

/**
 * ApiErrorAlert Component
 * 
 * Converts API error responses to user-friendly messages.
 */
interface ApiErrorAlertProps {
  error: unknown
  onRetry?: () => void
  className?: string
}

export function ApiErrorAlert({ error, onRetry, className }: ApiErrorAlertProps) {
  let title = "Error"
  let message = "An unexpected error occurred. Please try again."
  let severity: ErrorSeverity = "error"

  if (error instanceof Error) {
    message = error.message

    // Categorize common errors
    if (message.includes("network") || message.includes("fetch") || message.includes("ECONNREFUSED")) {
      title = "Connection Error"
      message = "Unable to connect to the server. Please check your internet connection and try again."
    } else if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
      title = "Request Timeout"
      message = "The request took too long to complete. Please try again."
      severity = "warning"
    } else if (message.includes("unauthorized") || message.includes("401")) {
      title = "Session Expired"
      message = "Your session has expired. Please refresh the page and try again."
    } else if (message.includes("validation")) {
      title = "Validation Error"
      message = "Please check your input and try again."
      severity = "warning"
    }
  } else if (typeof error === "string") {
    message = error
  }

  return (
    <ErrorAlert
      title={title}
      message={message}
      severity={severity}
      onRetry={onRetry}
      className={className}
    />
  )
}

/**
 * ErrorSummary Component
 * 
 * Displays multiple errors in a summary format.
 */
interface ErrorSummaryProps {
  errors: string[]
  onRetry?: () => void
  className?: string
}

export function ErrorSummary({ errors, onRetry, className }: ErrorSummaryProps) {
  if (errors.length === 0) return null

  return (
    <ErrorAlert
      title={`${errors.length} Error${errors.length > 1 ? "s" : ""} Occurred`}
      message={
        <ul className="list-disc list-inside space-y-1 mt-2">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      }
      severity="error"
      onRetry={onRetry}
      className={className}
    />
  )
}
