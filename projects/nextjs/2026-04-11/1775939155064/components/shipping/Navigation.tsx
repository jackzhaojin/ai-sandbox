'use client'

import { useStepContext } from '@/contexts/StepContext'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

interface NavigationProps {
  onNext?: () => void
  onPrevious?: () => void
  nextLabel?: string
  previousLabel?: string
  isNextLoading?: boolean
  isNextDisabled?: boolean
  showPrevious?: boolean
  shipmentId?: string
}

export function Navigation({
  onNext,
  onPrevious,
  nextLabel = 'Continue',
  previousLabel = 'Previous',
  isNextLoading = false,
  isNextDisabled = false,
  showPrevious = true,
  shipmentId,
}: NavigationProps) {
  const { currentStep, setCurrentStep, completeStep, getStepPath } = useStepContext()

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious()
    } else if (currentStep > 1) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      const path = getStepPath(prevStep, shipmentId)
      window.location.href = path
    }
  }

  const handleNext = async () => {
    if (onNext) {
      await onNext()
    }
    // Navigation after successful action is handled by the caller
  }

  // Dynamic labels based on step
  const getNextLabel = () => {
    if (nextLabel !== 'Continue') return nextLabel
    switch (currentStep) {
      case 1:
        return 'Continue to Rates'
      case 2:
        return 'Select & Continue'
      case 3:
        return 'Process Payment'
      case 4:
        return 'Schedule Pickup'
      case 5:
        return 'Confirm Shipment'
      case 6:
        return 'Finish'
      default:
        return 'Continue'
    }
  }

  // Short labels for mobile
  const getMobileNextLabel = () => {
    if (nextLabel !== 'Continue') return nextLabel
    switch (currentStep) {
      case 1:
        return 'Continue'
      case 2:
        return 'Select'
      case 3:
        return 'Continue'
      case 4:
        return 'Schedule'
      case 5:
        return 'Confirm'
      case 6:
        return 'Finish'
      default:
        return 'Continue'
    }
  }

  // Get accessible description of current navigation state
  const getNavigationLabel = () => {
    if (isNextLoading) {
      return `Processing, please wait. Step ${currentStep} of 6.`
    }
    return `Navigation: Step ${currentStep} of 6.`
  }

  return (
    <nav 
      className="bg-white border-t border-gray-200 py-3 md:py-4 px-4 sm:px-6 lg:px-8 sticky bottom-0 z-40 safe-area-inset-bottom"
      aria-label="Form navigation"
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
        {/* Previous button */}
        {showPrevious && currentStep > 1 ? (
          <button
            onClick={handlePrevious}
            disabled={isNextLoading}
            className={cn(
              'flex items-center gap-2 px-4 md:px-6 py-3 md:py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg transition-colors min-h-[48px] md:min-h-0',
              'hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              'active:bg-gray-100 touch-manipulation',
              isNextLoading && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={`Go back to previous step. ${previousLabel}`}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{previousLabel}</span>
            <span className="sm:hidden">Back</span>
          </button>
        ) : (
          <div /> /* Spacer for flex layout */
        )}

        {/* Step indicator for screen readers */}
        <span className="sr-only" role="status" aria-live="polite">
          {getNavigationLabel()}
        </span>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={isNextDisabled || isNextLoading}
          className={cn(
            'flex items-center gap-2 px-4 md:px-6 py-3 md:py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg transition-colors min-h-[48px] md:min-h-0',
            'hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            'active:bg-blue-800 touch-manipulation',
            (isNextDisabled || isNextLoading) && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={isNextLoading ? 'Processing, please wait' : `${getNextLabel()}, proceed to next step`}
          aria-busy={isNextLoading}
        >
          {isNextLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Processing...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">{getNextLabel()}</span>
              <span className="sm:hidden">{getMobileNextLabel()}</span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </nav>
  )
}
