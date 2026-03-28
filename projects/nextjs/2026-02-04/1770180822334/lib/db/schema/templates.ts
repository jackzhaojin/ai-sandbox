import { pgTable, uuid, text, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core'
import { sites } from './sites'
import { profiles } from './profiles'

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  structure: jsonb('structure').notNull(),
  defaultContent: jsonb('default_content'),
  lockedRegions: jsonb('locked_regions').$type<string[]>().default([]),
  isSystem: boolean('is_system').default(false).notNull(),
  createdBy: uuid('created_by').notNull().references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: index('idx_templates_site_id').on(table.siteId),
  isSystemIdx: index('idx_templates_is_system').on(table.isSystem),
}))
