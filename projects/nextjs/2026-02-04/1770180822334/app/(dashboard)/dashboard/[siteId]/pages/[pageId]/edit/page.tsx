'use client'

import { useState, useEffect } from 'react'
import { EditorProvider } from '@/components/editor/EditorContext'
import EditorToolbar from '@/components/editor/EditorToolbar'
import ComponentPalette from '@/components/editor/ComponentPalette'
import Canvas from '@/components/editor/Canvas'
import PropertyPanel from '@/components/editor/PropertyPanel'
import PageLockManager from '@/components/editor/PageLockManager'

interface PageEditorProps {
  params: Promise<{
    siteId: string
    pageId: string
  }>
}

export default function PageEditor({ params }: PageEditorProps) {
  // Unwrap params (Next.js 15 async params pattern)
  const [unwrappedParams, setUnwrappedParams] = useState<{
    siteId: string
    pageId: string
  } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Unwrap params on mount
  useEffect(() => {
    params.then(setUnwrappedParams)
  }, [])

  // Check user role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/auth/profile')
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.profile.role === 'admin')
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    }
    fetchUserRole()
  }, [])

  if (!unwrappedParams) {
    return <div className="flex h-screen items-center justify-center">Loading editor...</div>
  }

  const { siteId, pageId } = unwrappedParams

  return (
    <EditorProvider pageId={pageId} siteId={siteId}>
      <PageLockManager pageId={pageId} isAdmin={isAdmin} />
      <div className="flex h-screen flex-col">
        {/* Editor Toolbar */}
        <EditorToolbar />

        {/* Three-Panel Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Component Palette */}
          <aside className="w-64 overflow-y-auto border-r border-gray-200 bg-white">
            <ComponentPalette />
          </aside>

          {/* Center: Canvas */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <Canvas />
          </main>

          {/* Right: Property Panel */}
          <aside className="w-80 overflow-y-auto border-l border-gray-200 bg-white">
            <PropertyPanel />
          </aside>
        </div>
      </div>
    </EditorProvider>
  )
}
