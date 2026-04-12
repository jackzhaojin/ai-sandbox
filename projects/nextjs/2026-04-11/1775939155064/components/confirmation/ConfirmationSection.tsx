'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmationSectionProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
  className?: string
  icon?: React.ReactNode
}

export function ConfirmationSection({
  title,
  children,
  defaultExpanded = true,
  className,
  icon,
}: ConfirmationSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        {/* Expand/Collapse Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
          aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Content Area */}
      {isExpanded && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  )
}

// Key-Value Pair Component for consistent display
interface KeyValuePairProps {
  label: string
  value: React.ReactNode
  className?: string
}

export function KeyValuePair({ label, value, className = '' }: KeyValuePairProps) {
  return (
    <div className={className}>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">
        {value || <span className="text-gray-400 italic">Not provided</span>}
      </dd>
    </div>
  )
}

// Section Grid Component for layout
interface SectionGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3
}

export function SectionGrid({ children, columns = 2 }: SectionGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }

  return (
    <dl className={`grid ${gridClasses[columns]} gap-x-6 gap-y-4`}>
      {children}
    </dl>
  )
}

// Section Divider Component
export function SectionDivider() {
  return <div className="border-t border-gray-200 my-4" />
}

// Subsection Component
interface SubsectionProps {
  title: string
  children: React.ReactNode
}

export function Subsection({ title, children }: SubsectionProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
        {title}
      </h4>
      {children}
    </div>
  )
}

// Status Badge Component
interface StatusBadgeProps {
  status: 'confirmed' | 'pending' | 'in_transit' | 'completed' | 'error'
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = {
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    in_transit: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-gray-100 text-gray-800 border-gray-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  }

  const defaultLabels = {
    confirmed: 'Confirmed',
    pending: 'Pending',
    in_transit: 'In Transit',
    completed: 'Completed',
    error: 'Error',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        styles[status]
      )}
    >
      {label || defaultLabels[status]}
    </span>
  )
}
