# Component Renderers

This directory contains the core component renderers for PageForge CMS. Each renderer receives props and renders semantic HTML with Tailwind CSS v4 styling.

## Overview

All 7 core component types have been implemented:

1. **Hero** - Full-width banner with background image, title, subtitle, and CTA buttons
2. **TextBlock** - Rich text content renderer with semantic HTML
3. **ImageComponent** - Next.js Image component with caption and width variants
4. **TwoColumn** - Responsive side-by-side layout with configurable column ratios
5. **CTA** - Call-to-action section with heading, description, and button
6. **Testimonial** - Quote card with author info, avatar, and star rating
7. **Spacer** - Vertical spacing component with height variants

## Component Details

### 1. Hero Component

**File:** `Hero.tsx`

**Props:**
```typescript
interface HeroProps {
  heading: string
  subheading?: string
  primaryButtonText?: string
  primaryButtonLink?: string
  secondaryButtonText?: string
  secondaryButtonLink?: string
  backgroundImage?: string
  height?: 'small' | 'medium' | 'large'
  alignment?: 'left' | 'center' | 'right'
}
```

**Features:**
- Full-width banner with optional background image
- Responsive text sizing (4xl → 5xl → 6xl)
- Three alignment variants (left, center, right)
- Three height variants (300px, 500px, 700px on desktop)
- Primary and secondary CTA buttons
- Dark overlay on background image for text readability
- Next.js Image optimization with `fill` and `priority`

**Accessibility:**
- `role="banner"` for landmark navigation
- Proper heading hierarchy (h1)
- Focus states on buttons
- ARIA labels on buttons

---

### 2. TextBlock Component

**File:** `TextBlock.tsx`

**Props:**
```typescript
interface TextBlockProps {
  content: string
  textAlign?: 'left' | 'center' | 'right'
}
```

**Features:**
- Renders HTML content from Tiptap rich text editor
- Semantic styling for h1-h4, p, ul, ol, blockquote, code, pre, table
- Three text alignment options
- Dark mode support
- Responsive typography

**Accessibility:**
- `role="article"` for content sections
- Semantic HTML elements preserved from editor
- Proper heading hierarchy
- Color contrast compliance

**Supported Elements:**
- Headings (h1, h2, h3, h4)
- Paragraphs
- Lists (ordered and unordered)
- Blockquotes
- Links (with hover states)
- Strong/emphasis
- Inline code and code blocks
- Horizontal rules
- Tables

---

### 3. ImageComponent Component

**File:** `ImageComponent.tsx`

**Props:**
```typescript
interface ImageComponentProps {
  src: string
  alt: string
  caption?: string
  width?: 'small' | 'medium' | 'large' | 'full'
}
```

**Features:**
- Next.js Image component with automatic optimization
- Four width variants (max-w-md, 2xl, 4xl, full)
- Aspect ratio maintained (16:9 default)
- Optional caption in `figcaption`
- Centered by default
- Fallback for missing images

**Accessibility:**
- Required `alt` text
- Semantic `figure` and `figcaption` elements
- Descriptive captions

---

### 4. TwoColumn Component

**File:** `TwoColumn.tsx`

**Props:**
```typescript
interface TwoColumnProps {
  leftContent: string
  rightContent: string
  columnRatio?: '50-50' | '60-40' | '40-60' | '70-30' | '30-70'
}
```

**Features:**
- CSS Grid-based layout
- Five column ratio options
- Responsive: stacks on mobile, side-by-side on desktop (lg breakpoint)
- Rich text content in both columns
- Gap spacing (8 mobile, 12 desktop)

**Accessibility:**
- `role="region"` for landmark
- `aria-label` for screen readers
- Semantic HTML in content

---

### 5. CTA Component

**File:** `CTA.tsx`

**Props:**
```typescript
interface CTAProps {
  heading: string
  description?: string
  buttonText: string
  buttonLink: string
  backgroundColor?: 'primary' | 'secondary' | 'gray'
  variant?: 'primary' | 'secondary' | 'outline'
}
```

**Features:**
- Full-width section with prominent heading
- Three background color variants (blue, purple, gray)
- Three button variants (primary, secondary, outline)
- Responsive padding (py-16 → py-20 → py-24)
- Centered content with max-width container

**Accessibility:**
- `role="complementary"` for landmark
- `aria-label="Call to action"`
- Focus states with ring
- Keyboard navigable

---

### 6. Testimonial Component

**File:** `Testimonial.tsx`

**Props:**
```typescript
interface TestimonialProps {
  quote: string
  author: string
  role?: string
  avatar?: string
  rating?: number
}
```

**Features:**
- Card-based design with shadow
- Star rating display (1-5 stars)
- Avatar image or generated initial
- Author name and role
- Decorative quotation marks
- Max-width container for readability

**Accessibility:**
- `role="blockquote"` for quote semantic
- `figcaption` for author attribution
- `aria-label` for rating
- Semantic `cite` element for author name
- Alt text for avatar images

---

### 7. Spacer Component

**File:** `Spacer.tsx`

**Props:**
```typescript
interface SpacerProps {
  height?: 'small' | 'medium' | 'large' | 'xl'
}
```

**Features:**
- Four height variants:
  - small: 8 (mobile) → 12 (desktop)
  - medium: 16 → 20
  - large: 24 → 32
  - xl: 32 → 40 → 48
- Responsive heights
- No visual content

**Accessibility:**
- `role="separator"` for semantic meaning
- `aria-hidden="true"` (purely visual spacing)

---

## Usage

### Basic Import

```tsx
import Hero from '@/components/renderers/Hero'
import TextBlock from '@/components/renderers/TextBlock'
import ImageComponent from '@/components/renderers/ImageComponent'
// ... etc
```

### Using Component Registry

```tsx
import { componentRenderers } from '@/components/renderers'

// Dynamic component rendering
const ComponentRenderer = componentRenderers['hero']
<ComponentRenderer heading="Hello" subheading="World" />
```

### Example Usage

```tsx
<Hero
  heading="Welcome to PageForge"
  subheading="Build amazing pages visually"
  primaryButtonText="Get Started"
  primaryButtonLink="/signup"
  height="large"
  alignment="center"
/>

<Spacer height="large" />

<TextBlock
  content="<h2>About Us</h2><p>We are a team of...</p>"
  textAlign="left"
/>

<ImageComponent
  src="/images/hero.jpg"
  alt="Hero image"
  caption="Our beautiful product"
  width="large"
/>

<TwoColumn
  leftContent="<h3>Features</h3><ul><li>Fast</li><li>Reliable</li></ul>"
  rightContent="<h3>Benefits</h3><p>Save time and money</p>"
  columnRatio="50-50"
/>

<CTA
  heading="Ready to get started?"
  description="Join thousands of users"
  buttonText="Sign Up Now"
  buttonLink="/signup"
  backgroundColor="primary"
/>

<Testimonial
  quote="This product is amazing!"
  author="Jane Doe"
  role="CEO, Company Inc"
  rating={5}
/>
```

## Testing

A comprehensive test page is available at `/test-renderers` that demonstrates all 7 components with sample data.

**To test:**
```bash
npm run dev
# Visit http://localhost:3000/test-renderers
```

The test page includes:
- Sample data for each component
- Multiple variants (e.g., CTA with different backgrounds)
- Responsive testing notes
- Accessibility features documentation

## Design Principles

### Accessibility First
- Semantic HTML elements throughout
- ARIA labels where needed
- Proper heading hierarchy
- Keyboard navigation support
- Focus states on interactive elements
- Color contrast compliance

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), lg (1024px)
- Flexible layouts that adapt to screen size
- Responsive typography
- Touch-friendly button sizes

### Performance
- Next.js Image optimization
- Minimal inline styles (scoped CSS-in-JS only where needed)
- Tailwind CSS for utility-first styling
- No external dependencies beyond Next.js

### Developer Experience
- TypeScript interfaces for all props
- Clear prop names and defaults
- JSDoc comments in code
- Comprehensive documentation

## Next Steps

These renderers will be integrated into:
- **Step 10:** Page editor shell and canvas
- **Step 11:** Drag-and-drop component placement
- **Step 12:** Property panels for editing component props

The `componentRenderers` registry will be used by the page editor to dynamically render components based on page data from the database.

## Related Files

- `lib/db/seed.ts` - Component type definitions in database
- `lib/db/schema/components.ts` - Database schema
- `app/test-renderers/page.tsx` - Test page for all renderers
- `components/renderers/index.ts` - Exports and registry

## Notes

- All components use Tailwind CSS v4 (with `@import "tailwindcss"` syntax)
- TextBlock and TwoColumn use scoped CSS-in-JS for rich text styling
- Image components require Next.js Image optimization configuration
- Background images in Hero should be optimized before upload
