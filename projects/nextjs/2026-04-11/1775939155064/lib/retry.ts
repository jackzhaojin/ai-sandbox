/**
 * Retry Logic Utility
 * 
 * Provides exponential backoff retry functionality for async operations.
 * Features:
 * - Configurable max retries and delay
 * - Exponential backoff with jitter
 * - Network error detection
 * - Abort signal support
 * - Retry callback for progress tracking
 */

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  jitter?: boolean
  retryOnNetworkError?: boolean
  retryOnTimeout?: boolean
  shouldRetry?: (error: unknown, attempt: number) => boolean
  onRetry?: (error: unknown, attempt: number, nextDelay: number) => void
  signal?: AbortSignal
}

export interface RetryResult<T> {
  result: T
  attempts: number
  totalDelay: number
}

export class RetryExhaustedError extends Error {
  constructor(
    message: string,
    public readonly cause: unknown,
    public readonly attempts: number,
    public readonly totalDelay: number
  ) {
    super(message)
    this.name = "RetryExhaustedError"
  }
}

/**
 * Check if an error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    // Common network errors
    const message = error.message.toLowerCase()
    return (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("internet") ||
      message.includes("offline") ||
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("connection") ||
      message.includes("econnrefused") ||
      message.includes("enotfound") ||
      message.includes("etimedout") ||
      message.includes("econnreset")
    )
  }
  return false
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes("timeout") ||
      message.includes("timed out") ||
      message.includes("etimedout")
    )
  }
  return false
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
  useJitter: boolean
): number {
  // Calculate base delay with exponential backoff
  let delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1)
  
  // Cap at max delay
  delay = Math.min(delay, maxDelay)
  
  // Add jitter to prevent thundering herd
  if (useJitter) {
    // Random factor between 0.5 and 1.5
    const jitterFactor = 0.5 + Math.random()
    delay = delay * jitterFactor
  }
  
  return Math.round(delay)
}

/**
 * Sleep for a given duration
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      resolve()
    }, ms)
    
    const cleanup = () => {
      clearTimeout(timeout)
      signal?.removeEventListener("abort", onAbort)
    }
    
    const onAbort = () => {
      cleanup()
      reject(new Error("Retry aborted"))
    }
    
    signal?.addEventListener("abort", onAbort)
  })
}

/**
 * Retry an async operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
    retryOnNetworkError = true,
    retryOnTimeout = true,
    shouldRetry,
    onRetry,
    signal,
  } = options

  let lastError: unknown
  let totalDelay = 0

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    // Check if aborted before attempting
    if (signal?.aborted) {
      throw new Error("Retry aborted")
    }

    try {
      const result = await operation()
      return {
        result,
        attempts: attempt,
        totalDelay,
      }
    } catch (error) {
      lastError = error

      // Check if this is the last attempt
      if (attempt > maxRetries) {
        break
      }

      // Determine if we should retry
      let shouldRetryThisError = true

      if (shouldRetry) {
        shouldRetryThisError = shouldRetry(error, attempt)
      } else {
        // Default retry logic
        if (!retryOnNetworkError && isNetworkError(error)) {
          shouldRetryThisError = false
        }
        if (!retryOnTimeout && isTimeoutError(error)) {
          shouldRetryThisError = false
        }
      }

      if (!shouldRetryThisError) {
        throw error
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(
        attempt,
        initialDelay,
        maxDelay,
        backoffMultiplier,
        jitter
      )

      totalDelay += delay

      // Notify callback
      onRetry?.(error, attempt, delay)

      // Wait before retrying
      await sleep(delay, signal)
    }
  }

  // All retries exhausted
  throw new RetryExhaustedError(
    `Operation failed after ${maxRetries + 1} attempts`,
    lastError,
    maxRetries + 1,
    totalDelay
  )
}

/**
 * Hook-friendly retry wrapper that returns state
 */
export interface UseRetryState<T> {
  data: T | null
  isLoading: boolean
  isRetrying: boolean
  error: unknown
  retryCount: number
  execute: () => Promise<void>
  reset: () => void
}

/**
 * Create a retry-aware fetch function
 */
export function createRetryFetch(options: RetryOptions = {}) {
  return async function retryFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const { result } = await withRetry(
      async () => {
        const response = await fetch(input, init)
        
        // Retry on 5xx errors and 429 (rate limit)
        if (response.status >= 500 || response.status === 429) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
          throw error
        }
        
        return response
      },
      {
        ...options,
        shouldRetry: (error) => {
          // Don't retry 4xx errors (except 429)
          if (error instanceof Error) {
            const match = error.message.match(/HTTP (\d+)/)
            if (match) {
              const status = parseInt(match[1], 10)
              if (status >= 400 && status < 500 && status !== 429) {
                return false
              }
            }
          }
          return true
        },
      }
    )
    
    return result
  }
}

/**
 * Default retry fetch with sensible defaults
 */
export const retryFetch = createRetryFetch({
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  jitter: true,
})

/**
 * Utility to wrap an existing function with retry logic
 */
export function withRetryWrapper<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: RetryOptions = {}
): (...args: Parameters<T>) => Promise<RetryResult<Awaited<ReturnType<T>>>> {
  return (...args: Parameters<T>) => withRetry(async () => fn(...args) as Awaited<ReturnType<T>>, options)
}
