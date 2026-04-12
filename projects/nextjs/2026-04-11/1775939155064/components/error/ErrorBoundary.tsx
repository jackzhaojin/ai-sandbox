"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: () => void
  resetKeys?: Array<string | number>
  className?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary Component
 * 
 * A React error boundary that catches JavaScript errors in child components.
 * Features:
 * - Catches errors during rendering, lifecycle methods, and constructors
 * - Displays a user-friendly error UI
 * - Provides retry functionality
 * - Logs errors for debugging
 * - Supports custom fallback UI
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  private resetTimeout: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
    }

    // Update state with error info
    this.setState({ errorInfo })

    // Call error handler if provided
    this.props.onError?.(error, errorInfo)

    // Log to error tracking service in production
    if (process.env.NODE_ENV === "production") {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state if resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      )
      if (hasResetKeyChanged) {
        this.handleReset()
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout)
    }
  }

  handleReset = () => {
    this.props.onReset?.()
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleRetry = () => {
    // Clear any pending reset timeout
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout)
    }

    // Attempt to reset
    this.handleReset()

    // If reset fails immediately, show error again after a brief delay
    this.resetTimeout = setTimeout(() => {
      if (this.state.hasError) {
        // Error persists, keep showing error UI
      }
    }, 100)
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback, className } = this.props

    if (!hasError) {
      return children
    }

    // Custom fallback UI
    if (fallback) {
      return fallback
    }

    // Default error UI
    return (
      <DefaultErrorFallback
        error={error}
        onRetry={this.handleRetry}
        onGoBack={() => window.history.back()}
        onGoHome={() => window.location.href = "/"}
        className={className}
      />
    )
  }
}

/**
 * DefaultErrorFallback Component
 * 
 * The default UI displayed when an error is caught.
 */
interface DefaultErrorFallbackProps {
  error: Error | null
  onRetry: () => void
  onGoBack: () => void
  onGoHome: () => void
  className?: string
}

function DefaultErrorFallback({
  error,
  onRetry,
  onGoBack,
  onGoHome,
  className,
}: DefaultErrorFallbackProps) {
  const [isRetrying, setIsRetrying] = React.useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div
      className={cn(
        "min-h-[400px] flex items-center justify-center p-6",
        className
      )}
    >
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden="true" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something Went Wrong
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          We&apos;re sorry, but an unexpected error occurred. 
          Our team has been notified and we&apos;re working to fix it.
        </p>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === "development" && error && (
          <div className="mb-6 text-left">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 overflow-auto max-h-48">
              <p className="text-sm font-medium text-red-800 mb-2">Error Details:</p>
              <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
                {error.message}
              </pre>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer">
                    Stack Trace
                  </summary>
                  <pre className="text-xs text-red-600 mt-2 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={cn("h-4 w-4", isRetrying && "animate-spin")}
              aria-hidden="true"
            />
            {isRetrying ? "Retrying..." : "Try Again"}
          </button>

          <button
            onClick={onGoBack}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Go Back
          </button>

          <button
            onClick={onGoHome}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Go Home
          </button>
        </div>

        {/* Support link */}
        <p className="mt-6 text-sm text-gray-500">
          Still having issues?{" "}
          <a
            href="mailto:support@b2bshipping.com"
            className="text-blue-600 hover:underline"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  )
}

/**
 * withErrorBoundary HOC
 * 
 * Higher-order component that wraps a component with ErrorBoundary.
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || "Component"
  })`

  return WrappedComponent
}

/**
 * useErrorHandler Hook
 * 
 * Hook for programmatically triggering error boundary in functional components.
 * Note: This is a simplified version. In practice, you'd use this with a context
 * or state management solution for cross-component error handling.
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  if (error) {
    throw error
  }

  return setError
}
