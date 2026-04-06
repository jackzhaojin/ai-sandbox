"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckoutNavigation } from "./CheckoutNavigation";
import type { CheckoutStepId } from "@/hooks/use-checkout-navigation";

/**
 * CheckoutLayoutProps - Props for the checkout layout wrapper
 */
export interface CheckoutLayoutProps {
  /** Page content */
  children: React.ReactNode;
  /** Current step ID */
  currentStep: CheckoutStepId;
  /** Highest step index completed */
  completedStepIndex?: number;
  /** Callback for step click */
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
  /** Additional CSS classes for main content */
  className?: string;
  /** Additional CSS classes */
  contentClassName?: string;
  /** Whether to allow step navigation */
  allowStepNavigation?: boolean;
  /** Show save draft button */
  showSaveDraft?: boolean;
  /** Show start over button */
  showStartOver?: boolean;
}

/**
 * CheckoutLayout - Master layout wrapper for checkout pages
 * 
 * Combines step indicator with navigation buttons and provides consistent
 * layout structure for all checkout steps.
 * 
 * @example
 * <CheckoutLayout
 *   currentStep="details"
 *   onPrevious={handlePrevious}
 *   onNext={handleNext}
 *   onSaveDraft={handleSaveDraft}
 *   isLoading={isSubmitting}
 * >
 *   <ShipmentDetailsForm />
 * </CheckoutLayout>
 */
export function CheckoutLayout({
  children,
  currentStep,
  completedStepIndex,
  onStepClick,
  onPrevious,
  onNext,
  onSaveDraft,
  onStartOver,
  isLoading = false,
  isSavingDraft = false,
  nextDisabled = false,
  className,
  contentClassName,
  allowStepNavigation = true,
  showSaveDraft = true,
  showStartOver = true,
}: CheckoutLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Navigation with Step Indicator */}
      <CheckoutNavigation
        currentStep={currentStep}
        completedStepIndex={completedStepIndex}
        allowStepNavigation={allowStepNavigation}
        onStepClick={onStepClick}
        onPrevious={onPrevious}
        onNext={onNext}
        onSaveDraft={onSaveDraft}
        onStartOver={onStartOver}
        isLoading={isLoading}
        isSavingDraft={isSavingDraft}
        nextDisabled={nextDisabled}
        showSaveDraft={showSaveDraft}
        showStartOver={showStartOver}
        sticky
      />

      {/* Main Content */}
      <main
        className={cn(
          "container mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8",
          contentClassName
        )}
        role="main"
        aria-label={`${currentStep} step content`}
      >
        {children}
      </main>
    </div>
  );
}

export default CheckoutLayout;
