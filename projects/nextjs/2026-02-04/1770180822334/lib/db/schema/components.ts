import { pgTable, uuid, text, timestamp, pgEnum, boolean, jsonb, integer, index } from 'drizzle-orm/pg-core'

export const componentCategoryEnum = pgEnum('component_category', ['layout', 'content', 'media', 'form', 'navigation'])

export const components = pgTable('components', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull().unique(), // hero, text, image, etc.
  label: text('label').notNull(), // Display label
  icon: text('icon').notNull(), // Lucide icon name
  category: componentCategoryEnum('category').notNull(),
  description: text('description'),
  defaultProps: jsonb('default_props'),
  propSchema: jsonb('prop_schema').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isSystem: boolean('is_system').default(true).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  typeIdx: index('idx_components_type').on(table.type),
  categoryIdx: index('idx_components_category').on(table.category),
  sortOrderIdx: index('idx_components_sort_order').on(table.sortOrder),
  isActiveIdx: index('idx_components_is_active').on(table.isActive),
}))
