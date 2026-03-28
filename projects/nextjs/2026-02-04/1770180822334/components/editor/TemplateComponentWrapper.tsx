'use client'

import React, { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, GripVertical, Lock, Unlock } from 'lucide-react'

interface TemplateComponentWrapperProps {
  children: ReactNode
  componentId: string
  isSelected: boolean
  onSelect: (e?: React.MouseEvent) => void
  onDelete: (id: string) => void
  index: number
  isLocked: boolean
  onToggleLock: (id: string) => void
}

export default function TemplateComponentWrapper({
  children,
  componentId,
  isSelected,
  onSelect,
  onDelete,
  index,
  isLocked,
  onToggleLock
}: TemplateComponentWrapperProps) {
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
      onDelete(componentId)
    }
  }

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleLock(componentId)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative transition-all ${
        isLocked
          ? 'border-2 border-gray-400 bg-gray-50'
          : isSelected
          ? 'ring-2 ring-blue-500'
          : 'hover:ring-1 hover:ring-gray-300'
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
      {/* Lock indicator - Always visible when locked */}
      {isLocked && (
        <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded bg-gray-800 px-2 py-1 text-xs font-medium text-white shadow-lg">
          <Lock className="h-3 w-3" />
          Locked
        </div>
      )}

      {/* Component Toolbar - Only visible when selected */}
      {isSelected && (
        <div className="absolute right-2 top-2 z-10 flex gap-1 rounded bg-white shadow-lg ring-1 ring-black/5">
          {/* Lock/Unlock Toggle */}
          <button
            onClick={handleToggleLock}
            className={`flex items-center gap-1 px-2 py-1 text-sm hover:bg-gray-50 ${
              isLocked ? 'text-gray-800' : 'text-blue-600'
            }`}
            title={isLocked ? 'Unlock component' : 'Lock component'}
            type="button"
          >
            {isLocked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
          </button>

          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
            type="button"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50"
            title="Delete component"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Selected indicator badge (only if not locked) */}
      {isSelected && !isLocked && (
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
