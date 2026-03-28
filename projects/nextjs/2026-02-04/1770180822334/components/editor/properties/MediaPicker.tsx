'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface MediaItem {
  id: string
  url: string
  name: string
  type: string
}

interface MediaPickerProps {
  value?: string
  onChange: (url: string) => void
  label?: string
}

export default function MediaPicker({ value, onChange, label = 'Image' }: MediaPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState(value || '')

  // Load media from API when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMedia()
    }
  }, [isOpen])

  const loadMedia = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/media')
      if (response.ok) {
        const data = await response.json()
        setMedia(data.media || [])
      }
    } catch (error) {
      console.error('Failed to load media:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = () => {
    onChange(selectedUrl)
    setIsOpen(false)
  }

  const handleRemove = () => {
    onChange('')
    setSelectedUrl('')
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Preview */}
      {value && (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img
            src={value}
            alt="Selected media"
            className="w-full h-32 object-cover"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition"
            title="Remove image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
        >
          {value ? 'Change Image' : 'Select Image'}
        </Button>
        {value && (
          <Button
            onClick={handleRemove}
            variant="outline"
            size="sm"
          >
            Remove
          </Button>
        )}
      </div>

      {/* Media Library Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Select Media">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading media...</div>
          ) : media.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No media available. Upload images in the Media Library first.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {media.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedUrl(item.url)}
                    className={`relative rounded-lg overflow-hidden border-2 transition ${
                      selectedUrl === item.url
                        ? 'border-blue-600 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-24 object-cover"
                    />
                    {selectedUrl === item.url && (
                      <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button onClick={() => setIsOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleSelect} disabled={!selectedUrl}>
                  Select
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
