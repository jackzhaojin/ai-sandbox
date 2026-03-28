import { pgTable, uuid, text, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core'
import { profiles } from './profiles'

export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  domain: text('domain').unique(),
  description: text('description'),
  faviconUrl: text('favicon_url'),
  ogImageUrl: text('og_image_url'),
  themeSettings: jsonb('theme_settings'),
  seoSettings: jsonb('seo_settings'),
  // New columns for Step 23
  faviconMediaId: uuid('favicon_media_id'),
  logoMediaId: uuid('logo_media_id'),
  themeConfig: jsonb('theme_config'), // { primary, secondary, accent, bodyFont, headingFont, borderRadius, darkMode }
  customHeadHtml: text('custom_head_html'),
  customCss: text('custom_css'),
  analyticsConfig: jsonb('analytics_config'), // { ga4Id, gtmId, plausibleDomain, customScripts }
  socialLinks: jsonb('social_links'), // { twitter, facebook, instagram, linkedin, youtube, github, tiktok, website }
  errorPages: jsonb('error_pages'), // { 404: { title, message, pageId }, 500: { title, message, pageId }, maintenanceMode: { enabled, title, message } }
  settings: jsonb('settings'), // General settings: { defaultLanguage, timezone }
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdBy: uuid('created_by').notNull().references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
}, (table) => ({
  slugIdx: index('idx_sites_slug').on(table.slug),
  domainIdx: index('idx_sites_domain').on(table.domain),
  createdByIdx: index('idx_sites_created_by').on(table.createdBy),
}))
