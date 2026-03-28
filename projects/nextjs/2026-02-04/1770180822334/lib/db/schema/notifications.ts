import { pgTable, uuid, text, timestamp, pgEnum, boolean, index } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'

export const notificationTypeEnum = pgEnum('notification_type', [
  'review_submitted',
  'review_approved',
  'review_rejected',
  'page_published',
  'form_submission',
  'page_unlocked',
  'comment',
  'system'
])

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  siteId: uuid('site_id'), // For site-specific notifications
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdReadIdx: index('idx_notifications_user_id').on(table.userId, table.isRead),
  siteIdIdx: index('idx_notifications_site_id').on(table.siteId),
  createdAtIdx: index('idx_notifications_created_at').on(table.createdAt),
}))
