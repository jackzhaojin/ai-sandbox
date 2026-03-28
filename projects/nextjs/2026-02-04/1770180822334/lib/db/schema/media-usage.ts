import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { media } from './media'
import { pages } from './pages'
import { contentFragments } from './content-fragments'

export const mediaUsage = pgTable('media_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaId: uuid('media_id').notNull().references(() => media.id, { onDelete: 'cascade' }),
  pageId: uuid('page_id').references(() => pages.id, { onDelete: 'cascade' }),
  fragmentId: uuid('fragment_id').references(() => contentFragments.id, { onDelete: 'cascade' }),
  usageContext: text('usage_context'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  mediaIdIdx: index('idx_media_usage_media_id').on(table.mediaId),
  pageIdIdx: index('idx_media_usage_page_id').on(table.pageId),
  fragmentIdIdx: index('idx_media_usage_fragment_id').on(table.fragmentId),
}))
