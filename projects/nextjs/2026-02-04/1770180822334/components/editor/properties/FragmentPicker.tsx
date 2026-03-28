'use client'

import React, { useState, useEffect } from 'react'
import { Box, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Fragment {
  id: string
  name: string
  description: string | null
  type: string
  tags: string[] | null
  updatedAt: string
}

interface FragmentPickerProps {
  value?: string
  onChange: (fragmentId: string | undefined, fragmentName?: string) => void
  siteId: string
}

/**
 * FragmentPicker Property Editor
 *
 * Allows selecting a content fragment from a modal or dropdown
 */
export default function FragmentPicker({ value, onChange, siteId }: FragmentPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [fragments, setFragments] = useState<Fragment[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchFragments()
    }
  }, [isOpen, siteId])

  useEffect(() => {
    // Load selected fragment details
    if (value) {
      fetchFragmentDetails(value)
    } else {
      setSelectedFragment(null)
    }
  }, [value])

  const fetchFragments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/fragments?siteId=${siteId}`)
      if (!response.ok) {
        throw new Error('Failed to load fragments')
      }
      const data = await response.json()
      setFragments(data.fragments || [])
    } catch (error) {
      console.error('Error fetching fragments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFragmentDetails = async (fragmentId: string) => {
    try {
      const response = await fetch(`/api/fragments/${fragmentId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedFragment(data.fragment)
      }
    } catch (error) {
      console.error('Error fetching fragment details:', error)
    }
  }

  const handleSelect = (fragment: Fragment) => {
    onChange(fragment.id, fragment.name)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(undefined)
    setSelectedFragment(null)
  }

  const filteredFragments = fragments.filter((fragment) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      fragment.name.toLowerCase().includes(query) ||
      fragment.description?.toLowerCase().includes(query) ||
      fragment.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  })

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Fragment
      </label>

      {/* Selected fragment display */}
      {selectedFragment ? (
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-3">
          <Box className="h-4 w-4 text-purple-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {selectedFragment.name}
            </div>
            {selectedFragment.description && (
              <div className="text-xs text-gray-500 truncate">
                {selectedFragment.description}
              </div>
            )}
          </div>
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start"
          onClick={() => setIsOpen(true)}
        >
          <Box className="mr-2 h-4 w-4" />
          Select Fragment
        </Button>
      )}

      {/* Fragment picker modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[80vh] bg-white rounded-lg shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Select Fragment</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search fragments by name, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Fragments list */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading fragments...
                </div>
              ) : filteredFragments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No fragments match your search' : 'No fragments found'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFragments.map((fragment) => (
                    <button
                      key={fragment.id}
                      onClick={() => handleSelect(fragment)}
                      className={`w-full text-left rounded-lg border p-3 transition-colors ${
                        value === fragment.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Box className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                          value === fragment.id ? 'text-purple-500' : 'text-gray-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">{fragment.name}</div>
                          {fragment.description && (
                            <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {fragment.description}
                            </div>
                          )}
                          {fragment.tags && fragment.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {fragment.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Updated {new Date(fragment.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
