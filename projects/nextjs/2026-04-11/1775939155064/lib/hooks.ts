"use client"

import { useState, useEffect, useCallback } from "react"

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
