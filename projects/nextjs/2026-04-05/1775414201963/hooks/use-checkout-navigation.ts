"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Shipment } from "@/types/database";

/**
 * Checkout step definitions with labels and descriptions
 */
export const checkoutSteps = [
  { id: "details", label: "Shipment Details", description: "Enter package info" },
  { id: "rates", label: "Select Rate", description: "Choose shipping method" },
  { id: "payment", label: "Payment", description: "Payment method" },
  { id: "pickup", label: "Schedule Pickup", description: "Pickup details" },
  { id: "review", label: "Review & Confirm", description: "Final review" },
  { id: "confirm", label: "Confirmation", description: "Order complete" },
] as const;

export type CheckoutStepId = typeof checkoutSteps[number]["id"];

/**
 * Dynamic button labels based on current step
 */
export const getStepButtonLabels = (stepId: CheckoutStepId): { prev: string; next: string } => {
  const labels: Record<CheckoutStepId, { prev: string; next: string }> = {
    details: { prev: "", next: "Get Quotes" },
    rates: { prev: "Back", next: "Continue to Payment" },
    payment: { prev: "Back", next: "Continue to Pickup" },
    pickup: { prev: "Back", next: "Continue to Review" },
    review: { prev: "Back", next: "Submit Shipment" },
    confirm: { prev: "", next: "" },
  };
  return labels[stepId];
};

/**
 * Get step index from step ID
 */
export const getStepIndex = (stepId: CheckoutStepId): number => {
  return checkoutSteps.findIndex((s) => s.id === stepId);
};

/**
 * Get step ID from index
 */
export const getStepId = (index: number): CheckoutStepId => {
  return checkoutSteps[index]?.id ?? "details";
};

/**
 * Get route path for a step
 */
export const getStepPath = (stepId: CheckoutStepId, shipmentId?: string): string => {
  switch (stepId) {
    case "details":
      return "/shipments/new";
    case "rates":
      return shipmentId ? `/shipments/${shipmentId}/rates` : "/shipments/new";
    case "payment":
      return shipmentId ? `/shipments/${shipmentId}/payment` : "/shipments/new";
    case "pickup":
      return shipmentId ? `/shipments/${shipmentId}/pickup` : "/shipments/new";
    case "review":
      return shipmentId ? `/shipments/${shipmentId}/review` : "/shipments/new";
    case "confirm":
      return shipmentId ? `/shipments/${shipmentId}/confirm` : "/shipments/new";
    default:
      return "/shipments/new";
  }
};

/**
 * Step completion status for navigation
 */
export interface StepStatus {
  stepId: CheckoutStepId;
  isCompleted: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
}

/**
 * Auto-save result
 */
export interface AutoSaveResult {
  success: boolean;
  shipment?: Shipment;
  error?: string;
}

/**
 * UseCheckoutNavigation hook options
 */
export interface UseCheckoutNavigationOptions {
  /** Current step ID */
  currentStep: CheckoutStepId;
  /** Shipment ID for linking steps */
  shipmentId?: string;
  /** Highest completed step index */
  completedStepIndex?: number;
  /** Whether to enable step click navigation */
  allowStepNavigation?: boolean;
  /** Custom validation function for current step */
  validateStep?: () => boolean | Promise<boolean>;
  /** Called before navigation */
  onBeforeNavigate?: (fromStep: CheckoutStepId, toStep: CheckoutStepId) => Promise<boolean>;
  /** Called after successful navigation */
  onAfterNavigate?: (step: CheckoutStepId) => void;
}

/**
 * UseCheckoutNavigation hook return type
 */
export interface UseCheckoutNavigationReturn {
  /** Current step ID */
  currentStep: CheckoutStepId;
  /** Current step index (0-based) */
  currentStepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Array of completed step IDs */
  completedSteps: CheckoutStepId[];
  /** Whether we're on the first step */
  isFirstStep: boolean;
  /** Whether we're on the last step */
  isLastStep: boolean;
  /** Status for each step */
  stepStatuses: StepStatus[];
  /** Whether navigation is in progress */
  isNavigating: boolean;
  /** Whether auto-save is in progress */
  isSaving: boolean;
  /** Navigate to a specific step */
  goToStep: (stepId: CheckoutStepId) => Promise<void>;
  /** Navigate to the next step */
  goToNext: () => Promise<void>;
  /** Navigate to the previous step */
  goToPrevious: () => Promise<void>;
  /** Navigate to a step by clicking on it (respects completion status) */
  handleStepClick: (stepId: CheckoutStepId) => void;
  /** Save current progress as draft */
  saveAsDraft: () => Promise<boolean>;
  /** Start over - clear progress */
  startOver: () => void;
  /** Auto-save current step data */
  autoSave: (data: Record<string, unknown>) => Promise<AutoSaveResult>;
  /** Button labels for current step */
  buttonLabels: { prev: string; next: string };
  /** Create a step completed event */
  createStepEvent: (stepId: CheckoutStepId, eventType: string, metadata?: Record<string, unknown>) => Promise<void>;
}

/**
 * Hook for managing checkout navigation with progress tracking
 * 
 * @example
 * const navigation = useCheckoutNavigation({
 *   currentStep: 'details',
 *   shipmentId: '123',
 *   completedStepIndex: 0,
 *   validateStep: () => form.formState.isValid,
 * });
 */
export function useCheckoutNavigation(options: UseCheckoutNavigationOptions): UseCheckoutNavigationReturn {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const currentStepIndex = getStepIndex(options.currentStep);
  const totalSteps = checkoutSteps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Calculate completed steps based on completedStepIndex
  const completedSteps = React.useMemo(() => {
    const index = options.completedStepIndex ?? currentStepIndex - 1;
    return checkoutSteps
      .slice(0, Math.max(0, index + 1))
      .map((s) => s.id);
  }, [options.completedStepIndex, currentStepIndex]);

  // Calculate step statuses
  const stepStatuses = React.useMemo(() => {
    return checkoutSteps.map((step, index) => ({
      stepId: step.id,
      isCompleted: index <= (options.completedStepIndex ?? currentStepIndex - 1),
      isCurrent: step.id === options.currentStep,
      isUpcoming: index > currentStepIndex,
    }));
  }, [options.currentStep, options.completedStepIndex, currentStepIndex]);

  /**
   * Auto-save shipment data to Supabase
   */
  const autoSave = React.useCallback(async (data: Record<string, unknown>): Promise<AutoSaveResult> => {
    if (!options.shipmentId) {
      return { success: false, error: "No shipment ID available" };
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/shipments/${options.shipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          current_step: options.currentStep,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to save progress");
      }

      const result = await response.json();
      
      // Create step event for tracking
      await createStepEvent(options.currentStep, "step_saved", {
        timestamp: new Date().toISOString(),
      });

      return { success: true, shipment: result.data?.shipment };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save progress";
      console.error("Auto-save failed:", error);
      return { success: false, error: message };
    } finally {
      setIsSaving(false);
    }
  }, [options.shipmentId, options.currentStep]);

  /**
   * Create a step event for tracking
   */
  const createStepEvent = React.useCallback(async (
    stepId: CheckoutStepId,
    eventType: string,
    metadata?: Record<string, unknown>
  ): Promise<void> => {
    if (!options.shipmentId) return;

    try {
      // We'll use the activity log for step events
      await fetch(`/api/shipments/${options.shipmentId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_code: eventType,
          event_name: `${stepId}_${eventType}`,
          metadata: {
            step_id: stepId,
            step_index: getStepIndex(stepId),
            ...metadata,
          },
        }),
      });
    } catch (error) {
      // Silently fail - event logging is non-critical
      console.warn("Failed to create step event:", error);
    }
  }, [options.shipmentId]);

  /**
   * Navigate to a specific step
   */
  const goToStep = React.useCallback(async (targetStepId: CheckoutStepId) => {
    if (isNavigating || targetStepId === options.currentStep) return;

    // Check if we can navigate to the target step
    const targetIndex = getStepIndex(targetStepId);
    const maxAllowedIndex = options.completedStepIndex ?? currentStepIndex;

    // Only allow navigation to completed steps or the next upcoming step
    if (targetIndex > maxAllowedIndex + 1) {
      toast.error("Please complete the previous steps first");
      return;
    }

    setIsNavigating(true);
    try {
      // Run before navigation callback
      if (options.onBeforeNavigate) {
        const canProceed = await options.onBeforeNavigate(options.currentStep, targetStepId);
        if (!canProceed) return;
      }

      // Navigate to the step
      const path = getStepPath(targetStepId, options.shipmentId);
      router.push(path);

      // Run after navigation callback
      options.onAfterNavigate?.(targetStepId);
    } catch (error) {
      console.error("Navigation failed:", error);
      toast.error("Failed to navigate. Please try again.");
    } finally {
      setIsNavigating(false);
    }
  }, [
    isNavigating,
    options.currentStep,
    options.shipmentId,
    options.completedStepIndex,
    currentStepIndex,
    options.onBeforeNavigate,
    options.onAfterNavigate,
    router,
  ]);

  /**
   * Navigate to the next step
   */
  const goToNext = React.useCallback(async () => {
    if (isLastStep || isNavigating) return;

    // Validate current step
    if (options.validateStep) {
      const isValid = await options.validateStep();
      if (!isValid) {
        toast.error("Please fix the errors before continuing");
        return;
      }
    }

    const nextStep = getStepId(currentStepIndex + 1);
    await goToStep(nextStep);
  }, [
    isLastStep,
    isNavigating,
    currentStepIndex,
    options.validateStep,
    goToStep,
  ]);

  /**
   * Navigate to the previous step
   */
  const goToPrevious = React.useCallback(async () => {
    if (isFirstStep || isNavigating) return;

    const prevStep = getStepId(currentStepIndex - 1);
    await goToStep(prevStep);
  }, [isFirstStep, isNavigating, currentStepIndex, goToStep]);

  /**
   * Handle step click from StepIndicator
   */
  const handleStepClick = React.useCallback((stepId: CheckoutStepId) => {
    if (!options.allowStepNavigation) return;

    const stepStatus = stepStatuses.find((s) => s.stepId === stepId);
    if (!stepStatus) return;

    // Allow clicking on completed steps to go back
    if (stepStatus.isCompleted) {
      goToStep(stepId);
    }
  }, [options.allowStepNavigation, stepStatuses, goToStep]);

  /**
   * Save as draft
   */
  const saveAsDraft = React.useCallback(async (): Promise<boolean> => {
    if (!options.shipmentId) {
      toast.error("No shipment to save");
      return false;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/shipments/${options.shipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "draft",
          current_step: options.currentStep,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save draft");
      }

      await createStepEvent(options.currentStep, "draft_saved");
      toast.success("Draft saved successfully");
      return true;
    } catch (error) {
      toast.error("Failed to save draft");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [options.shipmentId, options.currentStep, createStepEvent]);

  /**
   * Start over - clear form and redirect to first step
   */
  const startOver = React.useCallback(() => {
    if (confirm("Are you sure you want to start over? All progress will be lost.")) {
      // Clear any local storage or session data if used
      localStorage.removeItem("shipmentDraft");
      
      // Redirect to first step
      router.push("/shipments/new");
      toast.info("Starting over...");
    }
  }, [router]);

  // Get button labels for current step
  const buttonLabels = getStepButtonLabels(options.currentStep);

  return {
    currentStep: options.currentStep,
    currentStepIndex,
    totalSteps,
    completedSteps,
    isFirstStep,
    isLastStep,
    stepStatuses,
    isNavigating,
    isSaving,
    goToStep,
    goToNext,
    goToPrevious,
    handleStepClick,
    saveAsDraft,
    startOver,
    autoSave,
    buttonLabels,
    createStepEvent,
  };
}

export default useCheckoutNavigation;
