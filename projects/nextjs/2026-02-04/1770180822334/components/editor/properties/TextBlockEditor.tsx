'use client'

import React from 'react'
import PropertyLabel from './PropertyLabel'
import RichTextEditor from './RichTextEditor'
import type { TextBlockProps } from '@/components/renderers/TextBlock'

interface TextBlockEditorProps {
  props: TextBlockProps
  onChange: (props: Partial<TextBlockProps>) => void
}

export default function TextBlockEditor({ props, onChange }: TextBlockEditorProps) {
  const handleContentChange = (html: string) => {
    onChange({ content: html })
  }

  const handleAlignmentChange = (align: 'left' | 'center' | 'right') => {
    onChange({ textAlign: align })
  }

  return (
    <div className="space-y-4">
      {/* Text Alignment */}
      <div>
        <PropertyLabel htmlFor="textAlign">Text Alignment</PropertyLabel>
        <div className="flex gap-2">
          {['left', 'center', 'right'].map((align) => (
            <button
              key={align}
              onClick={() => handleAlignmentChange(align as 'left' | 'center' | 'right')}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition ${
                (props.textAlign || 'left') === align
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {align.charAt(0).toUpperCase() + align.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Rich Text Content */}
      <div>
        <PropertyLabel>Content</PropertyLabel>
        <RichTextEditor
          content={props.content || '<p>Enter your content here...</p>'}
          onChange={handleContentChange}
          placeholder="Enter your text content..."
        />
      </div>
    </div>
  )
}
