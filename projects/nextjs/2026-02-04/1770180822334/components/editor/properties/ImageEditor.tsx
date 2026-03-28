'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import MediaPicker from './MediaPicker'
import PropertyLabel from './PropertyLabel'
import type { ImageComponentProps } from '@/components/renderers/ImageComponent'

interface ImageEditorProps {
  props: ImageComponentProps
  onChange: (props: Partial<ImageComponentProps>) => void
}

export default function ImageEditor({ props, onChange }: ImageEditorProps) {
  const handleChange = (key: keyof ImageComponentProps, value: string) => {
    onChange({ [key]: value })
  }

  return (
    <div className="space-y-4">
      {/* Image Source */}
      <MediaPicker
        label="Image"
        value={props.src}
        onChange={(url) => handleChange('src', url)}
      />

      {/* Alt Text */}
      <div>
        <PropertyLabel htmlFor="alt" required>Alt Text</PropertyLabel>
        <Input
          id="alt"
          value={props.alt || ''}
          onChange={(e) => handleChange('alt', e.target.value)}
          placeholder="Describe the image for accessibility"
        />
        <p className="mt-1 text-xs text-gray-500">
          Describe the image for screen readers and SEO
        </p>
      </div>

      {/* Caption */}
      <div>
        <PropertyLabel htmlFor="caption">Caption</PropertyLabel>
        <Input
          id="caption"
          value={props.caption || ''}
          onChange={(e) => handleChange('caption', e.target.value)}
          placeholder="Optional image caption"
        />
      </div>

      {/* Width */}
      <div>
        <PropertyLabel htmlFor="width">Width</PropertyLabel>
        <select
          id="width"
          value={props.width || 'full'}
          onChange={(e) => handleChange('width', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="small">Small (max-w-md)</option>
          <option value="medium">Medium (max-w-2xl)</option>
          <option value="large">Large (max-w-4xl)</option>
          <option value="full">Full Width</option>
        </select>
      </div>
    </div>
  )
}
