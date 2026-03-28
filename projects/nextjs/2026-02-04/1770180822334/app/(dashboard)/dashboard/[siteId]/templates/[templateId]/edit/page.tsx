'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Save, Eye, Monitor, Tablet, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import ComponentPalette from '@/components/editor/ComponentPalette'
import PropertyPanel from '@/components/editor/PropertyPanel'
import { EditorProvider, useEditor, ComponentInstance } from '@/components/editor/EditorContext'
import TemplateComponentWrapper from '@/components/editor/TemplateComponentWrapper'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { renderComponent } from '@/lib/component-renderer'

interface Template {
  id: string
  name: string
  description: string | null
  thumbnailUrl: string | null
  structure: ComponentInstance[]
  lockedRegions: string[]
}

function TemplateEditorContent() {
  const params = useParams()
  const router = useRouter()
  const siteId = params.siteId as string
  const templateId = params.templateId as string

  const {
    components,
    setComponents,
    selectedComponentId,
    setSelectedComponentId,
    viewport,
    setViewport,
    moveComponent,
    deleteComponent
  } = useEditor()

  const [template, setTemplate] = useState<Template | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [lockedRegions, setLockedRegions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTemplate()
  }, [templateId])

  const fetchTemplate = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/templates?siteId=${siteId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch template')
      }
      const data = await response.json()
      const foundTemplate = data.templates.find((t: Template) => t.id === templateId)

      if (!foundTemplate) {
        throw new Error('Template not found')
      }

      setTemplate(foundTemplate)
      setTemplateName(foundTemplate.name)
      setTemplateDescription(foundTemplate.description || '')
      setLockedRegions(foundTemplate.lockedRegions || [])
      setComponents(foundTemplate.structure || [])
    } catch (error) {
      console.error('Error fetching template:', error)
      toast.error('Failed to load template')
      router.push(`/dashboard/${siteId}/templates`)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLock = useCallback((componentId: string) => {
    setLockedRegions(prev => {
      if (prev.includes(componentId)) {
        return prev.filter(id => id !== componentId)
      } else {
        return [...prev, componentId]
      }
    })
  }, [])

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription || null,
          structure: components,
          lockedRegions,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save template')
      }

      toast.success('Template saved successfully')
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = components.findIndex(c => c.id === active.id)
    const newIndex = components.findIndex(c => c.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      moveComponent(oldIndex, newIndex)
    }
  }

  const handleSelectComponent = (id: string) => (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setSelectedComponentId(id)
  }

  const viewportWidths = {
    desktop: 'w-full',
    tablet: 'max-w-3xl',
    mobile: 'max-w-md'
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading template...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Editor Toolbar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        {/* Left: Template info */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/${siteId}/templates`)}
            className="text-sm text-gray-500 hover:text-gray-700"
            type="button"
          >
            ← Back to Templates
          </button>
          <div className="flex flex-col">
            <Input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="font-semibold"
              placeholder="Template Name"
            />
            <Input
              type="text"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              className="mt-1 text-sm text-gray-600"
              placeholder="Description (optional)"
            />
          </div>
        </div>

        {/* Center: Viewport controls */}
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setViewport('desktop')}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              viewport === 'desktop'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Desktop view"
            type="button"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              viewport === 'tablet'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Tablet view"
            type="button"
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              viewport === 'mobile'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Mobile view"
            type="button"
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </header>

      {/* Three-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Component Palette */}
        <aside className="w-64 overflow-y-auto border-r border-gray-200 bg-white">
          <ComponentPalette />
        </aside>

        {/* Center: Canvas */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto p-8" style={{ maxWidth: '100%' }}>
            <div
              className={`mx-auto bg-white shadow-lg ${viewportWidths[viewport]}`}
              onClick={() => setSelectedComponentId(null)}
              role="presentation"
            >
              {components.length === 0 ? (
                <div className="flex h-96 flex-col items-center justify-center text-gray-400">
                  <p className="text-lg font-medium">No components yet</p>
                  <p className="mt-2 text-sm">Drag components from the left panel to start</p>
                </div>
              ) : (
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {components.map((component, index) => (
                      <TemplateComponentWrapper
                        key={component.id}
                        componentId={component.id}
                        isSelected={selectedComponentId === component.id}
                        onSelect={handleSelectComponent(component.id)}
                        onDelete={deleteComponent}
                        index={index}
                        isLocked={lockedRegions.includes(component.id)}
                        onToggleLock={handleToggleLock}
                      >
                        {renderComponent(component)}
                      </TemplateComponentWrapper>
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </main>

        {/* Right: Property Panel */}
        <aside className="w-80 overflow-y-auto border-l border-gray-200 bg-white">
          <PropertyPanel />
        </aside>
      </div>
    </div>
  )
}

export default function TemplateEditorPage() {
  const params = useParams()
  const siteId = params.siteId as string
  const templateId = params.templateId as string

  return (
    <EditorProvider pageId={templateId} siteId={siteId}>
      <TemplateEditorContent />
    </EditorProvider>
  )
}
