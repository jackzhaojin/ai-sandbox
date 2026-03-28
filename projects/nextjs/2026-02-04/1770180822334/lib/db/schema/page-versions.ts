import { pgTable, uuid, integer, jsonb, text, timestamp, boolean, index, unique } from 'drizzle-orm/pg-core'
import { pages } from './pages'
import { profiles } from './profiles'

export const pageVersions = pgTable('page_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  content: jsonb('content').notNull(),
  layout: jsonb('layout').notNull(),
  metadata: jsonb('metadata'),
  createdBy: uuid('created_by').notNull().references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  changeSummary: text('change_summary'),
  isPublished: boolean('is_published').default(false).notNull(),
}, (table) => ({
  pageIdIdx: index('idx_page_versions_page_id').on(table.pageId, table.versionNumber),
  createdAtIdx: index('idx_page_versions_created_at').on(table.createdAt),
  uniqueVersion: unique('unique_page_version').on(table.pageId, table.versionNumber),
}))
