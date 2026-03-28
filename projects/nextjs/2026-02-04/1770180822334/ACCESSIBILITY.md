# Accessibility Features - WCAG 2.1 AA Compliance

This document outlines the accessibility features implemented in PageForge CMS to ensure WCAG 2.1 AA compliance.

## Table of Contents

- [Overview](#overview)
- [Global Accessibility Features](#global-accessibility-features)
- [Keyboard Navigation](#keyboard-navigation)
- [Screen Reader Support](#screen-reader-support)
- [Visual Accessibility](#visual-accessibility)
- [Accessibility Panel](#accessibility-panel)
- [User Preferences](#user-preferences)
- [Testing Guidelines](#testing-guidelines)

## Overview

PageForge CMS is built with accessibility as a core principle. All interactive components follow WCAG 2.1 AA guidelines to ensure the application is usable by everyone, including users with disabilities.

### Compliance Level

**Target:** WCAG 2.1 Level AA

### Key Features

- ✅ Keyboard navigation throughout the application
- ✅ Screen reader announcements for dynamic content
- ✅ Focus indicators on all interactive elements
- ✅ Alt text requirements for all images
- ✅ Reduced motion support
- ✅ Color contrast compliance
- ✅ Semantic HTML and ARIA labels
- ✅ Skip navigation links

## Global Accessibility Features

### Focus Indicators

All interactive elements have visible focus indicators that meet WCAG 2.1 AA requirements:

```css
/* Global focus indicator - 2px solid blue with 2px offset */
*:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}
```

**Never remove outline without replacement.** If custom focus styles are needed, always ensure they meet the minimum requirements:
- 2px minimum thickness
- Sufficient color contrast (3:1)
- Visible offset from the element

### Skip Navigation Links

Public pages include skip navigation links at the top of the page:

- **Skip to main content** - Jumps directly to the main content area
- **Skip to navigation** - Jumps to the site navigation menu

These links are hidden off-screen but become visible when focused with the keyboard.

### Semantic HTML

All components use semantic HTML elements:
- `<main>` for main content areas
- `<nav>` for navigation
- `<header>` and `<footer>` for page structure
- `<article>`, `<section>` for content organization
- Proper heading hierarchy (h1-h6)

## Keyboard Navigation

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Move focus forward |
| `Shift + Tab` | Move focus backward |
| `Enter` / `Space` | Activate focused element |
| `Escape` | Close modals, dialogs, dropdowns |
| `Cmd/Ctrl + K` | Open command palette (dashboard) |
| `Arrow Keys` | Navigate within components (carousels, tabs, etc.) |

### Tab Order

Tab order follows the visual reading order throughout the application:
1. Skip navigation links
2. Site navigation / Dashboard header
3. Main content area
4. Sidebar / Property panel
5. Footer

### Interactive Components

All interactive components are fully keyboard accessible:

#### Carousel
- **Arrow Left/Right**: Navigate slides
- **Space/Enter**: Play/pause autoplay
- **Tab**: Focus slide indicators

#### Accordion
- **Enter/Space**: Expand/collapse items
- **Tab**: Move between accordion items

#### Tabs
- **Arrow Left/Right**: Switch between tabs
- **Tab**: Move focus to tab panel content

#### Forms
- **Tab**: Move between form fields
- **Space**: Toggle checkboxes/radio buttons
- **Enter**: Submit forms

#### Modals
- **Escape**: Close modal
- **Tab**: Navigate within modal (focus trapped)

## Screen Reader Support

### ARIA Live Regions

Status updates and dynamic content changes are announced to screen readers using ARIA live regions:

```tsx
import { StatusAnnouncer } from '@/components/ui/aria-live'

// Usage
<StatusAnnouncer
  status="Page saved successfully"
  error={errorMessage}
/>
```

**Priority Levels:**
- `polite` - Waits for user to pause (default for status messages)
- `assertive` - Interrupts immediately (used for errors)

### ARIA Labels

All icon-only buttons include descriptive `aria-label` attributes:

```tsx
// ✅ Good
<button aria-label="Open search">
  <Search className="w-5 h-5" aria-hidden="true" />
</button>

// ❌ Bad
<button>
  <Search className="w-5 h-5" />
</button>
```

### Component Roles

All custom interactive components include appropriate ARIA roles:

- **Carousel**: `role="region"` with `aria-roledescription="carousel"`
- **Accordion**: `aria-expanded` and `aria-controls` on buttons
- **Tabs**: `role="tablist"`, `role="tab"`, `role="tabpanel"`
- **Modals**: `role="dialog"` with `aria-modal="true"`

## Visual Accessibility

### Color Contrast

All text meets WCAG 2.1 AA color contrast requirements:
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text (18pt+ or 14pt+ bold)**: Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio

The Accessibility Panel includes a color contrast checker to verify compliance.

### Image Alt Text

All images must have descriptive alt text:

1. **Media Library**: The `alt_text` field is included in the database schema
2. **Image Component**: Alt text field is marked as **required** in the property editor
3. **Warning Badges**: Images without alt text show a red warning badge in the media library

```tsx
// Image component always requires alt
<ImageEditor
  props={{ src, alt, caption }}
  onChange={updateProps}
/>
```

### Reduced Motion

Users who prefer reduced motion experience instant transitions instead of animations.

#### CSS Implementation

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

#### Component Support

All animated components respect the reduced motion preference:
- Carousels: Autoplay disabled, instant transitions
- Accordions: Instant expand/collapse
- Tabs: Instant panel switching
- Modals: Instant appear/disappear
- Parallax effects: Disabled

## Accessibility Panel

The page editor includes a comprehensive Accessibility Panel for auditing page content.

### Features

1. **Automated Auditing** - Powered by axe-core
   - Runs WCAG 2.1 AA compliance checks
   - Identifies violations, warnings, and passes
   - Provides fix suggestions and documentation links

2. **Heading Outline View**
   - Visual tree of heading hierarchy (h1-h6)
   - Helps ensure proper document structure
   - Identifies heading order issues

3. **Image Audit**
   - Lists all images on the page
   - Shows alt text status
   - Highlights missing or inadequate alt text

4. **Link Audit**
   - Lists all links
   - Flags generic link text ("click here", "read more")
   - Suggests more descriptive alternatives

5. **Color Contrast Checker**
   - Verifies text and background color contrast
   - Identifies contrast failures
   - Built into the violations tab

6. **Accessibility Score**
   - Overall page score (0-100%)
   - Visual progress indicator
   - Based on passed vs. failed checks

### Usage

1. Open the page editor
2. Click the "A11y" tab in the right sidebar
3. Click "Run Audit" to scan the current page
4. Review violations and make necessary changes
5. Re-run audit to verify fixes

## User Preferences

Users can customize their accessibility experience through the Accessibility Preferences panel.

### Available Preferences

1. **Reduce Motion**
   - Minimizes animations and transitions
   - Overrides system preference
   - Stored in localStorage

2. **High Contrast**
   - Increases contrast for better visibility
   - Applies stronger borders and colors

3. **Large Text**
   - Increases text size by 20%
   - Improves readability

### Implementation

```tsx
import {
  AccessibilityPreferencesProvider,
  useAccessibilityPreferences,
  AccessibilityPreferencesPanel
} from '@/lib/accessibility-preferences'

// Wrap app with provider
<AccessibilityPreferencesProvider>
  <App />
</AccessibilityPreferencesProvider>

// Use preferences in components
const { preferences } = useAccessibilityPreferences()

// Render preferences panel in settings
<AccessibilityPreferencesPanel />
```

## Testing Guidelines

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] Can navigate entire application using only keyboard
- [ ] Tab order follows logical reading order
- [ ] All interactive elements can be focused
- [ ] Focus indicators are visible on all elements
- [ ] Escape key closes modals and dropdowns
- [ ] Enter/Space activates buttons and links

#### Screen Reader Testing
- [ ] Test with VoiceOver (macOS) or NVDA (Windows)
- [ ] All images have descriptive alt text
- [ ] Form fields have associated labels
- [ ] Dynamic content changes are announced
- [ ] Error messages are announced
- [ ] Modal dialogs are properly announced
- [ ] All icon buttons have aria-labels

#### Visual Testing
- [ ] Verify color contrast with browser dev tools
- [ ] Test with browser zoom at 200%
- [ ] Test with reduced motion enabled
- [ ] Verify focus indicators are visible
- [ ] Check heading hierarchy (H1 → H2 → H3)

#### Automated Testing
- [ ] Run Accessibility Panel audit
- [ ] Fix all critical and serious violations
- [ ] Address moderate violations
- [ ] Run eslint with jsx-a11y rules enabled
- [ ] Achieve accessibility score above 90%

### Browser Extensions for Testing

- **axe DevTools** - Automated accessibility testing
- **WAVE** - Visual accessibility checker
- **Lighthouse** - Includes accessibility audit
- **Color Contrast Analyzer** - Verify contrast ratios

### Screen Reader Testing

#### macOS - VoiceOver
```bash
# Enable VoiceOver
Cmd + F5

# Navigate
VO + Right Arrow (next item)
VO + Left Arrow (previous item)
VO + Space (activate item)
```

#### Windows - NVDA
```bash
# Download NVDA from nvaccess.org

# Navigate
Down Arrow (next item)
Up Arrow (previous item)
Enter (activate item)
```

## Common Accessibility Issues and Fixes

### Issue: Missing Alt Text
**Problem:** Images without alt text
**Fix:** Add descriptive alt text in image component properties

### Issue: Low Color Contrast
**Problem:** Text is hard to read due to low contrast
**Fix:** Use the theme color picker with contrast warnings, or choose higher contrast colors

### Issue: Missing Form Labels
**Problem:** Form fields without associated labels
**Fix:** Always use `<label>` with `htmlFor` attribute

### Issue: Non-Descriptive Link Text
**Problem:** Links with generic text like "click here"
**Fix:** Use descriptive link text that explains the destination

### Issue: Broken Keyboard Navigation
**Problem:** Tab order is illogical or elements can't be focused
**Fix:** Ensure proper HTML structure and use `tabIndex` only when necessary

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WebAIM Resources](https://webaim.org/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

## Support

If you encounter any accessibility issues or have suggestions for improvements, please:
1. Open an issue in the project repository
2. Include details about the issue and your assistive technology setup
3. Provide steps to reproduce the issue

## Continuous Improvement

Accessibility is an ongoing commitment. We:
- Regularly audit pages with axe-core
- Test with screen readers and keyboard navigation
- Welcome feedback from users with disabilities
- Update components based on accessibility best practices
- Monitor WCAG guideline updates
