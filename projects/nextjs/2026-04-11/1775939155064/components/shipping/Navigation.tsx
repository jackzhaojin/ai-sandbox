'use client'

import { useStepContext } from '@/contexts/StepContext'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

interface NavigationProps {
  onNext?: () => void | Promise<void>
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

  return (
    <div className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6 lg:px-8 sticky bottom-0 z-40">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Previous button */}
        {showPrevious && currentStep > 1 ? (
          <button
            onClick={handlePrevious}
            disabled={isNextLoading}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg transition-colors',
              'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200',
              isNextLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            {previousLabel}
          </button>
        ) : (
          <div /> /* Spacer for flex layout */
        )}

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={isNextDisabled || isNextLoading}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg transition-colors',
            'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            (isNextDisabled || isNextLoading) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isNextLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {getNextLabel()}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
