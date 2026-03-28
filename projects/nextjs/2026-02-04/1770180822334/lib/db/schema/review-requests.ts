import { pgTable, uuid, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core'
import { pages } from './pages'
import { pageVersions } from './page-versions'
import { profiles } from './profiles'

export const reviewStatusEnum = pgEnum('review_status', ['pending', 'approved', 'rejected', 'changes_requested'])

export const reviewRequests = pgTable('review_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  versionId: uuid('version_id').notNull().references(() => pageVersions.id),
  requestedBy: uuid('requested_by').notNull().references(() => profiles.id),
  assignedTo: uuid('assigned_to').references(() => profiles.id),
  reviewedBy: uuid('reviewed_by').references(() => profiles.id),
  status: reviewStatusEnum('status').default('pending').notNull(),
  comments: text('comments'),
  reviewerNotes: text('reviewer_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, (table) => ({
  pageIdIdx: index('idx_review_requests_page_id').on(table.pageId),
  assignedToIdx: index('idx_review_requests_assigned_to').on(table.assignedTo),
  statusIdx: index('idx_review_requests_status').on(table.status),
}))
