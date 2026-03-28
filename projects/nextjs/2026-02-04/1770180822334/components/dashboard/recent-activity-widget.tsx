import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { getActivityDescription } from '@/lib/activity-logger'

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

interface RecentActivityWidgetProps {
  siteId: string
  activities: Activity[]
}

export function RecentActivityWidget({ siteId, activities }: RecentActivityWidgetProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <Link
          href={`/dashboard/${siteId}/activity`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View all
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No recent activity
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              {/* User Avatar */}
              <div className="flex-shrink-0">
                {activity.userAvatar ? (
                  <img
                    src={activity.userAvatar}
                    alt={activity.userName || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 text-sm font-medium">
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
