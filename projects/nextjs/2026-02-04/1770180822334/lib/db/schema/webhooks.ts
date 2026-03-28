import { pgTable, uuid, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core'
import { sites } from './sites'
import { profiles } from './profiles'

export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  events: text('events').array().notNull(),
  secret: text('secret'),
  isActive: boolean('is_active').default(true).notNull(),
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
  lastResponseCode: integer('last_response_code'),
  createdBy: uuid('created_by').notNull().references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: index('idx_webhooks_site_id').on(table.siteId),
  eventsIdx: index('idx_webhooks_events').using('gin', table.events),
}))
