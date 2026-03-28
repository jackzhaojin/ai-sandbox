'use client'

import React, { useState, useEffect } from 'react'
import { Box, ExternalLink } from 'lucide-react'
import { componentRenderers } from './index'

export interface FragmentProps {
  fragmentId?: string
  fragmentName?: string
  showBorder?: boolean
  mode?: 'preview' | 'edit'
}

interface FragmentData {
  id: string
  name: string
  content: any[]
  description: string | null
}

/**
 * Fragment Component Renderer
 *
 * Resolves fragmentId at render time by querying content_fragments table
 * and recursively renders the fragment's content array using ComponentRenderer
 */
export default function Fragment({
  fragmentId,
  fragmentName = 'Untitled Fragment',
  showBorder = true,
  mode = 'preview'
}: FragmentProps) {
  const [fragment, setFragment] = useState<FragmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!fragmentId) {
      setLoading(false)
      return
    }

    const fetchFragment = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/fragments/${fragmentId}`)

        if (!response.ok) {
          throw new Error('Failed to load fragment')
        }

        const data = await response.json()
        setFragment(data.fragment)
      } catch (err: any) {
        console.error('Error fetching fragment:', err)
        setError(err.message || 'Failed to load fragment')
      } finally {
        setLoading(false)
      }
    }

    fetchFragment()
  }, [fragmentId])

  // Render fragment content components recursively
  const renderFragmentContent = (content: any[]) => {
    if (!content || content.length === 0) {
      return (
        <div className="text-center text-gray-500 text-sm py-4">
          This fragment is empty
        </div>
      )
    }

    return content.map((component, index) => {
      const Component = componentRenderers[component.type as keyof typeof componentRenderers]

      if (!Component) {
        return (
          <div
            key={component.id || index}
            className="my-2 rounded border-2 border-red-300 bg-red-50 p-4 text-center"
          >
            <p className="text-sm text-red-600">
              Unknown component type: {component.type}
            </p>
          </div>
        )
      }

      return (
        <div key={component.id || index}>
          <Component {...(component.props as any)} />
        </div>
      )
    })
  }

  // No fragment selected state
  if (!fragmentId) {
    return (
      <div className={`${showBorder ? 'border-2 border-dashed border-gray-300' : ''} rounded-lg p-6 bg-gray-50`}>
        <div className="flex items-center gap-3 mb-2">
          <Box className="h-5 w-5 text-gray-400" />
          <div className="font-medium text-gray-700">Fragment Component</div>
        </div>
        <p className="text-sm text-gray-500">
          No fragment selected. Use the property panel to select a fragment.
        </p>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className={`${showBorder ? 'border-2 border-dashed border-blue-300' : ''} rounded-lg p-6 bg-blue-50`}>
        <div className="flex items-center gap-3 mb-2">
          <Box className="h-5 w-5 text-blue-500 animate-pulse" />
          <div className="font-medium text-blue-700">{fragmentName}</div>
        </div>
        <p className="text-sm text-blue-600">Loading fragment...</p>
      </div>
    )
  }

  // Error state
  if (error || !fragment) {
    return (
      <div className={`${showBorder ? 'border-2 border-dashed border-red-300' : ''} rounded-lg p-6 bg-red-50`}>
        <div className="flex items-center gap-3 mb-2">
          <Box className="h-5 w-5 text-red-500" />
          <div className="font-medium text-red-700">{fragmentName}</div>
        </div>
        <p className="text-sm text-red-600">
          {error || 'Fragment not found'}
        </p>
      </div>
    )
  }

  // Edit mode - show fragment with border and controls
  if (mode === 'edit') {
    return (
      <div className={`${showBorder ? 'border-2 border-dashed border-purple-400 bg-purple-50/50' : ''} rounded-lg p-4`}>
        {/* Fragment header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-purple-500 text-white">
              <Box className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-purple-900">{fragment.name}</div>
              {fragment.description && (
                <div className="text-xs text-purple-600">{fragment.description}</div>
              )}
            </div>
          </div>
          <a
            href={`/dashboard/${fragmentId}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 hover:underline"
          >
            Edit Fragment
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Fragment content (read-only on page canvas) */}
        <div className="pointer-events-none opacity-80">
          {renderFragmentContent(fragment.content)}
        </div>
      </div>
    )
  }

  // Preview mode - render fragment content directly without wrapper
  return (
    <div>
      {renderFragmentContent(fragment.content)}
    </div>
  )
}
