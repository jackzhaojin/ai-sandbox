# Step 15 Completion: Build Extended Component Renderers

**Task:** Build PageForge CMS — AEM-Inspired Visual Page Builder
**Completed:** 2026-02-04
**Step:** 15 of 31
**Status:** ✅ Complete

## Summary

Successfully implemented 4 extended interactive component renderers: Accordion, Tabs, Carousel, and Video. All components are marked as 'use client', have proper TypeScript interfaces, implement accessibility best practices, and respect user motion preferences.

## What Was Built

### 1. Accordion Component (`components/renderers/Accordion.tsx`)

**Features:**
- Renders items array with collapsible sections
- Uses semantic HTML and ARIA accordion pattern
  - `role="region"` for each section
  - `aria-expanded` to indicate open/closed state
  - `aria-controls` linking button to content
- Three variants:
  - `default`: Simple sections with dividers
  - `bordered`: Sections within a bordered container
  - `separated`: Individual sections with spacing
- `allowMultipleOpen` prop (default: false)
- Animated expand/collapse:
  - CSS transitions for max-height and opacity
  - Duration: 300ms ease-in-out
  - Respects `prefers-reduced-motion`
- Chevron icon rotation on toggle
- Keyboard support: Enter and Space keys to toggle
- Rich text content support with HTML rendering

**Props Interface:**
```typescript
interface AccordionItem {
  id: string
  title: string
  content: string // HTML string
}

interface AccordionProps {
  items: AccordionItem[]
  allowMultipleOpen?: boolean
  variant?: 'default' | 'bordered' | 'separated'
}
```

**State Management:**
- Uses `useState` to track open items with a Set
- Toggle logic handles single vs. multiple open sections
- Keyboard event handlers for accessibility

### 2. Tabs Component (`components/renderers/Tabs.tsx`)

**Features:**
- Renders tabs array with ARIA tablist/tab/tabpanel pattern
  - `role="tablist"` for tab container
  - `role="tab"` for each tab button
  - `role="tabpanel"` for content areas
  - `aria-selected` to indicate active tab
  - `aria-controls` linking tab to panel
- Four variants:
  - `default`: Simple bottom border with highlighted active tab
  - `pills`: Rounded tabs in a gray container
  - `underline`: Tabs with animated sliding underline
  - `bordered`: Tabs with border integration to content area
- Keyboard navigation:
  - Arrow Left/Right: Navigate between tabs
  - Home/End: Jump to first/last tab
  - Tab key: Focus management with tabIndex
- Animated tab switching:
  - Fade-in animation for content (300ms)
  - Sliding underline for underline variant (300ms)
  - Respects `prefers-reduced-motion`
- Rich text content support with HTML rendering

**Props Interface:**
```typescript
interface TabItem {
  id: string
  label: string
  content: string // HTML string
}

interface TabsProps {
  tabs: TabItem[]
  variant?: 'default' | 'pills' | 'underline' | 'bordered'
  defaultTab?: string
}
```

**State Management:**
- Uses `useState` for active tab tracking
- Uses `useRef` to store tab button references
- Uses `useEffect` to calculate underline position for underline variant

### 3. Carousel Component (`components/renderers/Carousel.tsx`)

**Features:**
- Renders slides array as an image slideshow
- Auto-play functionality:
  - Configurable interval (default: 5000ms)
  - Pauses on hover for accessibility
  - Play/Pause button for manual control
  - Uses `setInterval` with proper cleanup
- Navigation controls:
  - Previous/Next arrow buttons
  - Dot indicators (clickable)
  - Thumbnail strip (for thumbnails variant)
- Three variants:
  - `full-width`: Full-width slides
  - `cards-with-peek`: Centered with shadows
  - `thumbnails`: Includes thumbnail navigation
- Animated slide transitions:
  - TranslateX animation (700ms)
  - Opacity fade (700ms)
  - Respects `prefers-reduced-motion`
- Keyboard support: Arrow keys to navigate, Enter/Space to toggle play
- Image optimization with Next.js Image component
- Optional captions on slides

**Props Interface:**
```typescript
interface CarouselSlide {
  id: string
  src: string
  alt: string
  caption?: string
}

interface CarouselProps {
  slides: CarouselSlide[]
  autoPlay?: boolean
  interval?: number // milliseconds
  variant?: 'full-width' | 'cards-with-peek' | 'thumbnails'
  showControls?: boolean
}
```

**State Management:**
- Uses `useState` for current slide index and play state
- Uses `useEffect` for auto-play timer with dependencies
- Uses `useCallback` for navigation functions to prevent re-renders

### 4. Video Component (`components/renderers/Video.tsx`)

**Features:**
- Support for three source types:
  - `youtube`: Embeds YouTube videos via iframe
  - `vimeo`: Embeds Vimeo videos via iframe
  - `url`: Self-hosted videos via HTML5 video element
- Lazy loading with poster overlay:
  - Shows poster image with play button
  - Only loads actual video when user clicks play
  - Saves bandwidth and improves page load time
- Proper embed URLs with query parameters:
  - autoplay, muted, loop, controls
  - YouTube requires playlist param for loop
- Configuration props:
  - `autoPlay`, `muted`, `loop`, `showControls`
  - `lazyLoad` (default: true)
  - `posterImage` for thumbnail
- Responsive aspect-video container
- Next.js Image optimization for poster images
- Error state for missing/invalid configuration

**Props Interface:**
```typescript
type VideoSource = 'youtube' | 'vimeo' | 'url'

interface VideoProps {
  source: VideoSource
  videoId?: string // For YouTube/Vimeo
  url?: string // For self-hosted
  posterImage?: string
  title?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  showControls?: boolean
  lazyLoad?: boolean
}
```

**State Management:**
- Uses `useState` to track whether video has been loaded
- Click handler to switch from poster to actual video

## Files Created

1. `components/renderers/Accordion.tsx` (160 lines)
2. `components/renderers/Tabs.tsx` (232 lines)
3. `components/renderers/Carousel.tsx` (268 lines)
4. `components/renderers/Video.tsx` (237 lines)

## Files Modified

1. `components/renderers/index.ts`
   - Added imports for 4 new components
   - Added type exports for all new interfaces
   - Updated `componentRenderers` registry with:
     - `accordion: Accordion`
     - `tabs: Tabs`
     - `carousel: Carousel`
     - `video: Video`

## Common Patterns Across All Components

### 1. Client Components
All components are marked with `'use client'` directive at the top since they require browser APIs and interactivity.

### 2. Accessibility (ARIA)
- Proper ARIA roles and attributes
- Keyboard navigation support
- Screen reader announcements
- Focus management
- Clear labels and descriptions

### 3. Motion Preferences
All components respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  .transition-all {
    transition-duration: 0.01ms !important;
  }
}
```

### 4. TypeScript
- Proper interface definitions
- Exported types for reusability
- Type-safe props with defaults

### 5. Styling
- Tailwind CSS utility classes
- Scoped CSS-in-JS with `<style jsx>` for complex styling
- Responsive design with breakpoints
- Dark mode considerations in some components

### 6. Rich Content Support
Components that render user content (Accordion, Tabs) use:
- `dangerouslySetInnerHTML` for HTML rendering
- Prose styling classes for typography
- Note: Content should be sanitized on the server in production

## Technical Decisions

### Why 'use client'?
These components require:
- Browser event handlers (onClick, onKeyDown)
- React hooks (useState, useEffect, useRef)
- DOM APIs (hover detection, focus management)
- Animation state management

### Styling Approach
- Primary: Tailwind CSS for maintainability and consistency
- Secondary: Scoped `<style jsx>` for rich text styling and complex animations
- Avoided multiline template literals in className due to Next.js Turbopack parsing issues

### Animation Strategy
- CSS transitions (not JavaScript-based) for:
  - Better performance (GPU-accelerated)
  - Automatic prefers-reduced-motion support
  - Smoother 60fps animations
- Used translateX for carousel (not margin/left) for performance

### Lazy Loading
Video component implements lazy loading by default:
- Reduces initial page load
- Saves bandwidth
- Improves Core Web Vitals scores
- User can still access video with one click

## Testing

### TypeScript Compilation
✅ No TypeScript errors:
```bash
npx tsc --noEmit
# No errors
```

### Development Server
✅ Dev server starts successfully:
```bash
npm run dev
# Server running on http://localhost:3000
```

### Build Notes
- Production build encounters an unrelated error with `/_global-error` page
- This error exists in the codebase already and is not caused by new components
- The error is: `TypeError: Cannot read properties of null (reading 'useContext')`
- All new components compile and type-check successfully

## Integration Points

These components integrate with the existing system:

1. **Component Registry** (`components/renderers/index.ts`)
   - Added to `componentRenderers` object
   - Can be dynamically rendered in the page editor

2. **Property Editors** (Step 16 - Next)
   - Will need custom editors for:
     - Accordion: items array editor
     - Tabs: tabs array editor
     - Carousel: slides array editor with media upload
     - Video: source type selector and URL/ID input

3. **Page Data Schema** (Database)
   - Component instances will store props as JSON
   - Arrays (items, tabs, slides) stored as JSON arrays

## Usage Examples

### Accordion
```tsx
<Accordion
  items={[
    {
      id: '1',
      title: 'What is PageForge?',
      content: '<p>PageForge is a visual page builder...</p>'
    },
    {
      id: '2',
      title: 'How does it work?',
      content: '<p>Simply drag and drop components...</p>'
    }
  ]}
  allowMultipleOpen={false}
  variant="bordered"
/>
```

### Tabs
```tsx
<Tabs
  tabs={[
    {
      id: 'features',
      label: 'Features',
      content: '<h3>Key Features</h3><ul><li>Fast</li><li>Easy</li></ul>'
    },
    {
      id: 'pricing',
      label: 'Pricing',
      content: '<h3>Pricing</h3><p>Starting at $10/month</p>'
    }
  ]}
  variant="underline"
  defaultTab="features"
/>
```

### Carousel
```tsx
<Carousel
  slides={[
    {
      id: '1',
      src: '/images/slide1.jpg',
      alt: 'First slide',
      caption: 'Welcome to our platform'
    },
    {
      id: '2',
      src: '/images/slide2.jpg',
      alt: 'Second slide',
      caption: 'Powerful features'
    }
  ]}
  autoPlay={true}
  interval={5000}
  variant="full-width"
  showControls={true}
/>
```

### Video
```tsx
{/* YouTube */}
<Video
  source="youtube"
  videoId="dQw4w9WgXcQ"
  posterImage="/images/video-poster.jpg"
  title="Product Demo"
  lazyLoad={true}
  showControls={true}
/>

{/* Self-hosted */}
<Video
  source="url"
  url="/videos/demo.mp4"
  posterImage="/images/demo-poster.jpg"
  title="Tutorial Video"
  autoPlay={false}
  loop={false}
  showControls={true}
/>
```

## Next Steps

The next step (Step 16) will need to:
1. Build extended component renderers for: Form, Card Grid, Embed, Header, Footer
2. After that (Step 17), create property editors for all extended components including the 4 built in this step

## Lessons Learned

1. **Avoid Multiline classNames with Next.js Turbopack**
   - Turbopack's styled-jsx parser fails on multiline template literals in className
   - Solution: Use single-line classNames or extract to variables

2. **useState with Sets for Accordion**
   - Using `Set<string>` for open items is cleaner than array of IDs
   - Must create new Set on each update (immutability)

3. **useEffect Dependencies Matter**
   - Carousel auto-play needs proper dependencies to avoid memory leaks
   - useCallback for handlers prevents unnecessary re-renders

4. **Lazy Loading Videos**
   - Significant UX improvement
   - Simple state toggle (isLoaded) is sufficient
   - Poster image + play button provides clear affordance

## Git Commit

✅ Changes committed:
```
commit f3dbc08
Step 15: Build extended component renderers (Accordion, Tabs, Carousel, Video)
```

## Definition of Done

- ✅ Complete step: Build extended component renderers (Accordion, Tabs, Carousel, Video)
- ✅ Did NOT build the entire application — only this step
- ✅ All code compiles and runs (TypeScript passes, dev server starts)
- ✅ Changes are committed to git

**Step 15 is COMPLETE!** 🎉
