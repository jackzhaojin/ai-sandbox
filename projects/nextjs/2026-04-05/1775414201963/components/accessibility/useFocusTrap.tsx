"use client"

import * as React from "react"

export interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  isActive: boolean
  /** Callback when escape key is pressed */
  onEscape?: () => void
  /** Element to return focus to when trap is deactivated */
  returnFocusTo?: HTMLElement | null
}

/**
 * Focus trap for modals, dialogs, and other overlay components
 * 
 * WCAG 2.1 AA Requirements:
 * - 2.4.3 Focus Order: Focusable components receive focus in an order that preserves meaning
 * - 2.4.7 Focus Visible: Focus indicator is visible
 * 
 * Features:
 * - Traps focus within a container
 * - Cycles focus from last element back to first
 * - Supports Escape key to close
 * - Returns focus to trigger element on close
 * 
 * @example
 * const modalRef = useRef<HTMLDivElement>(null)
 * useFocusTrap({
 *   isActive: isOpen,
 *   onEscape: onClose,
 *   returnFocusTo: triggerElement
 * })
 * 
 * return (
 *   <div ref={modalRef} role="dialog" aria-modal="true">
 *     // modal content
 *   </div>
 * )
 */
export function useFocusTrap({
  isActive,
  onEscape,
  returnFocusTo,
}: UseFocusTrapOptions): React.RefObject<HTMLDivElement | null> {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const previousActiveElement = React.useRef<HTMLElement | null>(null)

  // Store the previously focused element when trap activates
  React.useEffect(() => {
    if (isActive) {
      previousActiveElement.current = document.activeElement as HTMLElement
      
      // Focus the first focusable element in the container
      const container = containerRef.current
      if (container) {
        const focusableElements = getFocusableElements(container)
        if (focusableElements.length > 0) {
          // Focus the first element, or the container itself if no focusable elements
          const firstElement = focusableElements[0]
          firstElement.focus()
        } else {
          container.setAttribute("tabindex", "-1")
          container.focus()
        }
      }
    } else if (previousActiveElement.current) {
      // Return focus when trap deactivates
      const elementToFocus = returnFocusTo || previousActiveElement.current
      elementToFocus?.focus()
    }
  }, [isActive, returnFocusTo])

  // Handle tab key to trap focus
  React.useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current
      if (!container) return

      // Handle Escape key
      if (e.key === "Escape" && onEscape) {
        e.preventDefault()
        onEscape()
        return
      }

      // Handle Tab key for focus trapping
      if (e.key === "Tab") {
        const focusableElements = getFocusableElements(container)
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        // Shift + Tab: Move backwards
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab: Move forwards
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isActive, onEscape])

  return containerRef
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled]):not([aria-hidden="true"])',
    'a[href]:not([aria-hidden="true"])',
    'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"])',
    'select:not([disabled]):not([aria-hidden="true"])',
    'textarea:not([disabled]):not([aria-hidden="true"])',
    '[tabindex]:not([tabindex="-1"]):not([disabled]):not([aria-hidden="true"])',
    '[contenteditable]:not([contenteditable="false"]):not([aria-hidden="true"])',
  ]

  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors.join(","))
  )

  // Filter out elements that are not visible
  return elements.filter((el) => {
    const style = window.getComputedStyle(el)
    return style.display !== "none" && style.visibility !== "hidden"
  })
}

export default useFocusTrap
