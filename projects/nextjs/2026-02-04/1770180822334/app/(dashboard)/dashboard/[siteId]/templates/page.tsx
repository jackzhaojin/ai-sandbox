'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, FileText, Lock, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface Template {
  id: string
  name: string
  description: string | null
  thumbnailUrl: string | null
  componentCount: number
  lockedRegions: string[] | null
  createdAt: string
  updatedAt: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const params = useParams()
  const siteId = params.siteId as string

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchUserRole()
    fetchTemplates()
  }, [siteId])

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

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/templates?siteId=${siteId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      const data = await response.json()
      setTemplates(data.templates)
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete the template "${templateName}"?`)) {
      return
    }

    setDeletingId(templateId)
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to delete template')
      }

      toast.success('Template deleted successfully')
      fetchTemplates()
    } catch (error: any) {
      console.error('Error deleting template:', error)
      toast.error(error.message || 'Failed to delete template')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreateNew = () => {
    // Navigate to create new template (we'll build this shortly)
    toast.info('Create template functionality will open a page selector')
    // TODO: Open a dialog to select a page to create template from
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Loading templates...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="mt-2 text-gray-600">
            Manage page templates for your site. Templates help you quickly create consistent pages.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        )}
      </div>

      {/* Admin Notice */}
      {!isAdmin && (
        <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
          <strong>Note:</strong> Template management is only available to administrators.
        </div>
      )}

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No templates yet</h3>
            <p className="mb-4 text-center text-sm text-gray-600">
              {isAdmin
                ? 'Create your first template to help authors quickly create consistent pages.'
                : 'No templates have been created for this site yet.'}
            </p>
            {isAdmin && (
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="border-b border-gray-200 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Thumbnail */}
                <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-gray-100">
                  {template.thumbnailUrl ? (
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <FileText className="h-12 w-12 text-gray-400" />
                  )}
                </div>

                {/* Stats */}
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {template.componentCount} {template.componentCount === 1 ? 'component' : 'components'}
                  </span>
                  {template.lockedRegions && template.lockedRegions.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Lock className="h-3 w-3" />
                      {template.lockedRegions.length} locked
                    </span>
                  )}
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/${siteId}/templates/${template.id}/edit`)}
                    >
                      <Pencil className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(template.id, template.name)}
                      disabled={deletingId === template.id}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
