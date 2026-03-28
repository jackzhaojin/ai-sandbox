import { pgTable, uuid, text, timestamp, pgEnum, jsonb, index } from 'drizzle-orm/pg-core'
import { sites } from './sites'
import { profiles } from './profiles'

export const menuLocationEnum = pgEnum('menu_location', ['header', 'footer', 'sidebar', 'custom'])

export const menus = pgTable('menus', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  location: menuLocationEnum('location').notNull(),
  items: jsonb('items').notNull(),
  createdBy: uuid('created_by').notNull().references(() => profiles.id),
  updatedBy: uuid('updated_by').notNull().references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: index('idx_menus_site_id').on(table.siteId),
  locationIdx: index('idx_menus_location').on(table.siteId, table.location),
}))
