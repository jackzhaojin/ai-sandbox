"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Shield, AlertTriangle, Truck, Scale } from "lucide-react";
import { Link } from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface TermsAndConditionsProps {
  /** Current state of all terms acceptance */
  acceptedTerms: TermsState;
  /** Callback when any term acceptance changes */
  onChange: (terms: TermsState) => void;
  /** Declared value to determine insurance checkbox visibility */
  declaredValue?: number;
  /** Whether shipment contains hazardous materials */
  isHazmat?: boolean;
  /** Link to full terms document */
  termsDocumentUrl?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the form is disabled */
  disabled?: boolean;
}

export interface TermsState {
  /** Declared value is accurate */
  declaredValueAccurate: boolean;
  /** Insurance coverage understanding (required for $2,500+) */
  insuranceUnderstanding: boolean;
  /** Contents comply with regulations */
  contentsComply: boolean;
  /** Carrier authorized to ship */
  carrierAuthorized: boolean;
  /** Hazmat certification accurate (required for hazmat shipments) */
  hazmatCertificationAccurate: boolean;
}

export const defaultTermsState: TermsState = {
  declaredValueAccurate: false,
  insuranceUnderstanding: false,
  contentsComply: false,
  carrierAuthorized: false,
  hazmatCertificationAccurate: false,
};

// Insurance threshold - $2,500
const INSURANCE_THRESHOLD = 2500;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if all required terms are accepted
 */
export function areAllRequiredTermsAccepted(
  terms: TermsState,
  declaredValue?: number,
  isHazmat?: boolean
): boolean {
  const baseTerms = [
    terms.declaredValueAccurate,
    terms.contentsComply,
    terms.carrierAuthorized,
  ];

  // Insurance understanding required for high-value shipments
  if ((declaredValue || 0) >= INSURANCE_THRESHOLD) {
    baseTerms.push(terms.insuranceUnderstanding);
  }

  // Hazmat certification required for hazmat shipments
  if (isHazmat) {
    baseTerms.push(terms.hazmatCertificationAccurate);
  }

  return baseTerms.every(Boolean);
}

/**
 * Get list of unaccepted required terms
 */
export function getUnacceptedTerms(
  terms: TermsState,
  declaredValue?: number,
  isHazmat?: boolean
): string[] {
  const unaccepted: string[] = [];

  if (!terms.declaredValueAccurate) {
    unaccepted.push("Declared value accuracy");
  }

  if ((declaredValue || 0) >= INSURANCE_THRESHOLD && !terms.insuranceUnderstanding) {
    unaccepted.push("Insurance coverage understanding");
  }

  if (!terms.contentsComply) {
    unaccepted.push("Contents compliance with regulations");
  }

  if (!terms.carrierAuthorized) {
    unaccepted.push("Carrier authorization");
  }

  if (isHazmat && !terms.hazmatCertificationAccurate) {
    unaccepted.push("Hazmat certification accuracy");
  }

  return unaccepted;
}

// ============================================
// COMPONENT
// ============================================

/**
 * TermsAndConditions - Component for accepting required terms and conditions
 *
 * Features:
 * - 4-5 required checkboxes depending on shipment characteristics
 * - Conditional insurance understanding checkbox for high-value shipments ($2,500+)
 * - Conditional hazmat certification checkbox for hazardous materials
 * - Link to full terms document
 * - Real-time validation state tracking
 */
export function TermsAndConditions({
  acceptedTerms,
  onChange,
  declaredValue = 0,
  isHazmat = false,
  termsDocumentUrl = "/terms-of-service",
  className,
  disabled = false,
}: TermsAndConditionsProps) {
  const needsInsurance = declaredValue >= INSURANCE_THRESHOLD;

  const handleTermChange = (term: keyof TermsState, checked: boolean) => {
    onChange({
      ...acceptedTerms,
      [term]: checked,
    });
  };

  const allRequiredAccepted = areAllRequiredTermsAccepted(
    acceptedTerms,
    declaredValue,
    isHazmat
  );

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Terms & Conditions</CardTitle>
            <CardDescription>
              Please review and accept the following terms before submitting
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Required Terms Checkboxes */}
        <div className="space-y-4">
          {/* Declared Value Accuracy */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="term-declared-value"
              checked={acceptedTerms.declaredValueAccurate}
              onCheckedChange={(checked) =>
                handleTermChange("declaredValueAccurate", checked as boolean)
              }
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex-1">
              <label
                htmlFor="term-declared-value"
                className={cn(
                  "text-sm font-medium cursor-pointer",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <span className="flex items-center gap-2">
                  <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                  Declared Value Accuracy
                </span>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                I confirm that the declared value of{" "}
                <strong>{new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(declaredValue)}</strong>{" "}
                accurately represents the actual value of the goods being shipped.
              </p>
            </div>
          </div>

          {/* Insurance Understanding (Conditional - $2,500+) */}
          {needsInsurance && (
            <div className="flex items-start gap-3 rounded-lg bg-warning-50/50 dark:bg-warning-950/20 p-3 border border-warning-200 dark:border-warning-800">
              <Checkbox
                id="term-insurance"
                checked={acceptedTerms.insuranceUnderstanding}
                onCheckedChange={(checked) =>
                  handleTermChange("insuranceUnderstanding", checked as boolean)
                }
                disabled={disabled}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label
                  htmlFor="term-insurance"
                  className={cn(
                    "text-sm font-medium cursor-pointer text-warning-700 dark:text-warning-400",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5" />
                    Insurance Coverage Understanding
                    <span className="text-xs bg-warning-100 dark:bg-warning-900 text-warning-700 dark:text-warning-300 px-1.5 py-0.5 rounded">
                      Required for high value
                    </span>
                  </span>
                </label>
                <p className="text-xs text-warning-600/80 dark:text-warning-400/80 mt-1">
                  I understand that shipments valued at $2,500 or more require
                  additional insurance coverage. I acknowledge that standard carrier
                  liability may be limited and have elected appropriate coverage for
                  this shipment.
                </p>
              </div>
            </div>
          )}

          {/* Contents Compliance */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="term-contents"
              checked={acceptedTerms.contentsComply}
              onCheckedChange={(checked) =>
                handleTermChange("contentsComply", checked as boolean)
              }
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex-1">
              <label
                htmlFor="term-contents"
                className={cn(
                  "text-sm font-medium cursor-pointer",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Contents Compliance with Regulations
                </span>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                I confirm that the contents of this shipment comply with all
                applicable federal, state, and international shipping regulations.
                The shipment does not contain any prohibited or restricted items
                (except as declared).
              </p>
            </div>
          </div>

          {/* Carrier Authorization */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="term-carrier"
              checked={acceptedTerms.carrierAuthorized}
              onCheckedChange={(checked) =>
                handleTermChange("carrierAuthorized", checked as boolean)
              }
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex-1">
              <label
                htmlFor="term-carrier"
                className={cn(
                  "text-sm font-medium cursor-pointer",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <span className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                  Carrier Authorization
                </span>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                I authorize the selected carrier and their agents to transport this
                shipment according to their terms of service. I understand that
                delivery times are estimates and may be affected by factors beyond
                the carrier&apos;s control.
              </p>
            </div>
          </div>

          {/* Hazmat Certification (Conditional) */}
          {isHazmat && (
            <div className="flex items-start gap-3 rounded-lg bg-destructive/5 dark:bg-destructive/10 p-3 border border-destructive/20">
              <Checkbox
                id="term-hazmat"
                checked={acceptedTerms.hazmatCertificationAccurate}
                onCheckedChange={(checked) =>
                  handleTermChange("hazmatCertificationAccurate", checked as boolean)
                }
                disabled={disabled}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label
                  htmlFor="term-hazmat"
                  className={cn(
                    "text-sm font-medium cursor-pointer text-destructive",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Hazmat Certification Accuracy
                    <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                      Required for hazmat
                    </span>
                  </span>
                </label>
                <p className="text-xs text-destructive/80 mt-1">
                  I certify that all hazardous materials have been properly
                  classified, packaged, marked, labeled, and documented according to
                  applicable dangerous goods regulations (DOT, IATA, IMDG). I
                  understand that misdeclaration of hazardous materials is a
                  federal offense.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Full Terms Link */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            By checking the boxes above, you agree to our{" "}
            <a
              href={termsDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
            >
              Terms of Service
              <Link className="h-3 w-3" />
            </a>{" "}
            and acknowledge that you have read and understand our{" "}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
            >
              Privacy Policy
              <Link className="h-3 w-3" />
            </a>
            .
          </p>
        </div>

        {/* Status Summary */}
        <div
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg text-sm",
            allRequiredAccepted
              ? "bg-success-50 text-success-700 border border-success-200"
              : "bg-muted text-muted-foreground border border-border"
          )}
        >
          {allRequiredAccepted ? (
            <>
              <div className="h-2 w-2 rounded-full bg-success-500" />
              <span>All required terms accepted</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-pulse" />
              <span>
                {getUnacceptedTerms(acceptedTerms, declaredValue, isHazmat).length} term
                {getUnacceptedTerms(acceptedTerms, declaredValue, isHazmat).length !== 1
                  ? "s"
                  : ""}{" "}
                remaining to accept
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TermsAndConditions;
