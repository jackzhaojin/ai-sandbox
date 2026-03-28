'use client'

import React, { useState } from 'react'
import { GripVertical, Trash2, Plus, Edit } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import PropertyLabel from './PropertyLabel'
import RichTextEditor from './RichTextEditor'
import type { TabsProps, TabItem } from '@/components/renderers/Tabs'

interface TabsEditorProps {
  props: TabsProps
  onChange: (props: Partial<TabsProps>) => void
}

export default function TabsEditor({ props, onChange }: TabsEditorProps) {
  const [editingTab, setEditingTab] = useState<TabItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const tabs = props.tabs || []

  const handleAddTab = () => {
    const newTab: TabItem = {
      id: `tab-${Date.now()}`,
      label: 'New Tab',
      content: '<p>Enter content here...</p>'
    }
    onChange({ tabs: [...tabs, newTab] })
  }

  const handleUpdateLabel = (tabId: string, label: string) => {
    const updatedTabs = tabs.map(tab =>
      tab.id === tabId ? { ...tab, label } : tab
    )
    onChange({ tabs: updatedTabs })
  }

  const handleDeleteTab = (tabId: string) => {
    onChange({ tabs: tabs.filter(tab => tab.id !== tabId) })
  }

  const handleMoveTab = (index: number, direction: 'up' | 'down') => {
    const newTabs = [...tabs]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newTabs.length) return

    ;[newTabs[index], newTabs[targetIndex]] = [newTabs[targetIndex], newTabs[index]]
    onChange({ tabs: newTabs })
  }

  const handleEditContent = (tab: TabItem) => {
    setEditingTab(tab)
    setIsModalOpen(true)
  }

  const handleSaveContent = (content: string) => {
    if (!editingTab) return

    const updatedTabs = tabs.map(tab =>
      tab.id === editingTab.id ? { ...tab, content } : tab
    )
    onChange({ tabs: updatedTabs })
    setIsModalOpen(false)
    setEditingTab(null)
  }

  return (
    <div className="space-y-4">
      {/* Tabs List */}
      <div>
        <PropertyLabel>Tabs</PropertyLabel>
        <div className="space-y-2">
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              className="flex items-start gap-2 p-3 border border-gray-300 rounded-lg bg-white"
            >
              {/* Drag Handle */}
              <div className="flex flex-col gap-1 pt-2">
                <button
                  onClick={() => handleMoveTab(index, 'up')}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 space-y-2">
                <Input
                  value={tab.label}
                  onChange={(e) => handleUpdateLabel(tab.id, e.target.value)}
                  placeholder="Tab label"
                  className="font-medium"
                />
                <button
                  onClick={() => handleEditContent(tab)}
                  className="w-full px-3 py-2 text-sm text-left border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Content
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveTab(index, 'down')}
                  disabled={index === tabs.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rotate-180"
                  title="Move down"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTab(tab.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete tab"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddTab}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Add Tab
          </button>
        </div>
      </div>

      {/* Variant */}
      <div>
        <PropertyLabel htmlFor="variant">Variant</PropertyLabel>
        <select
          id="variant"
          value={props.variant || 'default'}
          onChange={(e) => onChange({ variant: e.target.value as TabsProps['variant'] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="default">Default</option>
          <option value="pills">Pills</option>
          <option value="underline">Underline</option>
          <option value="bordered">Bordered</option>
        </select>
      </div>

      {/* Default Tab */}
      <div>
        <PropertyLabel htmlFor="defaultTab">Default Tab (optional)</PropertyLabel>
        <select
          id="defaultTab"
          value={props.defaultTab || ''}
          onChange={(e) => onChange({ defaultTab: e.target.value || undefined })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">First Tab</option>
          {tabs.map(tab => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTab(null)
        }}
        title={`Edit Content: ${editingTab?.label || ''}`}
        size="xl"
      >
        <div className="space-y-4">
          <RichTextEditor
            content={editingTab?.content || ''}
            onChange={(content) => {
              if (editingTab) {
                setEditingTab({ ...editingTab, content })
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsModalOpen(false)
                setEditingTab(null)
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => editingTab && handleSaveContent(editingTab.content)}
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
