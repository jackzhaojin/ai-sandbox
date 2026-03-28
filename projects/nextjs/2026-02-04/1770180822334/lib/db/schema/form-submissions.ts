import { pgTable, uuid, text, timestamp, jsonb, index, boolean } from 'drizzle-orm/pg-core'
import { sites } from './sites'
import { pages } from './pages'

export const formSubmissions = pgTable('form_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  pageId: uuid('page_id').references(() => pages.id),
  formId: text('form_id').notNull(), // Unique identifier for the form on the page
  formName: text('form_name').notNull(),
  data: jsonb('data').notNull(),
  submittedByIp: text('submitted_by_ip'),
  userAgent: text('user_agent'),
  isRead: boolean('is_read').default(false).notNull(),
  isSpam: boolean('is_spam').default(false).notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: index('idx_form_submissions_site_id').on(table.siteId),
  formIdIdx: index('idx_form_submissions_form_id').on(table.formId),
  submittedAtIdx: index('idx_form_submissions_submitted_at').on(table.submittedAt),
  isReadIdx: index('idx_form_submissions_is_read').on(table.isRead),
  isSpamIdx: index('idx_form_submissions_is_spam').on(table.isSpam),
}))
