"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, X, AlertCircle, Clock, Loader2 } from "lucide-react"

export type StatusType = 
  | "available" 
  | "limited" 
  | "unavailable" 
  | "selected" 
  | "complete" 
  | "pending" 
  | "processing" 
  | "warning" 
  | "error"

export interface StatusIndicatorProps {
  /** Status type */
  status: StatusType
  /** Display label */
  label?: string
  /** Show icon */
  showIcon?: boolean
  /** Size variant */
  size?: "sm" | "md" | "lg"
  /** Visual variant */
  variant?: "badge" | "dot" | "pill"
  /** Additional CSS classes */
  className?: string
  /** Custom icon override */
  icon?: React.ReactNode
}

const statusConfig: Record<StatusType, {
  label: string
  icon: React.ReactNode
  colors: {
    badge: string
    dot: string
    pill: string
  }
}> = {
  available: {
    label: "Available",
    icon: <Check className="h-3.5 w-3.5" />,
    colors: {
      badge: "bg-success-100 text-success-800 border-success-200",
      dot: "bg-success-500",
      pill: "bg-success-100 text-success-800 border-success-200",
    },
  },
  limited: {
    label: "Limited",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    colors: {
      badge: "bg-warning-100 text-warning-800 border-warning-200",
      dot: "bg-warning-500",
      pill: "bg-warning-100 text-warning-800 border-warning-200",
    },
  },
  unavailable: {
    label: "Unavailable",
    icon: <X className="h-3.5 w-3.5" />,
    colors: {
      badge: "bg-error-100 text-error-800 border-error-200",
      dot: "bg-error-500",
      pill: "bg-error-100 text-error-800 border-error-200",
    },
  },
  selected: {
    label: "Selected",
    icon: <Check className="h-3.5 w-3.5" />,
    colors: {
      badge: "bg-primary-100 text-primary-800 border-primary-200",
      dot: "bg-primary-500",
      pill: "bg-primary-100 text-primary-800 border-primary-200",
    },
  },
  complete: {
    label: "Complete",
    icon: <Check className="h-3.5 w-3.5" />,
    colors: {
      badge: "bg-gray-100 text-gray-800 border-gray-200",
      dot: "bg-gray-500",
      pill: "bg-gray-100 text-gray-800 border-gray-200",
    },
  },
  pending: {
    label: "Pending",
    icon: <Clock className="h-3.5 w-3.5" />,
    colors: {
      badge: "bg-info-100 text-info-800 border-info-200",
      dot: "bg-info-500",
      pill: "bg-info-100 text-info-800 border-info-200",
    },
  },
  processing: {
    label: "Processing",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    colors: {
      badge: "bg-info-100 text-info-800 border-info-200",
      dot: "bg-info-500",
      pill: "bg-info-100 text-info-800 border-info-200",
    },
  },
  warning: {
    label: "Warning",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    colors: {
      badge: "bg-warning-100 text-warning-800 border-warning-200",
      dot: "bg-warning-500",
      pill: "bg-warning-100 text-warning-800 border-warning-200",
    },
  },
  error: {
    label: "Error",
    icon: <X className="h-3.5 w-3.5" />,
    colors: {
      badge: "bg-error-100 text-error-800 border-error-200",
      dot: "bg-error-500",
      pill: "bg-error-100 text-error-800 border-error-200",
    },
  },
}

const sizeClasses = {
  sm: {
    badge: "px-2 py-0.5 text-xs",
    dot: "h-2 w-2",
    pill: "px-2.5 py-1 text-xs",
  },
  md: {
    badge: "px-2.5 py-1 text-sm",
    dot: "h-2.5 w-2.5",
    pill: "px-3 py-1.5 text-sm",
  },
  lg: {
    badge: "px-3 py-1.5 text-base",
    dot: "h-3 w-3",
    pill: "px-4 py-2 text-base",
  },
}

/**
 * StatusIndicator - Displays status with appropriate colors and icons
 * 
 * @example
 * <StatusIndicator status="available" />
 * <StatusIndicator status="limited" variant="dot" size="sm" />
 * <StatusIndicator status="selected" label="Active" variant="pill" />
 */
export function StatusIndicator({
  status,
  label,
  showIcon = true,
  size = "md",
  variant = "badge",
  className,
  icon,
}: StatusIndicatorProps) {
  const config = statusConfig[status]
  const displayLabel = label || config.label
  const displayIcon = icon || config.icon

  if (variant === "dot") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2",
          className
        )}
        title={displayLabel}
      >
        <span
          className={cn(
            "rounded-full",
            sizeClasses[size].dot,
            config.colors.dot
          )}
          aria-hidden="true"
        />
        <span className="sr-only">{displayLabel}</span>
        {showIcon && size !== "sm" && (
          <span className="text-sm text-muted-foreground">{displayLabel}</span>
        )}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-medium",
        sizeClasses[size][variant],
        config.colors[variant],
        className
      )}
      role="status"
      aria-label={displayLabel}
    >
      {showIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {displayIcon}
        </span>
      )}
      <span>{displayLabel}</span>
    </span>
  )
}

/**
 * FeeBadge - Displays fee information
 */
export interface FeeBadgeProps {
  /** Fee amount */
  amount: number
  /** Fee type label */
  label?: string
  /** Currency code */
  currency?: string
  /** Whether the fee is waived */
  isWaived?: boolean
  /** Size variant */
  size?: "sm" | "md"
  /** Additional CSS classes */
  className?: string
}

export function FeeBadge({
  amount,
  label = "Fee",
  currency = "USD",
  isWaived = false,
  size = "md",
  className,
}: FeeBadgeProps) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-medium",
        sizeClasses[size],
        isWaived
          ? "bg-success-100 text-success-800 border-success-200 line-through opacity-70"
          : "bg-gray-100 text-gray-800 border-gray-200",
        className
      )}
      title={isWaived ? `${label}: Waived` : `${label}: ${formattedAmount}`}
    >
      <span>{label}:</span>
      <span>{isWaived ? "Waived" : formattedAmount}</span>
    </span>
  )
}

/**
 * AvailabilityBadge - Shows availability with stock count
 */
export interface AvailabilityBadgeProps {
  /** Availability status */
  status: "in-stock" | "low-stock" | "out-of-stock"
  /** Stock quantity */
  quantity?: number
  /** Low stock threshold */
  lowStockThreshold?: number
  /** Additional CSS classes */
  className?: string
}

export function AvailabilityBadge({
  status,
  quantity,
  lowStockThreshold = 10,
  className,
}: AvailabilityBadgeProps) {
  const config = {
    "in-stock": {
      label: quantity !== undefined ? `${quantity} in stock` : "In Stock",
      className: "bg-success-100 text-success-800 border-success-200",
    },
    "low-stock": {
      label: quantity !== undefined ? `Only ${quantity} left` : "Low Stock",
      className: "bg-warning-100 text-warning-800 border-warning-200",
    },
    "out-of-stock": {
      label: "Out of Stock",
      className: "bg-error-100 text-error-800 border-error-200",
    },
  }

  const { label, className: statusClassName } = config[status]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-medium",
        statusClassName,
        className
      )}
      role="status"
    >
      {label}
    </span>
  )
}

export default StatusIndicator
