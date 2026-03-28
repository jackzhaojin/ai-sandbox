import { pgTable, uuid, text, timestamp, pgEnum, index, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sites } from './sites'
import { profiles } from './profiles'

export const pageStatusEnum = pgEnum('page_status', ['draft', 'in_review', 'scheduled', 'published', 'archived'])

export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  path: text('path').notNull(),
  parentId: uuid('parent_id'),
  templateId: uuid('template_id'), // Will reference templates table
  status: pageStatusEnum('status').default('draft').notNull(),
  publishedVersionId: uuid('published_version_id'),
  scheduledPublishAt: timestamp('scheduled_publish_at', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  publishedBy: uuid('published_by').references(() => profiles.id),
  lockedBy: uuid('locked_by').references(() => profiles.id),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  ogTitle: text('og_title'),
  ogDescription: text('og_description'),
  ogImageId: uuid('og_image_id'), // Will reference media table
  canonicalUrl: text('canonical_url'),
  noIndex: text('no_index').default('false'),
  noFollow: text('no_follow').default('false'),
  structuredData: text('structured_data'), // JSON string
  createdBy: uuid('created_by').notNull().references(() => profiles.id),
  updatedBy: uuid('updated_by').notNull().references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdIdx: index('idx_pages_site_id').on(table.siteId),
  slugIdx: index('idx_pages_slug').on(table.siteId, table.slug),
  pathIdx: index('idx_pages_path').on(table.siteId, table.path),
  statusIdx: index('idx_pages_status').on(table.status),
  parentIdIdx: index('idx_pages_parent_id').on(table.parentId),
  templateIdIdx: index('idx_pages_template_id').on(table.templateId),
  uniqueSlug: unique('unique_site_slug').on(table.siteId, table.slug),
  uniquePath: unique('unique_site_path').on(table.siteId, table.path),
}))

// Self-referencing relation for parent page
export const pagesRelations = relations(pages, ({ one, many }) => ({
  parent: one(pages, {
    fields: [pages.parentId],
    references: [pages.id],
  }),
  children: many(pages),
}))
