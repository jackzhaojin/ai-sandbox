'use client'

import React from 'react'
import FragmentPicker from './FragmentPicker'
import { useEditor } from '../EditorContext'

interface FragmentEditorProps {
  componentId: string
  fragmentId?: string
  fragmentName?: string
  showBorder?: boolean
}

/**
 * Property editor for Fragment components
 */
export default function FragmentEditor({
  componentId,
  fragmentId,
  fragmentName = '',
  showBorder = true
}: FragmentEditorProps) {
  const { updateComponent } = useEditor()
  const { siteId } = useEditor()

  const handleFragmentChange = (newFragmentId: string | undefined, newFragmentName?: string) => {
    updateComponent(componentId, {
      fragmentId: newFragmentId,
      fragmentName: newFragmentName || '',
      mode: 'edit'
    })
  }

  const handleShowBorderChange = (checked: boolean) => {
    updateComponent(componentId, { showBorder: checked })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Fragment Settings</h3>
      </div>

      {/* Fragment Picker */}
      <FragmentPicker
        value={fragmentId}
        onChange={handleFragmentChange}
        siteId={siteId}
      />

      {/* Show Border Toggle */}
      <div className="flex items-center justify-between">
        <label htmlFor="showBorder" className="text-sm font-medium text-gray-700">
          Show Border
        </label>
        <input
          id="showBorder"
          type="checkbox"
          checked={showBorder}
          onChange={(e) => handleShowBorderChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {fragmentId && (
        <div className="rounded-lg bg-purple-50 p-3 text-sm text-purple-800">
          <p className="font-medium mb-1">Fragment Component</p>
          <p className="text-xs text-purple-600">
            This component displays the selected fragment's content. Edit the fragment to change
            its content across all pages using it.
          </p>
        </div>
      )}
    </div>
  )
}
