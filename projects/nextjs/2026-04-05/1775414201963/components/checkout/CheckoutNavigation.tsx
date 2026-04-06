"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StepIndicator, MobileStepIndicator, type Step } from "@/components/shared/StepIndicator";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  RotateCcw, 
  Calculator,
  CreditCard,
  Truck,
  ClipboardCheck,
  CheckCircle,
} from "lucide-react";
import type { CheckoutStepId } from "@/hooks/use-checkout-navigation";

/**
 * Checkout step definitions with icons
 */
export const checkoutSteps: Step[] = [
  { id: "details", label: "Shipment Details", description: "Enter package info" },
  { id: "rates", label: "Select Rate", description: "Choose shipping method" },
  { id: "payment", label: "Payment", description: "Payment method" },
  { id: "pickup", label: "Schedule Pickup", description: "Pickup details" },
  { id: "review", label: "Review & Confirm", description: "Final review" },
  { id: "confirm", label: "Confirmation", description: "Order complete" },
];

/**
 * Get step index from step ID
 */
const getStepIndex = (stepId: CheckoutStepId): number => {
  return checkoutSteps.findIndex((s) => s.id === stepId);
};

/**
 * Dynamic button labels and icons based on current step
 */
export const getStepButtonConfig = (stepId: CheckoutStepId): { 
  prev: string; 
  next: string;
  nextIcon: React.ReactNode;
  showPrev: boolean;
  showNext: boolean;
} => {
  const configs: Record<CheckoutStepId, { 
    prev: string; 
    next: string;
    nextIcon: React.ReactNode;
    showPrev: boolean;
    showNext: boolean;
  }> = {
    details: { 
      prev: "Back", 
      next: "Get Quotes", 
      nextIcon: <Calculator className="h-4 w-4" />,
      showPrev: false,
      showNext: true,
    },
    rates: { 
      prev: "Back", 
      next: "Continue to Payment", 
      nextIcon: <CreditCard className="h-4 w-4" />,
      showPrev: true,
      showNext: true,
    },
    payment: { 
      prev: "Back", 
      next: "Continue to Pickup", 
      nextIcon: <Truck className="h-4 w-4" />,
      showPrev: true,
      showNext: true,
    },
    pickup: { 
      prev: "Back", 
      next: "Continue to Review", 
      nextIcon: <ClipboardCheck className="h-4 w-4" />,
      showPrev: true,
      showNext: true,
    },
    review: { 
      prev: "Back", 
      next: "Submit Shipment", 
      nextIcon: <CheckCircle className="h-4 w-4" />,
      showPrev: true,
      showNext: true,
    },
    confirm: { 
      prev: "", 
      next: "", 
      nextIcon: null,
      showPrev: false,
      showNext: false,
    },
  };
  return configs[stepId];
};

/**
 * CheckoutNavigationProps - Props for the checkout navigation component
 */
export interface CheckoutNavigationProps {
  /** Current step ID */
  currentStep: CheckoutStepId;
  /** Array of completed step IDs */
  completedSteps?: string[];
  /** Highest step index the user has reached */
  completedStepIndex?: number;
  /** Whether to allow clicking on completed steps */
  allowStepNavigation?: boolean;
  /** Callback when a step is clicked */
  onStepClick?: (stepId: CheckoutStepId) => void;
  /** Callback for previous button */
  onPrevious?: () => void;
  /** Callback for next button */
  onNext?: () => void;
  /** Callback for save draft */
  onSaveDraft?: () => void;
  /** Callback for start over */
  onStartOver?: () => void;
  /** Whether next button is loading */
  isLoading?: boolean;
  /** Whether save draft is loading */
  isSavingDraft?: boolean;
  /** Whether next button is disabled */
  nextDisabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show save draft button */
  showSaveDraft?: boolean;
  /** Show start over button */
  showStartOver?: boolean;
  /** Sticky positioning */
  sticky?: boolean;
}

/**
 * CheckoutNavigation - Complete navigation for checkout flow
 * 
 * Combines StepIndicator with Previous/Next buttons, Save Draft, and Start Over.
 * 
 * @example
 * <CheckoutNavigation
 *   currentStep="details"
 *   completedSteps={[]}
 *   onPrevious={() => router.back()}
 *   onNext={handleSubmit}
 *   onSaveDraft={handleSaveDraft}
 *   showSaveDraft
 * />
 */
export function CheckoutNavigation({
  currentStep,
  completedSteps = [],
  completedStepIndex,
  allowStepNavigation = true,
  onStepClick,
  onPrevious,
  onNext,
  onSaveDraft,
  onStartOver,
  isLoading = false,
  isSavingDraft = false,
  nextDisabled = false,
  className,
  showSaveDraft = true,
  showStartOver = true,
  sticky = false,
}: CheckoutNavigationProps) {
  const currentStepIndex = getStepIndex(currentStep);

  // Calculate completed steps array from index
  const calculatedCompletedSteps = React.useMemo(() => {
    if (completedSteps.length > 0) return completedSteps;
    const index = completedStepIndex ?? currentStepIndex - 1;
    return checkoutSteps
      .slice(0, Math.max(0, index + 1))
      .map((s) => s.id);
  }, [completedSteps, completedStepIndex, currentStepIndex]);

  const buttonConfig = getStepButtonConfig(currentStep);

  // Handle step click with navigation restriction
  const handleStepClick = (stepId: string) => {
    if (!allowStepNavigation || !onStepClick) return;

    const targetIndex = getStepIndex(stepId as CheckoutStepId);
    const maxAllowedIndex = completedStepIndex ?? currentStepIndex;

    // Only allow clicking on completed steps to go back
    if (targetIndex <= maxAllowedIndex) {
      onStepClick(stepId as CheckoutStepId);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Step Indicator */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          {/* Desktop: Full Step Indicator */}
          <div className="hidden md:block">
            <StepIndicator
              steps={checkoutSteps}
              currentStep={currentStep}
              completedSteps={calculatedCompletedSteps}
              orientation="horizontal"
              size="md"
              allowNavigation={allowStepNavigation}
              onStepClick={handleStepClick}
              variant="numbered"
            />
          </div>

          {/* Mobile: Compact Progress */}
          <div className="md:hidden">
            <MobileStepIndicator
              currentStep={currentStepIndex + 1}
              totalSteps={checkoutSteps.length}
              currentLabel={checkoutSteps[currentStepIndex]?.label || ""}
            />
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      {(buttonConfig.showPrev || buttonConfig.showNext || showSaveDraft) && (
        <div
          className={cn(
            "border-b bg-background",
            sticky && "sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          )}
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left side - Start Over & Previous */}
              <div className="flex items-center gap-3">
                {showStartOver && onStartOver && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onStartOver}
                    disabled={isLoading || isSavingDraft}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Start Over
                  </Button>
                )}

                {buttonConfig.showPrev && onPrevious && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onPrevious}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {buttonConfig.prev}
                  </Button>
                )}
              </div>

              {/* Right side - Save Draft & Next */}
              <div className="flex items-center gap-3">
                {showSaveDraft && onSaveDraft && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onSaveDraft}
                    disabled={isSavingDraft || isLoading}
                  >
                    {isSavingDraft ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Draft
                      </>
                    )}
                  </Button>
                )}

                {buttonConfig.showNext && onNext && (
                  <Button
                    type="submit"
                    onClick={onNext}
                    disabled={nextDisabled || isLoading}
                    className="min-w-[160px] gap-2"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner className="h-4 w-4" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {buttonConfig.next}
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SimpleCheckoutNavigation - Simplified navigation without step indicator
 * For use inside page content when step indicator is already shown in layout
 */
export interface SimpleCheckoutNavigationProps {
  /** Current step ID */
  currentStep: CheckoutStepId;
  /** Callback for previous button */
  onPrevious?: () => void;
  /** Callback for next button */
  onNext?: () => void;
  /** Whether next button is loading */
  isLoading?: boolean;
  /** Whether next button is disabled */
  nextDisabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SimpleCheckoutNavigation - Just the buttons, no step indicator
 */
export function SimpleCheckoutNavigation({
  currentStep,
  onPrevious,
  onNext,
  isLoading = false,
  nextDisabled = false,
  className,
}: SimpleCheckoutNavigationProps) {
  const buttonConfig = getStepButtonConfig(currentStep);

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {/* Left side - Previous */}
      <div>
        {buttonConfig.showPrev && onPrevious && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isLoading}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {buttonConfig.prev}
          </Button>
        )}
      </div>

      {/* Right side - Next */}
      <div>
        {buttonConfig.showNext && onNext && (
          <Button
            type="submit"
            onClick={onNext}
            disabled={nextDisabled || isLoading}
            className="min-w-[160px] gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="h-4 w-4" />
                Processing...
              </>
            ) : (
              <>
                {buttonConfig.next}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default CheckoutNavigation;
