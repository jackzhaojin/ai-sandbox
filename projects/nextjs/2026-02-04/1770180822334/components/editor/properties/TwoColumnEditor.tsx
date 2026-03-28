'use client'

import React from 'react'
import PropertyLabel from './PropertyLabel'
import RichTextEditor from './RichTextEditor'
import type { TwoColumnProps } from '@/components/renderers/TwoColumn'

interface TwoColumnEditorProps {
  props: TwoColumnProps
  onChange: (props: Partial<TwoColumnProps>) => void
}

export default function TwoColumnEditor({ props, onChange }: TwoColumnEditorProps) {
  const handleLeftContentChange = (html: string) => {
    onChange({ leftContent: html })
  }

  const handleRightContentChange = (html: string) => {
    onChange({ rightContent: html })
  }

  const handleRatioChange = (ratio: string) => {
    onChange({ columnRatio: ratio as TwoColumnProps['columnRatio'] })
  }

  return (
    <div className="space-y-4">
      {/* Column Ratio */}
      <div>
        <PropertyLabel htmlFor="columnRatio">Column Ratio</PropertyLabel>
        <select
          id="columnRatio"
          value={props.columnRatio || '50-50'}
          onChange={(e) => handleRatioChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="50-50">50% / 50%</option>
          <option value="60-40">60% / 40%</option>
          <option value="40-60">40% / 60%</option>
          <option value="70-30">70% / 30%</option>
          <option value="30-70">30% / 70%</option>
        </select>
      </div>

      {/* Left Column Content */}
      <div>
        <PropertyLabel>Left Column Content</PropertyLabel>
        <RichTextEditor
          content={props.leftContent || '<p>Left column content...</p>'}
          onChange={handleLeftContentChange}
        />
      </div>

      {/* Right Column Content */}
      <div>
        <PropertyLabel>Right Column Content</PropertyLabel>
        <RichTextEditor
          content={props.rightContent || '<p>Right column content...</p>'}
          onChange={handleRightContentChange}
        />
      </div>
    </div>
  )
}
