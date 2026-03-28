# Database Setup Guide - PageForge CMS

This document describes the database setup for PageForge CMS using Supabase and Drizzle ORM.

## Overview

- **Database**: Supabase PostgreSQL
- **ORM**: Drizzle ORM with postgres-js driver
- **Total Tables**: 22 tables across 6 logical groups
- **Migration Tool**: Drizzle Kit

## Prerequisites

1. Supabase project created at: `https://lmbrqiwzowiquebtsfyc.supabase.co`
2. Database password from Supabase dashboard

## Environment Configuration

### Required Environment Variables

Add the following to `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://lmbrqiwzowiquebtsfyc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Configuration
DATABASE_URL=postgresql://postgres.lmbrqiwzowiquebtsfyc:[YOUR_PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Getting Your Database Password

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `lmbrqiwzowiquebtsfyc`
3. Navigate to **Settings** → **Database**
4. Copy the password or reset it if needed
5. Update `[YOUR_PASSWORD]` in the `DATABASE_URL` above

## Database Schema

The schema consists of 22 tables organized into 6 groups:

### Group 1: User Management (3 tables)
- `profiles` - User accounts and roles
- `invitations` - Team invitations
- `activity_log` - Audit trail

### Group 2: Site & Content Structure (4 tables)
- `sites` - Multi-site management
- `pages` - Page metadata and structure
- `page_versions` - Version history
- `menus` - Navigation structures

### Group 3: Component System (4 tables)
- `components` - Component registry
- `templates` - Page templates
- `content_fragments` - Reusable content
- `fragment_versions` - Fragment version history

### Group 4: Media Management (3 tables)
- `media` - File metadata
- `media_folders` - Folder organization
- `media_usage` - Track where media is used

### Group 5: Advanced Features (5 tables)
- `form_submissions` - Form builder data
- `review_requests` - Content review workflow
- `notifications` - User notifications
- `newsletter_subscribers` - Newsletter management
- `analytics_events` - Custom event tracking

### Group 6: API & Integrations (3 tables)
- `api_keys` - Headless CMS API access
- `webhooks` - Event notifications
- `webhook_deliveries` - Delivery logs

## Running Migrations

### Step 1: Verify DATABASE_URL

Ensure your `.env.local` has the correct `DATABASE_URL` with your actual database password.

### Step 2: Push Schema to Supabase

Run the following command to apply the schema to your Supabase database:

```bash
npx drizzle-kit push
```

This will:
1. Connect to your Supabase database
2. Create all 22 tables
3. Set up all indexes, foreign keys, and constraints
4. Create all enum types

### Step 3: Verify Migration

After pushing, verify the tables were created:

```bash
npx drizzle-kit studio
```

This opens Drizzle Studio in your browser where you can:
- View all tables
- Inspect schema structure
- Browse data
- Run queries

## Alternative: Generate and Run SQL Migrations

If you prefer to review SQL before applying:

### Generate Migration Files

```bash
npx drizzle-kit generate
```

This creates SQL migration files in `drizzle/migrations/`.

### Apply Migrations Manually

1. Copy the SQL from `drizzle/migrations/0000_marvelous_sabretooth.sql`
2. Go to Supabase Dashboard → SQL Editor
3. Paste and execute the SQL
4. Verify tables are created

## Database Connection

### Client-Side (Browser)

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
```

### Server-Side (Server Components, Route Handlers)

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
```

### Drizzle ORM (Database Queries)

```typescript
import { db } from '@/lib/db'
import { pages, sites } from '@/lib/db/schema'

// Query example
const allPages = await db.query.pages.findMany()

// Using helper functions
import { getPagesBySite } from '@/lib/db/queries'
const sitePages = await getPagesBySite('site-id')
```

## Helper Functions

Common database queries are available in `lib/db/queries.ts`:

### User/Profile Queries
- `getUserById(userId)`
- `getUserByEmail(email)`
- `updateUserProfile(userId, data)`

### Site Queries
- `getSitesByUser(userId)`
- `getSiteBySlug(slug)`
- `getSiteById(siteId)`

### Page Queries
- `getPagesBySite(siteId)`
- `getPageById(pageId)`
- `getPageByPath(siteId, path)`
- `getPublishedPages(siteId)`

### Page Version Queries
- `getPageVersions(pageId)`
- `getLatestPageVersion(pageId)`
- `getPageWithVersion(pageId, versionId?)`

### Template Queries
- `getTemplatesBySite(siteId)`
- `getSystemTemplates()`

### Component Queries
- `getActiveComponents()`
- `getComponentsByCategory(category)`

### Media Queries
- `getMediaBySite(siteId, folderId?)`
- `getMediaFoldersBySite(siteId)`

### Content Fragment Queries
- `getContentFragmentsBySite(siteId)`
- `getContentFragmentsByType(siteId, type)`

## Testing the Connection

Create a test file to verify the database connection:

```typescript
// scripts/test-db.ts
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'

async function testConnection() {
  try {
    const result = await db.select().from(profiles).limit(1)
    console.log('✅ Database connection successful!')
    console.log('Result:', result)
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  }
}

testConnection()
```

Run with:
```bash
npx tsx scripts/test-db.ts
```

## Troubleshooting

### Connection Issues

1. **Verify DATABASE_URL format**: Should be `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[REGION].pooler.supabase.com:6543/postgres`
2. **Check password**: Ensure password doesn't contain special characters that need URL encoding
3. **Network access**: Ensure your IP is allowed (Supabase allows all IPs by default)

### Migration Issues

1. **Schema conflicts**: If tables already exist, you may need to drop them first (⚠️ will delete all data)
2. **Permission errors**: Ensure you're using the correct database user
3. **Syntax errors**: Check the generated SQL in `drizzle/migrations/`

## Next Steps

After database setup is complete:

1. ✅ Database schema created
2. ⏭️ **Step 4**: Implement authentication system
3. ⏭️ **Step 5**: Build RLS policies and storage buckets
4. ⏭️ **Step 6**: Create dashboard layout and navigation

## References

- [Supabase Database Connection Docs](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit Commands](https://orm.drizzle.team/kit-docs/overview)
