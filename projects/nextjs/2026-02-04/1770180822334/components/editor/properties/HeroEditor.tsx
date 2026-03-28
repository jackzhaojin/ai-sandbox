'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import MediaPicker from './MediaPicker'
import PropertyLabel from './PropertyLabel'
import type { HeroProps } from '@/components/renderers/Hero'

interface HeroEditorProps {
  props: HeroProps
  onChange: (props: Partial<HeroProps>) => void
}

export default function HeroEditor({ props, onChange }: HeroEditorProps) {
  const handleChange = (key: keyof HeroProps, value: string) => {
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
          placeholder="Enter hero heading"
        />
      </div>

      {/* Subheading */}
      <div>
        <PropertyLabel htmlFor="subheading">Subheading</PropertyLabel>
        <Input
          id="subheading"
          value={props.subheading || ''}
          onChange={(e) => handleChange('subheading', e.target.value)}
          placeholder="Enter hero subheading"
        />
      </div>

      {/* Background Image */}
      <MediaPicker
        label="Background Image"
        value={props.backgroundImage}
        onChange={(url) => handleChange('backgroundImage', url)}
      />

      {/* Primary Button */}
      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Primary Button</h4>
        <div className="space-y-3">
          <div>
            <PropertyLabel htmlFor="primaryButtonText">Button Text</PropertyLabel>
            <Input
              id="primaryButtonText"
              value={props.primaryButtonText || ''}
              onChange={(e) => handleChange('primaryButtonText', e.target.value)}
              placeholder="e.g., Get Started"
            />
          </div>
          <div>
            <PropertyLabel htmlFor="primaryButtonLink">Button Link</PropertyLabel>
            <Input
              id="primaryButtonLink"
              value={props.primaryButtonLink || ''}
              onChange={(e) => handleChange('primaryButtonLink', e.target.value)}
              placeholder="e.g., /signup"
            />
          </div>
        </div>
      </div>

      {/* Secondary Button */}
      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Secondary Button</h4>
        <div className="space-y-3">
          <div>
            <PropertyLabel htmlFor="secondaryButtonText">Button Text</PropertyLabel>
            <Input
              id="secondaryButtonText"
              value={props.secondaryButtonText || ''}
              onChange={(e) => handleChange('secondaryButtonText', e.target.value)}
              placeholder="e.g., Learn More"
            />
          </div>
          <div>
            <PropertyLabel htmlFor="secondaryButtonLink">Button Link</PropertyLabel>
            <Input
              id="secondaryButtonLink"
              value={props.secondaryButtonLink || ''}
              onChange={(e) => handleChange('secondaryButtonLink', e.target.value)}
              placeholder="e.g., /about"
            />
          </div>
        </div>
      </div>

      {/* Height */}
      <div className="border-t pt-4 mt-4">
        <PropertyLabel htmlFor="height">Height</PropertyLabel>
        <select
          id="height"
          value={props.height || 'large'}
          onChange={(e) => handleChange('height', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="small">Small (300px)</option>
          <option value="medium">Medium (500px)</option>
          <option value="large">Large (700px)</option>
        </select>
      </div>

      {/* Alignment */}
      <div>
        <PropertyLabel htmlFor="alignment">Text Alignment</PropertyLabel>
        <div className="flex gap-2">
          {['left', 'center', 'right'].map((align) => (
            <button
              key={align}
              onClick={() => handleChange('alignment', align)}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition ${
                (props.alignment || 'center') === align
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {align.charAt(0).toUpperCase() + align.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
