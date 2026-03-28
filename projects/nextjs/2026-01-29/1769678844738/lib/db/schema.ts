import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, numeric, index, uniqueIndex } from 'drizzle-orm/pg-core'

// ============================================================================
// Authentication Tables (NextAuth.js compatible)
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex('email_idx').on(table.email),
}))

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  idToken: text('id_token'),
  sessionState: varchar('session_state', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('accounts_user_id_idx').on(table.userId),
  providerIdx: uniqueIndex('accounts_provider_idx').on(table.provider, table.providerAccountId),
}))

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  sessionTokenIdx: uniqueIndex('session_token_idx').on(table.sessionToken),
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
}))

export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  identifierTokenIdx: uniqueIndex('identifier_token_idx').on(table.identifier, table.token),
}))

// ============================================================================
// Analytics Tables
// ============================================================================

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventName: varchar('event_name', { length: 255 }).notNull(),
  path: varchar('path', { length: 500 }),
  metadata: jsonb('metadata'),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  sessionId: varchar('session_id', { length: 255 }),
}, (table) => ({
  userIdIdx: index('analytics_events_user_id_idx').on(table.userId),
  eventTypeIdx: index('analytics_events_event_type_idx').on(table.eventType),
  timestampIdx: index('analytics_events_timestamp_idx').on(table.timestamp.desc()),
  eventTypeTimestampIdx: index('analytics_events_event_type_timestamp_idx').on(table.eventType, table.timestamp.desc()),
}))

export const analyticsMetrics = pgTable('analytics_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  metricType: varchar('metric_type', { length: 100 }).notNull(),
  metricName: varchar('metric_name', { length: 255 }).notNull(),
  metricValue: numeric('metric_value', { precision: 20, scale: 4 }).notNull(),
  dimensions: jsonb('dimensions'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  metricTypeIdx: index('analytics_metrics_metric_type_idx').on(table.metricType),
  metricTypeStartTimeIdx: index('analytics_metrics_metric_type_start_time_idx').on(table.metricType, table.startTime.desc()),
  timeRangeIdx: index('analytics_metrics_time_range_idx').on(table.startTime.desc(), table.endTime.desc()),
}))

export const savedReports = pgTable('saved_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  config: jsonb('config').notNull(),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('saved_reports_user_id_idx').on(table.userId),
  userIdCreatedAtIdx: index('saved_reports_user_id_created_at_idx').on(table.userId, table.createdAt.desc()),
  isPublicIdx: index('saved_reports_is_public_idx').on(table.isPublic),
}))

// ============================================================================
// Type Exports
// ============================================================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export type VerificationToken = typeof verificationTokens.$inferSelect
export type NewVerificationToken = typeof verificationTokens.$inferInsert

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert

export type AnalyticsMetric = typeof analyticsMetrics.$inferSelect
export type NewAnalyticsMetric = typeof analyticsMetrics.$inferInsert

export type SavedReport = typeof savedReports.$inferSelect
export type NewSavedReport = typeof savedReports.$inferInsert
