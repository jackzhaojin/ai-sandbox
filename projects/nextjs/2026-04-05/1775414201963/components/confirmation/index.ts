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

// Package Documentation Section
export {
  PackageDocumentationSection,
  type PackageDocumentationSectionProps,
  type DocumentItem,
  type DocumentStatus,
  type DocumentType,
} from "./PackageDocumentationSection";

// Contact Information Section
export {
  ContactInformationSection,
  type ContactInformationSectionProps,
  type CustomerServiceContact,
  type AccountManagerInfo,
  type ClaimsDepartmentInfo,
  type EmergencyContactInfo,
} from "./ContactInformationSection";

// Next Steps Checklist Section
export {
  NextStepsChecklistSection,
  type NextStepsChecklistSectionProps,
  type ChecklistTask,
  type TaskPriority,
  type TaskStatus,
} from "./NextStepsChecklistSection";

// Additional Actions Section
export {
  AdditionalActionsSection,
  type AdditionalActionsSectionProps,
  type InsuranceOption,
  type HoldLocation,
} from "./AdditionalActionsSection";

// Recent Shipments Component
export {
  RecentShipments,
  type RecentShipmentsProps,
  type RecentShipment,
  type ShipmentStatus,
} from "./RecentShipments";
