"use client"

import * as React from "react"
import { createContext, useContext, useCallback, useState, useEffect, useRef } from "react"

// ============================================================================
// ARIA Live Region Context - For announcing dynamic content to screen readers
// ============================================================================

type AnnouncementPriority = "polite" | "assertive"

interface LiveRegionContextType {
  announce: (message: string, priority?: AnnouncementPriority) => void
}

const LiveRegionContext = createContext<LiveRegionContextType | null>(null)

export function useLiveRegion() {
  const context = useContext(LiveRegionContext)
  if (!context) {
    throw new Error("useLiveRegion must be used within LiveRegionProvider")
  }
  return context
}

interface LiveRegionProviderProps {
  children: React.ReactNode
}

export function LiveRegionProvider({ children }: LiveRegionProviderProps) {
  const [politeMessage, setPoliteMessage] = useState("")
  const [assertiveMessage, setAssertiveMessage] = useState("")
  const politeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const assertiveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const announce = useCallback((message: string, priority: AnnouncementPriority = "polite") => {
    if (priority === "assertive") {
      // Clear any existing assertive message timeout
      if (assertiveTimeoutRef.current) {
        clearTimeout(assertiveTimeoutRef.current)
      }
      setAssertiveMessage(message)
      // Clear assertive message after it's been read
      assertiveTimeoutRef.current = setTimeout(() => {
        setAssertiveMessage("")
      }, 1000)
    } else {
      // Clear any existing polite message timeout
      if (politeTimeoutRef.current) {
        clearTimeout(politeTimeoutRef.current)
      }
      setPoliteMessage(message)
      // Clear polite message after it's been read
      politeTimeoutRef.current = setTimeout(() => {
        setPoliteMessage("")
      }, 1000)
    }
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (politeTimeoutRef.current) clearTimeout(politeTimeoutRef.current)
      if (assertiveTimeoutRef.current) clearTimeout(assertiveTimeoutRef.current)
    }
  }, [])

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      {/* ARIA Live Regions - Visually hidden but accessible to screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {politeMessage}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      >
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  )
}

// ============================================================================
// Screen Reader Only Text Component
// ============================================================================

interface VisuallyHiddenProps {
  children: React.ReactNode
}

export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return (
    <span className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 clip-rect-[0,0,0,0]">
      {children}
    </span>
  )
}

// ============================================================================
// Skip Link Component - For keyboard navigation
// ============================================================================

interface SkipLinkProps {
  targetId: string
  children?: React.ReactNode
}

export function SkipLink({ targetId, children = "Skip to main content" }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
    >
      {children}
    </a>
  )
}

// ============================================================================
// Error Message Component with proper ARIA attributes
// ============================================================================

interface ErrorMessageProps {
  id: string
  children: React.ReactNode
  className?: string
}

export function ErrorMessage({ id, children, className = "" }: ErrorMessageProps) {
  return (
    <p
      id={id}
      className={`text-sm text-red-600 flex items-center gap-1 mt-1 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {children}
    </p>
  )
}

// ============================================================================
// Helper to generate unique IDs for aria-describedby
// ============================================================================

export function useFieldId(prefix: string) {
  const [id] = useState(() => `${prefix}-${Math.random().toString(36).substr(2, 9)}`)
  return {
    inputId: id,
    errorId: `${id}-error`,
    descriptionId: `${id}-description`,
    helpId: `${id}-help`,
  }
}

// ============================================================================
// Form Field Wrapper with accessibility attributes
// ============================================================================

interface AccessibleFieldProps {
  label: React.ReactNode
  htmlFor: string
  error?: string
  description?: string
  helpText?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function AccessibleField({
  label,
  htmlFor,
  error,
  description,
  helpText,
  required,
  children,
  className = "",
}: AccessibleFieldProps) {
  const ids = useFieldId(htmlFor)
  const hasError = !!error
  const describedBy = [
    description && ids.descriptionId,
    helpText && ids.helpId,
    hasError && ids.errorId,
  ].filter(Boolean).join(" ") || undefined

  return (
    <div className={className}>
      <label htmlFor={ids.inputId} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-600 ml-1" aria-hidden="true">*</span>}
        {required && <VisuallyHidden>(required)</VisuallyHidden>}
      </label>
      
      {description && (
        <p id={ids.descriptionId} className="text-sm text-gray-500 mt-1">
          {description}
        </p>
      )}
      
      <div className="mt-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement, {
              id: ids.inputId,
              "aria-invalid": hasError,
              "aria-describedby": describedBy,
              "aria-required": required,
            })
          }
          return child
        })}
      </div>
      
      {helpText && (
        <p id={ids.helpId} className="text-sm text-gray-500 mt-1">
          {helpText}
        </p>
      )}
      
      {hasError && (
        <ErrorMessage id={ids.errorId}>
          {error}
        </ErrorMessage>
      )}
    </div>
  )
}

// ============================================================================
// Loading Announcement Hook
// ============================================================================

export function useLoadingAnnouncement() {
  const { announce } = useLiveRegion()
  
  const announceLoading = useCallback((message: string) => {
    announce(`${message}... Loading`, "polite")
  }, [announce])
  
  const announceSuccess = useCallback((message: string) => {
    announce(`${message} - Complete`, "polite")
  }, [announce])
  
  const announceError = useCallback((message: string) => {
    announce(`Error: ${message}`, "assertive")
  }, [announce])
  
  return { announceLoading, announceSuccess, announceError }
}

// ============================================================================
// Focus Management Hooks
// ============================================================================

export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  
  useEffect(() => {
    if (ref.current) {
      ref.current.focus()
    }
  }, [])
  
  return ref
}

export function useFocusOnError(errorKeys: string[]) {
  useEffect(() => {
    if (errorKeys.length > 0) {
      // Find the first element with aria-invalid="true"
      const firstError = document.querySelector('[aria-invalid="true"]') as HTMLElement
      if (firstError) {
        firstError.focus()
        firstError.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [errorKeys])
}

// ============================================================================
// Keyboard Navigation Utilities
// ============================================================================

export function useKeyboardNavigation(
  itemCount: number,
  onSelect: (index: number) => void,
  orientation: "horizontal" | "vertical" = "vertical"
) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent, currentIndex: number) => {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        if (orientation === "vertical" && event.key === "ArrowDown") {
          event.preventDefault()
          const nextIndex = (currentIndex + 1) % itemCount
          setFocusedIndex(nextIndex)
          onSelect(nextIndex)
        } else if (orientation === "horizontal" && event.key === "ArrowRight") {
          event.preventDefault()
          const nextIndex = (currentIndex + 1) % itemCount
          setFocusedIndex(nextIndex)
          onSelect(nextIndex)
        }
        break
      case "ArrowUp":
      case "ArrowLeft":
        if (orientation === "vertical" && event.key === "ArrowUp") {
          event.preventDefault()
          const prevIndex = currentIndex <= 0 ? itemCount - 1 : currentIndex - 1
          setFocusedIndex(prevIndex)
          onSelect(prevIndex)
        } else if (orientation === "horizontal" && event.key === "ArrowLeft") {
          event.preventDefault()
          const prevIndex = currentIndex <= 0 ? itemCount - 1 : currentIndex - 1
          setFocusedIndex(prevIndex)
          onSelect(prevIndex)
        }
        break
      case "Home":
        event.preventDefault()
        setFocusedIndex(0)
        onSelect(0)
        break
      case "End":
        event.preventDefault()
        setFocusedIndex(itemCount - 1)
        onSelect(itemCount - 1)
        break
      case "Enter":
      case " ":
        event.preventDefault()
        onSelect(currentIndex)
        break
    }
  }, [itemCount, onSelect, orientation])
  
  return { focusedIndex, handleKeyDown, setFocusedIndex }
}

// ============================================================================
// Color Contrast Checker Utilities
// ============================================================================

/**
 * Calculate relative luminance of a color (WCAG 2.1 formula)
 * Returns a value between 0 (black) and 1 (white)
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two luminances
 * Returns a ratio from 1:1 to 21:1
 */
function getContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Check if a color combination meets WCAG 2.1 AA standards
 * For normal text: 4.5:1 minimum
 * For large text (18pt+ or 14pt+ bold): 3:1 minimum
 * For UI components: 3:1 minimum
 */
export function checkContrast(
  foreground: string,
  background: string
): { ratio: number; passesAA: boolean; passesAAA: boolean; passesUI: boolean } {
  const fg = hexToRgb(foreground)
  const bg = hexToRgb(background)
  
  if (!fg || !bg) {
    return { ratio: 0, passesAA: false, passesAAA: false, passesUI: false }
  }
  
  const fgLum = getLuminance(fg.r, fg.g, fg.b)
  const bgLum = getLuminance(bg.r, bg.g, bg.b)
  const ratio = getContrastRatio(fgLum, bgLum)
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7,
    passesUI: ratio >= 3,
  }
}

// ============================================================================
// Accessible Icon Button Component
// ============================================================================

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label: string
  description?: string
}

export function IconButton({ icon, label, description, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-describedby={description ? undefined : undefined}
      title={label}
      className="inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
      {...props}
    >
      {icon}
      <VisuallyHidden>{label}</VisuallyHidden>
    </button>
  )
}
