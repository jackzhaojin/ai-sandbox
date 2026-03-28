'use client'

import { useState } from 'react'
import { File, FileText, Film, Music, Archive, MoreVertical, Download, Copy, Trash2, Edit2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/dropdown'
import Image from 'next/image'

interface MediaFile {
  id: string
  filename: string
  originalFilename: string
  mimeType: string
  fileSize: number
  width?: number
  height?: number
  altText?: string
  tags?: string[]
  url: string
  thumbnailUrl: string
  usageCount: number
  uploadedAt: string
}

interface MediaGridProps {
  media: MediaFile[]
  selectedMediaId: string | null
  onSelectMedia: (mediaId: string) => void
  onDeleteMedia: (mediaId: string) => void
  onCopyUrl: (url: string) => void
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return null // Use image preview
  if (mimeType.startsWith('video/')) return Film
  if (mimeType.startsWith('audio/')) return Music
  if (mimeType.includes('pdf')) return FileText
  if (mimeType.includes('zip') || mimeType.includes('rar')) return Archive
  return File
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function MediaCard({ file, isSelected, onSelect, onDelete, onCopyUrl }: {
  file: MediaFile
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onCopyUrl: (url: string) => void
}) {
  const FileIcon = getFileIcon(file.mimeType)
  const isImage = file.mimeType.startsWith('image/')

  return (
    <div
      className={`
        group relative bg-white border-2 rounded-lg overflow-hidden cursor-pointer
        transition-all hover:shadow-md
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
      `}
      onClick={onSelect}
    >
      {/* Thumbnail/Preview */}
      <div className="aspect-square bg-gray-100 relative flex items-center justify-center">
        {isImage ? (
          <Image
            src={file.thumbnailUrl}
            alt={file.altText || file.originalFilename}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          />
        ) : FileIcon ? (
          <FileIcon className="w-12 h-12 text-gray-400" />
        ) : (
          <File className="w-12 h-12 text-gray-400" />
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {/* Usage badge */}
          {file.usageCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              Used on {file.usageCount} page{file.usageCount !== 1 ? 's' : ''}
            </Badge>
          )}

          {/* Missing alt text warning - WCAG 2.1 AA */}
          {isImage && !file.altText && (
            <Badge
              variant="destructive"
              className="text-xs flex items-center gap-1"
              title="Missing alt text - required for accessibility"
            >
              <AlertCircle className="w-3 h-3" aria-hidden="true" />
              No alt text
            </Badge>
          )}
        </div>

        {/* Actions menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Dropdown
            trigger={
              <button
                className="p-1.5 bg-white rounded-lg shadow-md hover:bg-gray-50"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>
            }
          >
            <DropdownItem icon={<Copy className="w-4 h-4" />} onClick={() => onCopyUrl(file.url)}>
              Copy URL
            </DropdownItem>
            <DropdownItem
              icon={<Download className="w-4 h-4" />}
              onClick={() => {
                const a = document.createElement('a')
                a.href = file.url
                a.download = file.originalFilename
                a.click()
              }}
            >
              Download
            </DropdownItem>
            <DropdownItem icon={<Edit2 className="w-4 h-4" />} onClick={onSelect}>
              Edit Details
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem icon={<Trash2 className="w-4 h-4 text-red-600" />} onClick={onDelete}>
              <span className="text-red-600">Delete</span>
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* File info */}
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium text-gray-900 truncate" title={file.originalFilename}>
          {file.originalFilename}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatFileSize(file.fileSize)}</span>
          {file.width && file.height && (
            <span>{file.width} × {file.height}</span>
          )}
        </div>

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {file.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {file.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{file.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function MediaGrid({
  media,
  selectedMediaId,
  onSelectMedia,
  onDeleteMedia,
  onCopyUrl,
}: MediaGridProps) {
  if (media.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-center">
        <div>
          <File className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No media files</h3>
          <p className="text-sm text-gray-500">Upload files to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {media.map(file => (
        <MediaCard
          key={file.id}
          file={file}
          isSelected={selectedMediaId === file.id}
          onSelect={() => onSelectMedia(file.id)}
          onDelete={() => onDeleteMedia(file.id)}
          onCopyUrl={onCopyUrl}
        />
      ))}
    </div>
  )
}
