"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkipLinkProps {
  /** The target element ID to skip to */
  targetId?: string
  /** Link text */
  children?: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * SkipLink - Allows keyboard users to skip repetitive navigation
 * 
 * WCAG 2.1 AA Requirement: 2.4.1 Bypass Blocks
 * - Provides a mechanism to bypass blocks of content repeated on multiple pages
 * 
 * @example
 * <SkipLink targetId="main-content">Skip to main content</SkipLink>
 * <header>...</header>
 * <main id="main-content">...</main>
 */
export function SkipLink({
  targetId = "main-content",
  children = "Skip to main content",
  className,
}: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      // Make target focusable if it isn't already
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1")
        target.addEventListener("blur", () => {
          target.removeAttribute("tabindex")
        }, { once: true })
      }
      target.focus()
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4",
        "focus:z-skip-link focus:px-4 focus:py-3 focus:rounded-lg",
        "focus:bg-primary focus:text-primary-foreground focus:font-medium",
        "focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
    >
      {children}
    </a>
  )
}

export default SkipLink
