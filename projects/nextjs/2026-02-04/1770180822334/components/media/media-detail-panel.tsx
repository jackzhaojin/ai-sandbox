'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Trash2, FolderInput, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  caption?: string
  tags?: string[]
  folderId?: string | null
  url: string
  thumbnailUrl: string
  mediumUrl: string
  largeUrl: string
  usageCount: number
  uploadedAt: string
}

interface MediaDetailPanelProps {
  mediaId: string
  onClose: () => void
  onDelete: (mediaId: string) => void
  onUpdate: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MediaDetailPanel({ mediaId, onClose, onDelete, onUpdate }: MediaDetailPanelProps) {
  const [media, setMedia] = useState<MediaFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    fetchMedia()
  }, [mediaId])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/media/${mediaId}`)
      if (response.ok) {
        const data = await response.json()
        setMedia(data)
        setAltText(data.altText || '')
        setCaption(data.caption || '')
        setTags(data.tags || [])
      }
    } catch (error) {
      console.error('Error fetching media:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          altText,
          caption,
          tags,
        }),
      })

      if (response.ok) {
        onUpdate()
        fetchMedia()
      }
    } catch (error) {
      console.error('Error saving media:', error)
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (url: string, label: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(label)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  if (loading || !media) {
    return (
      <div className="w-96 bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  const isImage = media.mimeType.startsWith('image/')
  const hasChanges =
    altText !== (media.altText || '') ||
    caption !== (media.caption || '') ||
    JSON.stringify(tags) !== JSON.stringify(media.tags || [])

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-gray-900">Details</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Preview */}
        {isImage && (
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={media.mediumUrl}
              alt={media.altText || media.originalFilename}
              fill
              className="object-contain"
              sizes="384px"
            />
          </div>
        )}

        {/* File Info */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">File Information</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Filename:</span>
              <span className="text-gray-900 font-medium truncate ml-2" title={media.originalFilename}>
                {media.originalFilename}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Size:</span>
              <span className="text-gray-900">{formatFileSize(media.fileSize)}</span>
            </div>
            {media.width && media.height && (
              <div className="flex justify-between">
                <span className="text-gray-500">Dimensions:</span>
                <span className="text-gray-900">{media.width} × {media.height}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Type:</span>
              <span className="text-gray-900">{media.mimeType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Uploaded:</span>
              <span className="text-gray-900">{formatDate(media.uploadedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Usage:</span>
              <Badge variant={media.usageCount > 0 ? 'default' : 'secondary'}>
                Used on {media.usageCount} page{media.usageCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </div>

        {/* URLs */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">URLs</h3>
          <div className="space-y-2">
            {[
              { label: 'Original', url: media.url },
              ...(isImage ? [
                { label: 'Large (1600px)', url: media.largeUrl },
                { label: 'Medium (800px)', url: media.mediumUrl },
                { label: 'Thumbnail (200px)', url: media.thumbnailUrl },
              ] : []),
            ].map(({ label, url }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-32">{label}:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(url, label)}
                  className="flex-1 justify-start text-xs"
                >
                  {copiedUrl === label ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Alt Text */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            Alt Text
          </label>
          <Textarea
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe this image for accessibility..."
            rows={3}
          />
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            Caption
          </label>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            rows={2}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            Tags
          </label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
              placeholder="Add tag..."
            />
            <Button onClick={addTag} variant="outline" size="sm">
              <Tag className="w-4 h-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t space-y-2">
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}

        <Button
          variant="destructive"
          onClick={() => onDelete(mediaId)}
          disabled={media.usageCount > 0}
          className="w-full gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete File
        </Button>
        {media.usageCount > 0 && (
          <p className="text-xs text-gray-500 text-center">
            Cannot delete media used on pages
          </p>
        )}
      </div>
    </div>
  )
}
