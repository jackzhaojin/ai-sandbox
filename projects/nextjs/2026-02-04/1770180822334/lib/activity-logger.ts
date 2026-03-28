import { db } from '@/lib/db'
import { activityLog } from '@/lib/db/schema'

type EntityType = 'page' | 'template' | 'fragment' | 'media' | 'site' | 'user'
type ActivityAction =
  // Page actions
  | 'created'
  | 'updated'
  | 'deleted'
  | 'published'
  | 'unpublished'
  | 'archived'
  | 'restored'
  | 'submitted_for_review'
  | 'review_approved'
  | 'review_rejected'
  | 'scheduled'
  | 'schedule_cancelled'
  | 'auto_published'
  | 'locked'
  | 'unlocked'
  | 'version_restored'
  // Media actions
  | 'uploaded'
  // User actions
  | 'login'
  | 'role_changed'

interface LogActivityParams {
  userId?: string
  siteId?: string
  pageId?: string
  entityType: EntityType
  entityId: string
  action: ActivityAction
  metadata?: Record<string, unknown>
}

/**
 * Log an activity to the activity log (fire-and-forget, never throws)
 */
export async function logActivity({
  userId,
  siteId,
  pageId,
  entityType,
  entityId,
  action,
  metadata,
}: LogActivityParams) {
  try {
    await db.insert(activityLog).values({
      userId: userId || null,
      siteId: siteId || null,
      pageId: pageId || null,
      entityType,
      entityId,
      action,
      metadata: metadata || {},
    })
  } catch (error) {
    console.error('Error logging activity:', error)
    // Don't throw - logging failures shouldn't break the main operation
  }
}

/**
 * Get human-readable description for an activity
 */
export function getActivityDescription(
  action: ActivityAction,
  entityType: EntityType,
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
