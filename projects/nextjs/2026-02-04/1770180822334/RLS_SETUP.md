# Row Level Security (RLS) Setup Guide - PageForge CMS

This document describes the Row Level Security policies implemented for PageForge CMS.

## Overview

Row Level Security (RLS) has been configured for all 22 database tables to ensure proper access control based on user roles and relationships.

## User Roles

The system supports three user roles defined in the `profiles` table:

- **Admin** - Full access to all resources, site management, user management
- **Editor** - Create/edit/publish content, manage media within assigned sites
- **Viewer** - Read-only access to dashboard and content

## RLS Policies by Table

### 1. Profiles Table

**Policies:**
- `profiles_select_all` - Anyone can view all profiles
- `profiles_update_own` - Users can only update their own profile

**Access Matrix:**
| Action | Admin | Editor | Viewer | Anonymous |
|--------|-------|--------|--------|-----------|
| SELECT | All   | All    | All    | All       |
| UPDATE | Own   | Own    | Own    | -         |

---

### 2. Sites Table

**Policies:**
- `sites_select_own_or_admin` - Admin sees all sites, others see sites they created
- `sites_insert_editor_or_admin` - Editors and admins can create sites
- `sites_update_own_or_admin` - Admin can update all, others only their own
- `sites_delete_admin` - Only admins can delete sites

**Access Matrix:**
| Action | Admin | Editor | Viewer | Anonymous |
|--------|-------|--------|--------|-----------|
| SELECT | All   | Own    | Own    | -         |
| INSERT | ✓     | ✓      | -      | -         |
| UPDATE | All   | Own    | -      | -         |
| DELETE | All   | -      | -      | -         |

---

### 3. Pages Table

**Policies:**
- `pages_select_published_or_own_site` - Public sees published, authenticated users see their site pages
- `pages_insert_editor_or_admin` - Editors/admins can create pages in their sites
- `pages_update_own_site` - Can update pages in their sites
- `pages_delete_own_site` - Can delete pages in their sites

**Access Matrix:**
| Action | Admin      | Editor     | Viewer     | Anonymous   |
|--------|------------|------------|------------|-------------|
| SELECT | All        | Site pages | Site pages | Published   |
| INSERT | ✓          | Site only  | -          | -           |
| UPDATE | All        | Site only  | -          | -           |
| DELETE | All        | Site only  | -          | -           |

---

### 4. Page Versions Table

**Policies:**
- `page_versions_select_if_page_accessible` - Inherit page access
- `page_versions_insert_if_page_accessible` - Can create versions for accessible pages
- `page_versions_update_if_page_accessible` - Can update versions for accessible pages

**Access Control:** Inherits from parent `pages` table

---

### 5. Media Table

**Policies:**
- `media_select_authenticated` - All authenticated users can view media
- `media_insert_editor_or_admin` - Editors/admins can upload media
- `media_update_uploader_or_admin` - Uploader or admin can update
- `media_delete_uploader_or_admin` - Uploader or admin can delete

**Access Matrix:**
| Action | Admin | Editor | Viewer | Anonymous |
|--------|-------|--------|--------|-----------|
| SELECT | All   | All    | All    | -         |
| INSERT | ✓     | ✓      | -      | -         |
| UPDATE | All   | Own    | -      | -         |
| DELETE | All   | Own    | -      | -         |

---

### 6. Media Folders Table

**Policies:**
- `media_folders_select_site_access` - Site-based access
- `media_folders_insert_editor_or_admin` - Editors/admins can create folders
- `media_folders_update_site_access` - Can update folders in their sites
- `media_folders_delete_admin` - Only admins can delete folders

---

### 7. Templates Table

**Policies:**
- `templates_select_all_authenticated` - All authenticated users can view templates
- `templates_insert_admin` - Only admins can create templates
- `templates_update_admin` - Only admins can update templates
- `templates_delete_admin` - Only admins can delete templates

**Access Matrix:**
| Action | Admin | Editor | Viewer | Anonymous |
|--------|-------|--------|--------|-----------|
| SELECT | All   | All    | All    | -         |
| INSERT | ✓     | -      | -      | -         |
| UPDATE | ✓     | -      | -      | -         |
| DELETE | ✓     | -      | -      | -         |

---

### 8. Content Fragments Table

**Policies:**
- `content_fragments_select_site_access` - Site-based access
- `content_fragments_insert_editor_or_admin` - Editors/admins can create
- `content_fragments_update_site_access` - Can update in their sites
- `content_fragments_delete_admin` - Only admins can delete

---

### 9. Fragment Versions Table

**Policies:**
- `fragment_versions_select_if_fragment_accessible` - Inherit fragment access
- `fragment_versions_insert_if_fragment_accessible` - Can create versions for accessible fragments

**Access Control:** Inherits from parent `content_fragments` table

---

### 10. Menus Table

**Policies:**
- `menus_select_all_authenticated` - All authenticated users can view menus
- `menus_insert_admin` - Only admins can create menus
- `menus_update_admin` - Only admins can update menus
- `menus_delete_admin` - Only admins can delete menus

---

### 11. Activity Log Table

**Policies:**
- `activity_log_select_site_access` - Users can see logs for their sites
- **No INSERT policy** - Only server-side code (service role) can insert logs

**Special Note:** Activity logs are created server-side only to prevent tampering

---

### 12. Review Requests Table

**Policies:**
- `review_requests_select_involved_or_admin` - Requester, assignee, or admin can view
- `review_requests_insert_editor_or_admin` - Editors/admins can create review requests
- `review_requests_update_involved_or_admin` - Involved parties or admin can update

---

### 13. Form Submissions Table

**Policies:**
- `form_submissions_select_admin` - Only admins can view submissions
- `form_submissions_insert_public` - Anyone can submit forms (public forms)
- `form_submissions_update_admin` - Only admins can update submissions
- `form_submissions_delete_admin` - Only admins can delete submissions

**Access Matrix:**
| Action | Admin | Editor | Viewer | Anonymous |
|--------|-------|--------|--------|-----------|
| SELECT | All   | -      | -      | -         |
| INSERT | ✓     | ✓      | ✓      | ✓         |
| UPDATE | ✓     | -      | -      | -         |
| DELETE | ✓     | -      | -      | -         |

---

### 14. API Keys Table

**Policies:**
- `api_keys_select_admin` - Only admins can view API keys
- `api_keys_insert_admin` - Only admins can create API keys
- `api_keys_update_admin` - Only admins can update API keys
- `api_keys_delete_admin` - Only admins can delete API keys

**Access:** Admin-only for security reasons

---

### 15. Webhooks Table

**Policies:**
- `webhooks_select_admin` - Only admins can view webhooks
- `webhooks_insert_admin` - Only admins can create webhooks
- `webhooks_update_admin` - Only admins can update webhooks
- `webhooks_delete_admin` - Only admins can delete webhooks

**Access:** Admin-only for security reasons

---

### 16. Webhook Deliveries Table

**Policies:**
- `webhook_deliveries_select_admin` - Only admins can view delivery logs
- **No INSERT policy** - Server-side only

---

### 17. Invitations Table

**Policies:**
- `invitations_select_admin_or_invitee` - Admin or the invited person can view
- `invitations_insert_admin` - Only admins can send invitations
- `invitations_update_admin` - Only admins can update invitations
- `invitations_delete_admin` - Only admins can delete invitations

---

### 18. Notifications Table

**Policies:**
- `notifications_select_own` - Users can only see their own notifications
- `notifications_insert_own` - Users can create notifications (for their own account)
- `notifications_update_own` - Users can update their own notifications (mark as read)
- `notifications_delete_own` - Users can delete their own notifications

**Access:** Fully isolated per user

---

### 19. Components Table

**Policies:**
- `components_select_all_authenticated` - All authenticated users can view components
- `components_insert_admin` - Only admins can create components
- `components_update_admin` - Only admins can update components
- `components_delete_admin` - Only admins can delete components

**Access Matrix:**
| Action | Admin | Editor | Viewer | Anonymous |
|--------|-------|--------|--------|-----------|
| SELECT | All   | All    | All    | -         |
| INSERT | ✓     | -      | -      | -         |
| UPDATE | ✓     | -      | -      | -         |
| DELETE | ✓     | -      | -      | -         |

---

### 20. Newsletter Subscribers Table

**Policies:**
- `newsletter_subscribers_select_admin` - Only admins can view subscribers
- `newsletter_subscribers_insert_public` - Anyone can subscribe (public forms)
- `newsletter_subscribers_update_admin` - Only admins can update subscriptions
- `newsletter_subscribers_delete_admin` - Only admins can delete subscriptions

---

### 21. Analytics Events Table

**Policies:**
- `analytics_events_select_admin` - Only admins can view analytics
- `analytics_events_insert_public` - Anyone can submit analytics events

**Special Note:** Events can be submitted by anonymous users for tracking

---

### 22. Media Usage Table

**Policies:**
- `media_usage_select_authenticated` - All authenticated users can view media usage
- `media_usage_insert_editor_or_admin` - Editors/admins can track usage
- `media_usage_delete_editor_or_admin` - Editors/admins can remove usage records

---

## Applying RLS Policies

### Method 1: Using Supabase SQL Editor (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `lmbrqiwzowiquebtsfyc`
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy the contents of `drizzle/migrations/0002_rls_policies.sql`
6. Paste into the SQL editor
7. Click **Run** to execute

### Method 2: Using npm script (if DATABASE_URL is configured)

```bash
npm run db:rls
```

**Note:** This requires a valid `DATABASE_URL` in `.env.local` with direct connection credentials.

## Verifying RLS Policies

### Check RLS is enabled on tables:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### List all policies:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Count policies per table:

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

## Testing RLS Policies

Create test users with different roles and verify access:

### Test Script Example:

```typescript
// scripts/test-rls.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testRLS() {
  // Test as admin user
  const adminClient = createClient(supabaseUrl, supabaseKey)
  await adminClient.auth.signInWithPassword({
    email: 'admin@example.com',
    password: 'password'
  })

  // Try to fetch all sites (should work for admin)
  const { data: sites, error } = await adminClient
    .from('sites')
    .select('*')

  console.log('Admin sites query:', { sites, error })

  // Test as editor user
  const editorClient = createClient(supabaseUrl, supabaseKey)
  await editorClient.auth.signInWithPassword({
    email: 'editor@example.com',
    password: 'password'
  })

  // Try to fetch sites (should only see own sites)
  const { data: editorSites, error: editorError } = await editorClient
    .from('sites')
    .select('*')

  console.log('Editor sites query:', { sites: editorSites, error: editorError })
}

testRLS()
```

## Troubleshooting

### "Tenant or user not found" error

This error occurs when the DATABASE_URL connection string is invalid. To fix:

1. Verify your DATABASE_URL format in `.env.local`
2. Ensure password is correct
3. Use Supabase SQL Editor instead (Method 1 above)

### Policies not working

1. Verify RLS is enabled: Check `rowsecurity` column in `pg_tables`
2. Check policy syntax: Review policies in `pg_policies`
3. Verify user authentication: Ensure `auth.uid()` returns a valid user ID
4. Check profile role: Ensure user has correct role in `profiles` table

## Storage Bucket Configuration

In addition to RLS policies, a Supabase Storage bucket has been configured:

### Bucket: `media`

- **Public Access:** Yes (for reading)
- **Max File Size:** 10MB
- **Allowed MIME Types:**
  - Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`
  - Videos: `video/mp4`, `video/webm`, `video/quicktime`
  - Documents: `application/pdf`, `application/msword`, `.docx`

### Access the bucket:

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Upload file
const { data, error } = await supabase.storage
  .from('media')
  .upload('path/to/file.jpg', file)

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('media')
  .getPublicUrl('path/to/file.jpg')
```

## Next Steps

After RLS setup is complete:

1. ✅ RLS policies created for all 22 tables
2. ✅ Storage bucket configured
3. ⏭️ **Step 6:** Create dashboard layout and navigation
4. ⏭️ **Step 7:** Implement media library with folders and upload

## References

- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
