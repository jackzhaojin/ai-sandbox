"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, Loader2 } from "lucide-react"

export interface Step {
  /** Unique step ID */
  id: string
  /** Step label */
  label: string
  /** Optional step description */
  description?: string
  /** Whether the step is optional */
  optional?: boolean
}

export interface ProgressIndicatorProps {
  /** Array of steps */
  steps: Step[]
  /** Current active step ID */
  currentStep: string
  /** Array of completed step IDs */
  completedSteps?: string[]
  /** Orientation of the indicator */
  orientation?: "horizontal" | "vertical"
  /** Size variant */
  size?: "sm" | "md" | "lg"
  /** Additional CSS classes */
  className?: string
  /** Callback when a step is clicked (if allowed) */
  onStepClick?: (stepId: string) => void
  /** Whether to allow clicking on completed steps */
  allowNavigation?: boolean
}

/**
 * ProgressIndicator - Shows progress through a multi-step process
 * 
 * Supports both horizontal (desktop) and vertical (mobile/sidebar) layouts.
 * 
 * @example
 * <ProgressIndicator
 *   steps={[
 *     { id: "sender", label: "Sender" },
 *     { id: "recipient", label: "Recipient" },
 *     { id: "package", label: "Package" },
 *   ]}
 *   currentStep="recipient"
 *   completedSteps={["sender"]}
 * />
 */
export function ProgressIndicator({
  steps,
  currentStep,
  completedSteps = [],
  orientation = "horizontal",
  size = "md",
  className,
  onStepClick,
  allowNavigation = false,
}: ProgressIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  const sizeClasses = {
    sm: {
      step: "h-6 w-6 text-xs",
      line: "h-0.5",
      label: "text-xs",
      description: "text-xs",
      gap: "gap-2",
    },
    md: {
      step: "h-8 w-8 text-sm",
      line: "h-1",
      label: "text-sm",
      description: "text-xs",
      gap: "gap-3",
    },
    lg: {
      step: "h-10 w-10 text-base",
      line: "h-1.5",
      label: "text-base",
      description: "text-sm",
      gap: "gap-4",
    },
  }

  const getStepStatus = (stepId: string, index: number): "complete" | "current" | "upcoming" => {
    if (completedSteps.includes(stepId)) return "complete"
    if (stepId === currentStep) return "current"
    return "upcoming"
  }

  const handleStepClick = (stepId: string, status: string) => {
    if (!allowNavigation || !onStepClick) return
    if (status === "complete" || status === "current") {
      onStepClick(stepId)
    }
  }

  if (orientation === "vertical") {
    return (
      <nav aria-label="Progress" className={cn("w-full", className)}>
        <ol className="space-y-0">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id, index)
            const isClickable = allowNavigation && (status === "complete" || status === "current")

            return (
              <li key={step.id} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-1/2 top-full w-px -translate-x-1/2",
                      sizeClasses[size].line,
                      status === "complete" ? "bg-primary" : "bg-gray-200"
                    )}
                    style={{ height: "calc(100% - 2rem)" }}
                    aria-hidden="true"
                  />
                )}

                <div
                  className={cn(
                    "relative flex items-start gap-3 py-2",
                    sizeClasses[size].gap,
                    isClickable && "cursor-pointer"
                  )}
                  onClick={() => handleStepClick(step.id, status)}
                >
                  {/* Step indicator */}
                  <div
                    className={cn(
                      "flex-shrink-0 rounded-full border-2 flex items-center justify-center font-medium transition-colors",
                      sizeClasses[size].step,
                      status === "complete" && "bg-primary border-primary text-primary-foreground",
                      status === "current" && "border-primary text-primary bg-white",
                      status === "upcoming" && "border-gray-300 text-gray-400 bg-white"
                    )}
                    aria-current={status === "current" ? "step" : undefined}
                  >
                    {status === "complete" ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : status === "current" ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pt-1">
                    <p
                      className={cn(
                        "font-medium",
                        sizeClasses[size].label,
                        status === "upcoming" ? "text-gray-500" : "text-foreground"
                      )}
                    >
                      {step.label}
                      {step.optional && (
                        <span className="ml-1 text-muted-foreground">(Optional)</span>
                      )}
                    </p>
                    {step.description && (
                      <p className={cn("mt-0.5 text-muted-foreground", sizeClasses[size].description)}>
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }

  // Horizontal layout
  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol
        className={cn(
          "flex items-center justify-between",
          orientation === "horizontal" && "w-full"
        )}
        role="list"
      >
        {steps.map((step, index) => {
          const status = getStepStatus(step.id, index)
          const isClickable = allowNavigation && (status === "complete" || status === "current")
          const isLast = index === steps.length - 1

          return (
            <li
              key={step.id}
              className={cn(
                "relative flex",
                !isLast && "flex-1",
                orientation === "horizontal" && !isLast && "items-center"
              )}
            >
              <div
                className={cn(
                  "group flex items-center",
                  orientation === "horizontal" && "flex-col gap-2",
                  isClickable && "cursor-pointer"
                )}
                onClick={() => handleStepClick(step.id, status)}
              >
                {/* Step indicator */}
                <div
                  className={cn(
                    "flex-shrink-0 rounded-full border-2 flex items-center justify-center font-medium transition-colors",
                    sizeClasses[size].step,
                    status === "complete" && "bg-primary border-primary text-primary-foreground",
                    status === "current" && "border-primary text-primary bg-white ring-4 ring-primary/10",
                    status === "upcoming" && "border-gray-300 text-gray-400 bg-white"
                  )}
                  aria-current={status === "current" ? "step" : undefined}
                >
                  {status === "complete" ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : status === "current" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Step label */}
                <div className={cn(orientation === "horizontal" && "text-center")}>
                  <p
                    className={cn(
                      "font-medium",
                      sizeClasses[size].label,
                      status === "upcoming" ? "text-gray-500" : "text-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && orientation === "horizontal" && (
                    <p className={cn("text-muted-foreground", sizeClasses[size].description)}>
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 mx-4",
                    orientation === "horizontal" && "hidden sm:block"
                  )}
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      "rounded-full transition-colors",
                      sizeClasses[size].line,
                      status === "complete" ? "bg-primary" : "bg-gray-200"
                    )}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * StepProgressBar - Simple linear progress bar for steps
 */
export interface StepProgressBarProps {
  /** Current step number (1-based) */
  currentStep: number
  /** Total number of steps */
  totalSteps: number
  /** Show step counter */
  showCounter?: boolean
  /** Additional CSS classes */
  className?: string
}

export function StepProgressBar({
  currentStep,
  totalSteps,
  showCounter = true,
  className,
}: StepProgressBarProps) {
  const progress = Math.min((currentStep / totalSteps) * 100, 100)

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-2">
        {showCounter && (
          <span className="text-sm font-medium text-foreground">
            Step {currentStep} of {totalSteps}
          </span>
        )}
        <span className="text-sm text-muted-foreground">
          {Math.round(progress)}% complete
        </span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Step ${currentStep} of ${totalSteps}`}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressIndicator
