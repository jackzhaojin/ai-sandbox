'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Mail, Filter, Download, Trash2, CheckCircle, AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface FormSubmission {
  id: string
  formId: string
  formName: string
  data: Record<string, any>
  submittedAt: string
  submittedByIp: string
  isRead: boolean
  isSpam: boolean
}

export default function FormsPage() {
  const params = useParams()
  const siteId = params.siteId as string

  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])
  const [formFilter, setFormFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all')
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)

  useEffect(() => {
    fetchSubmissions()
  }, [siteId, formFilter, statusFilter])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        siteId,
        ...(formFilter !== 'all' && { formId: formFilter }),
        ...(statusFilter !== 'all' && { isRead: statusFilter === 'read' ? 'true' : 'false' })
      })

      const response = await fetch(`/api/forms/submissions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch submissions')

      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast.error('Failed to load form submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedSubmissions.length === submissions.length) {
      setSelectedSubmissions([])
    } else {
      setSelectedSubmissions(submissions.map(s => s.id))
    }
  }

  const handleSelectSubmission = (id: string) => {
    setSelectedSubmissions(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBulkAction = async (action: 'read' | 'spam' | 'delete') => {
    if (selectedSubmissions.length === 0) {
      toast.error('No submissions selected')
      return
    }

    try {
      const response = await fetch('/api/forms/submissions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedSubmissions,
          action
        })
      })

      if (!response.ok) throw new Error('Bulk action failed')

      toast.success(`Successfully ${action === 'delete' ? 'deleted' : 'marked'} ${selectedSubmissions.length} submission(s)`)
      setSelectedSubmissions([])
      fetchSubmissions()
    } catch (error) {
      console.error('Bulk action error:', error)
      toast.error('Failed to perform bulk action')
    }
  }

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        siteId,
        ...(formFilter !== 'all' && { formId: formFilter }),
        ...(statusFilter !== 'all' && { isRead: statusFilter === 'read' ? 'true' : 'false' })
      })

      const response = await fetch(`/api/forms/export?${params}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `form-submissions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Submissions exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export submissions')
    }
  }

  const handleToggleRead = async (id: string, isRead: boolean) => {
    try {
      const response = await fetch(`/api/forms/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !isRead })
      })

      if (!response.ok) throw new Error('Failed to update submission')

      toast.success(isRead ? 'Marked as unread' : 'Marked as read')
      fetchSubmissions()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update submission')
    }
  }

  const handleToggleSpam = async (id: string, isSpam: boolean) => {
    try {
      const response = await fetch(`/api/forms/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSpam: !isSpam })
      })

      if (!response.ok) throw new Error('Failed to update submission')

      toast.success(isSpam ? 'Unmarked as spam' : 'Marked as spam')
      fetchSubmissions()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update submission')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return

    try {
      const response = await fetch(`/api/forms/submissions/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete submission')

      toast.success('Submission deleted')
      setSelectedSubmission(null)
      fetchSubmissions()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete submission')
    }
  }

  const getKeyFields = (data: Record<string, any>) => {
    const keys = ['name', 'email', 'subject', 'message']
    const preview: string[] = []

    for (const key of keys) {
      if (data[key]) {
        const value = String(data[key])
        preview.push(value.length > 50 ? value.substring(0, 50) + '...' : value)
      }
    }

    return preview.slice(0, 2).join(' • ') || 'No preview available'
  }

  const uniqueForms = Array.from(new Set(submissions.map(s => s.formName)))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Form Submissions</h1>
          <p className="text-gray-600 mt-1">
            Manage and review form submissions from your site
          </p>
        </div>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              {/* Form Filter */}
              <select
                value={formFilter}
                onChange={(e) => setFormFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Forms</option>
                {uniqueForms.map(formName => (
                  <option key={formName} value={formName}>{formName}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>

            <div className="flex gap-2">
              {selectedSubmissions.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('read')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('spam')}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Mark as Spam
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <Checkbox
                      checked={selectedSubmissions.length === submissions.length && submissions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Form
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No form submissions yet</p>
                    </td>
                  </tr>
                ) : (
                  submissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className={`hover:bg-gray-50 cursor-pointer ${!submission.isRead ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedSubmissions.includes(submission.id)}
                          onCheckedChange={() => handleSelectSubmission(submission.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{submission.formName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {getKeyFields(submission.data)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {!submission.isRead && (
                            <Badge variant="default">Unread</Badge>
                          )}
                          {submission.isSpam && (
                            <Badge variant="destructive">Spam</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedSubmission(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedSubmission.formName}</h2>
                <p className="text-sm text-gray-600">
                  Submitted {formatDistanceToNow(new Date(selectedSubmission.submittedAt), { addSuffix: true })}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Metadata */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">IP Address:</span>
                  <span className="text-sm font-medium">{selectedSubmission.submittedByIp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Form ID:</span>
                  <span className="text-sm font-medium">{selectedSubmission.formId}</span>
                </div>
              </div>

              {/* Form Data */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Submission Data</h3>
                {Object.entries(selectedSubmission.data).map(([key, value]) => (
                  <div key={key} className="border-b pb-2">
                    <div className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-sm text-gray-900 mt-1">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleRead(selectedSubmission.id, selectedSubmission.isRead)}
                >
                  {selectedSubmission.isRead ? 'Mark as Unread' : 'Mark as Read'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleSpam(selectedSubmission.id, selectedSubmission.isSpam)}
                >
                  {selectedSubmission.isSpam ? 'Not Spam' : 'Mark as Spam'}
                </Button>
                {selectedSubmission.data.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `mailto:${selectedSubmission.data.email}`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(selectedSubmission.id)}
                  className="ml-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
