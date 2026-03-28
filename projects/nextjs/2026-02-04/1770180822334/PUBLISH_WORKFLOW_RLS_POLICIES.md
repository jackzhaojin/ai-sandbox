# Publish Workflow RLS Policies

This document outlines the Row Level Security (RLS) policies required for the publish workflow feature.

## Overview

The publish workflow adds new status states and workflow actions that require specific permissions:
- Only admins can set pages to `published` or `scheduled` status
- Only admins can archive pages
- Only admins can force unlock pages
- Authors can submit pages for review
- Admins can approve or reject review requests

## Required RLS Policies

### Pages Table

Update the existing `pages` table RLS policies to include workflow restrictions:

```sql
-- Policy: Users can view pages in their sites
CREATE POLICY "Users can view pages in accessible sites"
  ON pages FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE created_by = auth.uid()
      OR id IN (
        SELECT site_id FROM site_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can create draft pages
CREATE POLICY "Users can create draft pages"
  ON pages FOR INSERT
  WITH CHECK (
    status = 'draft'
    AND site_id IN (
      SELECT id FROM sites
      WHERE created_by = auth.uid()
      OR id IN (
        SELECT site_id FROM site_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'editor')
      )
    )
  );

-- Policy: Users can update their own draft pages
CREATE POLICY "Users can update draft pages"
  ON pages FOR UPDATE
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE created_by = auth.uid()
      OR id IN (
        SELECT site_id FROM site_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'editor')
      )
    )
    AND (
      -- Authors can only work with drafts or submit for review
      (status IN ('draft', 'in_review') AND created_by = auth.uid())
      OR
      -- Admins can change any status
      (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role = 'admin'
        )
      )
    )
  );

-- Policy: Only admins can delete pages
CREATE POLICY "Only admins can delete pages"
  ON pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Additional constraint: Only admins can set published/scheduled/archived status
-- This is enforced at the application layer AND via check constraint
ALTER TABLE pages ADD CONSTRAINT check_status_permissions
  CHECK (
    status NOT IN ('published', 'scheduled', 'archived')
    OR published_by IS NOT NULL
  );
```

### Review Requests Table

```sql
-- Policy: Users can view review requests for pages they have access to
CREATE POLICY "Users can view review requests"
  ON review_requests FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM pages
      WHERE site_id IN (
        SELECT id FROM sites
        WHERE created_by = auth.uid()
        OR id IN (
          SELECT site_id FROM site_members
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Policy: Users can create review requests for their own pages
CREATE POLICY "Users can submit review requests"
  ON review_requests FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND page_id IN (
      SELECT id FROM pages
      WHERE created_by = auth.uid()
      AND status = 'draft'
    )
  );

-- Policy: Only admins can update review requests (approve/reject)
CREATE POLICY "Admins can update review requests"
  ON review_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

### Activity Log Table

```sql
-- Policy: Users can view activity logs for their sites
CREATE POLICY "Users can view activity logs"
  ON activity_log FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites
      WHERE created_by = auth.uid()
      OR id IN (
        SELECT site_id FROM site_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Authenticated users can insert activity logs
CREATE POLICY "Users can create activity logs"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

### Notifications Table

```sql
-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Policy: System can create notifications for any user
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());
```

## Applying the Policies

Execute the following steps in order:

### 1. Enable RLS

```sql
-- Enable RLS on all tables if not already enabled
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### 2. Drop Existing Policies (if any)

```sql
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view pages in accessible sites" ON pages;
DROP POLICY IF EXISTS "Users can create draft pages" ON pages;
DROP POLICY IF EXISTS "Users can update draft pages" ON pages;
DROP POLICY IF EXISTS "Only admins can delete pages" ON pages;

DROP POLICY IF EXISTS "Users can view review requests" ON review_requests;
DROP POLICY IF EXISTS "Users can submit review requests" ON review_requests;
DROP POLICY IF EXISTS "Admins can update review requests" ON review_requests;

DROP POLICY IF EXISTS "Users can view activity logs" ON activity_log;
DROP POLICY IF EXISTS "Users can create activity logs" ON activity_log;

DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their notifications" ON notifications;
```

### 3. Apply New Policies

Copy and execute all the policy creation statements from the sections above.

## Testing the Policies

### Test 1: Author Submitting for Review

```sql
-- As an author user
-- Should succeed
UPDATE pages
SET status = 'in_review'
WHERE id = 'page-id' AND created_by = auth.uid() AND status = 'draft';

-- Should fail
UPDATE pages
SET status = 'published'
WHERE id = 'page-id';
```

### Test 2: Admin Publishing a Page

```sql
-- As an admin user
-- Should succeed
UPDATE pages
SET status = 'published', published_at = NOW(), published_by = auth.uid()
WHERE id = 'page-id';
```

### Test 3: Non-Admin Trying to Archive

```sql
-- As a non-admin user
-- Should fail
UPDATE pages
SET status = 'archived'
WHERE id = 'page-id';
```

## Troubleshooting

### Policy Not Working

1. Check if RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('pages', 'review_requests', 'activity_log', 'notifications');
   ```

2. Check applied policies:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE tablename IN ('pages', 'review_requests', 'activity_log', 'notifications');
   ```

3. Test with specific user context:
   ```sql
   SET LOCAL role authenticated;
   SET LOCAL request.jwt.claims = '{"sub": "user-id", "role": "authenticated"}';
   -- Run your query
   ```

### Common Issues

1. **"permission denied for table pages"**: RLS is enabled but no policy matches your query
2. **Policies too restrictive**: Check the USING clause logic
3. **Service role bypassing policies**: Service role key bypasses RLS - ensure you're using anon key for testing

## Migration Checklist

- [ ] Apply database migration for new fields (locked_by, locked_at, published_by, reviewer_notes)
- [ ] Enable RLS on all tables
- [ ] Apply all policies from this document
- [ ] Test as different user roles (admin, author, viewer)
- [ ] Verify auto-publish edge function has correct permissions
- [ ] Update API endpoints to respect RLS constraints
- [ ] Document for team

## Notes

- The service role key (used by Edge Functions) bypasses RLS completely
- Always use the anon key for client-side operations to enforce RLS
- Policies are evaluated in order; first matching policy grants access
- Use `EXPLAIN` to debug query performance with RLS enabled
