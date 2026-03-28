/**
 * Component Renderers Index
 *
 * Exports all core and extended component renderers for PageForge CMS
 */

// Core components
import Hero from './Hero'
import TextBlock from './TextBlock'
import ImageComponent from './ImageComponent'
import TwoColumn from './TwoColumn'
import CTA from './CTA'
import Testimonial from './Testimonial'
import Spacer from './Spacer'

// Extended components (Step 15)
import Accordion from './Accordion'
import Tabs from './Tabs'
import Carousel from './Carousel'
import Video from './Video'

// Extended components (Step 16)
import Form from './Form'
import CardGrid from './CardGrid'
import Embed from './Embed'
import Header from './Header'
import Footer from './Footer'

// Fragment component (Step 19)
import Fragment from './Fragment'

export {
  Hero,
  TextBlock,
  ImageComponent,
  TwoColumn,
  CTA,
  Testimonial,
  Spacer,
  Accordion,
  Tabs,
  Carousel,
  Video,
  Form,
  CardGrid,
  Embed,
  Header,
  Footer,
  Fragment
}

export type { HeroProps } from './Hero'
export type { TextBlockProps } from './TextBlock'
export type { ImageComponentProps } from './ImageComponent'
export type { TwoColumnProps } from './TwoColumn'
export type { CTAProps } from './CTA'
export type { TestimonialProps } from './Testimonial'
export type { SpacerProps } from './Spacer'
export type { AccordionProps, AccordionItem } from './Accordion'
export type { TabsProps, TabItem } from './Tabs'
export type { CarouselProps, CarouselSlide } from './Carousel'
export type { VideoProps, VideoSource } from './Video'
export type { FormProps, FormField, FormFieldType } from './Form'
export type { CardGridProps, Card } from './CardGrid'
export type { EmbedProps, EmbedMode, EmbedPreset } from './Embed'
export type { HeaderProps, MenuItem } from './Header'
export type { FooterProps, FooterMenuItem, SocialLink } from './Footer'
export type { FragmentProps } from './Fragment'

/**
 * Component Registry Map
 *
 * Maps component type names to their renderer components
 */
export const componentRenderers = {
  hero: Hero,
  text: TextBlock,
  image: ImageComponent,
  'two-column': TwoColumn,
  cta: CTA,
  testimonial: Testimonial,
  spacer: Spacer,
  accordion: Accordion,
  tabs: Tabs,
  carousel: Carousel,
  video: Video,
  form: Form,
  'card-grid': CardGrid,
  embed: Embed,
  header: Header,
  footer: Footer,
  fragment: Fragment
} as const

export type ComponentType = keyof typeof componentRenderers
