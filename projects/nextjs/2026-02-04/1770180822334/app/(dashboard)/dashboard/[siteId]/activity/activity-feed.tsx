'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

// Client-side implementation of activity description
function getActivityDescription(
  action: string,
  entityType: string,
  entityName?: string
): string {
  const name = entityName || `${entityType}`

  const descriptions: Record<string, string> = {
    created: `created ${name}`,
    updated: `updated ${name}`,
    deleted: `deleted ${name}`,
    published: `published ${name}`,
    unpublished: `unpublished ${name}`,
    archived: `archived ${name}`,
    restored: `restored ${name}`,
    submitted_for_review: `submitted ${name} for review`,
    review_approved: `approved ${name}`,
    review_rejected: `rejected ${name}`,
    scheduled: `scheduled ${name} for publishing`,
    schedule_cancelled: `cancelled scheduled publishing of ${name}`,
    auto_published: `auto-published ${name}`,
    locked: `locked ${name}`,
    unlocked: `unlocked ${name}`,
    version_restored: `restored a previous version of ${name}`,
    uploaded: `uploaded ${name}`,
    login: `logged in`,
    role_changed: `changed role`,
  }

  return descriptions[action] || `performed ${action} on ${name}`
}

interface Activity {
  id: string
  userId: string | null
  siteId: string | null
  pageId: string | null
  entityType: 'page' | 'template' | 'fragment' | 'media' | 'site' | 'user'
  entityId: string
  action: string
  metadata: any
  createdAt: Date
  userName: string | null
  userEmail: string | null
  userAvatar: string | null
}

interface User {
  id: string
  name: string | null
  email: string
}

interface ActivityFeedProps {
  initialActivities: Activity[]
  users: User[]
  siteId: string
  totalPages: number
  currentPage: number
}

export function ActivityFeed({
  initialActivities,
  users,
  siteId,
  totalPages,
  currentPage,
}: ActivityFeedProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isExporting, setIsExporting] = useState(false)

  const actionFilter = searchParams.get('action') || ''
  const userFilter = searchParams.get('userId') || ''
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // Reset to page 1 when filtering
    router.push(`/dashboard/${siteId}/activity?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/dashboard/${siteId}/activity?${params.toString()}`)
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams(searchParams.toString())
      const response = await fetch(`/api/sites/${siteId}/activity/export?${params.toString()}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-log-${new Date().toISOString()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export activity log')
    } finally {
      setIsExporting(false)
    }
  }

  const actionTypes = [
    { value: '', label: 'All Actions' },
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'deleted', label: 'Deleted' },
    { value: 'published', label: 'Published' },
    { value: 'unpublished', label: 'Unpublished' },
    { value: 'archived', label: 'Archived' },
    { value: 'restored', label: 'Restored' },
    { value: 'submitted_for_review', label: 'Submitted for Review' },
    { value: 'review_approved', label: 'Review Approved' },
    { value: 'review_rejected', label: 'Review Rejected' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'locked', label: 'Locked' },
    { value: 'unlocked', label: 'Unlocked' },
  ]

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Action Type Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Action Type</label>
            <select
              value={actionFilter}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {actionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">User</label>
            <select
              value={userFilter}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-lg shadow">
        {initialActivities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No activities found
          </div>
        ) : (
          <div className="divide-y">
            {initialActivities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    {activity.userAvatar ? (
                      <img
                        src={activity.userAvatar}
                        alt={activity.userName || 'User'}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {activity.userName?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium">{activity.userName || 'Unknown User'}</span>
                      {' '}
                      <span className="text-gray-600">
                        {getActivityDescription(
                          activity.action as any,
                          activity.entityType,
                          activity.metadata?.name || activity.entityType
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </div>
                  </div>

                  {/* Link to Entity */}
                  {activity.pageId && activity.entityType === 'page' && (
                    <a
                      href={`/dashboard/${siteId}/pages/${activity.pageId}/edit`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
