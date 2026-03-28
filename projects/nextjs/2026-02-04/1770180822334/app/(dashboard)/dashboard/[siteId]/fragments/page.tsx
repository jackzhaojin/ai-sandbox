'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Box, Pencil, Trash2, Tag, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface Fragment {
  id: string
  name: string
  type: string
  description: string | null
  tags: string[] | null
  content: any[]
  createdAt: string
  updatedAt: string
}

export default function FragmentsPage() {
  const router = useRouter()
  const params = useParams()
  const siteId = params.siteId as string

  const [fragments, setFragments] = useState<Fragment[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchFragments()
  }, [siteId])

  const fetchFragments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/fragments?siteId=${siteId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch fragments')
      }
      const data = await response.json()
      setFragments(data.fragments)
    } catch (error) {
      console.error('Error fetching fragments:', error)
      toast.error('Failed to load fragments')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (fragmentId: string, fragmentName: string) => {
    if (!confirm(`Are you sure you want to delete the fragment "${fragmentName}"?`)) {
      return
    }

    setDeletingId(fragmentId)
    try {
      const response = await fetch(`/api/fragments/${fragmentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to delete fragment')
      }

      toast.success('Fragment deleted successfully')
      fetchFragments()
    } catch (error: any) {
      console.error('Error deleting fragment:', error)
      toast.error(error.message || 'Failed to delete fragment')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreateNew = () => {
    router.push(`/dashboard/${siteId}/fragments/new`)
  }

  const getFragmentTypeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 text-blue-800'
      case 'media':
        return 'bg-purple-100 text-purple-800'
      case 'layout':
        return 'bg-green-100 text-green-800'
      case 'data':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Loading fragments...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Fragments</h1>
          <p className="mt-2 text-gray-600">
            Create reusable content fragments that can be used across multiple pages.
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Fragment
        </Button>
      </div>

      {/* Fragments Grid */}
      {fragments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Box className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No fragments yet</h3>
            <p className="mb-4 text-center text-sm text-gray-600">
              Create your first content fragment to reuse content across multiple pages.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Fragment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {fragments.map((fragment) => (
            <Card key={fragment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-gray-200 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Box className="h-5 w-5 text-purple-500" />
                      <CardTitle className="text-lg">{fragment.name}</CardTitle>
                    </div>
                    {fragment.description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {fragment.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Type badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getFragmentTypeColor(fragment.type)}`}>
                    {fragment.type}
                  </span>
                </div>

                {/* Tags */}
                {fragment.tags && fragment.tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1">
                    {fragment.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>
                    Updated {new Date(fragment.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/${siteId}/fragments/${fragment.id}/edit`)}
                  >
                    <Pencil className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(fragment.id, fragment.name)}
                    disabled={deletingId === fragment.id}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
