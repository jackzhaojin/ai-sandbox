'use client'

import React, { useState } from 'react'
import { GripVertical, Trash2, Plus, Edit } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import PropertyLabel from './PropertyLabel'
import RichTextEditor from './RichTextEditor'
import type { AccordionProps, AccordionItem } from '@/components/renderers/Accordion'

interface AccordionEditorProps {
  props: AccordionProps
  onChange: (props: Partial<AccordionProps>) => void
}

export default function AccordionEditor({ props, onChange }: AccordionEditorProps) {
  const [editingItem, setEditingItem] = useState<AccordionItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const items = props.items || []

  const handleAddItem = () => {
    const newItem: AccordionItem = {
      id: `item-${Date.now()}`,
      title: 'New Accordion Item',
      content: '<p>Enter content here...</p>'
    }
    onChange({ items: [...items, newItem] })
  }

  const handleUpdateTitle = (itemId: string, title: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, title } : item
    )
    onChange({ items: updatedItems })
  }

  const handleDeleteItem = (itemId: string) => {
    onChange({ items: items.filter(item => item.id !== itemId) })
  }

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newItems.length) return

    ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
    onChange({ items: newItems })
  }

  const handleEditContent = (item: AccordionItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleSaveContent = (content: string) => {
    if (!editingItem) return

    const updatedItems = items.map(item =>
      item.id === editingItem.id ? { ...item, content } : item
    )
    onChange({ items: updatedItems })
    setIsModalOpen(false)
    setEditingItem(null)
  }

  return (
    <div className="space-y-4">
      {/* Items List */}
      <div>
        <PropertyLabel>Accordion Items</PropertyLabel>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-start gap-2 p-3 border border-gray-300 rounded-lg bg-white"
            >
              {/* Drag Handle */}
              <div className="flex flex-col gap-1 pt-2">
                <button
                  onClick={() => handleMoveItem(index, 'up')}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Item Content */}
              <div className="flex-1 space-y-2">
                <Input
                  value={item.title}
                  onChange={(e) => handleUpdateTitle(item.id, e.target.value)}
                  placeholder="Item title"
                  className="font-medium"
                />
                <button
                  onClick={() => handleEditContent(item)}
                  className="w-full px-3 py-2 text-sm text-left border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Content
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveItem(index, 'down')}
                  disabled={index === items.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rotate-180"
                  title="Move down"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddItem}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Variant */}
      <div>
        <PropertyLabel htmlFor="variant">Variant</PropertyLabel>
        <select
          id="variant"
          value={props.variant || 'default'}
          onChange={(e) => onChange({ variant: e.target.value as AccordionProps['variant'] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="default">Default</option>
          <option value="bordered">Bordered</option>
          <option value="separated">Separated</option>
        </select>
      </div>

      {/* Allow Multiple Open */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="allowMultipleOpen"
          checked={props.allowMultipleOpen || false}
          onChange={(e) => onChange({ allowMultipleOpen: e.target.checked })}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <PropertyLabel htmlFor="allowMultipleOpen" className="mb-0">
          Allow Multiple Items Open
        </PropertyLabel>
      </div>

      {/* Content Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(null)
        }}
        title={`Edit Content: ${editingItem?.title || ''}`}
        size="xl"
      >
        <div className="space-y-4">
          <RichTextEditor
            content={editingItem?.content || ''}
            onChange={(content) => {
              if (editingItem) {
                setEditingItem({ ...editingItem, content })
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsModalOpen(false)
                setEditingItem(null)
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => editingItem && handleSaveContent(editingItem.content)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
