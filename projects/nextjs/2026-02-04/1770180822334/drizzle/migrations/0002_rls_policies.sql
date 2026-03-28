-- Row Level Security (RLS) Policies for PageForge CMS
-- This migration enables RLS on all tables and creates appropriate policies

-- ========================================
-- 1. PROFILES TABLE
-- ========================================
-- Policies: SELECT all, UPDATE own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ========================================
-- 2. SITES TABLE
-- ========================================
-- Policies: Admin sees all, authors see their own
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sites_select_own_or_admin"
  ON sites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR sites.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "sites_insert_editor_or_admin"
  ON sites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "sites_update_own_or_admin"
  ON sites FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR sites.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "sites_delete_admin"
  ON sites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 3. PAGES TABLE
-- ========================================
-- Policies: Admin all, authors their sites, published are public
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pages_select_published_or_own_site"
  ON pages FOR SELECT
  USING (
    -- Public can see published pages
    pages.status = 'published'
    OR
    -- Authenticated users can see pages from their sites
    EXISTS (
      SELECT 1 FROM profiles
      JOIN sites ON sites.created_by = profiles.id OR profiles.role = 'admin'
      WHERE profiles.id = auth.uid()
      AND sites.id = pages.site_id
    )
  );

CREATE POLICY "pages_insert_editor_or_admin"
  ON pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN sites ON sites.created_by = profiles.id OR profiles.role = 'admin'
      WHERE profiles.id = auth.uid()
      AND sites.id = pages.site_id
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "pages_update_own_site"
  ON pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN sites ON sites.created_by = profiles.id OR profiles.role = 'admin'
      WHERE profiles.id = auth.uid()
      AND sites.id = pages.site_id
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "pages_delete_own_site"
  ON pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN sites ON sites.created_by = profiles.id OR profiles.role = 'admin'
      WHERE profiles.id = auth.uid()
      AND sites.id = pages.site_id
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- ========================================
-- 4. PAGE_VERSIONS TABLE
-- ========================================
-- Policies: Inherit page access
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_versions_select_if_page_accessible"
  ON page_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_versions.page_id
      AND (
        pages.status = 'published'
        OR EXISTS (
          SELECT 1 FROM profiles
          JOIN sites ON sites.created_by = profiles.id OR profiles.role = 'admin'
          WHERE profiles.id = auth.uid()
          AND sites.id = pages.site_id
        )
      )
    )
  );

CREATE POLICY "page_versions_insert_if_page_accessible"
  ON page_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pages
      JOIN sites ON sites.id = pages.site_id
      JOIN profiles ON profiles.id = auth.uid()
      WHERE pages.id = page_versions.page_id
      AND (sites.created_by = profiles.id OR profiles.role = 'admin')
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "page_versions_update_if_page_accessible"
  ON page_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pages
      JOIN sites ON sites.id = pages.site_id
      JOIN profiles ON profiles.id = auth.uid()
      WHERE pages.id = page_versions.page_id
      AND (sites.created_by = profiles.id OR profiles.role = 'admin')
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- ========================================
-- 5. MEDIA TABLE
-- ========================================
-- Policies: All authenticated for SELECT, uploader/admin for DELETE
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_select_authenticated"
  ON media FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "media_insert_editor_or_admin"
  ON media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "media_update_uploader_or_admin"
  ON media FOR UPDATE
  USING (
    media.uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "media_delete_uploader_or_admin"
  ON media FOR DELETE
  USING (
    media.uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 6. MEDIA_FOLDERS TABLE
-- ========================================
-- Policies: Site access
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_folders_select_site_access"
  ON media_folders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN sites ON sites.created_by = profiles.id OR profiles.role = 'admin'
      WHERE profiles.id = auth.uid()
      AND sites.id = media_folders.site_id
    )
  );

CREATE POLICY "media_folders_insert_editor_or_admin"
  ON media_folders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN sites ON sites.created_by = profiles.id OR profiles.role = 'admin'
      WHERE profiles.id = auth.uid()
      AND sites.id = media_folders.site_id
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "media_folders_update_site_access"
  ON media_folders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN sites ON sites.created_by = profiles.id OR profiles.role = 'admin'
      WHERE profiles.id = auth.uid()
      AND sites.id = media_folders.site_id
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "media_folders_delete_admin"
  ON media_folders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 7. TEMPLATES TABLE
-- ========================================
-- Policies: SELECT all, admin INSERT/UPDATE/DELETE
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select_all_authenticated"
  ON templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "templates_insert_admin"
  ON templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "templates_update_admin"
  ON templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "templates_delete_admin"
  ON templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 8. CONTENT_FRAGMENTS TABLE
-- ========================================
-- Policies: Site access
ALTER TABLE content_fragments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_fragments_select_site_access"
  ON content_fragments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN sites ON sites.created_by = profiles.id OR profiles.role = 'admin'
      WHERE profiles.id = auth.uid()
      AND sites.id = content_fragments.site_id
    )
  );

CREATE POLICY "content_fragments_insert_editor_or_admin"
  ON content_fragments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN sites ON sites.created_by = profiles.id OR profiles.role = 'admin'
      WHERE profiles.id = auth.uid()
      AND sites.id = content_fragments.site_id
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "content_fragments_update_site_access"
  ON content_fragments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN sites ON sites.created_by = profiles.id OR profiles.role = 'admin'
      WHERE profiles.id = auth.uid()
      AND sites.id = content_fragments.site_id
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "content_fragments_delete_admin"
  ON content_fragments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 9. FRAGMENT_VERSIONS TABLE
-- ========================================
-- Policies: Inherit fragment access
ALTER TABLE fragment_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fragment_versions_select_if_fragment_accessible"
  ON fragment_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM content_fragments
      JOIN sites ON sites.id = content_fragments.site_id
      JOIN profiles ON profiles.id = auth.uid()
      WHERE content_fragments.id = fragment_versions.fragment_id
      AND (sites.created_by = profiles.id OR profiles.role = 'admin')
    )
  );

CREATE POLICY "fragment_versions_insert_if_fragment_accessible"
  ON fragment_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM content_fragments
      JOIN sites ON sites.id = content_fragments.site_id
      JOIN profiles ON profiles.id = auth.uid()
      WHERE content_fragments.id = fragment_versions.fragment_id
      AND (sites.created_by = profiles.id OR profiles.role = 'admin')
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- ========================================
-- 10. MENUS TABLE
-- ========================================
-- Policies: SELECT all, admin write
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menus_select_all_authenticated"
  ON menus FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "menus_insert_admin"
  ON menus FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "menus_update_admin"
  ON menus FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "menus_delete_admin"
  ON menus FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 11. ACTIVITY_LOG TABLE
-- ========================================
-- Policies: SELECT site access, INSERT server-only (service role)
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_select_site_access"
  ON activity_log FOR SELECT
  USING (
    activity_log.site_id IS NULL
    OR EXISTS (
      SELECT 1 FROM profiles
      JOIN sites ON sites.created_by = profiles.id OR profiles.role = 'admin'
      WHERE profiles.id = auth.uid()
      AND sites.id = activity_log.site_id
    )
  );

-- INSERT policy: Only service role can insert (no user-level INSERT policy)
-- This ensures activity logs are created by server-side code only

-- ========================================
-- 12. REVIEW_REQUESTS TABLE
-- ========================================
-- Policies: Author/admin access
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_requests_select_involved_or_admin"
  ON review_requests FOR SELECT
  USING (
    review_requests.requested_by = auth.uid()
    OR review_requests.assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "review_requests_insert_editor_or_admin"
  ON review_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "review_requests_update_involved_or_admin"
  ON review_requests FOR UPDATE
  USING (
    review_requests.requested_by = auth.uid()
    OR review_requests.assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 13. FORM_SUBMISSIONS TABLE
-- ========================================
-- Policies: Public INSERT, admin UPDATE/DELETE
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_submissions_select_admin"
  ON form_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "form_submissions_insert_public"
  ON form_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "form_submissions_update_admin"
  ON form_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "form_submissions_delete_admin"
  ON form_submissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 14. API_KEYS TABLE
-- ========================================
-- Policies: Admin only
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_select_admin"
  ON api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "api_keys_insert_admin"
  ON api_keys FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "api_keys_update_admin"
  ON api_keys FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "api_keys_delete_admin"
  ON api_keys FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 15. WEBHOOKS TABLE
-- ========================================
-- Policies: Admin only
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhooks_select_admin"
  ON webhooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "webhooks_insert_admin"
  ON webhooks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "webhooks_update_admin"
  ON webhooks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "webhooks_delete_admin"
  ON webhooks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 16. WEBHOOK_DELIVERIES TABLE
-- ========================================
-- Policies: Admin only
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_deliveries_select_admin"
  ON webhook_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- INSERT is done by server-side code (service role)

-- ========================================
-- 17. INVITATIONS TABLE
-- ========================================
-- Policies: Admin write, invitee read by token
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_select_admin_or_invitee"
  ON invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR invitations.email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "invitations_insert_admin"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "invitations_update_admin"
  ON invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "invitations_delete_admin"
  ON invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 18. NOTIFICATIONS TABLE
-- ========================================
-- Policies: User sees own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (notifications.user_id = auth.uid());

CREATE POLICY "notifications_insert_own"
  ON notifications FOR INSERT
  WITH CHECK (notifications.user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (notifications.user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (notifications.user_id = auth.uid());

-- ========================================
-- 19. COMPONENTS TABLE
-- ========================================
-- Policies: SELECT all, admin write
ALTER TABLE components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "components_select_all_authenticated"
  ON components FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "components_insert_admin"
  ON components FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "components_update_admin"
  ON components FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "components_delete_admin"
  ON components FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 20. NEWSLETTER_SUBSCRIBERS TABLE
-- ========================================
-- Policies: Public INSERT, admin SELECT/UPDATE/DELETE
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter_subscribers_select_admin"
  ON newsletter_subscribers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "newsletter_subscribers_insert_public"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "newsletter_subscribers_update_admin"
  ON newsletter_subscribers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "newsletter_subscribers_delete_admin"
  ON newsletter_subscribers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 21. ANALYTICS_EVENTS TABLE
-- ========================================
-- Policies: Public INSERT, admin SELECT
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_events_select_admin"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "analytics_events_insert_public"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- ========================================
-- 22. MEDIA_USAGE TABLE
-- ========================================
-- Policies: Authenticated access
ALTER TABLE media_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_usage_select_authenticated"
  ON media_usage FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "media_usage_insert_editor_or_admin"
  ON media_usage FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "media_usage_delete_editor_or_admin"
  ON media_usage FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );
