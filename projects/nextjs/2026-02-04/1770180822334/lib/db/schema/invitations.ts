import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { profiles, userRoleEnum } from './profiles'

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  role: userRoleEnum('role').notNull(),
  siteId: uuid('site_id').references(() => profiles.id),
  token: text('token').notNull().unique(),
  invitedBy: uuid('invited_by').notNull().references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
}, (table) => ({
  tokenIdx: index('idx_invitations_token').on(table.token),
  emailIdx: index('idx_invitations_email').on(table.email),
}))
