'use client'

import { useState, useEffect } from 'react'
import { Search, Check, Upload as UploadIcon } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UploadZone } from './upload-zone'
import Image from 'next/image'

interface MediaFile {
  id: string
  filename: string
  originalFilename: string
  mimeType: string
  fileSize: number
  width?: number
  height?: number
  url: string
  thumbnailUrl: string
}

interface MediaPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (media: MediaFile) => void
  siteId: string
  allowedTypes?: string[] // e.g., ['image/', 'video/']
  multiple?: boolean
}

export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  siteId,
  allowedTypes,
  multiple = false,
}: MediaPickerProps) {
  const [media, setMedia] = useState<MediaFile[]>([])
  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'browse' | 'upload'>('browse')

  useEffect(() => {
    if (isOpen) {
      fetchMedia()
      setSelectedMedia([])
    }
  }, [isOpen, searchQuery])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        siteId,
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await fetch(`/api/media?${params}`)
      if (response.ok) {
        const data = await response.json()

        // Filter by allowed types if specified
        let filteredMedia = data.media
        if (allowedTypes && allowedTypes.length > 0) {
          filteredMedia = filteredMedia.filter((file: MediaFile) =>
            allowedTypes.some(type => file.mimeType.startsWith(type))
          )
        }

        setMedia(filteredMedia)
      }
    } catch (error) {
      console.error('Error fetching media:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (file: MediaFile) => {
    if (multiple) {
      const isSelected = selectedMedia.some(m => m.id === file.id)
      if (isSelected) {
        setSelectedMedia(selectedMedia.filter(m => m.id !== file.id))
      } else {
        setSelectedMedia([...selectedMedia, file])
      }
    } else {
      onSelect(file)
      onClose()
    }
  }

  const handleConfirmMultiple = () => {
    if (selectedMedia.length > 0) {
      selectedMedia.forEach(file => onSelect(file))
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Media"
      size="xl"
    >
      <div className="flex flex-col h-[600px]">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              view === 'browse'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setView('browse')}
          >
            Browse Library
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              view === 'upload'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setView('upload')}
          >
            Upload New
          </button>
        </div>

        {view === 'browse' ? (
          <>
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search media..."
                  className="pl-10"
                />
              </div>
              {allowedTypes && allowedTypes.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Showing only:</span>
                  {allowedTypes.map(type => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type.replace('/', '')}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Media Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading media...</p>
                  </div>
                </div>
              ) : media.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <UploadIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No media found</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {searchQuery ? 'Try a different search query' : 'Upload files to get started'}
                    </p>
                    <Button onClick={() => setView('upload')}>
                      Upload Files
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {media.map(file => {
                    const isSelected = multiple && selectedMedia.some(m => m.id === file.id)
                    const isImage = file.mimeType.startsWith('image/')

                    return (
                      <button
                        key={file.id}
                        onClick={() => handleSelect(file)}
                        className={`
                          relative bg-white border-2 rounded-lg overflow-hidden
                          hover:shadow-md transition-all
                          ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
                        `}
                      >
                        <div className="aspect-square bg-gray-100 relative flex items-center justify-center">
                          {isImage ? (
                            <Image
                              src={file.thumbnailUrl}
                              alt={file.originalFilename}
                              fill
                              className="object-cover"
                              sizes="200px"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <p className="text-xs text-gray-500 uppercase">
                                {file.mimeType.split('/')[1]}
                              </p>
                            </div>
                          )}

                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="p-2">
                          <p className="text-xs text-gray-900 truncate" title={file.originalFilename}>
                            {file.originalFilename}
                          </p>
                          {file.width && file.height && (
                            <p className="text-xs text-gray-500">
                              {file.width} × {file.height}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {multiple && selectedMedia.length > 0 && (
              <div className="p-4 border-t flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  {selectedMedia.length} file{selectedMedia.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleConfirmMultiple}>
                    Insert Selected
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <UploadZone
              siteId={siteId}
              folderId={null}
              onUploadComplete={() => {
                fetchMedia()
                setView('browse')
              }}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
