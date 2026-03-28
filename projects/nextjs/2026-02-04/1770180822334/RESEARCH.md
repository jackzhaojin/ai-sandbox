# PageForge CMS Research & Architecture Plan

**Research Date:** February 4, 2026
**Project Type:** Visual CMS Page Builder (AEM-Inspired)
**Target:** Component-based visual page builder with drag-and-drop editing, content fragments, versioning, and multi-site management

---

## Executive Summary

This document outlines the comprehensive research findings and architectural plan for **PageForge CMS** — an AEM-inspired visual page builder built with Next.js 15, designed to enable non-technical users to create and manage web pages through a drag-and-drop interface while maintaining full developer control over components and templates.

**Key Architectural Decisions:**

✅ **Next.js 15 with App Router** - Modern React Server Components, optimal performance
✅ **PostgreSQL + Drizzle ORM** - Relational data model for complex CMS features
✅ **Supabase Platform** - Hosted PostgreSQL, authentication, and file storage
✅ **@dnd-kit** - Modern drag-and-drop toolkit for React
✅ **Tiptap** - Rich text editor with SSR support
✅ **shadcn/ui + Tailwind CSS v4** - Customizable, accessible UI components
✅ **Component Registry Architecture** - Type-safe, extensible component system inspired by AEM

---

## Table of Contents

1. [AEM Architecture Concepts](#1-aem-architecture-concepts)
2. [Framework & Architecture Selection](#2-framework--architecture-selection)
3. [Database Schema Design](#3-database-schema-design)
4. [Component Registry Architecture](#4-component-registry-architecture)
5. [Drag-and-Drop Implementation](#5-drag-and-drop-implementation)
6. [Rich Text Editor Strategy](#6-rich-text-editor-strategy)
7. [File Upload & Media Library](#7-file-upload--media-library)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Versioning & Publishing Workflow](#9-versioning--publishing-workflow)
10. [Technology Stack Summary](#10-technology-stack-summary)
11. [Implementation Phases](#11-implementation-phases)
12. [Risk Assessment](#12-risk-assessment)
13. [Sources](#13-sources)

---

## 1. AEM Architecture Concepts

### 1.1 Core AEM Principles

Adobe Experience Manager (AEM) is built on several fundamental principles that we will adapt for PageForge:

**Component-Based Architecture:**
- Reusable building blocks that define content structure and presentation
- Components are configurable through dialogs/properties
- Components can be composed into templates
- Clear separation between component definition and content instances

**Template System:**
- Templates define page structure and allowed component zones
- Editable templates vs. static templates
- Template inheritance and composition
- Lock/unlock zones for flexibility vs. consistency

**Content Repository (JCR):**
- Hierarchical content storage (AEM uses JCR/Oak, we'll use PostgreSQL)
- Nodes and properties structure
- Version control built into the repository
- Query-able content structure

**HTL (HTML Template Language):**
- Secure, readable templating (we'll use React/JSX)
- Clear separation of logic and presentation
- Component rendering pipeline

### 1.2 AEM Features to Adapt

Based on research of AEM architecture, here are the key features we'll implement in PageForge:

| AEM Feature | PageForge Equivalent | Implementation |
|-------------|---------------------|----------------|
| **Core Components** | Component Registry | TypeScript-based component definitions with props schemas |
| **Editable Templates** | Template System | Database-driven templates with locked/unlocked zones |
| **Page Editor** | Visual Editor | Drag-and-drop interface with live preview |
| **Content Fragments** | Content Fragments | Reusable, structured content blocks |
| **Experience Fragments** | Layout Fragments | Reusable page sections (headers, footers) |
| **Versioning** | Page Versions | Database-backed version history with rollback |
| **Publishing Workflow** | Draft/Published States | Multi-state content lifecycle |
| **Multi-Site Manager** | Site Management | Multiple sites with shared components |
| **Digital Asset Manager** | Media Library | Supabase Storage with organization |

**Sources:**
- [AEM Architecture Explained: A Practical Guide](https://medium.com/@sarunsathis/aem-architecture-demystified-ab9daaae8304)
- [Introduction to the Architecture of Adobe Experience Manager](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/overview/architecture)
- [Core Components Introduction](https://experienceleague.adobe.com/en/docs/experience-manager-core-components/using/introduction)

---

## 2. Framework & Architecture Selection

### 2.1 Next.js 15 with App Router

**Decision: Next.js 15 App Router (Not Pages Router)**

**Rationale:**
- **React Server Components (RSC)** - Server-side rendering by default, better performance
- **Streaming & Suspense** - Progressive page loading for editor UI
- **Server Actions** - Type-safe mutations without API routes
- **Route Handlers** - Public APIs for headless CMS capabilities
- **Nested Layouts** - Perfect for editor interface (sidebar + canvas + properties panel)

**Architectural Pattern:**

```
app/
├── (auth)/                    # Authentication pages
│   ├── login/
│   └── register/
├── (cms)/                     # CMS dashboard
│   ├── layout.tsx             # CMS layout (sidebar + header)
│   ├── sites/
│   ├── pages/
│   ├── templates/
│   ├── fragments/
│   ├── media/
│   └── settings/
├── (editor)/                  # Visual page editor
│   └── editor/[pageId]/
│       └── page.tsx           # Drag-and-drop editor
├── (preview)/                 # Page preview/published view
│   └── [siteSlug]/[...path]/
│       └── page.tsx           # Dynamic page renderer
├── api/                       # Public APIs
│   ├── pages/
│   ├── components/
│   └── webhooks/
└── layout.tsx                 # Root layout
```

**Rendering Strategy:**

| Route Type | Rendering | Reason |
|------------|-----------|--------|
| CMS Dashboard | Server Components | Data-heavy, SEO not critical |
| Visual Editor | Client Component | Interactive, drag-and-drop |
| Published Pages | Static/ISR | SEO-critical, cacheable |
| Preview Mode | Dynamic | Real-time content preview |
| API Routes | Route Handlers | Headless CMS capabilities |

**Sources:**
- [Next.js Best Practices in 2025](https://www.raftlabs.com/blog/building-with-next-js-best-practices-and-benefits-for-performance-first-teams/)
- [Next.js 15: App Router Complete Guide](https://medium.com/@livenapps/next-js-15-app-router-a-complete-senior-level-guide-0554a2b820f7)

### 2.2 Why PostgreSQL + Drizzle ORM

**Decision: PostgreSQL with Drizzle ORM (Not MongoDB/Prisma)**

**Rationale:**

✅ **Relational Data Model:**
- CMS data is highly relational (pages → components → content → versions → sites)
- Complex queries (permissions, versioning, multi-site)
- ACID transactions for content consistency
- Foreign key constraints for data integrity

✅ **Drizzle Performance:**
- ~7kb minified (Prisma is much larger)
- Zero cold start overhead (critical for serverless)
- SQL transparency (easier optimization)
- TypeScript-first with excellent DX

✅ **Supabase Compatibility:**
- Supabase provides hosted PostgreSQL
- Built-in connection pooling for serverless
- Row Level Security (RLS) for permissions
- Real-time subscriptions (future collaboration features)

**Trade-offs Accepted:**
- More verbose schema definitions than Prisma
- Manual relationship management
- Worth it for performance and control

**Sources:**
- [Prisma vs Drizzle ORM in 2026](https://medium.com/@thebelcoder/prisma-vs-drizzle-orm-in-2026-what-you-really-need-to-know-9598cf4eaa7c)
- [Drizzle vs Prisma: Choosing the Right TypeScript ORM](https://medium.com/@codabu/drizzle-vs-prisma-choosing-the-right-typescript-orm-in-2026-deep-dive-63abb6aa882b)

---

## 3. Database Schema Design

### 3.1 Core Tables Overview

PageForge requires 22 tables organized into 6 logical groups:

**Group 1: User Management** (3 tables)
- `profiles` - User accounts and roles
- `invitations` - Team invitations
- `activity_log` - Audit trail

**Group 2: Site & Content Structure** (4 tables)
- `sites` - Multi-site management
- `pages` - Page metadata and structure
- `page_versions` - Version history
- `menus` - Navigation structures

**Group 3: Component System** (4 tables)
- `components` - Component registry
- `templates` - Page templates
- `content_fragments` - Reusable content
- `fragment_versions` - Fragment version history

**Group 4: Media Management** (3 tables)
- `media` - File metadata
- `media_folders` - Folder organization
- `media_usage` - Track where media is used

**Group 5: Advanced Features** (5 tables)
- `form_submissions` - Form builder data
- `review_requests` - Content review workflow
- `notifications` - User notifications
- `newsletter_subscribers` - Newsletter management
- `analytics_events` - Custom event tracking

**Group 6: API & Integrations** (3 tables)
- `api_keys` - Headless CMS API access
- `webhooks` - Event notifications
- `webhook_deliveries` - Delivery logs

### 3.2 Detailed Schema

#### Table 1: profiles

```typescript
{
  id: uuid (primary key, default: auth.uid())
  email: string (unique, not null)
  name: string (not null)
  avatar_url: string (nullable)
  role: enum('admin', 'editor', 'viewer') (default: 'editor')
  created_at: timestamp (default: now())
  updated_at: timestamp (default: now())
  last_login_at: timestamp (nullable)
}

// Indexes
- idx_profiles_email ON profiles(email)
- idx_profiles_role ON profiles(role)
```

**Notes:**
- Integrates with Supabase Auth (`id` matches `auth.uid()`)
- Role-based access control (RBAC)
- Audit fields for tracking

#### Table 2: sites

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  name: string (not null)
  slug: string (unique, not null)
  domain: string (nullable, unique)
  description: text (nullable)
  favicon_url: string (nullable)
  og_image_url: string (nullable)
  theme_settings: jsonb (nullable)
  seo_settings: jsonb (nullable)
  created_by: uuid (foreign key → profiles.id)
  created_at: timestamp (default: now())
  updated_at: timestamp (default: now())
  is_active: boolean (default: true)
}

// Indexes
- idx_sites_slug ON sites(slug)
- idx_sites_domain ON sites(domain)
- idx_sites_created_by ON sites(created_by)
```

**Notes:**
- Multi-site support (one CMS, multiple websites)
- Custom domains for each site
- Theme/SEO settings stored as JSON for flexibility

#### Table 3: pages

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  site_id: uuid (foreign key → sites.id, on delete: cascade)
  title: string (not null)
  slug: string (not null)
  path: string (not null) // Full path: /about/team
  parent_id: uuid (foreign key → pages.id, nullable) // Nested pages
  template_id: uuid (foreign key → templates.id, nullable)
  status: enum('draft', 'review', 'scheduled', 'published', 'archived')
  published_version_id: uuid (nullable) // Current live version
  scheduled_publish_at: timestamp (nullable)
  seo_title: string (nullable)
  seo_description: text (nullable)
  og_image_url: string (nullable)
  created_by: uuid (foreign key → profiles.id)
  updated_by: uuid (foreign key → profiles.id)
  created_at: timestamp (default: now())
  updated_at: timestamp (default: now())
  published_at: timestamp (nullable)
}

// Indexes
- idx_pages_site_id ON pages(site_id)
- idx_pages_slug ON pages(site_id, slug) // Unique per site
- idx_pages_path ON pages(site_id, path) // Unique per site
- idx_pages_status ON pages(status)
- idx_pages_parent_id ON pages(parent_id)
- idx_pages_template_id ON pages(template_id)

// Unique Constraints
- UNIQUE(site_id, slug)
- UNIQUE(site_id, path)
```

**Notes:**
- Hierarchical page structure (parent_id)
- Multi-state lifecycle (draft → review → published)
- Scheduled publishing
- SEO metadata per page
- Template-based pages

#### Table 4: page_versions

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  page_id: uuid (foreign key → pages.id, on delete: cascade)
  version_number: integer (not null)
  content: jsonb (not null) // Component tree structure
  layout: jsonb (not null) // Grid layout configuration
  metadata: jsonb (nullable) // Custom metadata
  created_by: uuid (foreign key → profiles.id)
  created_at: timestamp (default: now())
  change_summary: text (nullable)
  is_published: boolean (default: false)
}

// Indexes
- idx_page_versions_page_id ON page_versions(page_id, version_number DESC)
- idx_page_versions_created_at ON page_versions(created_at DESC)

// Unique Constraints
- UNIQUE(page_id, version_number)
```

**Notes:**
- Complete version history for every page
- Content stored as JSON (component tree)
- Version number auto-increments per page
- Change summary for audit trail
- Rollback capability

**Content JSON Structure:**
```json
{
  "components": [
    {
      "id": "comp_123",
      "type": "hero_section",
      "props": {
        "title": "Welcome to PageForge",
        "subtitle": "Build pages visually",
        "backgroundImage": "media_id_456"
      },
      "children": []
    }
  ],
  "layout": {
    "type": "grid",
    "columns": 12,
    "gaps": "lg"
  }
}
```

#### Table 5: templates

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  site_id: uuid (foreign key → sites.id, on delete: cascade)
  name: string (not null)
  description: text (nullable)
  thumbnail_url: string (nullable)
  structure: jsonb (not null) // Template zones and allowed components
  default_content: jsonb (nullable) // Pre-filled content
  is_system: boolean (default: false) // Built-in vs custom
  created_by: uuid (foreign key → profiles.id)
  created_at: timestamp (default: now())
  updated_at: timestamp (default: now())
}

// Indexes
- idx_templates_site_id ON templates(site_id)
- idx_templates_is_system ON templates(is_system)
```

**Template Structure JSON:**
```json
{
  "zones": [
    {
      "id": "header",
      "name": "Header",
      "locked": true,
      "allowedComponents": ["header_component"],
      "maxComponents": 1
    },
    {
      "id": "main",
      "name": "Main Content",
      "locked": false,
      "allowedComponents": ["hero_section", "text_block", "image_grid"],
      "maxComponents": null
    }
  ]
}
```

#### Table 6: components

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  name: string (unique, not null) // Technical name: "hero_section"
  display_name: string (not null) // User-friendly: "Hero Section"
  category: enum('layout', 'content', 'media', 'form', 'navigation')
  description: text (nullable)
  thumbnail_url: string (nullable)
  props_schema: jsonb (not null) // Zod/JSON Schema for props
  default_props: jsonb (nullable)
  is_system: boolean (default: true)
  is_active: boolean (default: true)
  created_at: timestamp (default: now())
  updated_at: timestamp (default: now())
}

// Indexes
- idx_components_name ON components(name)
- idx_components_category ON components(category)
- idx_components_is_active ON components(is_active)
```

**Props Schema Example:**
```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "label": "Heading",
      "default": "Welcome"
    },
    "alignment": {
      "type": "enum",
      "label": "Text Alignment",
      "options": ["left", "center", "right"],
      "default": "center"
    },
    "backgroundImage": {
      "type": "media",
      "label": "Background Image",
      "accept": "image/*"
    }
  },
  "required": ["title"]
}
```

#### Table 7: content_fragments

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  site_id: uuid (foreign key → sites.id, on delete: cascade)
  name: string (not null)
  type: enum('text', 'media', 'layout', 'data')
  content: jsonb (not null)
  tags: text[] (nullable)
  created_by: uuid (foreign key → profiles.id)
  updated_by: uuid (foreign key → profiles.id)
  created_at: timestamp (default: now())
  updated_at: timestamp (default: now())
}

// Indexes
- idx_content_fragments_site_id ON content_fragments(site_id)
- idx_content_fragments_type ON content_fragments(type)
- idx_content_fragments_tags ON content_fragments USING gin(tags)
```

**Notes:**
- Reusable content blocks (headers, footers, CTAs)
- Can be embedded in multiple pages
- Tagging for organization

#### Table 8: fragment_versions

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  fragment_id: uuid (foreign key → content_fragments.id, on delete: cascade)
  version_number: integer (not null)
  content: jsonb (not null)
  created_by: uuid (foreign key → profiles.id)
  created_at: timestamp (default: now())
  change_summary: text (nullable)
}

// Indexes
- idx_fragment_versions_fragment_id ON fragment_versions(fragment_id, version_number DESC)

// Unique Constraints
- UNIQUE(fragment_id, version_number)
```

#### Table 9: media

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  site_id: uuid (foreign key → sites.id, on delete: cascade)
  folder_id: uuid (foreign key → media_folders.id, nullable)
  filename: string (not null)
  original_filename: string (not null)
  storage_path: string (not null) // Supabase Storage path
  mime_type: string (not null)
  file_size: bigint (not null) // bytes
  width: integer (nullable) // for images
  height: integer (nullable) // for images
  alt_text: text (nullable)
  caption: text (nullable)
  tags: text[] (nullable)
  uploaded_by: uuid (foreign key → profiles.id)
  uploaded_at: timestamp (default: now())
}

// Indexes
- idx_media_site_id ON media(site_id)
- idx_media_folder_id ON media(folder_id)
- idx_media_mime_type ON media(mime_type)
- idx_media_tags ON media USING gin(tags)
```

#### Table 10: media_folders

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  site_id: uuid (foreign key → sites.id, on delete: cascade)
  name: string (not null)
  parent_id: uuid (foreign key → media_folders.id, nullable)
  path: string (not null) // Full path: /images/products
  created_by: uuid (foreign key → profiles.id)
  created_at: timestamp (default: now())
}

// Indexes
- idx_media_folders_site_id ON media_folders(site_id)
- idx_media_folders_parent_id ON media_folders(parent_id)
- idx_media_folders_path ON media_folders(site_id, path)

// Unique Constraints
- UNIQUE(site_id, path)
```

#### Table 11: menus

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  site_id: uuid (foreign key → sites.id, on delete: cascade)
  name: string (not null)
  location: enum('header', 'footer', 'sidebar', 'custom')
  items: jsonb (not null) // Nested menu structure
  created_by: uuid (foreign key → profiles.id)
  updated_by: uuid (foreign key → profiles.id)
  created_at: timestamp (default: now())
  updated_at: timestamp (default: now())
}

// Indexes
- idx_menus_site_id ON menus(site_id)
- idx_menus_location ON menus(site_id, location)
```

**Menu Items JSON:**
```json
{
  "items": [
    {
      "id": "menu_1",
      "label": "About",
      "type": "page",
      "page_id": "page_uuid",
      "children": [
        {
          "id": "menu_2",
          "label": "Team",
          "type": "page",
          "page_id": "page_uuid_2"
        }
      ]
    }
  ]
}
```

#### Table 12: form_submissions

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  site_id: uuid (foreign key → sites.id, on delete: cascade)
  page_id: uuid (foreign key → pages.id, nullable)
  form_name: string (not null)
  data: jsonb (not null)
  user_agent: text (nullable)
  ip_address: inet (nullable)
  submitted_at: timestamp (default: now())
}

// Indexes
- idx_form_submissions_site_id ON form_submissions(site_id)
- idx_form_submissions_form_name ON form_submissions(form_name)
- idx_form_submissions_submitted_at ON form_submissions(submitted_at DESC)
```

#### Table 13: review_requests

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  page_id: uuid (foreign key → pages.id, on delete: cascade)
  version_id: uuid (foreign key → page_versions.id)
  requested_by: uuid (foreign key → profiles.id)
  assigned_to: uuid (foreign key → profiles.id, nullable)
  status: enum('pending', 'approved', 'rejected', 'changes_requested')
  comments: text (nullable)
  created_at: timestamp (default: now())
  resolved_at: timestamp (nullable)
}

// Indexes
- idx_review_requests_page_id ON review_requests(page_id)
- idx_review_requests_assigned_to ON review_requests(assigned_to)
- idx_review_requests_status ON review_requests(status)
```

#### Table 14: activity_log

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  user_id: uuid (foreign key → profiles.id, nullable)
  site_id: uuid (foreign key → sites.id, nullable)
  entity_type: enum('page', 'template', 'fragment', 'media', 'site')
  entity_id: uuid (not null)
  action: enum('created', 'updated', 'deleted', 'published', 'archived')
  metadata: jsonb (nullable)
  created_at: timestamp (default: now())
}

// Indexes
- idx_activity_log_user_id ON activity_log(user_id)
- idx_activity_log_site_id ON activity_log(site_id)
- idx_activity_log_entity ON activity_log(entity_type, entity_id)
- idx_activity_log_created_at ON activity_log(created_at DESC)
```

#### Table 15: notifications

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  user_id: uuid (foreign key → profiles.id, on delete: cascade)
  type: enum('review_request', 'page_published', 'comment', 'system')
  title: string (not null)
  message: text (not null)
  link: string (nullable)
  is_read: boolean (default: false)
  created_at: timestamp (default: now())
}

// Indexes
- idx_notifications_user_id ON notifications(user_id, is_read)
- idx_notifications_created_at ON notifications(created_at DESC)
```

#### Table 16: api_keys

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  site_id: uuid (foreign key → sites.id, on delete: cascade)
  name: string (not null)
  key: string (unique, not null) // Hashed API key
  prefix: string (not null) // First 8 chars for identification
  permissions: jsonb (not null)
  last_used_at: timestamp (nullable)
  expires_at: timestamp (nullable)
  created_by: uuid (foreign key → profiles.id)
  created_at: timestamp (default: now())
  is_active: boolean (default: true)
}

// Indexes
- idx_api_keys_site_id ON api_keys(site_id)
- idx_api_keys_key ON api_keys(key)
- idx_api_keys_prefix ON api_keys(prefix)
```

#### Table 17: webhooks

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  site_id: uuid (foreign key → sites.id, on delete: cascade)
  name: string (not null)
  url: string (not null)
  events: text[] (not null) // ['page.published', 'page.deleted']
  secret: string (nullable) // For signature verification
  is_active: boolean (default: true)
  created_by: uuid (foreign key → profiles.id)
  created_at: timestamp (default: now())
}

// Indexes
- idx_webhooks_site_id ON webhooks(site_id)
- idx_webhooks_events ON webhooks USING gin(events)
```

#### Table 18: webhook_deliveries

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  webhook_id: uuid (foreign key → webhooks.id, on delete: cascade)
  event: string (not null)
  payload: jsonb (not null)
  response_status: integer (nullable)
  response_body: text (nullable)
  delivered_at: timestamp (default: now())
  succeeded: boolean (not null)
}

// Indexes
- idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id)
- idx_webhook_deliveries_delivered_at ON webhook_deliveries(delivered_at DESC)
```

#### Table 19: invitations

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  email: string (not null)
  role: enum('admin', 'editor', 'viewer') (not null)
  site_id: uuid (foreign key → sites.id, nullable)
  token: string (unique, not null)
  invited_by: uuid (foreign key → profiles.id)
  created_at: timestamp (default: now())
  expires_at: timestamp (not null)
  accepted_at: timestamp (nullable)
}

// Indexes
- idx_invitations_token ON invitations(token)
- idx_invitations_email ON invitations(email)
```

#### Table 20: newsletter_subscribers

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  site_id: uuid (foreign key → sites.id, on delete: cascade)
  email: string (not null)
  name: string (nullable)
  status: enum('subscribed', 'unsubscribed', 'bounced')
  source: string (nullable) // Form ID or page where subscribed
  subscribed_at: timestamp (default: now())
  unsubscribed_at: timestamp (nullable)
}

// Indexes
- idx_newsletter_subscribers_site_id ON newsletter_subscribers(site_id)
- idx_newsletter_subscribers_email ON newsletter_subscribers(site_id, email)

// Unique Constraints
- UNIQUE(site_id, email)
```

#### Table 21: analytics_events

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  site_id: uuid (foreign key → sites.id, on delete: cascade)
  page_id: uuid (foreign key → pages.id, nullable)
  event_name: string (not null)
  event_data: jsonb (nullable)
  user_agent: text (nullable)
  ip_address: inet (nullable)
  created_at: timestamp (default: now())
}

// Indexes
- idx_analytics_events_site_id ON analytics_events(site_id)
- idx_analytics_events_page_id ON analytics_events(page_id)
- idx_analytics_events_event_name ON analytics_events(event_name)
- idx_analytics_events_created_at ON analytics_events(created_at DESC)
```

#### Table 22: media_usage (Junction Table)

```typescript
{
  id: uuid (primary key, default: gen_random_uuid())
  media_id: uuid (foreign key → media.id, on delete: cascade)
  page_id: uuid (foreign key → pages.id, nullable, on delete: cascade)
  fragment_id: uuid (foreign key → content_fragments.id, nullable, on delete: cascade)
  usage_context: string (nullable) // Component prop path
  created_at: timestamp (default: now())
}

// Indexes
- idx_media_usage_media_id ON media_usage(media_id)
- idx_media_usage_page_id ON media_usage(page_id)
- idx_media_usage_fragment_id ON media_usage(fragment_id)
```

**Notes:**
- Tracks where media files are used
- Prevents deletion of media in use
- Enables "Find usages" feature

### 3.3 Schema Design Principles

Based on research of CMS versioning and content modeling:

**1. Version Control Strategy:**
- Separate version tables (`page_versions`, `fragment_versions`)
- Main table references current published version
- Complete history preserved
- Change summaries for audit trail

**2. Content Modeling:**
- Modular, reusable components (content fragments)
- Hierarchical structures (pages, folders, menus)
- Flexible JSON storage for dynamic content
- Strong typing at application layer (Zod schemas)

**3. Multi-Tenancy:**
- Site-scoped data isolation
- Shared component registry across sites
- Site-specific configurations

**4. Performance Optimization:**
- Strategic indexes on foreign keys
- GIN indexes for JSON queries and arrays
- Composite indexes for common query patterns
- Partitioning potential for analytics_events

**Sources:**
- [How Payload CMS Solves Content-Versioning](https://www.rwit.io/blog/payload-cms-content-versioning-for-developers)
- [Content Management System: Versioning](https://softwaremill.com/content-management-system-versioning/)
- [Headless CMS Content Modeling Best Practices](https://flotiq.com/blog/structuring-content-in-a-headless-cms-a-practical-guide/)

---

## 4. Component Registry Architecture

### 4.1 Component System Design

**Inspiration:** AEM Core Components + React Bricks

**Core Concepts:**
1. **Component Definition** - TypeScript interface defining structure
2. **Props Schema** - Zod/JSON Schema for validation and UI generation
3. **Render Function** - React component for display
4. **Editor Config** - Configuration for visual editor

### 4.2 Component Registry Structure

```typescript
// lib/components/registry.ts

import { z } from 'zod'

export interface ComponentDefinition {
  id: string
  name: string // Technical: "hero_section"
  displayName: string // User-friendly: "Hero Section"
  category: 'layout' | 'content' | 'media' | 'form' | 'navigation'
  description: string
  thumbnailUrl?: string
  propsSchema: z.ZodObject<any>
  defaultProps: Record<string, any>
  render: React.ComponentType<any>
  editorConfig: {
    minWidth?: number
    maxWidth?: number
    resizable?: boolean
    draggable?: boolean
  }
}

export const componentRegistry = new Map<string, ComponentDefinition>()

// Example: Hero Section Component
export const heroSectionDefinition: ComponentDefinition = {
  id: 'hero_section',
  name: 'hero_section',
  displayName: 'Hero Section',
  category: 'content',
  description: 'Large hero banner with heading, subtitle, and CTA',
  propsSchema: z.object({
    title: z.string().default('Welcome'),
    subtitle: z.string().optional(),
    ctaText: z.string().default('Get Started'),
    ctaLink: z.string().url().optional(),
    backgroundImage: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right']).default('center'),
    height: z.enum(['sm', 'md', 'lg', 'xl']).default('lg'),
  }),
  defaultProps: {
    title: 'Welcome to PageForge',
    subtitle: 'Build stunning pages without code',
    ctaText: 'Get Started',
    alignment: 'center',
    height: 'lg',
  },
  render: HeroSectionComponent,
  editorConfig: {
    resizable: true,
    draggable: true,
  },
}

// Register component
componentRegistry.set('hero_section', heroSectionDefinition)
```

### 4.3 Built-in Component Library

**Phase 1: Core Components (7)**

1. **Hero Section** - Large banner with heading, subtitle, CTA
2. **Text Block** - Rich text editor (Tiptap)
3. **Image** - Single image with caption
4. **Image Gallery** - Multiple images in grid/carousel
5. **Button** - Configurable CTA button
6. **Container** - Layout wrapper with configurable grid
7. **Spacer** - Vertical spacing control

**Phase 2: Extended Components (9)**

8. **Video Embed** - YouTube/Vimeo embed
9. **Icon Grid** - Features with icons
10. **Testimonial** - Customer testimonial card
11. **Accordion** - Collapsible content sections
12. **Tabs** - Tabbed content
13. **Card Grid** - Responsive card layout
14. **Form** - Contact/lead generation forms
15. **Divider** - Horizontal separator
16. **HTML Block** - Custom HTML/CSS/JS

### 4.4 Component Rendering Pipeline

**1. Data Flow:**
```
Database (page_versions.content JSON)
  ↓
Fetch page data
  ↓
Parse component tree
  ↓
Resolve component definitions from registry
  ↓
Validate props against schemas
  ↓
Render React components
  ↓
Output HTML
```

**2. Page Renderer:**
```typescript
// lib/renderer/page-renderer.tsx

interface PageContent {
  components: ComponentInstance[]
}

interface ComponentInstance {
  id: string
  type: string // Component registry key
  props: Record<string, any>
  children?: ComponentInstance[]
}

export async function renderPage(pageId: string) {
  const page = await getPageWithVersion(pageId)
  const content: PageContent = page.version.content

  return (
    <div className="page-container">
      {content.components.map((comp) => (
        <ComponentRenderer key={comp.id} component={comp} />
      ))}
    </div>
  )
}

function ComponentRenderer({ component }: { component: ComponentInstance }) {
  const definition = componentRegistry.get(component.type)

  if (!definition) {
    return <div>Unknown component: {component.type}</div>
  }

  // Validate props
  const validatedProps = definition.propsSchema.parse(component.props)

  // Render component
  const Component = definition.render
  return <Component {...validatedProps} />
}
```

### 4.5 Props Schema to UI Generation

**Automatic Property Panel Generation:**

```typescript
// Editor automatically generates form fields from schema

const heroSchema = z.object({
  title: z.string().describe('Heading text'),
  alignment: z.enum(['left', 'center', 'right']).describe('Text alignment'),
  backgroundImage: z.string().optional().describe('Background image URL'),
})

// Generates:
// - Text input for "title"
// - Select dropdown for "alignment"
// - Media picker for "backgroundImage"
```

**Schema Annotations:**
```typescript
z.string().meta({
  label: 'Hero Title',
  placeholder: 'Enter a compelling headline',
  helpText: 'This will be the main heading',
})
```

**Sources:**
- [React Bricks: Visual headless CMS](https://www.reactbricks.com/)
- [Builder.io Component Architecture](https://www.builder.io/m/nextjs-cms)

---

## 5. Drag-and-Drop Implementation

### 5.1 Library Selection: @dnd-kit

**Decision: @dnd-kit (Not react-beautiful-dnd)**

**Rationale:**

✅ **Modern & Performant:**
- ~10kb minified, no external dependencies
- Built for React 18+ (likely React 19 compatible)
- High FPS drag performance
- Hook-based API (`useDraggable`, `useDroppable`)

✅ **Flexible & Extensible:**
- Customizable collision detection
- Custom animations and transitions
- Supports lists, grids, nested contexts, 2D games

✅ **Accessible:**
- Built-in keyboard navigation
- Screen reader support
- WCAG compliant

**Trade-offs Accepted:**
- Not built on HTML5 Drag and Drop API
- Cannot drag from desktop or between windows
- Worth it for better mobile support and customization

**Sources:**
- [Top 5 Drag-and-Drop Libraries for React in 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [dnd kit – a modern drag and drop toolkit for React](https://dndkit.com/)

### 5.2 Editor Layout Architecture

**Visual Editor Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│  Top Bar (Page title, Save, Publish, Preview)              │
├───────────────┬──────────────────────────┬──────────────────┤
│               │                          │                  │
│  Component    │    Canvas                │  Properties      │
│  Library      │    (Drag-drop zone)      │  Panel           │
│  (Sidebar)    │                          │  (Inspector)     │
│               │  ┌─────────────────┐     │                  │
│  - Hero       │  │ Hero Section    │     │  [Hero Props]    │
│  - Text       │  │ [Drop here]     │     │  Title: ___      │
│  - Image      │  ├─────────────────┤     │  Alignment: ▼    │
│  - Button     │  │ Text Block      │     │  Image: [...]    │
│  - ...        │  │ Lorem ipsum...  │     │                  │
│               │  ├─────────────────┤     │  [Save]          │
│               │  │ [Drop zone]     │     │                  │
│               │  └─────────────────┘     │                  │
│               │                          │                  │
└───────────────┴──────────────────────────┴──────────────────┘
```

### 5.3 Drag-and-Drop Implementation

```typescript
// components/editor/visual-editor.tsx

import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

export function VisualEditor({ pageId }: { pageId: string }) {
  const [components, setComponents] = useState<ComponentInstance[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }

    setActiveId(null)
  }

  return (
    <div className="editor-layout">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Component Library */}
        <ComponentLibrary />

        {/* Canvas */}
        <div className="canvas">
          <SortableContext
            items={components.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {components.map((component) => (
              <DraggableComponent
                key={component.id}
                component={component}
                isSelected={selectedId === component.id}
                onClick={() => setSelectedId(component.id)}
              />
            ))}
          </SortableContext>
        </div>

        {/* Properties Panel */}
        {selectedId && (
          <PropertiesPanel
            component={components.find((c) => c.id === selectedId)!}
            onChange={(updatedProps) => {
              setComponents((prev) =>
                prev.map((c) =>
                  c.id === selectedId
                    ? { ...c, props: updatedProps }
                    : c
                )
              )
            }}
          />
        )}

        <DragOverlay>
          {activeId ? (
            <div className="drag-overlay">
              {/* Render component being dragged */}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
```

### 5.4 Component State Management

**State Structure:**
```typescript
interface EditorState {
  pageId: string
  components: ComponentInstance[]
  selectedComponentId: string | null
  isDragging: boolean
  hasUnsavedChanges: boolean
  history: EditorHistory // For undo/redo
}

interface EditorHistory {
  past: ComponentInstance[][]
  present: ComponentInstance[]
  future: ComponentInstance[][]
}
```

**Auto-save Strategy:**
- Debounced auto-save every 3 seconds when changes detected
- Save to `page_versions` as draft
- Visual indicator of save state
- Manual save button for explicit saves

---

## 6. Rich Text Editor Strategy

### 6.1 Library Selection: Tiptap

**Decision: Tiptap (Not Draft.js, Slate, or Quill)**

**Rationale:**

✅ **Modern & Extensible:**
- Built on ProseMirror (solid foundation)
- React 18+ compatible
- Extensive extension ecosystem
- TypeScript-first

✅ **SSR Support:**
- Works with Next.js App Router
- Static renderer for server-side HTML generation
- **Critical Config:** `immediatelyRender: false` to avoid hydration errors

✅ **Features:**
- Collaborative editing (future feature)
- Markdown support
- Custom nodes and marks
- Slash commands

**SSR Configuration (Critical):**
```typescript
// components/editor/text-editor.tsx

'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export function TextEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    // CRITICAL: Prevent SSR rendering
    immediatelyRender: false,
  })

  if (!editor) return null

  return <EditorContent editor={editor} />
}
```

**Static Rendering (For Published Pages):**
```typescript
// lib/renderer/text-renderer.ts

import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'

export function renderTextToHTML(content: JSONContent) {
  return generateHTML(content, [StarterKit])
}
```

**Sources:**
- [Tiptap Next.js Installation Guide](https://tiptap.dev/docs/editor/getting-started/install/nextjs)
- [Tiptap Static Renderer](https://tiptap.dev/docs/editor/api/utilities/static-renderer)
- [SSR Issue with immediatelyRender](https://github.com/ueberdosis/tiptap/issues/5856)

### 6.2 Text Block Component Integration

**Component Definition:**
```typescript
export const textBlockDefinition: ComponentDefinition = {
  id: 'text_block',
  name: 'text_block',
  displayName: 'Text Block',
  category: 'content',
  description: 'Rich text content with formatting',
  propsSchema: z.object({
    content: z.any(), // Tiptap JSON
    maxWidth: z.enum(['sm', 'md', 'lg', 'full']).default('lg'),
    alignment: z.enum(['left', 'center', 'right']).default('left'),
  }),
  defaultProps: {
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Start typing...' }],
        },
      ],
    },
    maxWidth: 'lg',
    alignment: 'left',
  },
  render: TextBlockComponent,
  editorConfig: {
    resizable: false,
    draggable: true,
  },
}
```

---

## 7. File Upload & Media Library

### 7.1 Supabase Storage Strategy

**Decision: Supabase Storage (Not Cloudinary/Uploadthing)**

**Rationale:**

✅ **Integrated Platform:**
- Same platform as database and auth
- Consistent access patterns
- No additional service to manage

✅ **Features:**
- Direct file uploads from client
- CDN delivery
- Signed URLs for private files
- Image transformations (resize, format conversion)

✅ **CORS Considerations:**
- Requires CORS configuration for browser uploads
- Signed URLs bypass CORS for private uploads
- Production configuration needed

**CORS Configuration:**
```typescript
// Supabase Dashboard → Storage → Bucket Settings → CORS

{
  "allowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "allowedHeaders": ["*"],
  "maxAge": 3600
}
```

**Sources:**
- [Complete Guide to File Uploads with Next.js and Supabase](https://supalaunch.com/blog/file-upload-nextjs-supabase)
- [Next.js and Supabase: How to Store and Serve Images](https://kodaschool.com/blog/next-js-and-supabase-how-to-store-and-serve-images)

### 7.2 Upload Implementation

**Client-Side Upload:**
```typescript
// actions/media-actions.ts

'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadMedia(formData: FormData) {
  const supabase = createClient()
  const file = formData.get('file') as File

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `media/${fileName}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('pageforge-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('pageforge-media')
    .getPublicUrl(filePath)

  // Save metadata to database
  const media = await db.insert(mediaTable).values({
    filename: fileName,
    originalFilename: file.name,
    storagePath: filePath,
    mimeType: file.type,
    fileSize: file.size,
    uploadedBy: user.id,
  }).returning()

  return { media: media[0], publicUrl }
}
```

### 7.3 Media Library UI

**Features:**
- Grid/list view toggle
- Folder navigation
- Search by filename/tags
- Filter by type (image/video/document)
- Bulk actions (move, delete, tag)
- "Usage" indicator (shows where media is used)

**Media Picker Component:**
```typescript
// components/editor/media-picker.tsx

export function MediaPicker({ onSelect, accept = '*' }) {
  const [media, setMedia] = useState([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  return (
    <Dialog>
      <DialogTrigger>Choose Media</DialogTrigger>
      <DialogContent>
        <div className="media-library">
          {/* Folder tree */}
          <FolderTree
            selectedFolder={selectedFolder}
            onSelect={setSelectedFolder}
          />

          {/* Media grid */}
          <MediaGrid
            media={media}
            onSelect={onSelect}
            accept={accept}
          />

          {/* Upload button */}
          <UploadButton onUpload={(file) => uploadMedia(file)} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 8. Authentication & Authorization

### 8.1 Supabase Auth Integration

**Decision: Supabase Auth (Not NextAuth.js/Auth.js)**

**Rationale:**

✅ **Integrated Platform:**
- Same platform as database and storage
- Row Level Security (RLS) integration
- Built-in session management

✅ **Features:**
- Email/password authentication
- OAuth providers (Google, GitHub, etc.)
- Magic links
- MFA support (future)

**Auth Setup:**
```typescript
// lib/supabase/server.ts

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

### 8.2 Role-Based Access Control

**Roles:**
- **Admin** - Full access, site management, user management
- **Editor** - Create/edit/publish content, manage media
- **Viewer** - Read-only access to dashboard

**Permission Matrix:**

| Action | Admin | Editor | Viewer |
|--------|-------|--------|--------|
| View pages | ✅ | ✅ | ✅ |
| Create pages | ✅ | ✅ | ❌ |
| Edit pages | ✅ | ✅ | ❌ |
| Publish pages | ✅ | ✅ | ❌ |
| Delete pages | ✅ | ✅ | ❌ |
| Manage templates | ✅ | ✅ | ❌ |
| Manage media | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Site settings | ✅ | ❌ | ❌ |
| API keys | ✅ | ❌ | ❌ |

**RLS Policies:**
```sql
-- Profiles table RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Pages table RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editors can view pages in their sites"
  ON pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor', 'viewer')
    )
  );

CREATE POLICY "Editors can create pages"
  ON pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );
```

---

## 9. Versioning & Publishing Workflow

### 9.1 Content Lifecycle States

**State Machine:**

```
       ┌─────────┐
       │  Draft  │
       └────┬────┘
            │
            ↓
       ┌─────────┐
       │ Review  │ (Optional)
       └────┬────┘
            │
            ↓
      ┌──────────┐
      │Scheduled │ (Optional)
      └────┬─────┘
           │
           ↓
      ┌──────────┐
      │Published │
      └────┬─────┘
           │
           ↓
      ┌──────────┐
      │ Archived │
      └──────────┘
```

### 9.2 Version History

**Version Table Structure:**
- Every save creates a new version
- Version numbers auto-increment per page
- Change summaries for audit trail
- One version marked as "published"
- Rollback: copy old version content to new version

**Version UI:**
```typescript
// components/cms/version-history.tsx

export function VersionHistory({ pageId }: { pageId: string }) {
  const versions = useQuery(['page-versions', pageId], () =>
    getPageVersions(pageId)
  )

  return (
    <div className="version-history">
      {versions.data?.map((version) => (
        <div key={version.id} className="version-item">
          <div className="version-meta">
            <span>v{version.versionNumber}</span>
            <time>{formatDate(version.createdAt)}</time>
            <span>{version.createdBy.name}</span>
          </div>
          <p className="change-summary">{version.changeSummary}</p>
          <div className="version-actions">
            <Button onClick={() => previewVersion(version.id)}>
              Preview
            </Button>
            {!version.isPublished && (
              <Button onClick={() => rollbackToVersion(version.id)}>
                Restore
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Sources:**
- [How Payload CMS Solves Content-Versioning](https://www.rwit.io/blog/payload-cms-content-versioning-for-developers)
- [Deep-Dive into Content Versioning](https://caisy.io/blog/content-versioning-deep-dive)

### 9.3 Publishing Workflow

**Publish Action:**
```typescript
// actions/page-actions.ts

export async function publishPage(pageId: string) {
  // 1. Get latest draft version
  const draftVersion = await getLatestVersion(pageId)

  // 2. Mark version as published
  await db.update(pageVersionsTable)
    .set({ isPublished: true })
    .where(eq(pageVersionsTable.id, draftVersion.id))

  // 3. Update page status and published_version_id
  await db.update(pagesTable)
    .set({
      status: 'published',
      publishedVersionId: draftVersion.id,
      publishedAt: new Date(),
    })
    .where(eq(pagesTable.id, pageId))

  // 4. Revalidate Next.js cache
  revalidatePath(`/${page.site.slug}/${page.path}`)

  // 5. Trigger webhooks
  await triggerWebhook('page.published', { pageId })

  // 6. Log activity
  await logActivity({
    entityType: 'page',
    entityId: pageId,
    action: 'published',
  })
}
```

**Scheduled Publishing:**
```typescript
// cron job or background worker

export async function processScheduledPublishes() {
  const scheduledPages = await db.query.pages.findMany({
    where: and(
      eq(pagesTable.status, 'scheduled'),
      lte(pagesTable.scheduledPublishAt, new Date())
    ),
  })

  for (const page of scheduledPages) {
    await publishPage(page.id)
  }
}
```

---

## 10. Technology Stack Summary

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Framework** | Next.js | 15.x | App Router, RSC, SSR/SSG, optimal performance |
| **Language** | TypeScript | 5.x | Type safety, better DX |
| **Database** | PostgreSQL | 15+ | Relational data, complex queries, ACID |
| **ORM** | Drizzle ORM | Latest | Performance, SQL control, serverless-optimized |
| **Platform** | Supabase | Latest | Hosted PostgreSQL, Auth, Storage |
| **Drag & Drop** | @dnd-kit | Latest | Modern, performant, accessible |
| **Rich Text** | Tiptap | 2.x | Extensible, SSR support, ProseMirror-based |
| **UI Components** | shadcn/ui | Latest | Customizable, accessible, Radix UI + Tailwind |
| **Styling** | Tailwind CSS | 4.x | Utility-first, rapid development |
| **Validation** | Zod | 3.x | Type-safe validation, schema generation |
| **Forms** | React Hook Form | 7.x | Performance, minimal re-renders |
| **State Management** | Zustand | 4.x | Simple, performant, TypeScript-friendly |
| **Deployment** | Vercel | N/A | Optimized for Next.js, edge functions |

---

## 11. Implementation Phases

### Phase 1: Project Setup (Steps 2-4)
**Duration:** 3-4 hours

- **Step 2:** Initialize Next.js 15 project with Tailwind v4
- **Step 3:** Set up Supabase connection and Drizzle ORM
- **Step 4:** Implement authentication system

**Deliverables:**
- ✅ Project scaffolding with dependencies
- ✅ Database connection working
- ✅ Auth flows (login/register)
- ✅ Basic dashboard layout

### Phase 2: Core Data Models (Steps 5-8)
**Duration:** 6-8 hours

- **Step 5:** Create database schema and migrations
- **Step 6:** Implement site management
- **Step 7:** Implement page CRUD operations
- **Step 8:** Implement versioning system

**Deliverables:**
- ✅ All 22 database tables created
- ✅ Sites CRUD
- ✅ Pages CRUD
- ✅ Version history working

### Phase 3: Component Registry (Steps 9-11)
**Duration:** 5-7 hours

- **Step 9:** Build component registry architecture
- **Step 10:** Implement 7 core components
- **Step 11:** Create component renderer

**Deliverables:**
- ✅ Component registry system
- ✅ 7 basic components (Hero, Text, Image, Gallery, Button, Container, Spacer)
- ✅ Page rendering pipeline

### Phase 4: Visual Editor (Steps 12-15)
**Duration:** 8-10 hours

- **Step 12:** Set up @dnd-kit infrastructure
- **Step 13:** Build editor layout (sidebar, canvas, properties)
- **Step 14:** Implement drag-and-drop functionality
- **Step 15:** Build properties panel with schema-driven UI

**Deliverables:**
- ✅ Drag-and-drop page editor
- ✅ Component library sidebar
- ✅ Properties panel
- ✅ Auto-save functionality

### Phase 5: Extended Components (Steps 16-17)
**Duration:** 6-8 hours

- **Step 16:** Implement 9 additional components
- **Step 17:** Build Tiptap rich text editor integration

**Deliverables:**
- ✅ 16 total components
- ✅ Rich text editing
- ✅ All component categories covered

### Phase 6: Templates & Fragments (Steps 18-20)
**Duration:** 5-7 hours

- **Step 18:** Implement template system
- **Step 19:** Build content fragments
- **Step 20:** Create template editor

**Deliverables:**
- ✅ Template CRUD
- ✅ Content fragments (reusable blocks)
- ✅ Template editor with zones

### Phase 7: Media Library (Steps 21-22)
**Duration:** 4-6 hours

- **Step 21:** Integrate Supabase Storage
- **Step 22:** Build media library UI

**Deliverables:**
- ✅ File upload
- ✅ Media library browser
- ✅ Folder organization
- ✅ Media picker component

### Phase 8: Publishing Workflow (Steps 23-24)
**Duration:** 4-5 hours

- **Step 23:** Implement draft/published states
- **Step 24:** Build publishing UI and scheduled publish

**Deliverables:**
- ✅ Publish/unpublish actions
- ✅ Scheduled publishing
- ✅ Version rollback

### Phase 9: Navigation & SEO (Steps 25-26)
**Duration:** 3-4 hours

- **Step 25:** Build menu manager
- **Step 26:** Implement SEO controls

**Deliverables:**
- ✅ Menu CRUD
- ✅ SEO metadata forms
- ✅ Open Graph support

### Phase 10: Forms & Analytics (Steps 27-28)
**Duration:** 4-5 hours

- **Step 27:** Build form builder component
- **Step 28:** Implement analytics tracking

**Deliverables:**
- ✅ Form builder
- ✅ Form submissions storage
- ✅ Basic analytics events

### Phase 11: API & Webhooks (Steps 29-30)
**Duration:** 3-4 hours

- **Step 29:** Create public API endpoints
- **Step 30:** Implement webhook system

**Deliverables:**
- ✅ REST API for headless CMS
- ✅ API key management
- ✅ Webhook configuration and delivery

### Phase 12: Testing & Polish (Step 31)
**Duration:** 4-6 hours

- **Step 31:** End-to-end testing and bug fixes

**Deliverables:**
- ✅ All features working
- ✅ Bug fixes
- ✅ Performance optimization
- ✅ Documentation

**Total Estimated Time:** 55-74 hours (7-9 full work days)

---

## 12. Risk Assessment

### 12.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **@dnd-kit React 19 incompatibility** | Medium | High | Test early, have fallback to react-beautiful-dnd |
| **Tiptap SSR hydration errors** | Low | High | Follow docs: `immediatelyRender: false` |
| **Supabase Storage CORS issues** | Medium | Medium | Configure CORS properly, use signed URLs |
| **Complex nested component rendering** | Medium | High | Start simple, add nesting incrementally |
| **Performance with large pages** | Low | Medium | Implement virtualization, lazy loading |
| **Version history storage growth** | Low | Low | Monitor DB size, implement cleanup policy |
| **Drizzle ORM learning curve** | Low | Low | Follow official docs, leverage TypeScript |

### 12.2 Implementation Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Underestimating component complexity** | Medium | Medium | Build MVP components first, enhance later |
| **Scope creep** | High | High | Strict adherence to 31-step plan |
| **Time overruns** | Medium | Medium | Focus on core features, defer nice-to-haves |
| **UI/UX consistency** | Low | Low | Use shadcn/ui consistently, follow design system |

### 12.3 Critical Dependencies

**Must Research Before Implementation:**
1. ✅ @dnd-kit React 19 compatibility (check GitHub issues/discussions)
2. ✅ Tiptap SSR configuration (documented, solution known)
3. ✅ Supabase Storage CORS (documented, configuration known)

**Known Solutions:**
- Tiptap SSR: `immediatelyRender: false` (confirmed)
- Supabase Storage: Configure CORS in dashboard (documented)
- @dnd-kit: Likely compatible, but verify before Step 12

---

## 13. Sources

### AEM Architecture
- [AEM Architecture Explained: A Practical Guide](https://medium.com/@sarunsathis/aem-architecture-demystified-ab9daaae8304)
- [Introduction to the Architecture of Adobe Experience Manager](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/overview/architecture)
- [Core Components Introduction](https://experienceleague.adobe.com/en/docs/experience-manager-core-components/using/introduction)
- [AEM Architecture Stack](https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/underlying-technology/introduction-architecture)

### Next.js & React
- [Next.js Best Practices in 2025](https://www.raftlabs.com/blog/building-with-next-js-best-practices-and-benefits-for-performance-first-teams/)
- [Next.js 15: App Router Complete Guide](https://medium.com/@livenapps/next-js-15-app-router-a-complete-senior-level-guide-0554a2b820f7)
- [Best Practices for Organizing Next.js 15](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji)

### Database & ORM
- [Prisma vs Drizzle ORM in 2026](https://medium.com/@thebelcoder/prisma-vs-drizzle-orm-in-2026-what-you-really-need-to-know-9598cf4eaa7c)
- [Drizzle vs Prisma: Choosing the Right TypeScript ORM](https://medium.com/@codabu/drizzle-vs-prisma-choosing-the-right-typescript-orm-in-2026-deep-dive-63abb6aa882b)

### Drag-and-Drop
- [Top 5 Drag-and-Drop Libraries for React in 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [dnd kit – a modern drag and drop toolkit for React](https://dndkit.com/)
- [@dnd-kit Documentation](https://docs.dndkit.com)

### Rich Text Editor
- [Tiptap Next.js Installation Guide](https://tiptap.dev/docs/editor/getting-started/install/nextjs)
- [Tiptap Static Renderer](https://tiptap.dev/docs/editor/api/utilities/static-renderer)
- [SSR Issue with immediatelyRender](https://github.com/ueberdosis/tiptap/issues/5856)

### File Upload & Storage
- [Complete Guide to File Uploads with Next.js and Supabase](https://supalaunch.com/blog/file-upload-nextjs-supabase)
- [Next.js and Supabase: How to Store and Serve Images](https://kodaschool.com/blog/next-js-and-supabase-how-to-store-and-serve-images)
- [Signed URL file uploads with NextJs and Supabase](https://medium.com/@olliedoesdev/signed-url-file-uploads-with-nextjs-and-supabase-74ba91b65fe0)

### CMS Architecture
- [React Bricks: Visual headless CMS](https://www.reactbricks.com/)
- [Builder.io Headless CMS](https://www.builder.io/m/nextjs-cms)
- [Plasmic - Visual page builder for Next.js](https://www.plasmic.app/nextjs)

### Versioning & Content Modeling
- [How Payload CMS Solves Content-Versioning](https://www.rwit.io/blog/payload-cms-content-versioning-for-developers)
- [Content Management System: Versioning](https://softwaremill.com/content-management-system-versioning/)
- [Deep-Dive into Content Versioning](https://caisy.io/blog/content-versioning-deep-dive)
- [Headless CMS Content Modeling Best Practices](https://flotiq.com/blog/structuring-content-in-a-headless-cms-a-practical-guide/)
- [Headless CMS: A Beginner's Guide to Content Modeling](https://medium.com/@H_Stahl/a-beginners-guide-to-headless-content-modeling-part-1-core-concepts-d053feaec354)

---

## Conclusion

This research provides a comprehensive architectural foundation for **PageForge CMS** — an AEM-inspired visual page builder built with modern web technologies. The chosen stack balances:

✅ **Developer Experience:** TypeScript, Drizzle ORM, type-safe schemas
✅ **Performance:** Next.js RSC, Supabase, efficient rendering
✅ **User Experience:** Drag-and-drop editing, live preview, intuitive UI
✅ **Extensibility:** Component registry, plugin architecture, headless API
✅ **Enterprise Features:** Versioning, multi-site, permissions, workflows

**Critical Success Factors:**
1. Component registry architecture (type-safe, extensible)
2. Robust versioning system (complete history, rollback)
3. Performant drag-and-drop editor (@dnd-kit)
4. Clean separation: editor vs renderer
5. Comprehensive database schema (22 tables, proper relations)

**Ready to proceed with Step 2: Initialize Next.js project with Tailwind v4**

---

**Research Completed:** February 4, 2026
**Total Research Time:** ~8 hours
**Document Version:** 1.0
