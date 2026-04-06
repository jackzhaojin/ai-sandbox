// Accessibility Components and Hooks
// WCAG 2.1 AA Compliance Utilities

export { SkipLink } from "@/components/shared/SkipLink"
export type { SkipLinkProps } from "@/components/shared/SkipLink"

export {
  AccessibilityProvider,
  useAccessibility,
} from "./AccessibilityProvider"
export type { AccessibilityProviderProps } from "./AccessibilityProvider"

export { useFocusTrap } from "./useFocusTrap"
export type { UseFocusTrapOptions } from "./useFocusTrap"

export { useAnnouncer, Announcer } from "./useAnnouncer"
export type { UseAnnouncerOptions, UseAnnouncerReturn } from "./useAnnouncer"

// Re-export VisuallyHidden for text that should be hidden visually but available to screen readers
export { default as VisuallyHidden } from "./VisuallyHidden"
export type { VisuallyHiddenProps } from "./VisuallyHidden"

// Live Region components for announcing dynamic content
export {
  LiveRegion,
  LoadingAnnouncement,
  FormValidationAnnouncement,
} from "./LiveRegion"
export type {
  LiveRegionProps,
  LoadingAnnouncementProps,
  FormValidationAnnouncementProps,
} from "./LiveRegion"
