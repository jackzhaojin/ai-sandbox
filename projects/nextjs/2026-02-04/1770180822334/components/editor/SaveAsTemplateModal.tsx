'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ComponentInstance } from './EditorContext'

interface SaveAsTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  components: ComponentInstance[]
  siteId: string
}

export default function SaveAsTemplateModal({
  isOpen,
  onClose,
  components,
  siteId
}: SaveAsTemplateModalProps) {
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          name: templateName,
          description: templateDescription || null,
          structure: components,
          defaultContent: components,
          lockedRegions: [],
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create template')
      }

      toast.success('Template created successfully')
      handleClose()
    } catch (error: any) {
      console.error('Error creating template:', error)
      toast.error(error.message || 'Failed to create template')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setTemplateName('')
    setTemplateDescription('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Save as Template</h2>
            <p className="mt-1 text-sm text-gray-500">
              Create a reusable template from this page's current content
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-6">
          <div>
            <label htmlFor="templateName" className="block text-sm font-medium text-gray-700">
              Template Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="templateName"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Product Landing Page"
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="templateDescription" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <Input
              id="templateDescription"
              type="text"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="e.g., A landing page template for product launches"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500">Optional description to help identify this template</p>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            <strong>Note:</strong> This will save the current page layout ({components.length}{' '}
            {components.length === 1 ? 'component' : 'components'}) as a template that can be used to create
            new pages.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </div>
    </div>
  )
}
