import { pgTable, uuid, text, timestamp, index, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sites } from './sites'
import { profiles } from './profiles'

export const mediaFolders = pgTable('media_folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  parentId: uuid('parent_id'),
  path: text('path').notNull(),
  createdBy: uuid('created_by').notNull().references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: index('idx_media_folders_site_id').on(table.siteId),
  parentIdIdx: index('idx_media_folders_parent_id').on(table.parentId),
  pathIdx: index('idx_media_folders_path').on(table.siteId, table.path),
  uniquePath: unique('unique_site_folder_path').on(table.siteId, table.path),
}))

// Self-referencing relation for parent folder
export const mediaFoldersRelations = relations(mediaFolders, ({ one, many }) => ({
  parent: one(mediaFolders, {
    fields: [mediaFolders.parentId],
    references: [mediaFolders.id],
  }),
  children: many(mediaFolders),
}))
