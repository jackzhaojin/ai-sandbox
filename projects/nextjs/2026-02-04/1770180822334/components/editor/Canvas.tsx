'use client'

import React, { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { useEditor, ComponentInstance } from './EditorContext'
import { componentRenderers } from '@/components/renderers'
import ComponentWrapper from './ComponentWrapper'

// Canvas drop zone component
function CanvasDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: 'canvas-dropzone'
  })

  return (
    <div ref={setNodeRef} className="min-h-[400px]">
      {children}
    </div>
  )
}

export default function Canvas() {
  const {
    components,
    viewport,
    selectedComponentId,
    selectedComponentIds,
    setSelectedComponentId,
    toggleComponentSelection,
    deselectAll,
    addComponent,
    moveComponent
  } = useEditor()
  const [activeId, setActiveId] = useState<string | null>(null)

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Viewport width classes
  const viewportClasses = {
    desktop: 'w-full',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]'
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)

    if (!over) return

    // Check if dragging from palette
    const activeData = active.data.current
    if (activeData?.source === 'palette') {
      // Add new component from palette
      const newComponent: ComponentInstance = {
        id: crypto.randomUUID(),
        type: activeData.type,
        props: activeData.defaultProps
      }
      addComponent(newComponent)
      return
    }

    // Handle reordering on canvas
    if (active.id !== over.id) {
      const oldIndex = components.findIndex((c) => c.id === active.id)
      const newIndex = components.findIndex((c) => c.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        moveComponent(oldIndex, newIndex)
      }
    }
  }

  // Empty state
  if (components.length === 0) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full items-center justify-center">
          <CanvasDropZone>
            <div className="text-center">
              <div className="mb-4 text-6xl">📦</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-700">
                Your canvas is empty
              </h3>
              <p className="text-gray-500">
                Drag components from the palette to start building your page
              </p>
            </div>
          </CanvasDropZone>
        </div>
      </DndContext>
    )
  }

  // Get the active component for drag overlay
  const activeComponent = activeId ? components.find((c) => c.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-full justify-center p-8">
        {/* Canvas container with viewport sizing */}
        <div className={`${viewportClasses[viewport]} mx-auto transition-all duration-300`}>
          <SortableContext
            items={components.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <CanvasDropZone>
              {/* Render components */}
              {components.map((component, index) => {
                const Component = componentRenderers[component.type as keyof typeof componentRenderers]

                if (!Component) {
                  return (
                    <div
                      key={component.id}
                      className="my-2 rounded border-2 border-red-300 bg-red-50 p-4 text-center"
                    >
                      <p className="text-sm text-red-600">
                        Unknown component type: {component.type}
                      </p>
                    </div>
                  )
                }

                const isSelected = selectedComponentId === component.id || selectedComponentIds.includes(component.id)

                return (
                  <ComponentWrapper
                    key={component.id}
                    componentId={component.id}
                    isSelected={isSelected}
                    onSelect={(e) => {
                      if (e?.shiftKey) {
                        // Shift+Click: Toggle multi-select
                        toggleComponentSelection(component.id)
                      } else {
                        // Normal click: Single select
                        deselectAll()
                        setSelectedComponentId(component.id)
                      }
                    }}
                    index={index}
                  >
                    <Component {...(component.props as any)} />
                  </ComponentWrapper>
                )
              })}
            </CanvasDropZone>
          </SortableContext>
        </div>
      </div>

      {/* Drag overlay - shows component being dragged */}
      <DragOverlay>
        {activeComponent ? (
          <div className="rounded-lg bg-white p-4 shadow-lg ring-2 ring-blue-500 opacity-80">
            <div className="text-sm font-medium text-gray-900">
              {activeComponent.type}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
