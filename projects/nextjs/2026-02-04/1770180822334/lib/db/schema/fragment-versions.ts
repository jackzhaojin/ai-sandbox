import { pgTable, uuid, integer, jsonb, text, timestamp, index, unique } from 'drizzle-orm/pg-core'
import { contentFragments } from './content-fragments'
import { profiles } from './profiles'

export const fragmentVersions = pgTable('fragment_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fragmentId: uuid('fragment_id').notNull().references(() => contentFragments.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  content: jsonb('content').notNull(),
  createdBy: uuid('created_by').notNull().references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  changeSummary: text('change_summary'),
}, (table) => ({
  fragmentIdIdx: index('idx_fragment_versions_fragment_id').on(table.fragmentId, table.versionNumber),
  uniqueVersion: unique('unique_fragment_version').on(table.fragmentId, table.versionNumber),
}))
