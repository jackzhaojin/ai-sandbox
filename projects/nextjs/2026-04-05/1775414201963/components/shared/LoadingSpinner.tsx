"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  /** Color variant */
  variant?: "primary" | "secondary" | "muted" | "white"
  /** Additional CSS classes */
  className?: string
  /** Accessible label */
  label?: string
  /** Whether to center the spinner */
  centered?: boolean
}

const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

const variantClasses = {
  primary: "text-primary",
  secondary: "text-secondary-foreground",
  muted: "text-muted-foreground",
  white: "text-white",
}

/**
 * LoadingSpinner - An accessible loading spinner component
 * 
 * @example
 * <LoadingSpinner size="md" variant="primary" label="Loading shipments..." />
 * 
 * <LoadingSpinner centered size="lg" />
 */
export function LoadingSpinner({
  size = "md",
  variant = "primary",
  className,
  label = "Loading...",
  centered = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center",
        centered && "absolute inset-0",
        className
      )}
    >
      <svg
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  )

  if (centered) {
    return (
      <div className="relative flex min-h-[100px] items-center justify-center">
        {spinner}
      </div>
    )
  }

  return spinner
}

/**
 * LoadingOverlay - Full overlay with spinner
 */
export interface LoadingOverlayProps extends LoadingSpinnerProps {
  /** Whether the overlay is visible */
  isLoading: boolean
  /** Overlay background opacity */
  opacity?: "light" | "medium" | "dark"
  /** Content to show behind overlay */
  children?: React.ReactNode
}

export function LoadingOverlay({
  isLoading,
  opacity = "medium",
  children,
  ...spinnerProps
}: LoadingOverlayProps) {
  const opacityClasses = {
    light: "bg-white/50",
    medium: "bg-white/70",
    dark: "bg-white/90",
  }

  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm",
            opacityClasses[opacity]
          )}
          role="alert"
          aria-busy="true"
          aria-live="polite"
        >
          <LoadingSpinner {...spinnerProps} />
        </div>
      )}
    </div>
  )
}

/**
 * Skeleton - Loading placeholder
 */
export interface SkeletonProps {
  /** Width of the skeleton */
  width?: string | number
  /** Height of the skeleton */
  height?: string | number
  /** Additional CSS classes */
  className?: string
  /** Whether to animate the skeleton */
  animate?: boolean
  /** Border radius */
  rounded?: "none" | "sm" | "md" | "lg" | "full"
}

export function Skeleton({
  width,
  height,
  className,
  animate = true,
  rounded = "md",
}: SkeletonProps) {
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }

  return (
    <div
      className={cn(
        "bg-muted",
        roundedClasses[rounded],
        animate && "animate-pulse",
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  )
}

export default LoadingSpinner
