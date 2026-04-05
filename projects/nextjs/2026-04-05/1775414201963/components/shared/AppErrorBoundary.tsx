"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export interface ErrorBoundaryProps {
  /** Children to render */
  children: React.ReactNode
  /** Fallback UI to render when error occurs */
  fallback?: React.ReactNode
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** Whether to show the default error UI */
  showDefaultUI?: boolean
  /** Additional CSS classes for the default UI */
  className?: string
}

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * ErrorBoundary - Catches JavaScript errors in child components
 * 
 * Displays a user-friendly error message and provides recovery options.
 * 
 * @example
 * <ErrorBoundary onError={logError}>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * <ErrorBoundary fallback={<CustomError />}
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
    
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback, showDefaultUI = true, className } = this.props

    if (!hasError) {
      return children
    }

    if (fallback) {
      return fallback
    }

    if (!showDefaultUI) {
      return null
    }

    return (
      <div className={cn("flex min-h-[400px] items-center justify-center p-4", className)}>
        <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-100">
              <AlertTriangle className="h-8 w-8 text-error-600" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-card-foreground">Something went wrong</h2>
            <p className="mt-2 text-muted-foreground">
              We apologize for the inconvenience. An unexpected error has occurred.
            </p>
          </div>
          
          <div className="mt-6 space-y-6">
            {process.env.NODE_ENV === "development" && error && (
              <div className="rounded-md bg-muted p-4">
                <p className="mb-2 text-sm font-semibold text-error-600">Error Details:</p>
                <pre className="max-h-32 overflow-auto text-xs text-muted-foreground">
                  {error.message}
                  {error.stack && (
                    <>
                      {"\n\n"}
                      {error.stack}
                    </>
                  )}
                </pre>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                variant="ghost"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                If this problem persists, please contact support.
              </p>
              <p className="mt-1 text-xs">
                Error ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

/**
 * ErrorFallback - A simple error fallback component for use with ErrorBoundary
 */
export interface ErrorFallbackProps {
  /** Error that occurred */
  error: Error
  /** Function to reset the error state */
  resetErrorBoundary: () => void
  /** Additional CSS classes */
  className?: string
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  className,
}: ErrorFallbackProps) {
  return (
    <div className={cn("rounded-lg border border-error-200 bg-error-50 p-6", className)}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-error-600" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-error-900">
            Something went wrong
          </h3>
          <p className="mt-1 text-sm text-error-700">
            {error.message || "An unexpected error occurred"}
          </p>
          <Button
            onClick={resetErrorBoundary}
            variant="outline"
            size="sm"
            className="mt-4 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AppErrorBoundary
