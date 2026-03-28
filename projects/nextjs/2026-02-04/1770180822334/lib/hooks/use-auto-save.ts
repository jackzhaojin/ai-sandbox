import { useEffect, useRef, useState } from 'react'

interface UseAutoSaveOptions {
  data: any
  onSave: (data: any) => Promise<void>
  interval?: number // in milliseconds, default 30000 (30 seconds)
  enabled?: boolean
  storageKey?: string // for localStorage backup
}

interface UseAutoSaveReturn {
  isSaving: boolean
  lastSaved: Date | null
  error: Error | null
  saveNow: () => Promise<void>
}

export function useAutoSave({
  data,
  onSave,
  interval = 30000, // 30 seconds
  enabled = true,
  storageKey,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const previousDataRef = useRef<any>(null)
  const isMountedRef = useRef(true)

  // Save to localStorage as backup
  useEffect(() => {
    if (storageKey && data) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          data,
          timestamp: new Date().toISOString(),
        }))
      } catch (err) {
        console.error('Failed to save to localStorage:', err)
      }
    }
  }, [data, storageKey])

  const saveNow = async () => {
    if (!enabled || isSaving) return

    try {
      setIsSaving(true)
      setError(null)
      await onSave(data)

      if (isMountedRef.current) {
        setLastSaved(new Date())
        previousDataRef.current = data
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Save failed'))
      }
      console.error('Auto-save error:', err)
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false)
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Only auto-save if data has changed
    if (previousDataRef.current !== null &&
        JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return
    }

    // Set new timer
    timerRef.current = setTimeout(() => {
      saveNow()
    }, interval)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [data, enabled, interval])

  return {
    isSaving,
    lastSaved,
    error,
    saveNow,
  }
}
