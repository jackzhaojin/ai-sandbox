import { pgTable, uuid, text, timestamp, bigint, integer, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sites } from './sites'
import { mediaFolders } from './media-folders'
import { profiles } from './profiles'

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id').references(() => mediaFolders.id),
  filename: text('filename').notNull(),
  originalFilename: text('original_filename').notNull(),
  storagePath: text('storage_path').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  width: integer('width'),
  height: integer('height'),
  altText: text('alt_text'),
  caption: text('caption'),
  tags: text('tags').array(),
  uploadedBy: uuid('uploaded_by').notNull().references(() => profiles.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: index('idx_media_site_id').on(table.siteId),
  folderIdIdx: index('idx_media_folder_id').on(table.folderId),
  mimeTypeIdx: index('idx_media_mime_type').on(table.mimeType),
  tagsIdx: index('idx_media_tags').using('gin', table.tags),
}))

export const mediaRelations = relations(media, ({ one }) => ({
  folder: one(mediaFolders, {
    fields: [media.folderId],
    references: [mediaFolders.id],
  }),
  uploader: one(profiles, {
    fields: [media.uploadedBy],
    references: [profiles.id],
  }),
}))
