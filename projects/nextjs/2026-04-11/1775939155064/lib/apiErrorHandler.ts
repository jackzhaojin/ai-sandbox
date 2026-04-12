/**
 * API Error Handler Utility
 * 
 * Provides centralized error handling for API calls with user-friendly messages.
 * Features:
 * - Converts technical errors to user-friendly messages
 * - Categorizes errors by type
 * - Handles session expiration
 * - Provides retry recommendations
 */

import { isNetworkError, isTimeoutError } from "./retry"

export type ErrorCategory = 
  | "network"
  | "timeout"
  | "auth"
  | "validation"
  | "server"
  | "not_found"
  | "rate_limit"
  | "unknown"

export interface ApiErrorDetails {
  category: ErrorCategory
  message: string
  technicalMessage: string
  isRetryable: boolean
  shouldReport: boolean
  httpStatus?: number
}

/**
 * User-friendly error messages by category
 */
const userFriendlyMessages: Record<ErrorCategory, string> = {
  network: "Unable to connect to the server. Please check your internet connection and try again.",
  timeout: "The request took too long to complete. Please try again.",
  auth: "Your session has expired. Please sign in again to continue.",
  validation: "Please check your input and try again.",
  server: "Something went wrong on our end. Please try again in a few moments.",
  not_found: "The requested resource was not found. It may have been moved or deleted.",
  rate_limit: "Too many requests. Please wait a moment before trying again.",
  unknown: "An unexpected error occurred. Please try again.",
}

/**
 * Categorize an error based on its properties
 */
export function categorizeError(error: unknown): ErrorCategory {
  // Check for network errors
  if (isNetworkError(error)) {
    return "network"
  }

  // Check for timeout errors
  if (isTimeoutError(error)) {
    return "timeout"
  }

  // Check for HTTP status codes
  if (error instanceof Response) {
    switch (error.status) {
      case 401:
      case 403:
        return "auth"
      case 404:
        return "not_found"
      case 422:
      case 400:
        return "validation"
      case 429:
        return "rate_limit"
      case 500:
      case 502:
      case 503:
      case 504:
        return "server"
      default:
        return error.status >= 500 ? "server" : "unknown"
    }
  }

  // Check error messages for common patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    if (message.includes("unauthorized") || message.includes("401") || message.includes("403")) {
      return "auth"
    }
    if (message.includes("not found") || message.includes("404")) {
      return "not_found"
    }
    if (message.includes("validation") || message.includes("invalid") || message.includes("422")) {
      return "validation"
    }
    if (message.includes("rate limit") || message.includes("429") || message.includes("too many")) {
      return "rate_limit"
    }
    if (message.includes("server error") || message.includes("500") || message.includes("502") || message.includes("503")) {
      return "server"
    }
  }

  return "unknown"
}

/**
 * Check if an error type is retryable
 */
export function isRetryableError(category: ErrorCategory): boolean {
  const retryableCategories: ErrorCategory[] = [
    "network",
    "timeout",
    "server",
    "rate_limit",
  ]
  return retryableCategories.includes(category)
}

/**
 * Check if an error should be reported to error tracking
 */
export function shouldReportError(category: ErrorCategory): boolean {
  const reportCategories: ErrorCategory[] = [
    "server",
    "unknown",
  ]
  return reportCategories.includes(category)
}

/**
 * Extract HTTP status code from error
 */
export function extractStatusCode(error: unknown): number | undefined {
  if (error instanceof Response) {
    return error.status
  }
  
  if (error instanceof Error) {
    const match = error.message.match(/\b(\d{3})\b/)
    if (match) {
      const code = parseInt(match[1], 10)
      if (code >= 200 && code < 600) {
        return code
      }
    }
  }
  
  return undefined
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(category: ErrorCategory, customMessage?: string): string {
  return customMessage || userFriendlyMessages[category]
}

/**
 * Process an API error and return detailed information
 */
export function handleApiError(error: unknown, customMessage?: string): ApiErrorDetails {
  const category = categorizeError(error)
  const httpStatus = extractStatusCode(error)
  
  let technicalMessage = "Unknown error"
  if (error instanceof Error) {
    technicalMessage = error.message
  } else if (typeof error === "string") {
    technicalMessage = error
  } else if (error instanceof Response) {
    technicalMessage = `HTTP ${error.status}: ${error.statusText}`
  }

  return {
    category,
    message: getUserFriendlyMessage(category, customMessage),
    technicalMessage,
    isRetryable: isRetryableError(category),
    shouldReport: shouldReportError(category),
    httpStatus,
  }
}

/**
 * Async version that attempts to parse JSON error responses
 */
export async function handleApiErrorAsync(
  error: unknown,
  response?: Response
): Promise<ApiErrorDetails> {
  let customMessage: string | undefined

  // Try to parse error response body
  if (response) {
    try {
      const data = await response.json()
      if (data.error) {
        customMessage = data.error
      } else if (data.message) {
        customMessage = data.message
      } else if (Array.isArray(data.errors) && data.errors.length > 0) {
        customMessage = data.errors.map((e: { message?: string }) => e.message || String(e)).join(". ")
      }
    } catch {
      // Failed to parse JSON, use default handling
    }
  }

  return handleApiError(error, customMessage)
}

/**
 * Higher-order function to wrap API calls with error handling
 */
export function withErrorHandling<T, R>(
  apiCall: (args: T) => Promise<R>,
  options: {
    onError?: (details: ApiErrorDetails) => void
    transformError?: (details: ApiErrorDetails) => Error
  } = {}
): (args: T) => Promise<R> {
  return async (args: T) => {
    try {
      return await apiCall(args)
    } catch (error) {
      const details = handleApiError(error)
      
      options.onError?.(details)
      
      if (options.transformError) {
        throw options.transformError(details)
      }
      
      // Create a new error with user-friendly message
      const userError = new Error(details.message)
      ;(userError as Error & { details: ApiErrorDetails }).details = details
      throw userError
    }
  }
}

/**
 * Create a fetch wrapper with automatic error handling
 */
export function createHandledFetch(
  baseOptions: RequestInit = {},
  errorOptions: {
    onError?: (details: ApiErrorDetails) => void
  } = {}
) {
  return async function handledFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    try {
      const response = await fetch(input, {
        ...baseOptions,
        ...init,
        headers: {
          ...baseOptions.headers,
          ...init?.headers,
        },
      })

      if (!response.ok) {
        const details = await handleApiErrorAsync(response, response)
        errorOptions.onError?.(details)
        
        const error = new Error(details.message)
        throw error
      }

      return response
    } catch (error) {
      if (error instanceof Error && error.message.includes("fetch")) {
        const details = handleApiError(error)
        errorOptions.onError?.(details)
        throw new Error(details.message)
      }
      throw error
    }
  }
}

/**
 * Session expired checker
 */
export function isSessionExpiredError(error: unknown): boolean {
  const details = handleApiError(error)
  return details.category === "auth" && details.httpStatus === 401
}

/**
 * Redirect to login helper
 */
export function redirectToLogin(returnUrl?: string) {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams()
    if (returnUrl) {
      params.set("returnUrl", returnUrl)
    }
    const query = params.toString()
    window.location.href = `/login${query ? `?${query}` : ""}`
  }
}

/**
 * Error messages for specific API endpoints
 */
export const endpointErrorMessages: Record<string, Partial<Record<ErrorCategory, string>>> = {
  "/api/shipments": {
    validation: "Please check your shipment details and try again.",
    server: "Unable to save your shipment. Please try again.",
  },
  "/api/quote": {
    server: "Unable to calculate shipping rates. Please try again.",
    timeout: "Rate calculation is taking longer than expected. Please try again.",
  },
  "/api/shipments/{id}/payment": {
    validation: "Please check your payment information and try again.",
    server: "Unable to save payment details. Please try again.",
  },
  "/api/shipments/{id}/pickup": {
    validation: "Please check your pickup details and try again.",
    server: "Unable to schedule pickup. Please try again.",
  },
  "/api/shipments/{id}/submit": {
    validation: "Please review your shipment details before submitting.",
    server: "Unable to submit your shipment. Please try again.",
  },
}

/**
 * Get context-specific error message
 */
export function getEndpointErrorMessage(
  endpoint: string,
  category: ErrorCategory
): string | undefined {
  // Try exact match first
  const exactMatch = endpointErrorMessages[endpoint]?.[category]
  if (exactMatch) return exactMatch

  // Try pattern matching for dynamic endpoints
  for (const [pattern, messages] of Object.entries(endpointErrorMessages)) {
    // Convert pattern to regex (e.g., "/api/shipments/{id}/payment" -> "/api/shipments/[^/]+/payment")
    const regexPattern = pattern.replace(/\{[^}]+\}/g, "[^/]+")
    const regex = new RegExp(`^${regexPattern}$`)
    
    if (regex.test(endpoint)) {
      return messages[category]
    }
  }

  return undefined
}
