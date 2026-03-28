'use client'

import React, { useCallback, useRef, useEffect, useState } from 'react'
import { useEditor } from './EditorContext'
import { Settings, FileText, Eye } from 'lucide-react'
import PageSeoPanel from './PageSeoPanel'
import AccessibilityPanel from './AccessibilityPanel'
import {
  HeroEditor,
  TextBlockEditor,
  ImageEditor,
  TwoColumnEditor,
  CTAEditor,
  TestimonialEditor,
  SpacerEditor,
  AccordionEditor,
  TabsEditor,
  CarouselEditor,
  VideoEditor,
  FormEditor,
  CardGridEditor,
  EmbedEditor,
  HeaderEditor,
  FooterEditor,
  FragmentEditor
} from './properties'

type TabType = 'component' | 'seo' | 'accessibility'

export default function PropertyPanel() {
  const { selectedComponentId, selectedComponentIds, components, updateComponent } = useEditor()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('component')

  // Find selected component
  const selectedComponent = components.find(c => c.id === selectedComponentId)

  // Check if multi-select is active
  const isMultiSelect = selectedComponentIds.length > 0

  // Debounced update handler
  const handlePropsChange = useCallback((newProps: Record<string, unknown>) => {
    if (!selectedComponentId) return

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer to debounce updates (300ms delay)
    debounceTimerRef.current = setTimeout(() => {
      updateComponent(selectedComponentId, newProps)
    }, 300)
  }, [selectedComponentId, updateComponent])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Render appropriate editor based on component type
  const renderEditor = () => {
    if (!selectedComponent) return null

    // Cast props to any to satisfy TypeScript - props are validated at runtime by the editors
    const props = selectedComponent.props as any

    switch (selectedComponent.type) {
      case 'hero':
        return <HeroEditor props={props} onChange={handlePropsChange} />

      case 'text':
        return <TextBlockEditor props={props} onChange={handlePropsChange} />

      case 'image':
        return <ImageEditor props={props} onChange={handlePropsChange} />

      case 'twocolumn':
        return <TwoColumnEditor props={props} onChange={handlePropsChange} />

      case 'cta':
        return <CTAEditor props={props} onChange={handlePropsChange} />

      case 'testimonial':
        return <TestimonialEditor props={props} onChange={handlePropsChange} />

      case 'spacer':
        return <SpacerEditor props={props} onChange={handlePropsChange} />

      case 'accordion':
        return <AccordionEditor props={props} onChange={handlePropsChange} />

      case 'tabs':
        return <TabsEditor props={props} onChange={handlePropsChange} />

      case 'carousel':
        return <CarouselEditor props={props} onChange={handlePropsChange} />

      case 'video':
        return <VideoEditor props={props} onChange={handlePropsChange} />

      case 'form':
        return <FormEditor props={props} onChange={handlePropsChange} />

      case 'cardgrid':
        return <CardGridEditor props={props} onChange={handlePropsChange} />

      case 'embed':
        return <EmbedEditor props={props} onChange={handlePropsChange} />

      case 'header':
        return <HeaderEditor props={props} onChange={handlePropsChange} />

      case 'footer':
        return <FooterEditor props={props} onChange={handlePropsChange} />

      case 'fragment':
        return <FragmentEditor componentId={selectedComponent.id} {...props} />

      default:
        return (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              No editor available for component type: <strong>{selectedComponent.type}</strong>
            </p>
          </div>
        )
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex">
          <button
            onClick={() => setActiveTab('component')}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
              activeTab === 'component'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
            type="button"
            aria-label="Component properties tab"
            aria-current={activeTab === 'component' ? 'page' : undefined}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">Component</span>
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
              activeTab === 'seo'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
            type="button"
            aria-label="Page SEO tab"
            aria-current={activeTab === 'seo' ? 'page' : undefined}
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">SEO</span>
          </button>
          <button
            onClick={() => setActiveTab('accessibility')}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
              activeTab === 'accessibility'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
            type="button"
            aria-label="Accessibility audit tab"
            aria-current={activeTab === 'accessibility' ? 'page' : undefined}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">A11y</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'seo' ? (
        <PageSeoPanel />
      ) : activeTab === 'accessibility' ? (
        <AccessibilityPanel />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Show component editor if component is selected */}
            {selectedComponent ? (
              <>
                {/* Header */}
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedComponent.type.charAt(0).toUpperCase() + selectedComponent.type.slice(1)}
                  </p>
                </div>

                {/* Editor */}
                {renderEditor()}
              </>
            ) : isMultiSelect ? (
              <div className="flex h-full items-center justify-center p-8">
                <div className="text-center">
                  <div className="mb-4 text-5xl">📦</div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-700">
                    {selectedComponentIds.length} components selected
                  </h3>
                  <p className="text-sm text-gray-500">
                    Use Delete/Backspace to delete all selected components
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    Press Escape to deselect
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-8">
                <div className="text-center">
                  <div className="mb-4 text-5xl">⚙️</div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-700">
                    No component selected
                  </h3>
                  <p className="text-sm text-gray-500">
                    Click on a component in the canvas to edit its properties
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
