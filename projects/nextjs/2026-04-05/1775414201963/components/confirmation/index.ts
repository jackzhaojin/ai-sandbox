/**
 * B2B Postal Checkout Flow - Confirmation Components
 * Components for Step 6: Confirmation/Success Page
 */

// Success Banner
export {
  SuccessBanner,
  type SuccessBannerProps,
} from "./SuccessBanner";

// Confirmation Section (reusable collapsible)
export {
  ConfirmationSection,
  type ConfirmationSectionProps,
  type ConfirmationSectionStatus,
} from "./ConfirmationSection";

// Pre-built Confirmation Sections
export {
  ShipmentReferenceSection,
  PickupConfirmationSection,
  DeliveryInformationSection,
  TrackingInformationSection,
  type ShipmentReferenceSectionProps,
  type PickupConfirmationSectionProps,
  type PickupStatus,
  type DeliveryInformationSectionProps,
  type TrackingInformationSectionProps,
  type TrackingNotificationPreference,
} from "./ConfirmationSections";
