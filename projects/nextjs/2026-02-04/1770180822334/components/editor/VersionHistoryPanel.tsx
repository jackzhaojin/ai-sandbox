'use client'

import React, { useState, useEffect } from 'react'
import { X, Eye, RotateCcw, Clock, User } from 'lucide-react'
import { useEditor } from './EditorContext'
import { toast } from 'sonner'
import { ComponentInstance } from './EditorContext'

interface Version {
  id: string
  versionNumber: number
  content: {
    components: ComponentInstance[]
  }
  layout: Record<string, unknown>
  metadata: {
    savedAt?: string
    componentCount?: number
  }
  createdAt: string
  changeSummary: string
  isPublished: boolean
  createdBy: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
  }
}

interface VersionHistoryPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function VersionHistoryPanel({ isOpen, onClose }: VersionHistoryPanelProps) {
  const { pageId, setComponents, resetHistory } = useEditor()
  const [versions, setVersions] = useState<Version[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchVersions()
    }
  }, [isOpen, pageId])

  const fetchVersions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/pages/${pageId}/versions`)
      if (!response.ok) {
        throw new Error('Failed to fetch versions')
      }
      const data = await response.json()
      setVersions(data.versions)
    } catch (error) {
      console.error('Error fetching versions:', error)
      toast.error('Failed to load version history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewVersion = (version: Version) => {
    setSelectedVersion(version)
    setShowPreview(true)
  }

  const handleRestoreVersion = (version: Version) => {
    if (!confirm(`Are you sure you want to restore Version ${version.versionNumber}? This will replace your current working state (but won't auto-save).`)) {
      return
    }

    try {
      // Load version's components into the editor
      setComponents(version.content.components)
      toast.success(`Restored Version ${version.versionNumber}. Don't forget to save!`)
      onClose()
    } catch (error) {
      console.error('Error restoring version:', error)
      toast.error('Failed to restore version')
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Slide-out panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100"
            type="button"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-2 text-sm text-gray-500">Loading versions...</p>
              </div>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Clock className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No versions saved yet</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          Version {version.versionNumber}
                        </span>
                        {version.isPublished && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            Published
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {version.changeSummary}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{version.createdBy.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeTime(version.createdAt)}</span>
                        </div>
                      </div>
                      {version.metadata.componentCount !== undefined && (
                        <p className="text-xs text-gray-400 mt-1">
                          {version.metadata.componentCount} component{version.metadata.componentCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleViewVersion(version)}
                      className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      type="button"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </button>
                    <button
                      onClick={() => handleRestoreVersion(version)}
                      className="flex items-center gap-1 rounded border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      type="button"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedVersion && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-8">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Preview Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Version {selectedVersion.versionNumber} Preview
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Read-only preview • {formatRelativeTime(selectedVersion.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg p-1 hover:bg-gray-100"
                type="button"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">
                  Components ({selectedVersion.content.components.length})
                </h4>
                {selectedVersion.content.components.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No components in this version</p>
                ) : (
                  <div className="space-y-3">
                    {selectedVersion.content.components.map((component, index) => (
                      <div
                        key={component.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-500">#{index + 1}</span>
                          <span className="text-sm font-semibold text-gray-900 capitalize">
                            {component.type}
                          </span>
                        </div>
                        <pre className="text-xs text-gray-600 overflow-x-auto">
                          {JSON.stringify(component.props, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Preview Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                type="button"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPreview(false)
                  handleRestoreVersion(selectedVersion)
                }}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                type="button"
              >
                <RotateCcw className="h-4 w-4" />
                Restore This Version
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
