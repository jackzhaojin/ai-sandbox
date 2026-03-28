'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AccessibilityPreferences {
  reduceMotion: boolean
  highContrast: boolean
  largeText: boolean
}

interface AccessibilityPreferencesContext {
  preferences: AccessibilityPreferences
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void
  resetPreferences: () => void
}

const AccessibilityPreferencesContext = createContext<AccessibilityPreferencesContext | null>(null)

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  reduceMotion: false,
  highContrast: false,
  largeText: false,
}

const STORAGE_KEY = 'pageforge-a11y-preferences'

/**
 * Provider for user accessibility preferences
 * Stores preferences in localStorage and applies them globally
 */
export function AccessibilityPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load preferences from localStorage and system preferences on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Load saved preferences
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPreferences(parsed)
      } catch (error) {
        console.error('Failed to load accessibility preferences:', error)
      }
    } else {
      // Check system preferences if no saved preferences
      const systemPrefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const systemPrefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches

      setPreferences({
        ...DEFAULT_PREFERENCES,
        reduceMotion: systemPrefersReducedMotion,
        highContrast: systemPrefersHighContrast,
      })
    }

    setIsInitialized(true)
  }, [])

  // Apply preferences to document
  useEffect(() => {
    if (!isInitialized || typeof document === 'undefined') return

    // Apply reduce motion
    if (preferences.reduceMotion) {
      document.documentElement.classList.add('reduce-motion')
      document.documentElement.style.setProperty('--motion-duration', '0.01ms')
    } else {
      document.documentElement.classList.remove('reduce-motion')
      document.documentElement.style.removeProperty('--motion-duration')
    }

    // Apply high contrast
    if (preferences.highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }

    // Apply large text
    if (preferences.largeText) {
      document.documentElement.classList.add('large-text')
      document.documentElement.style.setProperty('font-size', '120%')
    } else {
      document.documentElement.classList.remove('large-text')
      document.documentElement.style.removeProperty('font-size')
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences, isInitialized])

  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AccessibilityPreferencesContext.Provider
      value={{ preferences, updatePreference, resetPreferences }}
    >
      {children}
    </AccessibilityPreferencesContext.Provider>
  )
}

/**
 * Hook to access and update accessibility preferences
 */
export function useAccessibilityPreferences() {
  const context = useContext(AccessibilityPreferencesContext)
  if (!context) {
    throw new Error('useAccessibilityPreferences must be used within AccessibilityPreferencesProvider')
  }
  return context
}

/**
 * Standalone component for accessibility preferences toggle
 * Can be added to user profile settings or preferences page
 */
export function AccessibilityPreferencesPanel() {
  const { preferences, updatePreference, resetPreferences } = useAccessibilityPreferences()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Accessibility Preferences
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Customize your experience to meet your accessibility needs.
          These settings override system preferences.
        </p>
      </div>

      <div className="space-y-4">
        {/* Reduce Motion */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <label
              htmlFor="reduce-motion"
              className="text-sm font-medium text-gray-900 cursor-pointer"
            >
              Reduce motion
            </label>
            <p className="text-xs text-gray-600 mt-1">
              Minimize animations and transitions throughout the interface
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              id="reduce-motion"
              type="checkbox"
              checked={preferences.reduceMotion}
              onChange={(e) => updatePreference('reduceMotion', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* High Contrast */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <label
              htmlFor="high-contrast"
              className="text-sm font-medium text-gray-900 cursor-pointer"
            >
              High contrast
            </label>
            <p className="text-xs text-gray-600 mt-1">
              Increase contrast for better visibility
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              id="high-contrast"
              type="checkbox"
              checked={preferences.highContrast}
              onChange={(e) => updatePreference('highContrast', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Large Text */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <label
              htmlFor="large-text"
              className="text-sm font-medium text-gray-900 cursor-pointer"
            >
              Large text
            </label>
            <p className="text-xs text-gray-600 mt-1">
              Increase text size by 20% for easier reading
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              id="large-text"
              type="checkbox"
              checked={preferences.largeText}
              onChange={(e) => updatePreference('largeText', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={resetPreferences}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          type="button"
        >
          Reset to system defaults
        </button>
      </div>
    </div>
  )
}
