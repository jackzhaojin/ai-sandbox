'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { useEditor } from './EditorContext'
import {
  Layers,
  Type,
  Image,
  Columns,
  MousePointerClick,
  MessageSquareQuote,
  Space,
  Box
} from 'lucide-react'

// Component palette items with metadata
const paletteComponents = [
  {
    type: 'hero',
    label: 'Hero',
    icon: Layers,
    category: 'Layout',
    description: 'Full-width hero banner',
    defaultProps: {
      heading: 'Your Heading Here',
      subheading: 'Add a compelling subheading',
      height: 'medium',
      alignment: 'center'
    }
  },
  {
    type: 'text',
    label: 'Text Block',
    icon: Type,
    category: 'Content',
    description: 'Rich text content',
    defaultProps: {
      content: '<p>Start typing your content here...</p>',
      textAlign: 'left'
    }
  },
  {
    type: 'image',
    label: 'Image',
    icon: Image,
    category: 'Media',
    description: 'Optimized image',
    defaultProps: {
      src: '/placeholder.jpg',
      alt: 'Image description',
      width: 'medium'
    }
  },
  {
    type: 'two-column',
    label: 'Two Column',
    icon: Columns,
    category: 'Layout',
    description: 'Split content layout',
    defaultProps: {
      leftContent: '<p>Left column content</p>',
      rightContent: '<p>Right column content</p>',
      columnRatio: '50-50'
    }
  },
  {
    type: 'cta',
    label: 'Call to Action',
    icon: MousePointerClick,
    category: 'Content',
    description: 'Prominent CTA section',
    defaultProps: {
      heading: 'Ready to Get Started?',
      description: 'Take action today',
      buttonText: 'Get Started',
      buttonLink: '#',
      backgroundColor: 'primary',
      variant: 'primary'
    }
  },
  {
    type: 'testimonial',
    label: 'Testimonial',
    icon: MessageSquareQuote,
    category: 'Content',
    description: 'Customer testimonial',
    defaultProps: {
      quote: 'This is an amazing product that solved all our problems!',
      author: 'John Doe',
      role: 'CEO, Company Inc.',
      rating: 5
    }
  },
  {
    type: 'spacer',
    label: 'Spacer',
    icon: Space,
    category: 'Layout',
    description: 'Vertical spacing',
    defaultProps: {
      height: 'medium'
    }
  },
  {
    type: 'fragment',
    label: 'Fragment',
    icon: Box,
    category: 'Content',
    description: 'Reusable content fragment',
    defaultProps: {
      fragmentId: undefined,
      fragmentName: 'Untitled Fragment',
      showBorder: true,
      mode: 'edit'
    }
  }
]

// Group components by category
const groupedComponents = paletteComponents.reduce((acc, component) => {
  if (!acc[component.category]) {
    acc[component.category] = []
  }
  acc[component.category].push(component)
  return acc
}, {} as Record<string, typeof paletteComponents>)

// Draggable palette item component
function PaletteItem({ component }: { component: typeof paletteComponents[0] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${component.type}`,
    data: {
      type: component.type,
      defaultProps: component.defaultProps,
      source: 'palette'
    }
  })

  const Icon = component.icon

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex w-full items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {/* Icon */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-gray-100">
        <Icon className="h-4 w-4 text-gray-600" />
      </div>

      {/* Label and description */}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900">
          {component.label}
        </div>
        <div className="mt-0.5 text-xs text-gray-500">
          {component.description}
        </div>
      </div>
    </div>
  )
}

export default function ComponentPalette() {
  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Components</h2>

      {/* Render components grouped by category */}
      {Object.entries(groupedComponents).map(([category, items]) => (
        <div key={category} className="mb-6">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            {category}
          </h3>

          <div className="space-y-1">
            {items.map((component) => (
              <PaletteItem key={component.type} component={component} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
