import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { sites } from './sites'
import { pages } from './pages'

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  pageId: uuid('page_id').references(() => pages.id),
  eventName: text('event_name').notNull(),
  eventData: jsonb('event_data'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: index('idx_analytics_events_site_id').on(table.siteId),
  pageIdIdx: index('idx_analytics_events_page_id').on(table.pageId),
  eventNameIdx: index('idx_analytics_events_event_name').on(table.eventName),
  createdAtIdx: index('idx_analytics_events_created_at').on(table.createdAt),
}))
