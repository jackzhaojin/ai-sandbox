'use client'

import React, { useState, useEffect } from 'react'
import { X, FileText, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Template {
  id: string
  name: string
  description: string | null
  thumbnailUrl: string | null
  structure: any
  defaultContent: any
  componentCount?: number
  lockedRegions?: string[]
}

interface TemplateGalleryProps {
  siteId: string
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: Template, pageTitle: string, pageSlug: string) => void
}

export default function TemplateGallery({ siteId, isOpen, onClose, onSelectTemplate }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [pageTitle, setPageTitle] = useState('')
  const [pageSlug, setPageSlug] = useState('')
  const [step, setStep] = useState<'select' | 'details'>('select')

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen, siteId])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/templates?siteId=${siteId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      const data = await response.json()

      // Add blank template as first option
      const blankTemplate: Template = {
        id: 'blank',
        name: 'Blank Page',
        description: 'Start with a blank canvas',
        thumbnailUrl: null,
        structure: [],
        defaultContent: [],
        componentCount: 0
      }

      setTemplates([blankTemplate, ...data.templates])
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load templates')
      // Still show blank template on error
      setTemplates([{
        id: 'blank',
        name: 'Blank Page',
        description: 'Start with a blank canvas',
        thumbnailUrl: null,
        structure: [],
        defaultContent: [],
        componentCount: 0
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    setStep('details')
  }

  const handleBack = () => {
    setStep('select')
    setSelectedTemplate(null)
  }

  const handleCreate = () => {
    if (!selectedTemplate) return

    if (!pageTitle.trim()) {
      toast.error('Please enter a page title')
      return
    }

    if (!pageSlug.trim()) {
      toast.error('Please enter a page slug')
      return
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(pageSlug)) {
      toast.error('Slug must be lowercase letters, numbers, and hyphens only')
      return
    }

    onSelectTemplate(selectedTemplate, pageTitle, pageSlug)
    handleClose()
  }

  const handleClose = () => {
    setStep('select')
    setSelectedTemplate(null)
    setPageTitle('')
    setPageSlug('')
    onClose()
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setPageTitle(title)

    // Auto-generate slug if it hasn't been manually edited
    if (!pageSlug || pageSlug === generateSlug(pageTitle)) {
      setPageSlug(generateSlug(title))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'select' ? 'Choose a Template' : 'Page Details'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {step === 'select'
                ? 'Select a template to start with or create a blank page'
                : 'Enter details for your new page'}
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
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {step === 'select' && (
            <>
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-gray-500">Loading templates...</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="group relative flex flex-col overflow-hidden rounded-lg border-2 border-gray-200 bg-white text-left transition-all hover:border-blue-500 hover:shadow-md"
                      type="button"
                    >
                      {/* Thumbnail */}
                      <div className="flex h-40 items-center justify-center bg-gray-100">
                        {template.thumbnailUrl ? (
                          <img
                            src={template.thumbnailUrl}
                            alt={template.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileText className="h-12 w-12 text-gray-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {template.description}
                          </p>
                        )}

                        {/* Component count badge */}
                        {template.componentCount !== undefined && template.componentCount > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              {template.componentCount} {template.componentCount === 1 ? 'component' : 'components'}
                            </span>
                            {template.lockedRegions && template.lockedRegions.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Lock className="h-3 w-3" />
                                {template.lockedRegions.length} locked
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'details' && selectedTemplate && (
            <div className="mx-auto max-w-md space-y-6">
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">{selectedTemplate.name}</h3>
                {selectedTemplate.description && (
                  <p className="mt-1 text-sm text-gray-500">{selectedTemplate.description}</p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="pageTitle" className="block text-sm font-medium text-gray-700">
                    Page Title
                  </label>
                  <Input
                    id="pageTitle"
                    type="text"
                    value={pageTitle}
                    onChange={handleTitleChange}
                    placeholder="e.g., About Us"
                    className="mt-1"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="pageSlug" className="block text-sm font-medium text-gray-700">
                    Page Slug (URL path)
                  </label>
                  <Input
                    id="pageSlug"
                    type="text"
                    value={pageSlug}
                    onChange={(e) => setPageSlug(e.target.value)}
                    placeholder="e.g., about-us"
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Lowercase letters, numbers, and hyphens only
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          {step === 'select' ? (
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleCreate}>
                Create Page
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
