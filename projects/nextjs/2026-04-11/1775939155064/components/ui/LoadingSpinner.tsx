"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  label?: string
  centered?: boolean
  fullPage?: boolean
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
  xl: "h-16 w-16",
}

/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner component using Lucide's Loader2 icon.
 * Features:
 * - Multiple sizes (sm, md, lg, xl)
 * - Optional label text
 * - Centered or inline display
 * - Full page overlay option
 * - Proper ARIA attributes for accessibility
 */
export function LoadingSpinner({
  size = "md",
  className,
  label,
  centered = false,
  fullPage = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        "flex items-center gap-3",
        centered && "flex-col justify-center",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className={cn(
          "animate-spin text-blue-600",
          sizeClasses[size]
        )}
        aria-hidden="true"
      />
      {label && (
        <span
          className={cn(
            "text-gray-600 font-medium",
            size === "sm" && "text-sm",
            size === "md" && "text-sm",
            size === "lg" && "text-base",
            size === "xl" && "text-lg"
          )}
        >
          {label}
        </span>
      )}
      <span className="sr-only">{label || "Loading"}</span>
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

/**
 * LoadingOverlay Component
 * 
 * Displays a loading spinner over content with an optional backdrop.
 */
interface LoadingOverlayProps extends LoadingSpinnerProps {
  isLoading: boolean
  children: React.ReactNode
  blur?: boolean
}

export function LoadingOverlay({
  isLoading,
  children,
  blur = false,
  ...spinnerProps
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-white/60",
            blur && "backdrop-blur-sm"
          )}
        >
          <LoadingSpinner {...spinnerProps} />
        </div>
      )}
    </div>
  )
}

/**
 * ButtonLoadingSpinner Component
 * 
 * Smaller spinner designed for use inside buttons.
 */
interface ButtonLoadingSpinnerProps {
  className?: string
}

export function ButtonLoadingSpinner({ className }: ButtonLoadingSpinnerProps) {
  return (
    <Loader2
      className={cn("h-4 w-4 animate-spin", className)}
      aria-hidden="true"
    />
  )
}
