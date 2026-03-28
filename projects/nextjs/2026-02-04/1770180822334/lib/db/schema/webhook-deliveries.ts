import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core'
import { webhooks } from './webhooks'

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookId: uuid('webhook_id').notNull().references(() => webhooks.id, { onDelete: 'cascade' }),
  event: text('event').notNull(),
  payload: jsonb('payload').notNull(),
  responseStatus: integer('response_status'),
  responseBody: text('response_body'),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }).defaultNow().notNull(),
  succeeded: boolean('succeeded').notNull(),
}, (table) => ({
  webhookIdIdx: index('idx_webhook_deliveries_webhook_id').on(table.webhookId),
  deliveredAtIdx: index('idx_webhook_deliveries_delivered_at').on(table.deliveredAt),
}))
