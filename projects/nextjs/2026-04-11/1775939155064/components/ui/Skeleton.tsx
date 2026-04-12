"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  circle?: boolean
  rounded?: boolean
  animate?: boolean
}

/**
 * Skeleton Component
 * 
 * A loading placeholder component with animated shimmer effect.
 * Use to show loading states while content is being fetched.
 */
export function Skeleton({
  className,
  width,
  height,
  circle = false,
  rounded = true,
  animate = true,
}: SkeletonProps) {
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === "number" ? `${width}px` : width
  if (height) style.height = typeof height === "number" ? `${height}px` : height

  return (
    <div
      className={cn(
        "bg-gray-200",
        animate && "animate-pulse",
        circle ? "rounded-full" : rounded ? "rounded-md" : "rounded-none",
        className
      )}
      style={style}
      aria-hidden="true"
    />
  )
}

/**
 * SkeletonCard Component
 * 
 * Pre-configured skeleton for card-shaped content.
 */
interface SkeletonCardProps {
  className?: string
  hasImage?: boolean
  lines?: number
}

export function SkeletonCard({
  className,
  hasImage = true,
  lines = 3,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-5 space-y-4",
        className
      )}
    >
      {hasImage && (
        <div className="flex items-start gap-4">
          <Skeleton circle width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={16} />
          </div>
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            width={i === lines - 1 ? "80%" : "100%"}
            height={i === 0 ? 24 : 16}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * SkeletonText Component
 * 
 * Skeleton for text content with multiple lines.
 */
interface SkeletonTextProps {
  lines?: number
  className?: string
  lastLineWidth?: string
}

export function SkeletonText({
  lines = 3,
  className,
  lastLineWidth = "60%",
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastLineWidth : "100%"}
          height={16}
        />
      ))}
    </div>
  )
}

/**
 * SkeletonPricingCard Component
 * 
 * Skeleton specifically designed for the pricing/quote cards.
 */
export function SkeletonPricingCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border-2 border-gray-200 p-5 space-y-4",
        className
      )}
    >
      {/* Header with logo and rating */}
      <div className="flex items-start gap-4">
        <Skeleton circle width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" height={20} />
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} circle width={12} height={12} />
            ))}
          </div>
        </div>
      </div>

      {/* Service info */}
      <div className="space-y-2">
        <Skeleton width="50%" height={18} />
        <div className="flex gap-4">
          <Skeleton width={80} height={16} />
          <Skeleton width={100} height={16} />
        </div>
      </div>

      {/* Price */}
      <div className="py-2">
        <Skeleton width="40%" height={36} />
        <Skeleton width="60%" height={14} className="mt-1" />
      </div>

      {/* Features */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton circle width={14} height={14} />
            <Skeleton width="70%" height={16} />
          </div>
        ))}
      </div>

      {/* Carbon badge */}
      <Skeleton width={100} height={24} rounded />
    </div>
  )
}

/**
 * SkeletonReviewSection Component
 * 
 * Skeleton for review page sections.
 */
export function SkeletonReviewSection({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4",
        className
      )}
    >
      {/* Section header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <Skeleton circle width={24} height={24} />
          <Skeleton width={150} height={20} />
        </div>
        <Skeleton width={60} height={32} rounded />
      </div>

      {/* Content */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <Skeleton width="40%" height={14} />
          <Skeleton width="80%" height={18} />
        </div>
        <div className="space-y-3">
          <Skeleton width="40%" height={14} />
          <Skeleton width="70%" height={18} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="space-y-3">
          <Skeleton width="40%" height={14} />
          <Skeleton width="60%" height={18} />
        </div>
        <div className="space-y-3">
          <Skeleton width="40%" height={14} />
          <Skeleton width="75%" height={18} />
        </div>
      </div>
    </div>
  )
}

/**
 * SkeletonGrid Component
 * 
 * Grid of skeleton cards for loading states.
 */
interface SkeletonGridProps {
  count?: number
  columns?: 1 | 2 | 3 | 4
  className?: string
  type?: "card" | "pricing"
}

export function SkeletonGrid({
  count = 6,
  columns = 3,
  className,
  type = "card",
}: SkeletonGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }

  const SkeletonComponent = type === "pricing" ? SkeletonPricingCard : SkeletonCard

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  )
}
