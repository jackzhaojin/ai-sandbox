'use client'

import { useStepContext, type Step } from '@/contexts/StepContext'
import { cn } from '@/lib/utils'
import { Check, AlertCircle } from 'lucide-react'

interface StepIndicatorProps {
  shipmentId?: string
}

export function StepIndicator({ shipmentId }: StepIndicatorProps) {
  const { steps, currentStep, canNavigateToStep, getStepPath } = useStepContext()

  return (
    <>
      {/* Desktop: Full horizontal stepper */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1
            const isClickable = canNavigateToStep(step.id)
            const stepPath = getStepPath(step.id, shipmentId)

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step circle and label */}
                <div className="flex flex-col items-center">
                  <a
                    href={isClickable ? stepPath : undefined}
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
                      step.status === 'completed' &&
                        'bg-blue-600 border-blue-600 text-white',
                      step.status === 'current' &&
                        'bg-white border-blue-600 text-blue-600 ring-2 ring-blue-100',
                      step.status === 'error' &&
                        'bg-white border-red-500 text-red-500',
                      step.status === 'pending' &&
                        isClickable &&
                        'bg-white border-gray-300 text-gray-500 hover:border-gray-400',
                      step.status === 'pending' &&
                        !isClickable &&
                        'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    )}
                    onClick={(e) => {
                      if (!isClickable) {
                        e.preventDefault()
                      }
                    }}
                  >
                    {step.status === 'completed' && <Check className="w-5 h-5" />}
                    {step.status === 'error' && <AlertCircle className="w-5 h-5" />}
                    {step.status !== 'completed' && step.status !== 'error' && (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </a>
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
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile: Compact progress bar */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm font-medium text-blue-600">
            {steps.find((s) => s.id === currentStep)?.label}
          </span>
        </div>
        <div className="flex gap-1">
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
      </div>
    </>
  )
}
