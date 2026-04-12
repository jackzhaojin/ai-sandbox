"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { withRetry, RetryOptions, RetryResult } from "./retry"
import { handleApiError, ApiErrorDetails } from "./apiErrorHandler"

// Debounce hook for address autocomplete
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// Address autocomplete hook
interface AddressSuggestion {
  id: string
  street: string
  suite?: string
  city: string
  state: string
  zip: string
  country: string
  is_residential: boolean
  location_type: 'residential' | 'commercial' | 'mixed_use'
  confidence: number
}

interface UseAddressAutocompleteOptions {
  minLength?: number
  debounceMs?: number
}

export function useAddressAutocomplete(options: UseAddressAutocompleteOptions = {}) {
  const { minLength = 3, debounceMs = 300 } = options
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, debounceMs)

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < minLength) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/address-search?q=${encodeURIComponent(debouncedQuery)}`
        )

        if (!response.ok) {
          throw new Error("Failed to fetch address suggestions")
        }

        const data = await response.json()
        setSuggestions(data.suggestions || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery, minLength])

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
  }
}

// Form field focus/blur tracking for validation timing
export function useFieldValidation() {
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [blurredFields, setBlurredFields] = useState<Set<string>>(new Set())

  const touchField = useCallback((fieldName: string) => {
    setTouchedFields((prev) => new Set(prev).add(fieldName))
  }, [])

  const blurField = useCallback((fieldName: string) => {
    setBlurredFields((prev) => new Set(prev).add(fieldName))
  }, [])

  const isFieldTouched = useCallback(
    (fieldName: string) => touchedFields.has(fieldName),
    [touchedFields]
  )

  const isFieldBlurred = useCallback(
    (fieldName: string) => blurredFields.has(fieldName),
    [blurredFields]
  )

  const shouldShowError = useCallback(
    (fieldName: string, hasError: boolean) => {
      return hasError && (isFieldTouched(fieldName) || isFieldBlurred(fieldName))
    },
    [isFieldTouched, isFieldBlurred]
  )

  return {
    touchField,
    blurField,
    isFieldTouched,
    isFieldBlurred,
    shouldShowError,
  }
}

// ============================================================================
// Loading State Hooks
// ============================================================================

interface UseAsyncState<T> {
  data: T | null
  isLoading: boolean
  isRetrying: boolean
  error: string | null
  errorDetails: ApiErrorDetails | null
  retryCount: number
  execute: (...args: unknown[]) => Promise<void>
  reset: () => void
  retry: () => void
}

/**
 * useAsync Hook
 * 
 * Manages async operation state with built-in error handling and retry support.
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  options: {
    immediate?: boolean
    retryOptions?: RetryOptions
    onSuccess?: (data: T) => void
    onError?: (error: ApiErrorDetails) => void
  } = {}
): UseAsyncState<T> {
  const { immediate = false, retryOptions, onSuccess, onError } = options
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<ApiErrorDetails | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  
  const asyncFunctionRef = useRef(asyncFunction)
  asyncFunctionRef.current = asyncFunction

  const execute = useCallback(async () => {
    setIsLoading(true)
    setIsRetrying(retryCount > 0)
    setError(null)
    setErrorDetails(null)

    try {
      let result: T

      if (retryOptions) {
        const retryResult: RetryResult<T> = await withRetry(
          () => asyncFunctionRef.current(),
          {
            ...retryOptions,
            onRetry: (err, attempt, delay) => {
              setRetryCount(attempt)
              retryOptions.onRetry?.(err, attempt, delay)
            },
          }
        )
        result = retryResult.result
      } else {
        result = await asyncFunctionRef.current()
      }

      setData(result)
      setRetryCount(0)
      onSuccess?.(result)
    } catch (err) {
      const details = handleApiError(err)
      setError(details.message)
      setErrorDetails(details)
      onError?.(details)
    } finally {
      setIsLoading(false)
      setIsRetrying(false)
    }
  }, [retryOptions, onSuccess, onError, retryCount])

  const reset = useCallback(() => {
    setData(null)
    setIsLoading(false)
    setIsRetrying(false)
    setError(null)
    setErrorDetails(null)
    setRetryCount(0)
  }, [])

  const retry = useCallback(() => {
    setRetryCount((prev) => prev + 1)
  }, [])

  // Execute on mount if immediate is true
  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, execute])

  // Retry when retryCount changes
  useEffect(() => {
    if (retryCount > 0) {
      execute()
    }
  }, [retryCount, execute])

  return {
    data,
    isLoading,
    isRetrying,
    error,
    errorDetails,
    retryCount,
    execute,
    reset,
    retry,
  }
}

/**
 * useLoadingState Hook
 * 
 * Simple hook for managing loading states with timeout detection.
 */
interface UseLoadingStateOptions {
  timeout?: number
  onTimeout?: () => void
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const { timeout, onTimeout } = options
  const [isLoading, setIsLoading] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const startLoading = useCallback(() => {
    setIsLoading(true)
    setStartTime(Date.now())

    if (timeout) {
      timeoutRef.current = setTimeout(() => {
        onTimeout?.()
      }, timeout)
    }
  }, [timeout, onTimeout])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
    setStartTime(null)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const getElapsedTime = useCallback(() => {
    if (!startTime) return 0
    return Date.now() - startTime
  }, [startTime])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isLoading,
    startLoading,
    stopLoading,
    getElapsedTime,
  }
}

/**
 * useOptimistic Hook
 * 
 * Implements optimistic UI updates with automatic rollback on error.
 */
export function useOptimistic<T>(
  initialValue: T,
  updateFunction: (value: T) => Promise<void>,
  options: {
    onError?: (error: unknown, rolledBackValue: T) => void
    onSuccess?: () => void
  } = {}
) {
  const [value, setValue] = useState<T>(initialValue)
  const [pendingValue, setPendingValue] = useState<T | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const optimisticUpdate = useCallback(async (newValue: T) => {
    const previousValue = value
    
    // Optimistically update UI
    setValue(newValue)
    setPendingValue(newValue)
    setIsPending(true)
    setError(null)

    try {
      await updateFunction(newValue)
      setPendingValue(null)
      options.onSuccess?.()
    } catch (err) {
      // Rollback on error
      setValue(previousValue)
      setError(err)
      options.onError?.(err, previousValue)
    } finally {
      setIsPending(false)
    }
  }, [value, updateFunction, options])

  const reset = useCallback(() => {
    setValue(initialValue)
    setPendingValue(null)
    setIsPending(false)
    setError(null)
  }, [initialValue])

  return {
    value,
    pendingValue,
    isPending,
    error,
    optimisticUpdate,
    reset,
  }
}

/**
 * useFetch Hook
 * 
 * Enhanced fetch hook with automatic retry and error handling.
 */
interface UseFetchOptions extends RetryOptions {
  immediate?: boolean
  onSuccess?: (data: unknown) => void
  onError?: (error: ApiErrorDetails) => void
}

export function useFetch<T>(
  url: string,
  options: UseFetchOptions = {}
) {
  const {
    immediate = true,
    onSuccess,
    onError,
    ...retryOptions
  } = options

  const fetchData = useCallback(async () => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return response.json() as Promise<T>
  }, [url])

  return useAsync(fetchData, {
    immediate,
    retryOptions,
    onSuccess,
    onError,
  })
}

/**
 * useDelayedLoading Hook
 * 
 * Prevents flash of loading state by delaying the loading indicator.
 */
export function useDelayedLoading(
  isLoading: boolean,
  delay: number = 200
): boolean {
  const [showLoading, setShowLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isLoading) {
      timeoutRef.current = setTimeout(() => {
        setShowLoading(true)
      }, delay)
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setShowLoading(false)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isLoading, delay])

  return showLoading
}
