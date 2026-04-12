'use client'

import React from 'react'
import { AlertCircle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ValidationErrorType =
  | 'origin'
  | 'destination'
  | 'package'
  | 'pricing'
  | 'payment'
  | 'pickup'
  | 'terms'
  | 'quote_expired'
  | 'po_expired'

export interface ValidationError {
  type: ValidationErrorType
  field?: string
  message: string
  sectionId?: string
}

export interface ValidationErrorsProps {
  errors: ValidationError[]
  className?: string
  onErrorClick?: (error: ValidationError) => void
}

const SECTION_LABELS: Record<ValidationErrorType, string> = {
  origin: 'Origin Address',
  destination: 'Destination Address',
  package: 'Package Details',
  pricing: 'Shipping Rate',
  payment: 'Payment Method',
  pickup: 'Pickup Details',
  terms: 'Terms & Conditions',
  quote_expired: 'Quote Expired',
  po_expired: 'Purchase Order Expired',
}

const SECTION_IDS: Record<ValidationErrorType, string> = {
  origin: 'origin-section',
  destination: 'destination-section',
  package: 'package-section',
  pricing: 'pricing-section',
  payment: 'payment-section',
  pickup: 'pickup-section',
  terms: 'terms-section',
  quote_expired: 'pricing-section',
  po_expired: 'payment-section',
}

export function ValidationErrors({ errors, className, onErrorClick }: ValidationErrorsProps) {
  if (errors.length === 0) return null

  // Group errors by type
  const groupedErrors = errors.reduce((acc, error) => {
    if (!acc[error.type]) {
      acc[error.type] = []
    }
    acc[error.type].push(error)
    return acc
  }, {} as Record<ValidationErrorType, ValidationError[]>)

  const handleErrorClick = (error: ValidationError) => {
    const sectionId = error.sectionId || SECTION_IDS[error.type]
    const element = document.getElementById(sectionId)
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Add a temporary highlight effect
      element.classList.add('ring-2', 'ring-red-500', 'ring-offset-2')
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2')
      }, 2000)
    }

    onErrorClick?.(error)
  }

  const getSectionRoute = (type: ValidationErrorType): string | null => {
    switch (type) {
      case 'origin':
      case 'destination':
      case 'package':
        return 'new'
      case 'pricing':
      case 'quote_expired':
        return 'rates'
      case 'payment':
      case 'po_expired':
        return 'payment'
      case 'pickup':
        return 'pickup'
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        'bg-red-50 border border-red-200 rounded-lg overflow-hidden',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Header */}
      <div className="bg-red-100 px-4 py-3 border-b border-red-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-red-800">
            Please fix the following issues before submitting:
          </h3>
        </div>
      </div>

      {/* Error List */}
      <div className="p-4">
        <ul className="space-y-3">
          {(Object.keys(groupedErrors) as ValidationErrorType[]).map((type) => (
            <li key={type} className="space-y-2">
              {/* Section Header */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-red-900">
                  {SECTION_LABELS[type]}
                </span>
                {groupedErrors[type].length > 1 && (
                  <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    {groupedErrors[type].length} issues
                  </span>
                )}
              </div>

              {/* Individual Errors */}
              <ul className="ml-4 space-y-1">
                {groupedErrors[type].map((error, index) => (
                  <li key={`${type}-${index}`}>
                    <button
                      onClick={() => handleErrorClick(error)}
                      className={cn(
                        'group flex items-start gap-2 text-left w-full',
                        'text-sm text-red-700 hover:text-red-900',
                        'hover:bg-red-100/50 rounded px-2 py-1 -mx-2 transition-colors'
                      )}
                    >
                      <ChevronRight
                        className="h-4 w-4 mt-0.5 shrink-0 text-red-500 group-hover:translate-x-0.5 transition-transform"
                        aria-hidden="true"
                      />
                      <span>{error.message}</span>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Quick Action Link */}
              {getSectionRoute(type) && type !== 'terms' && type !== 'quote_expired' && type !== 'po_expired' && (
                <p className="ml-4 text-xs text-red-600">
                  Click an issue above to scroll to it, or{' '}
                  <a
                    href={`#${SECTION_IDS[type]}`}
                    onClick={(e) => {
                      e.preventDefault()
                      handleErrorClick({ type, message: '' } as ValidationError)
                    }}
                    className="underline hover:text-red-800"
                  >
                    jump to section
                  </a>
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Summary Footer */}
      <div className="bg-red-100/50 px-4 py-2 border-t border-red-200">
        <p className="text-xs text-red-700">
          {errors.length} {errors.length === 1 ? 'issue' : 'issues'} need to be resolved
        </p>
      </div>
    </div>
  )
}
