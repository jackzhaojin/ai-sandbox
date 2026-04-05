"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

export interface NavigationProps {
  /** Previous button label */
  prevLabel?: string
  /** Next button label */
  nextLabel?: string
  /** Whether previous button is disabled */
  prevDisabled?: boolean
  /** Whether next button is disabled */
  nextDisabled?: boolean
  /** Whether next button is loading */
  isLoading?: boolean
  /** Callback for previous button */
  onPrevious?: () => void
  /** Callback for next button */
  onNext?: () => void
  /** Additional CSS classes */
  className?: string
  /** Show save draft button */
  showSaveDraft?: boolean
  /** Callback for save draft */
  onSaveDraft?: () => void
  /** Whether save draft is loading */
  isSavingDraft?: boolean
  /** Custom content to render between buttons */
  children?: React.ReactNode
  /** Alignment of navigation */
  align?: "left" | "center" | "right" | "between"
  /** Sticky positioning */
  sticky?: boolean
}

/**
 * Navigation - Previous/Next navigation with loading states
 * 
 * @example
 * <Navigation
 *   prevLabel="Back"
 *   nextLabel="Continue"
 *   onPrevious={() => router.back()}
 *   onNext={handleSubmit}
 *   isLoading={isSubmitting}
 * />
 */
export function Navigation({
  prevLabel = "Previous",
  nextLabel = "Next",
  prevDisabled = false,
  nextDisabled = false,
  isLoading = false,
  onPrevious,
  onNext,
  className,
  showSaveDraft = false,
  onSaveDraft,
  isSavingDraft = false,
  children,
  align = "between",
  sticky = false,
}: NavigationProps) {
  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
  }

  return (
    <div
      className={cn(
        "flex w-full items-center gap-4",
        alignClasses[align],
        sticky && "sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4",
        className
      )}
    >
      {/* Left side - Previous button */}
      <div className="flex items-center gap-3">
        {onPrevious && (
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={prevDisabled || isLoading}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {prevLabel}
          </Button>
        )}
        
        {children}
      </div>

      {/* Right side - Save draft & Next buttons */}
      <div className="flex items-center gap-3">
        {showSaveDraft && onSaveDraft && (
          <Button
            variant="ghost"
            onClick={onSaveDraft}
            disabled={isSavingDraft || isLoading}
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : (
              "Save Draft"
            )}
          </Button>
        )}
        
        {onNext && (
          <Button
            onClick={onNext}
            disabled={nextDisabled || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Processing...
              </>
            ) : (
              <>
                {nextLabel}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * StepNavigation - Navigation specifically for multi-step forms
 */
export interface StepNavigationProps extends NavigationProps {
  /** Current step number (1-based) */
  currentStep: number
  /** Total number of steps */
  totalSteps: number
  /** Show step indicator */
  showStepIndicator?: boolean
  /** Custom next button text based on step */
  finalStepLabel?: string
}

export function StepNavigation({
  currentStep,
  totalSteps,
  showStepIndicator = true,
  finalStepLabel = "Complete",
  nextLabel = "Continue",
  ...props
}: StepNavigationProps) {
  const isFinalStep = currentStep === totalSteps
  const displayNextLabel = isFinalStep ? finalStepLabel : nextLabel

  return (
    <div className="space-y-4">
      {showStepIndicator && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Step {currentStep}</span>
          <span>of {totalSteps}</span>
        </div>
      )}
      
      <Navigation
        {...props}
        nextLabel={displayNextLabel}
      />
    </div>
  )
}

/**
 * MobileNavigation - Fixed bottom navigation for mobile
 */
export interface MobileNavigationProps {
  /** Navigation items */
  items: Array<{
    label: string
    icon: React.ReactNode
    href?: string
    isActive?: boolean
    onClick?: () => void
  }>
  /** Additional CSS classes */
  className?: string
}

export function MobileNavigation({
  items,
  className,
}: MobileNavigationProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-sticky border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around">
        {items.map((item, index) => {
          const Component = item.href ? "a" : "button"
          return (
            <Component
              key={index}
              {...(item.href && { href: item.href })}
              {...(item.onClick && { onClick: item.onClick })}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                item.isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={item.isActive ? "page" : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </Component>
          )
        })}
      </div>
    </nav>
  )
}

export default Navigation
