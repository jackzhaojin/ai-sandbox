import { pgTable, uuid, text, timestamp, pgEnum, jsonb, index } from 'drizzle-orm/pg-core'
import { sites } from './sites'
import { profiles } from './profiles'

export const fragmentTypeEnum = pgEnum('fragment_type', ['text', 'media', 'layout', 'data'])

export const contentFragments = pgTable('content_fragments', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: fragmentTypeEnum('type').notNull(),
  content: jsonb('content').notNull(),
  tags: text('tags').array(),
  createdBy: uuid('created_by').notNull().references(() => profiles.id),
  updatedBy: uuid('updated_by').notNull().references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: index('idx_content_fragments_site_id').on(table.siteId),
  typeIdx: index('idx_content_fragments_type').on(table.type),
  tagsIdx: index('idx_content_fragments_tags').using('gin', table.tags),
}))
