'use client'

import { useState, useEffect, use } from 'react'
import { Search, Upload as UploadIcon, Filter, X, FolderPlus } from 'lucide-react'
import { FolderTree } from '@/components/media/folder-tree'
import { UploadZone } from '@/components/media/upload-zone'
import { MediaGrid } from '@/components/media/media-grid'
import { MediaDetailPanel } from '@/components/media/media-detail-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: Promise<{ siteId: string }>
}

export default function MediaPage({ params }: PageProps) {
  const { siteId } = use(params)

  const [folders, setFolders] = useState<any[]>([])
  const [media, setMedia] = useState<any[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Modals
  const [showUpload, setShowUpload] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null)
  const [showRenameFolder, setShowRenameFolder] = useState(false)
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null)
  const [renameFolderName, setRenameFolderName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'folder' | 'media', id: string } | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [mimeTypeFilter, setMimeTypeFilter] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchFolders()
    fetchMedia()
  }, [siteId, selectedFolderId, searchQuery, mimeTypeFilter])

  const fetchFolders = async () => {
    try {
      const response = await fetch(`/api/media/folders?siteId=${siteId}`)
      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders)
      }
    } catch (error) {
      console.error('Error fetching folders:', error)
    }
  }

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        siteId,
        ...(selectedFolderId && { folderId: selectedFolderId }),
        ...(selectedFolderId === null && { folderId: '' }),
        ...(searchQuery && { search: searchQuery }),
        ...(mimeTypeFilter && { mimeType: mimeTypeFilter }),
      })

      const response = await fetch(`/api/media?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMedia(data.media)
      }
    } catch (error) {
      console.error('Error fetching media:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await fetch('/api/media/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          name: newFolderName,
          parentId: newFolderParentId,
        }),
      })

      if (response.ok) {
        setShowNewFolder(false)
        setNewFolderName('')
        setNewFolderParentId(null)
        fetchFolders()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create folder')
      }
    } catch (error) {
      console.error('Error creating folder:', error)
      alert('Failed to create folder')
    }
  }

  const handleRenameFolder = async () => {
    if (!renameFolderName.trim() || !renameFolderId) return

    try {
      const response = await fetch(`/api/media/folders/${renameFolderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameFolderName }),
      })

      if (response.ok) {
        setShowRenameFolder(false)
        setRenameFolderId(null)
        setRenameFolderName('')
        fetchFolders()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to rename folder')
      }
    } catch (error) {
      console.error('Error renaming folder:', error)
      alert('Failed to rename folder')
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const response = await fetch(`/api/media/folders/${folderId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setShowDeleteConfirm(false)
        setDeleteTarget(null)
        fetchFolders()
        if (selectedFolderId === folderId) {
          setSelectedFolderId(null)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete folder')
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
      alert('Failed to delete folder')
    }
  }

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setShowDeleteConfirm(false)
        setDeleteTarget(null)
        setSelectedMediaId(null)
        fetchMedia()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete media')
      }
    } catch (error) {
      console.error('Error deleting media:', error)
      alert('Failed to delete media')
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    // Could add toast notification here
  }

  return (
    <div className="h-screen flex">
      {/* Folder Sidebar */}
      <div className="w-64 border-r bg-gray-50">
        <FolderTree
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onCreateFolder={(parentId) => {
            setNewFolderParentId(parentId)
            setShowNewFolder(true)
          }}
          onRenameFolder={(folderId) => {
            const folder = folders.find(f => f.id === folderId)
            if (folder) {
              setRenameFolderId(folderId)
              setRenameFolderName(folder.name)
              setShowRenameFolder(true)
            }
          }}
          onDeleteFolder={(folderId) => {
            setDeleteTarget({ type: 'folder', id: folderId })
            setShowDeleteConfirm(true)
          }}
          onMoveFolder={(folderId) => {
            // TODO: Implement move folder modal
            alert('Move folder functionality coming soon')
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
            <p className="text-sm text-gray-500 mt-1">
              {media.length} file{media.length !== 1 ? 's' : ''}
              {selectedFolderId && folders.find(f => f.id === selectedFolderId) && (
                <> in {folders.find(f => f.id === selectedFolderId)?.name}</>
              )}
            </p>
          </div>

          <Button onClick={() => setShowUpload(true)} className="gap-2">
            <UploadIcon className="w-4 h-4" />
            Upload Files
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b bg-white space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by filename, alt text, or tags..."
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Active Filters */}
          {(mimeTypeFilter || searchQuery) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery('')}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {mimeTypeFilter && (
                <Badge variant="secondary" className="gap-1">
                  Type: {mimeTypeFilter}
                  <button onClick={() => setMimeTypeFilter(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearchQuery('')
                  setMimeTypeFilter(null)
                }}
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Filter Options */}
          {showFilters && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {['image/', 'video/', 'application/pdf'].map(type => (
                    <Button
                      key={type}
                      size="sm"
                      variant={mimeTypeFilter === type ? 'default' : 'outline'}
                      onClick={() => setMimeTypeFilter(mimeTypeFilter === type ? null : type)}
                    >
                      {type === 'image/' && 'Images'}
                      {type === 'video/' && 'Videos'}
                      {type === 'application/pdf' && 'PDFs'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading media...</p>
              </div>
            </div>
          ) : (
            <MediaGrid
              media={media}
              selectedMediaId={selectedMediaId}
              onSelectMedia={setSelectedMediaId}
              onDeleteMedia={(mediaId) => {
                setDeleteTarget({ type: 'media', id: mediaId })
                setShowDeleteConfirm(true)
              }}
              onCopyUrl={handleCopyUrl}
            />
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedMediaId && (
        <MediaDetailPanel
          mediaId={selectedMediaId}
          onClose={() => setSelectedMediaId(null)}
          onDelete={(mediaId) => {
            setDeleteTarget({ type: 'media', id: mediaId })
            setShowDeleteConfirm(true)
          }}
          onUpdate={fetchMedia}
        />
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        title="Upload Files"
        size="lg"
      >
        <UploadZone
          siteId={siteId}
          folderId={selectedFolderId}
          onUploadComplete={() => {
            fetchMedia()
          }}
        />
      </Modal>

      {/* New Folder Modal */}
      <Modal
        isOpen={showNewFolder}
        onClose={() => {
          setShowNewFolder(false)
          setNewFolderName('')
          setNewFolderParentId(null)
        }}
        title="Create Folder"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Folder Name
            </label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder()
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewFolder(false)
                setNewFolderName('')
                setNewFolderParentId(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rename Folder Modal */}
      <Modal
        isOpen={showRenameFolder}
        onClose={() => {
          setShowRenameFolder(false)
          setRenameFolderId(null)
          setRenameFolderName('')
        }}
        title="Rename Folder"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Name
            </label>
            <Input
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              placeholder="Enter new name..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameFolder()
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRenameFolder(false)
                setRenameFolderId(null)
                setRenameFolderName('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameFolder} disabled={!renameFolderName.trim()}>
              Rename
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setDeleteTarget(null)
        }}
        title={`Delete ${deleteTarget?.type === 'folder' ? 'Folder' : 'Media'}`}
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false)
                setDeleteTarget(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget?.type === 'folder') {
                  handleDeleteFolder(deleteTarget.id)
                } else if (deleteTarget?.type === 'media') {
                  handleDeleteMedia(deleteTarget.id)
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
