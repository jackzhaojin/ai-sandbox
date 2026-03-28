import React from 'react'
import { ComponentInstance } from '@/components/editor/EditorContext'

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
 * Render a component instance based on its type
 */
export function renderComponent(component: ComponentInstance): React.ReactNode {
  const { type, props } = component

  switch (type) {
    case 'hero':
      return <Hero {...(props as any)} />
    case 'text':
      return <TextBlock {...(props as any)} />
    case 'image':
      return <ImageComponent {...(props as any)} />
    case 'cta':
      return <CTA {...(props as any)} />
    case 'testimonial':
      return <Testimonial {...(props as any)} />
    case 'spacer':
      return <Spacer {...(props as any)} />
    case 'two-column':
      return <TwoColumn {...(props as any)} />
    case 'accordion':
      return <Accordion {...(props as any)} />
    case 'tabs':
      return <Tabs {...(props as any)} />
    case 'carousel':
      return <Carousel {...(props as any)} />
    case 'video':
      return <Video {...(props as any)} />
    case 'form':
      return <Form {...(props as any)} />
    case 'card-grid':
      return <CardGrid {...(props as any)} />
    case 'embed':
      return <Embed {...(props as any)} />
    case 'header':
      return <Header {...(props as any)} />
    case 'footer':
      return <Footer {...(props as any)} />
    default:
      return (
        <div className="bg-red-50 border border-red-200 p-4 text-red-800">
          Unknown component type: {type}
        </div>
      )
  }
}
