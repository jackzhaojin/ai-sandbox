'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import PropertyLabel from './PropertyLabel'
import type { CTAProps } from '@/components/renderers/CTA'

interface CTAEditorProps {
  props: CTAProps
  onChange: (props: Partial<CTAProps>) => void
}

export default function CTAEditor({ props, onChange }: CTAEditorProps) {
  const handleChange = (key: keyof CTAProps, value: string) => {
    onChange({ [key]: value })
  }

  return (
    <div className="space-y-4">
      {/* Heading */}
      <div>
        <PropertyLabel htmlFor="heading" required>Heading</PropertyLabel>
        <Input
          id="heading"
          value={props.heading || ''}
          onChange={(e) => handleChange('heading', e.target.value)}
          placeholder="Enter CTA heading"
        />
      </div>

      {/* Description */}
      <div>
        <PropertyLabel htmlFor="description">Description</PropertyLabel>
        <Textarea
          id="description"
          value={props.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter CTA description"
          rows={3}
        />
      </div>

      {/* Button Text */}
      <div>
        <PropertyLabel htmlFor="buttonText" required>Button Text</PropertyLabel>
        <Input
          id="buttonText"
          value={props.buttonText || ''}
          onChange={(e) => handleChange('buttonText', e.target.value)}
          placeholder="e.g., Get Started"
        />
      </div>

      {/* Button Link */}
      <div>
        <PropertyLabel htmlFor="buttonLink" required>Button Link</PropertyLabel>
        <Input
          id="buttonLink"
          value={props.buttonLink || ''}
          onChange={(e) => handleChange('buttonLink', e.target.value)}
          placeholder="e.g., /signup"
        />
      </div>

      {/* Background Color */}
      <div>
        <PropertyLabel htmlFor="backgroundColor">Background Color</PropertyLabel>
        <select
          id="backgroundColor"
          value={props.backgroundColor || 'primary'}
          onChange={(e) => handleChange('backgroundColor', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="primary">Primary (Blue)</option>
          <option value="secondary">Secondary (Purple)</option>
          <option value="gray">Gray</option>
        </select>
      </div>

      {/* Button Variant */}
      <div>
        <PropertyLabel htmlFor="variant">Button Style</PropertyLabel>
        <div className="grid grid-cols-3 gap-2">
          {['primary', 'secondary', 'outline'].map((variant) => (
            <button
              key={variant}
              onClick={() => handleChange('variant', variant)}
              className={`px-4 py-2 rounded-lg border-2 transition text-sm ${
                (props.variant || 'primary') === variant
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
