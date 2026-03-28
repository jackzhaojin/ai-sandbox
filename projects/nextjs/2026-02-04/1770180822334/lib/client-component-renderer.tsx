'use client'

import React from 'react'

// Import all component renderers
import Hero from '@/components/renderers/Hero'
import TextBlock from '@/components/renderers/TextBlock'
import ImageComponent from '@/components/renderers/ImageComponent'
import CTA from '@/components/renderers/CTA'
import Testimonial from '@/components/renderers/Testimonial'
import Spacer from '@/components/renderers/Spacer'
import TwoColumn from '@/components/renderers/TwoColumn'
import Accordion from '@/components/renderers/Accordion'
import Tabs from '@/components/renderers/Tabs'
import Carousel from '@/components/renderers/Carousel'
import Video from '@/components/renderers/Video'
import Form from '@/components/renderers/Form'
import CardGrid from '@/components/renderers/CardGrid'
import Embed from '@/components/renderers/Embed'
import Header from '@/components/renderers/Header'
import Footer from '@/components/renderers/Footer'

/**
 * Component Registry Map
 *
 * Maps component type names to their renderer components.
 * Used for both public page rendering and preview mode.
 */
export const componentRegistry = {
  hero: Hero,
  text: TextBlock,
  image: ImageComponent,
  cta: CTA,
  testimonial: Testimonial,
  spacer: Spacer,
  'two-column': TwoColumn,
  accordion: Accordion,
  tabs: Tabs,
  carousel: Carousel,
  video: Video,
  form: Form,
  'card-grid': CardGrid,
  embed: Embed,
  header: Header,
  footer: Footer,
  // Fragment is handled separately with server-side resolution
} as const

export type ComponentType = keyof typeof componentRegistry

/**
 * UnknownComponent - Fallback for unknown component types
 *
 * Behavior:
 * - Public view: Renders nothing (silent failure)
 * - Preview mode: Shows yellow warning box with component type
 */
interface UnknownComponentProps {
  type: string
  mode?: 'public' | 'preview'
}

export function UnknownComponent({ type, mode = 'public' }: UnknownComponentProps) {
  if (mode === 'public') {
    // Silent failure on public pages - don't expose internal details
    return null
  }

  // Preview mode - show warning
  return (
    <div className="my-4 rounded-lg border-2 border-yellow-400 bg-yellow-50 p-6">
      <div className="flex items-center gap-2 mb-2">
        <svg
          className="h-5 w-5 text-yellow-600"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="font-semibold text-yellow-900">Unknown Component</span>
      </div>
      <p className="text-sm text-yellow-800">
        Component type <code className="px-1.5 py-0.5 bg-yellow-200 rounded font-mono text-xs">{type}</code> is not recognized.
      </p>
      <p className="text-xs text-yellow-700 mt-2">
        This component will not be rendered on the published page. Please check if the component type is correct or if a new renderer needs to be created.
      </p>
    </div>
  )
}

interface ComponentInstance {
  id?: string
  type: string
  props?: Record<string, any>
}

/**
 * ClientComponentRenderer - Renders a component instance with proper fallback
 *
 * This is a client component that handles rendering of all component types.
 *
 * Handles:
 * - Looking up component in registry
 * - Passing props to renderer
 * - Falling back to UnknownComponent for unrecognized types
 * - Fragment components (resolved separately)
 */
interface ComponentRendererProps {
  component: ComponentInstance
  mode?: 'public' | 'preview'
}

export default function ClientComponentRenderer({ component, mode = 'public' }: ComponentRendererProps) {
  const { type, props = {} } = component

  // Handle fragment type separately (resolved server-side)
  if (type === 'fragment') {
    // Fragment should be resolved before rendering
    console.warn('Fragment component encountered in ComponentRenderer - should be resolved server-side')
    return <UnknownComponent type={type} mode={mode} />
  }

  // Look up component in registry
  const Component = componentRegistry[type as ComponentType]

  if (!Component) {
    return <UnknownComponent type={type} mode={mode} />
  }

  // Render component with props (with type assertion for flexibility)
  return <Component {...(props as any)} />
}
