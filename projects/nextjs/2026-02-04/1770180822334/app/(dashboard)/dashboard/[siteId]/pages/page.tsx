'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, FileText, Edit, Eye, Archive, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import TemplateGallery from '@/components/editor/TemplateGallery'

interface Page {
  id: string
  title: string
  slug: string
  status: string
  updatedAt: string
  updatedBy: string
}

interface Template {
  id: string
  name: string
  description: string | null
  thumbnailUrl: string | null
  structure: any
  defaultContent: any
  componentCount?: number
  lockedRegions?: string[]
}

export default function PagesListPage() {
  const router = useRouter()
  const params = useParams()
  const siteId = params.siteId as string

  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)
  const [creating, setCreating] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchPages()
    fetchUserRole()
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

  const fetchPages = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // For now, using placeholder data
      setPages([
        {
          id: '1',
          title: 'Home Page',
          slug: 'home',
          status: 'published',
          updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          updatedBy: 'John Doe',
        },
        {
          id: '2',
          title: 'About Us',
          slug: 'about',
          status: 'draft',
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          updatedBy: 'Jane Smith',
        },
      ])
    } catch (error) {
      console.error('Error fetching pages:', error)
      toast.error('Failed to load pages')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = async (
    template: Template,
    pageTitle: string,
    pageSlug: string
  ) => {
    setCreating(true)
    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          title: pageTitle,
          slug: pageSlug,
          templateId: template.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create page')
      }

      const data = await response.json()
      toast.success('Page created successfully')

      // Navigate to the editor
      router.push(`/dashboard/${siteId}/pages/${data.page.id}/edit`)
    } catch (error: any) {
      console.error('Error creating page:', error)
      toast.error(error.message || 'Failed to create page')
    } finally {
      setCreating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'review':
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'archived':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleBulkArchive = async () => {
    if (selectedPages.length === 0) {
      toast.error('No pages selected')
      return
    }

    if (!window.confirm(`Archive ${selectedPages.length} page(s)?`)) return

    try {
      const response = await fetch('/api/pages/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'archive',
          pageIds: selectedPages,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to archive pages')
      }

      toast.success(`Archived ${selectedPages.length} page(s)`)
      setSelectedPages([])
      fetchPages()
    } catch (error: any) {
      console.error('Error archiving pages:', error)
      toast.error(error.message || 'Failed to archive pages')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPages.length === 0) {
      toast.error('No pages selected')
      return
    }

    if (!window.confirm(`Permanently delete ${selectedPages.length} page(s)? This cannot be undone.`)) return

    try {
      const response = await fetch('/api/pages/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          pageIds: selectedPages,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete pages')
      }

      toast.success(`Deleted ${selectedPages.length} page(s)`)
      setSelectedPages([])
      fetchPages()
    } catch (error: any) {
      console.error('Error deleting pages:', error)
      toast.error(error.message || 'Failed to delete pages')
    }
  }

  const togglePageSelection = (pageId: string) => {
    setSelectedPages((prev) =>
      prev.includes(pageId)
        ? prev.filter((id) => id !== pageId)
        : [...prev, pageId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedPages.length === filteredPages.length) {
      setSelectedPages([])
    } else {
      setSelectedPages(filteredPages.map((p) => p.id))
    }
  }

  const filteredPages = pages.filter((page) => {
    if (statusFilter === 'all') return true
    return page.status === statusFilter
  })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Loading pages...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pages</h1>
            <p className="mt-2 text-gray-600">
              Manage all pages for your site
            </p>
          </div>
          <Button onClick={() => setShowTemplateGallery(true)} disabled={creating}>
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            {['all', 'draft', 'in_review', 'scheduled', 'published', 'archived'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  {status === 'all' ? pages.length : pages.filter((p) => p.status === status).length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Bulk Actions */}
        {isAdmin && selectedPages.length > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedPages.length} page(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkArchive}
                className="gap-2"
              >
                <Archive className="h-4 w-4" />
                Archive Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Pages List */}
        {filteredPages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">No pages yet</h3>
              <p className="mb-4 text-center text-sm text-gray-600">
                Create your first page to get started
              </p>
              <Button onClick={() => setShowTemplateGallery(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Page
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Select All Header */}
            {isAdmin && filteredPages.length > 0 && (
              <div className="flex items-center gap-3 px-2 py-2">
                <Checkbox
                  checked={selectedPages.length === filteredPages.length && filteredPages.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-gray-600">Select all</span>
              </div>
            )}

            {filteredPages.map((page) => (
              <Card key={page.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-start gap-4">
                    {isAdmin && (
                      <div className="pt-1">
                        <Checkbox
                          checked={selectedPages.includes(page.id)}
                          onCheckedChange={() => togglePageSelection(page.id)}
                        />
                      </div>
                    )}
                    <div className="rounded-lg bg-blue-100 p-3">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{page.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">/{page.slug}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <Badge className={getStatusColor(page.status)}>
                          {page.status === 'in_review' ? 'In Review' : page.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Updated {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })} by{' '}
                          {page.updatedBy}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => alert('Preview functionality will be implemented in later steps')}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => router.push(`/dashboard/${siteId}/pages/${page.id}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Template Gallery Modal */}
      <TemplateGallery
        siteId={siteId}
        isOpen={showTemplateGallery}
        onClose={() => setShowTemplateGallery(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </>
  )
}
