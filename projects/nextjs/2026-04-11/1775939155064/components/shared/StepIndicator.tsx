'use client'

import { useStepContext, type Step } from '@/contexts/StepContext'
import { cn } from '@/lib/utils'
import { Check, AlertCircle } from 'lucide-react'

interface StepIndicatorProps {
  shipmentId?: string
}

export function StepIndicator({ shipmentId }: StepIndicatorProps) {
  const { steps, currentStep, canNavigateToStep, getStepPath } = useStepContext()

  // Get accessible step description
  const getStepDescription = (step: Step) => {
    const position = steps.findIndex(s => s.id === step.id) + 1
    const total = steps.length
    
    if (step.status === 'completed') {
      return `Step ${position} of ${total}: ${step.label}, completed. Click to return to this step.`
    } else if (step.status === 'current') {
      return `Step ${position} of ${total}: ${step.label}, current step.`
    } else if (step.status === 'error') {
      return `Step ${position} of ${total}: ${step.label}, has errors. Click to review.`
    } else if (canNavigateToStep(step.id)) {
      return `Step ${position} of ${total}: ${step.label}, available.`
    } else {
      return `Step ${position} of ${total}: ${step.label}, locked. Complete previous steps first.`
    }
  }

  return (
    <nav aria-label="Checkout progress">
      {/* Desktop: Full horizontal stepper */}
      <div className="hidden md:block">
        <ol className="flex items-center justify-between" role="list">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1
            const isClickable = canNavigateToStep(step.id)
            const stepPath = getStepPath(step.id, shipmentId)

            return (
              <li key={step.id} className="flex items-center flex-1">
                {/* Step circle and label */}
                <div className="flex flex-col items-center">
                  {isClickable ? (
                    <a
                      href={stepPath}
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                        step.status === 'completed' &&
                          'bg-blue-600 border-blue-600 text-white',
                        step.status === 'current' &&
                          'bg-white border-blue-600 text-blue-600 ring-2 ring-blue-100',
                        step.status === 'error' &&
                          'bg-white border-red-500 text-red-500',
                        step.status === 'pending' &&
                          'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
                      )}
                      aria-label={getStepDescription(step)}
                      aria-current={step.status === 'current' ? 'step' : undefined}
                    >
                      {step.status === 'completed' && <Check className="w-5 h-5" aria-hidden="true" />}
                      {step.status === 'error' && <AlertCircle className="w-5 h-5" aria-hidden="true" />}
                      {step.status !== 'completed' && step.status !== 'error' && (
                        <span className="text-sm font-semibold" aria-hidden="true">{step.id}</span>
                      )}
                    </a>
                  ) : (
                    <div
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full border-2 bg-gray-100 border-gray-200 text-gray-400',
                        step.status === 'current' && 'ring-2 ring-blue-100'
                      )}
                      aria-label={getStepDescription(step)}
                      aria-current={step.status === 'current' ? 'step' : undefined}
                    >
                      {step.status === 'completed' && <Check className="w-5 h-5" aria-hidden="true" />}
                      {step.status === 'error' && <AlertCircle className="w-5 h-5" aria-hidden="true" />}
                      {step.status !== 'completed' && step.status !== 'error' && (
                        <span className="text-sm font-semibold" aria-hidden="true">{step.id}</span>
                      )}
                    </div>
                  )}
                  <span
                    className={cn(
                      'mt-2 text-xs font-medium transition-colors',
                      step.status === 'current' && 'text-blue-600',
                      step.status === 'completed' && 'text-gray-700',
                      step.status === 'error' && 'text-red-500',
                      step.status === 'pending' && 'text-gray-500'
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connecting line */}
                {!isLast && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4 transition-colors duration-300',
                      step.status === 'completed'
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    )}
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>
      </div>

      {/* Mobile: Compact progress bar with step info */}
      <div className="md:hidden" aria-label={`Checkout progress: Step ${currentStep} of ${steps.length}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm font-medium text-blue-600 truncate max-w-[50%]">
            {steps.find((s) => s.id === currentStep)?.label}
          </span>
        </div>
        <div 
          className="flex gap-1.5" 
          role="progressbar" 
          aria-valuemin={1} 
          aria-valuemax={steps.length} 
          aria-valuenow={currentStep}
          aria-valuetext={`Step ${currentStep} of ${steps.length}: ${steps.find((s) => s.id === currentStep)?.label}`}
        >
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors duration-300',
                step.status === 'completed' && 'bg-blue-600',
                step.status === 'current' && 'bg-blue-400',
                step.status === 'error' && 'bg-red-500',
                step.status === 'pending' && 'bg-gray-200'
              )}
            />
          ))}
        </div>
        
        {/* Hidden description for screen readers */}
        <ol className="sr-only" role="list">
          {steps.map((step, index) => (
            <li key={step.id} aria-current={step.status === 'current' ? 'step' : undefined}>
              Step {index + 1}: {step.label} - {step.status}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}
