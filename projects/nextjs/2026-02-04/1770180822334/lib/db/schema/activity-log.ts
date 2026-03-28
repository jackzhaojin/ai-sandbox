import { pgTable, uuid, timestamp, pgEnum, jsonb, index } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'

export const entityTypeEnum = pgEnum('entity_type', ['page', 'template', 'fragment', 'media', 'site', 'user'])
export const activityActionEnum = pgEnum('activity_action', [
  // Page actions
  'created',
  'updated',
  'deleted',
  'published',
  'unpublished',
  'archived',
  'restored',
  'submitted_for_review',
  'review_approved',
  'review_rejected',
  'scheduled',
  'schedule_cancelled',
  'auto_published',
  'locked',
  'unlocked',
  'version_restored',
  // Media actions
  'uploaded',
  // User actions
  'login',
  'role_changed'
])

export const activityLog = pgTable('activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id),
  siteId: uuid('site_id'), // Will reference sites table
  pageId: uuid('page_id'), // For page-specific filtering
  entityType: entityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  action: activityActionEnum('action').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_activity_log_user_id').on(table.userId),
  siteIdIdx: index('idx_activity_log_site_id').on(table.siteId),
  pageIdIdx: index('idx_activity_log_page_id').on(table.pageId),
  entityIdx: index('idx_activity_log_entity').on(table.entityType, table.entityId),
  createdAtIdx: index('idx_activity_log_created_at').on(table.createdAt),
}))
