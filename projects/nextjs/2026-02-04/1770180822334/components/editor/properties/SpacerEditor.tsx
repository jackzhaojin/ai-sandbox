'use client'

import React from 'react'
import PropertyLabel from './PropertyLabel'
import type { SpacerProps } from '@/components/renderers/Spacer'

interface SpacerEditorProps {
  props: SpacerProps
  onChange: (props: Partial<SpacerProps>) => void
}

export default function SpacerEditor({ props, onChange }: SpacerEditorProps) {
  const handleHeightChange = (height: string) => {
    onChange({ height: height as SpacerProps['height'] })
  }

  const heights = [
    { value: 'small', label: 'Small', description: '32-48px' },
    { value: 'medium', label: 'Medium', description: '64-80px' },
    { value: 'large', label: 'Large', description: '96-128px' },
    { value: 'xl', label: 'Extra Large', description: '128-192px' }
  ]

  return (
    <div className="space-y-4">
      <div>
        <PropertyLabel htmlFor="height">Spacing Height</PropertyLabel>
        <div className="space-y-2">
          {heights.map((h) => (
            <button
              key={h.value}
              onClick={() => handleHeightChange(h.value)}
              className={`w-full px-4 py-3 rounded-lg border-2 transition text-left ${
                (props.height || 'medium') === h.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${
                    (props.height || 'medium') === h.value ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {h.label}
                  </div>
                  <div className="text-sm text-gray-500">{h.description}</div>
                </div>
                {(props.height || 'medium') === h.value && (
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Preview */}
      <div className="border-t pt-4">
        <PropertyLabel>Preview</PropertyLabel>
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="text-xs text-gray-500 mb-2">Current spacing:</div>
          <div className="bg-blue-200 rounded" style={{
            height: props.height === 'small' ? '32px' :
                    props.height === 'large' ? '96px' :
                    props.height === 'xl' ? '128px' :
                    '64px'
          }} />
        </div>
      </div>
    </div>
  )
}
