// Components - Main export file

// UI Components (shadcn/ui)
export * from "./ui"

// Shared Components - export with explicit naming to avoid conflicts
export {
  FormField as SharedFormField,
  type FormFieldProps,
  AddressInput,
  type AddressInputProps,
  type AddressInputValue,
  ContactInput,
  type ContactInputProps,
  type ContactInputValue,
  CopyButton,
  type CopyButtonProps,
  LoadingSpinner,
  LoadingOverlay,
  Skeleton,
  type LoadingSpinnerProps,
  type LoadingOverlayProps,
  type SkeletonProps,
  AppErrorBoundary,
  ErrorFallback,
  type ErrorBoundaryProps,
  type ErrorBoundaryState,
  type ErrorFallbackProps,
  StatusIndicator,
  FeeBadge,
  AvailabilityBadge,
  type StatusIndicatorProps,
  type StatusType,
  type FeeBadgeProps,
  type AvailabilityBadgeProps,
  ContextualHelp,
  HelpPanel,
  HelpTopic,
  type ContextualHelpProps,
  type HelpPanelProps,
  type HelpTopicProps,
  ProgressIndicator,
  StepProgressBar,
  type ProgressIndicatorProps,
  type Step,
  type StepProgressBarProps,
  StepIndicator,
  MobileStepIndicator,
  type StepIndicatorProps,
  type Step as StepIndicatorStep,
  type MobileStepIndicatorProps,
} from "./shared"

// Layout Components
export {
  Header,
  Footer,
  Navigation,
  StepNavigation,
  MobileNavigation,
  ShippingLayout,
  CheckoutLayout,
  type HeaderProps,
  type NavItem,
  type FooterProps,
  type FooterColumn,
  type FooterLink,
  type NavigationProps,
  type StepNavigationProps,
  type MobileNavigationProps,
  type ShippingLayoutProps,
  type CheckoutLayoutProps,
} from "./layout"

// Pricing Components
export {
  PricingCard,
  type PricingCardProps,
  PriceBreakdown,
  type PriceBreakdownProps,
} from "./pricing"

// Payment Components
export {
  PaymentMethodSelector,
  type PaymentMethodSelectorProps,
  type PaymentMethodOption,
  type PaymentMethodConfig,
  PurchaseOrderForm,
  type PurchaseOrderFormData,
  type PurchaseOrderFormProps,
  BillOfLadingForm,
  type BillOfLadingFormData,
  type BillOfLadingFormProps,
  type FreightTerm,
  ThirdPartyBillingForm,
  type ThirdPartyBillingFormData,
  type ThirdPartyBillingFormProps,
} from "./payment"

// Pickup Components
export {
  PickupCalendar,
  type PickupCalendarProps,
} from "./pickup"
