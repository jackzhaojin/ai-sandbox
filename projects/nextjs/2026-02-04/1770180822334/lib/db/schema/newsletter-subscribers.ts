import { pgTable, uuid, text, timestamp, pgEnum, index, unique } from 'drizzle-orm/pg-core'
import { sites } from './sites'

export const subscriberStatusEnum = pgEnum('subscriber_status', ['subscribed', 'unsubscribed', 'bounced'])

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  name: text('name'),
  status: subscriberStatusEnum('status').default('subscribed').notNull(),
  source: text('source'),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).defaultNow().notNull(),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
}, (table) => ({
  siteIdIdx: index('idx_newsletter_subscribers_site_id').on(table.siteId),
  emailIdx: index('idx_newsletter_subscribers_email').on(table.siteId, table.email),
  uniqueEmail: unique('unique_site_subscriber_email').on(table.siteId, table.email),
}))
