'use client'

import React, { useState, useEffect } from 'react'
import { useEditor } from './EditorContext'
import {
  Save,
  Eye,
  Upload,
  Undo,
  Redo,
  Monitor,
  Tablet,
  Smartphone,
  Clock,
  FileArchive,
  CheckSquare
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import VersionHistoryPanel from './VersionHistoryPanel'
import SaveAsTemplateModal from './SaveAsTemplateModal'
import PageWorkflowActions from './PageWorkflowActions'
import ReviewPanel from './ReviewPanel'

export default function EditorToolbar() {
  const router = useRouter()
  const {
    isDirty,
    canUndo,
    canRedo,
    undo,
    redo,
    viewport,
    setViewport,
    pageId,
    siteId,
    components,
    resetHistory
  } = useEditor()

  const [isSaving, setIsSaving] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false)
  const [showReviewPanel, setShowReviewPanel] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [pageStatus, setPageStatus] = useState<string>('draft')
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)

  // Check if user is admin and fetch page status
  useEffect(() => {
    fetchUserRole()
    fetchPageStatus()
  }, [pageId])

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/auth/profile')
      if (response.ok) {
        const data = await response.json()
        setIsAdmin(data.profile.role === 'admin')
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const fetchPageStatus = async () => {
    try {
      const response = await fetch(`/api/pages/${pageId}`)
      if (response.ok) {
        const data = await response.json()
        setPageStatus(data.page.status || 'draft')
        setScheduledAt(data.page.scheduledPublishAt || null)
      }
    } catch (error) {
      console.error('Error fetching page status:', error)
    }
  }

  const handleStatusChange = () => {
    fetchPageStatus()
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/pages/${pageId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          components,
          changeSummary: `Saved ${components.length} components`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save page')
      }

      const data = await response.json()

      // Reset history to create new checkpoint
      resetHistory()

      toast.success(`Saved successfully (Version ${data.version.versionNumber})`)
    } catch (error) {
      console.error('Error saving page:', error)
      toast.error('Failed to save page')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    // TODO: Implement preview functionality
    console.log('Preview clicked')
    alert('Preview functionality will be implemented in later steps')
  }

  const handleSubmitForReview = async () => {
    if (!window.confirm('Submit this page for review?')) return

    try {
      const response = await fetch(`/api/pages/${pageId}/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comments: '',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit for review')
      }

      toast.success('Page submitted for review')
      // Reload to update status
      window.location.reload()
    } catch (error: any) {
      console.error('Error submitting for review:', error)
      toast.error(error.message || 'Failed to submit for review')
    }
  }

  const handlePublish = () => {
    // TODO: Implement direct publish functionality
    console.log('Publish clicked')
    alert('Publish functionality will be implemented in later steps (admin only)')
  }

  const handleVersionHistory = () => {
    setShowVersionHistory(true)
  }

  return (
    <>
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      {/* Left: Page info */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/dashboard/${siteId}`)}
          className="text-sm text-gray-500 hover:text-gray-700"
          type="button"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Center: Viewport toggles and undo/redo */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <div className="flex gap-1 border-r border-gray-200 pr-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="rounded p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            title="Undo"
            type="button"
          >
            <Undo className="h-4 w-4 text-gray-700" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="rounded p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            title="Redo"
            type="button"
          >
            <Redo className="h-4 w-4 text-gray-700" />
          </button>
        </div>

        {/* Viewport Toggle */}
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setViewport('desktop')}
            className={`rounded p-2 transition-colors ${
              viewport === 'desktop'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Desktop view"
            type="button"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`rounded p-2 transition-colors ${
              viewport === 'tablet'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Tablet view"
            type="button"
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`rounded p-2 transition-colors ${
              viewport === 'mobile'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Mobile view"
            type="button"
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-2">
        {/* Workflow Actions (Schedule, Archive, etc.) */}
        <PageWorkflowActions
          pageId={pageId}
          currentStatus={pageStatus}
          scheduledAt={scheduledAt}
          isAdmin={isAdmin}
          onStatusChange={handleStatusChange}
        />

        {/* Version History */}
        <button
          onClick={handleVersionHistory}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          type="button"
        >
          <Clock className="h-4 w-4" />
          Version History
        </button>

        {/* Save as Template (Admin only) */}
        {isAdmin && (
          <button
            onClick={() => setShowSaveAsTemplate(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            type="button"
            title="Save this page as a reusable template"
          >
            <FileArchive className="h-4 w-4" />
            Save as Template
          </button>
        )}

        {/* Review Button (Admin only, when page is in_review) */}
        {isAdmin && pageStatus === 'in_review' && (
          <button
            onClick={() => setShowReviewPanel(true)}
            className="flex items-center gap-2 rounded-lg border border-yellow-400 bg-yellow-50 px-3 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100"
            type="button"
          >
            <CheckSquare className="h-4 w-4" />
            Review
          </button>
        )}

        {/* Preview */}
        <button
          onClick={handlePreview}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          type="button"
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
        >
          <Save className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        {/* Submit for Review (Authors) or Publish (Admins) */}
        {!isAdmin ? (
          <button
            onClick={handleSubmitForReview}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            type="button"
          >
            <Upload className="h-4 w-4" />
            Submit for Review
          </button>
        ) : (
          <button
            onClick={handlePublish}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            type="button"
          >
            <Upload className="h-4 w-4" />
            Publish
          </button>
        )}
      </div>
    </header>

    {/* Version History Panel */}
    <VersionHistoryPanel
      isOpen={showVersionHistory}
      onClose={() => setShowVersionHistory(false)}
    />

    {/* Save as Template Modal */}
    <SaveAsTemplateModal
      isOpen={showSaveAsTemplate}
      onClose={() => setShowSaveAsTemplate(false)}
      components={components}
      siteId={siteId}
    />

    {/* Review Panel */}
    <ReviewPanel
      pageId={pageId}
      isOpen={showReviewPanel}
      onClose={() => setShowReviewPanel(false)}
      onReviewComplete={handleStatusChange}
    />
    </>
  )
}
