"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface VisuallyHiddenProps {
  /** Content to hide visually but make available to screen readers */
  children: React.ReactNode
  /** Additional CSS classes */
  className?: string
  /**
   * Whether the element should be focusable.
   * Use true for skip links or other elements that need to become visible on focus.
   */
  focusable?: boolean
  /**
   * HTML element to render
   * @default "span"
   */
  as?: keyof JSX.IntrinsicElements
}

/**
 * VisuallyHidden - Hides content visually while keeping it accessible to screen readers
 * 
 * WCAG 2.1 AA Requirements:
 * - 1.3.2 Meaningful Sequence: Content can be read in a meaningful order
 * - 4.1.2 Name, Role, Value: UI components have name and role that can be programmatically determined
 * 
 * Common use cases:
 * - Labels for icon-only buttons
 * - Context for screen reader users
 * - Table headers that are visually redundant
 * - Descriptive text for complex interactions
 * 
 * @example
 * <button>
 *   <SettingsIcon aria-hidden="true" />
 *   <VisuallyHidden>Settings</VisuallyHidden>
 * </button>
 * 
 * // For skip links that become visible on focus:
 * <VisuallyHidden focusable>
 *   <a href="#main">Skip to main content</a>
 * </VisuallyHidden>
 */
export function VisuallyHidden({
  children,
  className,
  focusable = false,
  as: Component = "span",
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn(
        // Default visually hidden styles
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        // Keep it visible to screen readers
        "[clip:rect(0,0,0,0)]",
        // Make visible on focus if focusable
        focusable &&
          "focus:static focus:w-auto focus:h-auto focus:m-0 focus:overflow-visible focus:whitespace-normal focus:[clip:auto]"
      )}
      {...(!focusable && { "aria-hidden": false })}
    >
      {children}
    </Component>
  )
}

export default VisuallyHidden
