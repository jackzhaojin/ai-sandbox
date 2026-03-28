'use client'

import React, { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEditor } from './EditorContext'
import { Trash2, GripVertical } from 'lucide-react'

interface ComponentWrapperProps {
  children: ReactNode
  componentId: string
  isSelected: boolean
  onSelect: (e?: React.MouseEvent) => void
  index: number
}

export default function ComponentWrapper({
  children,
  componentId,
  isSelected,
  onSelect,
  index
}: ComponentWrapperProps) {
  const { deleteComponent } = useEditor()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: componentId,
    data: {
      type: 'canvas-component',
      componentId,
      index
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this component?')) {
      deleteComponent(componentId)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-300'
      }`}
      onClick={(e) => onSelect(e)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect()
        }
      }}
    >
      {/* Drag Handle - Visible on hover or when selected */}
      <div className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 transition-opacity ${
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <button
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-8 h-8 rounded bg-white shadow-md ring-1 ring-black/5 text-gray-600 hover:bg-gray-50 cursor-grab active:cursor-grabbing transition-colors"
          title="Drag to reorder"
          type="button"
          aria-label="Drag to reorder component"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      </div>

      {/* Component Toolbar - Only visible when selected */}
      {isSelected && (
        <div className="absolute right-2 top-2 z-10 flex gap-1 rounded bg-white shadow-lg ring-1 ring-black/5">
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            title="Delete component"
            type="button"
            aria-label="Delete component"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Selected indicator badge */}
      {isSelected && (
        <div className="absolute left-2 top-2 z-10 rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white shadow-lg">
          Selected
        </div>
      )}

      {/* Component content */}
      <div className="pointer-events-none">
        {children}
      </div>
    </div>
  )
}
