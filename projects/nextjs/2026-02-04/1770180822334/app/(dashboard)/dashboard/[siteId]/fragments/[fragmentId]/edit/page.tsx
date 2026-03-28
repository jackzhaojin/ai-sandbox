'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { EditorProvider } from '@/components/editor/EditorContext'
import ComponentPalette from '@/components/editor/ComponentPalette'
import Canvas from '@/components/editor/Canvas'
import PropertyPanel from '@/components/editor/PropertyPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, ArrowLeft, Eye, Clock, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface Fragment {
  id: string
  name: string
  type: string
  content: any[]
  description: string | null
  tags: string[] | null
  updatedAt: string
}

interface UsageInfo {
  usageCount: number
  pages: Array<{
    id: string
    title: string
    slug: string
  }>
}

export default function FragmentEditor() {
  const router = useRouter()
  const params = useParams()
  const siteId = params.siteId as string
  const fragmentId = params.fragmentId as string

  const [fragment, setFragment] = useState<Fragment | null>(null)
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showUsageDropdown, setShowUsageDropdown] = useState(false)

  // Fragment metadata editing
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (fragmentId !== 'new') {
      fetchFragment()
      fetchUsage()
    } else {
      setLoading(false)
      setName('New Fragment')
      setDescription('')
      setTags([])
    }
  }, [fragmentId])

  const fetchFragment = async () => {
    try {
      const response = await fetch(`/api/fragments/${fragmentId}`)
      if (!response.ok) {
        throw new Error('Failed to load fragment')
      }
      const data = await response.json()
      setFragment(data.fragment)
      setName(data.fragment.name)
      setDescription(data.fragment.description || '')
      setTags(data.fragment.tags || [])
    } catch (error) {
      console.error('Error fetching fragment:', error)
      toast.error('Failed to load fragment')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsage = async () => {
    try {
      const response = await fetch(`/api/fragments/${fragmentId}/usage`)
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error('Error fetching usage:', error)
    }
  }

  const handleSave = async (components: any[]) => {
    setSaving(true)
    try {
      const fragmentData = {
        name,
        type: fragment?.type || 'layout',
        content: components,
        description: description || null,
        tags: tags.length > 0 ? tags : null,
        changeSummary: 'Updated fragment content',
      }

      let response
      if (fragmentId === 'new') {
        // Create new fragment
        response = await fetch('/api/fragments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId,
            ...fragmentData,
          }),
        })
      } else {
        // Update existing fragment
        response = await fetch(`/api/fragments/${fragmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fragmentData),
        })
      }

      if (!response.ok) {
        throw new Error('Failed to save fragment')
      }

      const data = await response.json()
      toast.success('Fragment saved successfully')

      // If new fragment, redirect to edit page
      if (fragmentId === 'new') {
        router.push(`/dashboard/${siteId}/fragments/${data.fragment.id}/edit`)
      } else {
        // Refresh data
        fetchFragment()
        fetchUsage()
      }
    } catch (error) {
      console.error('Error saving fragment:', error)
      toast.error('Failed to save fragment')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading fragment editor...</div>
      </div>
    )
  }

  return (
    <EditorProvider
      pageId={fragmentId}
      siteId={siteId}
    >
      <div className="flex h-screen flex-col">
        {/* Fragment Editor Toolbar */}
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/dashboard/${siteId}/fragments`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {/* Fragment Name */}
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-64 font-semibold"
                  placeholder="Fragment name"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Usage Count */}
              {usage && fragmentId !== 'new' && (
                <div className="relative">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowUsageDropdown(!showUsageDropdown)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Used on {usage.usageCount} {usage.usageCount === 1 ? 'page' : 'pages'}
                  </Button>

                  {/* Usage dropdown */}
                  {showUsageDropdown && usage.pages.length > 0 && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg z-10">
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-700 px-2 py-1">
                          Pages using this fragment:
                        </div>
                        {usage.pages.map((page) => (
                          <a
                            key={page.id}
                            href={`/dashboard/${siteId}/pages/${page.id}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-2 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                          >
                            {page.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Save Button */}
              <Button
                onClick={() => {
                  // Get components from EditorContext
                  const editorContext = document.querySelector('[data-editor-context]')
                  if (editorContext) {
                    const components = JSON.parse(editorContext.getAttribute('data-components') || '[]')
                    handleSave(components)
                  }
                }}
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Fragment'}
              </Button>
            </div>
          </div>

          {/* Description and Tags Row */}
          <div className="mt-3 flex items-start gap-4">
            <div className="flex-1">
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm"
                placeholder="Fragment description (optional)"
              />
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <Input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="w-24 text-xs"
                placeholder="Add tag"
              />
            </div>
          </div>
        </div>

        {/* Three-Panel Layout (same as page editor) */}
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
