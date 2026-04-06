/**
 * B2B Postal Checkout Flow - Review Components
 * Components for Step 5: Review & Confirm
 */

// Main components
export {
  ShipmentSummaryCard,
  ShipmentSummaryCardSkeleton,
  type ShipmentSummaryCardProps,
} from "./ShipmentSummaryCard";

export {
  ReviewSection,
  OriginDetailsSection,
  DestinationDetailsSection,
  PackageDetailsSection,
  PricingBreakdownSection,
  PaymentInformationSection,
  PickupScheduleSection,
  type ReviewSectionProps,
  type ReviewSectionStatus,
  type KeyValuePair,
  type OriginDetailsSectionProps,
  type DestinationDetailsSectionProps,
  type PackageDetailsSectionProps,
  type PricingBreakdownSectionProps,
  type PaymentInformationSectionProps,
  type PaymentMethodType,
  type PickupScheduleSectionProps,
} from "./ReviewSection";

// Terms and Conditions
export {
  TermsAndConditions,
  defaultTermsState,
  areAllRequiredTermsAccepted,
  getUnacceptedTerms,
  type TermsAndConditionsProps,
  type TermsState,
} from "./TermsAndConditions";

// Validation Errors
export {
  ValidationErrors,
  generateValidationErrors,
  canSubmitShipment,
  type ValidationErrorsProps,
  type ValidationError,
  type CheckoutStep,
  type ShipmentValidationData,
} from "./ValidationErrors";
