# Accessibility Documentation
## B2B Postal Checkout - WCAG 2.1 AA Compliance

This document outlines the accessibility features implemented in the B2B Postal Checkout application, ensuring compliance with WCAG 2.1 Level AA standards.

---

## Table of Contents

1. [Overview](#overview)
2. [Keyboard Navigation](#keyboard-navigation)
3. [Screen Reader Support](#screen-reader-support)
4. [Focus Management](#focus-management)
5. [Color Contrast](#color-contrast)
6. [Form Accessibility](#form-accessibility)
7. [Dynamic Content Announcements](#dynamic-content-announcements)
8. [Component Guidelines](#component-guidelines)

---

## Overview

Our application meets WCAG 2.1 Level AA requirements through:

- **2.1 Keyboard Accessible**: All functionality is available via keyboard
- **2.4 Navigable**: Multiple ways to navigate, consistent focus order
- **3.3 Input Assistance**: Labels, error prevention, and error identification
- **4.1 Compatible**: Name, role, value for all UI components

---

## Keyboard Navigation

### Skip Links

Skip links allow keyboard users to bypass repetitive navigation:

```tsx
// First focusable element on every page
<SkipLink targetId="main-content">Skip to main content</SkipLink>
<SkipLink targetId="navigation">Skip to navigation</SkipLink>
```

**Key Features:**
- Visible only when focused (appears at top-left)
- High contrast styling
- Smooth scroll to target
- Sets focus on target element

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Move to next focusable element |
| `Shift + Tab` | Move to previous focusable element |
| `Enter` | Activate buttons, submit forms, select cards |
| `Space` | Toggle checkboxes, expand/collapse |
| `Escape` | Close modals, dialogs, panels |
| `Arrow Keys` | Navigate radio groups, selects, dropdowns |
| `Home` | First item in list/group |
| `End` | Last item in list/group |

### Focusable Elements

All interactive elements are keyboard accessible:
- Buttons (including icon-only buttons with aria-label)
- Links
- Form inputs (text, select, checkbox, radio)
- Pricing cards (Enter/Space to select)
- Modal dialogs (focus trapped within)

---

## Screen Reader Support

### ARIA Live Regions

Dynamic content changes are announced via live regions:

```tsx
import { LiveRegion, LoadingAnnouncement, FormValidationAnnouncement } from "@/components/accessibility"

// Loading states
<LoadingAnnouncement 
  isLoading={isFetching}
  loadingMessage="Fetching shipping quotes..."
  successMessage="Quotes loaded successfully"
/>

// Form validation
<FormValidationAnnouncement 
  errorCount={3}
  wasSubmitted={true}
/>

// Custom announcements
const { announcePolite, announceAssertive } = useAccessibility()
announcePolite("Step 2 completed")
announceAssertive("Error: Please fix the form")
```

### Semantic HTML

- Proper heading hierarchy (`h1` → `h2` → `h3`)
- Landmark regions (`<header>`, `<main>`, `<footer>`, `<nav>`)
- Lists for grouped items (`<ul>`, `<ol>`, `<li>`)
- Tables for data (with proper headers)

### ARIA Attributes

Common patterns used throughout:

```tsx
// Buttons with icons only
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" />
</button>

// Required fields
<input aria-required="true" />
<span aria-hidden="true">*</span>
<span className="sr-only">(required)</span>

// Error states
<input aria-invalid="true" aria-describedby="error-id" />
<span id="error-id" role="alert">Error message</span>

// Progress indicators
<div role="progressbar" aria-valuenow={2} aria-valuemin={1} aria-valuemax={6}>

// Step indicator
<div aria-current="step">Current step</div>
```

---

## Focus Management

### Focus Indicators

All interactive elements have visible focus indicators:

```css
/* Default focus style */
:focus-visible {
  outline: none;
  ring: 2px solid var(--ring);
  ring-offset: 2px;
  ring-offset-color: var(--background);
}
```

### Focus Trap

Modals and dialogs trap focus within their content:

```tsx
import { useFocusTrap } from "@/components/accessibility"

function Modal({ isOpen, onClose }) {
  const containerRef = useFocusTrap({
    isActive: isOpen,
    onEscape: onClose,
  })
  
  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      {/* Modal content */}
    </div>
  )
}
```

### Focus Restoration

When closing modals/dialogs, focus returns to the triggering element.

---

## Color Contrast

All text meets WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text/UI components).

### Contrast Ratios

| Color Pair | Ratio | Passes AA |
|------------|-------|-----------|
| Foreground on Background | 21:1 | ✓ |
| Primary on Background | 4.6:1 | ✓ |
| Muted Foreground on Background | 4.5:1 | ✓ |
| Error on Background | 5.2:1 | ✓ |
| Success on Background | 4.5:1 | ✓ |

### Error Identification

Errors are identified with:
1. Text description (not color alone)
2. Icon indicator
3. Error color styling
4. ARIA attributes

```tsx
<p className="text-error-600 flex items-center gap-1.5" role="alert">
  <AlertCircle className="h-4 w-4" aria-hidden="true" />
  Please enter a valid email address
</p>
```

---

## Form Accessibility

### Labels

All inputs have associated labels:

```tsx
// Explicit label association
<label htmlFor="email">Email Address</label>
<input id="email" type="email" />

// Or using FormField component
<FormField label="Email Address" required>
  <Input type="email" />
</FormField>
```

### Error Messages

Errors are announced and described:

```tsx
<FormField 
  label="Email"
  error="Please enter a valid email"
  required
>
  <Input type="email" />
</FormField>

// Renders:
// - Input with aria-invalid="true"
// - Input with aria-describedby pointing to error
// - Error with role="alert"
```

### Required Fields

Required fields are indicated visually and programmatically:

```tsx
<FormField label="Company Name" required>
  <Input />
</FormField>

// Visual: Asterisk (*) after label
// Screen reader: "(required)" text
// ARIA: aria-required="true" on input
```

---

## Dynamic Content Announcements

### Loading States

```tsx
<LiveRegion 
  message={isLoading ? "Loading shipping quotes..." : ""}
  priority="polite"
/>
```

### Success Messages

```tsx
const { announcePolite } = useAccessibility()

const handleSubmit = async () => {
  const result = await submitShipment()
  announcePolite("Shipment created successfully")
}
```

### Error Messages

```tsx
const { announceAssertive } = useAccessibility()

if (errors.length > 0) {
  announceAssertive(`Form has ${errors.length} errors. Please review.`)
}
```

---

## Component Guidelines

### Buttons

```tsx
// Text buttons
<Button>Submit</Button>

// Icon-only buttons (always provide aria-label)
<Button aria-label="Close">
  <XIcon aria-hidden="true" />
</Button>

// Loading state
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <LoadingSpinner size="sm" />
      <span>Loading...</span>
    </>
  ) : (
    "Submit"
  )}
</Button>
```

### Links

```tsx
// External links
<a href="..." target="_blank" rel="noopener noreferrer">
  Learn more
  <span className="sr-only">(opens in new tab)</span>
</a>
```

### Images

```tsx
// Decorative images
<img src="..." alt="" aria-hidden="true" />

// Informative images
<img src="..." alt="Carrier logo: FedEx" />

// Complex images
<figure>
  <img src="..." alt="Shipping rate comparison chart" />
  <figcaption>Detailed description of the chart...</figcaption>
</figure>
```

### Tables

```tsx
<table>
  <caption>Shipping rates by carrier</caption>
  <thead>
    <tr>
      <th scope="col">Carrier</th>
      <th scope="col">Service</th>
      <th scope="col">Price</th>
    </tr>
  </thead>
  <tbody>
    {/* rows */}
  </tbody>
</table>
```

---

## Testing Checklist

### Keyboard Testing

- [ ] Tab navigates through all interactive elements
- [ ] Shift+Tab navigates backwards
- [ ] Enter activates buttons and links
- [ ] Space toggles checkboxes
- [ ] Arrow keys navigate radio groups and selects
- [ ] Escape closes modals and dialogs
- [ ] Focus is visible on all interactive elements
- [ ] Focus order is logical

### Screen Reader Testing

- [ ] All images have appropriate alt text
- [ ] Form labels are associated with inputs
- [ ] Error messages are announced
- [ ] Loading states are announced
- [ ] Success messages are announced
- [ ] Page title is descriptive
- [ ] Headings are in logical order
- [ ] Landmarks are used appropriately

### Visual Testing

- [ ] Color is not the only means of conveying information
- [ ] Text has sufficient contrast (4.5:1 minimum)
- [ ] Focus indicators are visible
- [ ] Text can be resized up to 200% without loss of functionality
- [ ] Content is responsive and works at 320px width

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

---

## Support

For accessibility questions or issues, please:

1. Check this documentation
2. Review the component in `components/accessibility/`
3. Test with screen readers (NVDA, JAWS, VoiceOver)
4. Run automated tests with axe DevTools
