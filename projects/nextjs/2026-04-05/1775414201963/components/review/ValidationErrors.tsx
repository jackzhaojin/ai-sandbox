"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, ChevronRight, AlertTriangle } from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface ValidationError {
  /** Unique error identifier */
  id: string;
  /** Error message to display */
  message: string;
  /** The step/section this error belongs to */
  step: CheckoutStep;
  /** Label for the step/section */
  stepLabel: string;
  /** URL to navigate to fix this error */
  href?: string;
  /** Callback when error link is clicked */
  onClick?: () => void;
  /** Error severity */
  severity?: "error" | "warning";
}

export type CheckoutStep =
  | "details"
  | "rates"
  | "payment"
  | "pickup"
  | "review"
  | "terms";

export interface ValidationErrorsProps {
  /** Array of validation errors to display */
  errors: ValidationError[];
  /** Additional CSS classes */
  className?: string;
  /** Callback when an error link is clicked (receives the error) */
  onErrorClick?: (error: ValidationError) => void;
  /** Whether to show the header with error count */
  showHeader?: boolean;
  /** Custom title for the alert */
  title?: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Group errors by step for organized display
 */
function groupErrorsByStep(errors: ValidationError[]): Map<CheckoutStep, ValidationError[]> {
  const grouped = new Map<CheckoutStep, ValidationError[]>();

  errors.forEach((error) => {
    const existing = grouped.get(error.step) || [];
    existing.push(error);
    grouped.set(error.step, existing);
  });

  return grouped;
}

/**
 * Get step order for sorting (to show errors in flow order)
 */
function getStepOrder(step: CheckoutStep): number {
  const order: Record<CheckoutStep, number> = {
    details: 1,
    rates: 2,
    payment: 3,
    pickup: 4,
    review: 5,
    terms: 5,
  };
  return order[step] || 99;
}

/**
 * Sort errors by step order, then by severity
 */
function sortErrors(errors: ValidationError[]): ValidationError[] {
  return [...errors].sort((a, b) => {
    // First sort by step order
    const stepDiff = getStepOrder(a.step) - getStepOrder(b.step);
    if (stepDiff !== 0) return stepDiff;

    // Then by severity (errors before warnings)
    if (a.severity === "error" && b.severity !== "error") return -1;
    if (a.severity !== "error" && b.severity === "error") return 1;

    return 0;
  });
}

// ============================================
// COMPONENT
// ============================================

/**
 * ValidationErrors - Red alert banner displaying pre-submission validation issues
 *
 * Features:
 * - Red alert banner with error icon
 * - Bulleted list of validation issues
 * - Each issue links to the relevant section/step
 * - Groups errors by step for better organization
 * - Supports both href navigation and onClick callbacks
 * - Distinguishes between errors and warnings
 */
export function ValidationErrors({
  errors,
  className,
  onErrorClick,
  showHeader = true,
  title = "Please fix the following issues before submitting",
}: ValidationErrorsProps) {
  if (errors.length === 0) {
    return null;
  }

  const sortedErrors = sortErrors(errors);
  const groupedErrors = groupErrorsByStep(sortedErrors);

  // Sort steps by order
  const sortedSteps = Array.from(groupedErrors.keys()).sort(
    (a, b) => getStepOrder(a) - getStepOrder(b)
  );

  const errorCount = errors.filter((e) => e.severity !== "warning").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;

  const handleErrorClick = (error: ValidationError) => {
    if (onErrorClick) {
      onErrorClick(error);
    }
  };

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-destructive/50 bg-destructive/5 p-4",
        className
      )}
    >
      {showHeader && (
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 mt-0.5">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-destructive">{title}</h3>
            <p className="text-sm text-destructive/80 mt-1">
              {errorCount > 0 && (
                <span>
                  {errorCount} error{errorCount !== 1 ? "s" : ""}
                </span>
              )}
              {errorCount > 0 && warningCount > 0 && " and "}
              {warningCount > 0 && (
                <span>
                  {warningCount} warning{warningCount !== 1 ? "s" : ""}
                </span>
              )}{" "}
              need to be resolved before you can submit your shipment.
            </p>
          </div>
        </div>
      )}

      <ul className="space-y-4">
        {sortedSteps.map((step) => {
          const stepErrors = groupedErrors.get(step) || [];

          return (
            <li key={step} className="space-y-2">
              {/* Step header */}
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive text-xs uppercase tracking-wider">
                  {stepErrors[0]?.stepLabel || step}
                </span>
              </div>

              {/* Errors for this step */}
              <ul className="space-y-1 ml-4">
                {stepErrors.map((error) => (
                  <li key={error.id}>
                    {error.href ? (
                      <a
                        href={error.href}
                        onClick={(e) => {
                          if (onErrorClick) {
                            e.preventDefault();
                            handleErrorClick(error);
                          }
                        }}
                        className={cn(
                          "group flex items-start gap-2 text-sm py-1 px-2 -mx-2 rounded-md transition-colors",
                          error.severity === "warning"
                            ? "text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-950/20"
                            : "text-destructive/90 hover:bg-destructive/10",
                          onErrorClick && "cursor-pointer"
                        )}
                      >
                        <span className="flex-shrink-0 mt-0.5">
                          {error.severity === "warning" ? (
                            <AlertTriangle className="h-4 w-4 text-warning-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </span>
                        <span className="flex-1">{error.message}</span>
                        <ChevronRight className="h-4 w-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-muted-foreground" />
                      </a>
                    ) : (
                      <button
                        onClick={() => handleErrorClick(error)}
                        disabled={!onErrorClick}
                        className={cn(
                          "w-full text-left group flex items-start gap-2 text-sm py-1 px-2 -mx-2 rounded-md transition-colors",
                          error.severity === "warning"
                            ? "text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-950/20"
                            : "text-destructive/90 hover:bg-destructive/10",
                          !onErrorClick && "cursor-default"
                        )}
                      >
                        <span className="flex-shrink-0 mt-0.5">
                          {error.severity === "warning" ? (
                            <AlertTriangle className="h-4 w-4 text-warning-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </span>
                        <span className="flex-1">{error.message}</span>
                        {onErrorClick && (
                          <ChevronRight className="h-4 w-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ============================================
// PRE-BUILT VALIDATION ERROR GENERATORS
// ============================================

export interface ShipmentValidationData {
  /** Whether step 1 (shipment details) is complete */
  step1Complete: boolean;
  /** Whether a quote/rate has been selected */
  quoteSelected: boolean;
  /** Whether payment method has been set */
  paymentSet: boolean;
  /** Whether pickup has been scheduled */
  pickupScheduled: boolean;
  /** Whether all terms have been accepted */
  termsAccepted: boolean;
  /** Whether the selected quote has expired */
  quoteExpired?: boolean;
  /** Quote expiry timestamp */
  quoteExpiryDate?: string;
  /** Whether the PO (if used) has expired */
  poExpired?: boolean;
  /** PO expiry timestamp */
  poExpiryDate?: string;
  /** Additional validation errors */
  additionalErrors?: Array<{
    id: string;
    message: string;
    step: CheckoutStep;
    stepLabel: string;
    severity?: "error" | "warning";
  }>;
}

/**
 * Generate validation errors based on shipment data
 * This runs complete checks across all steps
 */
export function generateValidationErrors(
  data: ShipmentValidationData
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Step 1: Shipment details
  if (!data.step1Complete) {
    errors.push({
      id: "step1-incomplete",
      message: "Shipment details are incomplete. Please provide origin, destination, and package information.",
      step: "details",
      stepLabel: "Step 1",
      href: "/shipments/new",
      severity: "error",
    });
  }

  // Step 2: Quote selection
  if (!data.quoteSelected) {
    errors.push({
      id: "quote-not-selected",
      message: "No shipping rate has been selected. Please choose a carrier and service.",
      step: "rates",
      stepLabel: "Step 2",
      href: "#rates",
      severity: "error",
    });
  }

  // Quote expiry check
  if (data.quoteExpired) {
    errors.push({
      id: "quote-expired",
      message: data.quoteExpiryDate
        ? `Your selected rate expired on ${new Date(data.quoteExpiryDate).toLocaleString()}. Please select a new rate.`
        : "Your selected rate has expired. Please select a new rate.",
      step: "rates",
      stepLabel: "Step 2",
      href: "#rates",
      severity: "error",
    });
  }

  // Step 3: Payment
  if (!data.paymentSet) {
    errors.push({
      id: "payment-not-set",
      message: "Payment method has not been configured. Please provide payment information.",
      step: "payment",
      stepLabel: "Step 3",
      href: "#payment",
      severity: "error",
    });
  }

  // PO expiry check
  if (data.poExpired) {
    errors.push({
      id: "po-expired",
      message: data.poExpiryDate
        ? `Your purchase order expired on ${new Date(data.poExpiryDate).toLocaleDateString()}. Please update your payment method.`
        : "Your purchase order has expired. Please update your payment method.",
      step: "payment",
      stepLabel: "Step 3",
      href: "#payment",
      severity: "error",
    });
  }

  // Step 4: Pickup
  if (!data.pickupScheduled) {
    errors.push({
      id: "pickup-not-scheduled",
      message: "Pickup has not been scheduled. Please select a pickup date and time.",
      step: "pickup",
      stepLabel: "Step 4",
      href: "#pickup",
      severity: "error",
    });
  }

  // Step 5: Terms
  if (!data.termsAccepted) {
    errors.push({
      id: "terms-not-accepted",
      message: "Terms and conditions have not been accepted. Please review and accept all required terms.",
      step: "terms",
      stepLabel: "Step 5",
      href: "#terms",
      severity: "error",
    });
  }

  // Add any additional errors
  if (data.additionalErrors) {
    errors.push(...data.additionalErrors.map((e) => ({ ...e, severity: e.severity || "error" })));
  }

  return errors;
}

/**
 * Check if shipment can be submitted based on validation
 */
export function canSubmitShipment(data: ShipmentValidationData): boolean {
  const errors = generateValidationErrors(data);
  // Only block submission for errors, not warnings
  return !errors.some((e) => e.severity !== "warning");
}

export default ValidationErrors;
