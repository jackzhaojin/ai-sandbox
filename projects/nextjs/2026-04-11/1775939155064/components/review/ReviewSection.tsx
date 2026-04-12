'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Check, AlertCircle, Pencil } from 'lucide-react'
import Link from 'next/link'

interface ReviewSectionProps {
  title: string
  editHref: string
  isComplete: boolean
  children: React.ReactNode
  defaultExpanded?: boolean
  incompleteMessage?: string
}

export function ReviewSection({
  title,
  editHref,
  isComplete,
  children,
  defaultExpanded = true,
  incompleteMessage = 'This section is incomplete',
}: ReviewSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          {isComplete ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Check className="h-3 w-3" />
              Complete
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              <AlertCircle className="h-3 w-3" />
              Incomplete
            </span>
          )}
          
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Button */}
          <Link
            href={editHref}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>

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
      </div>

      {/* Content Area */}
      {isExpanded && (
        <div className="p-6">
          {!isComplete && incompleteMessage && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {incompleteMessage}
              </p>
            </div>
          )}
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
      <dd className="mt-1 text-sm text-gray-900">{value || <span className="text-gray-400 italic">Not provided</span>}</dd>
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
