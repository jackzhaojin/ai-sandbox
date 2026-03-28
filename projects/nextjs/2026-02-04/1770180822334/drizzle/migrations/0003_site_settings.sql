-- Migration: Add site settings columns to sites table

-- Add new columns for site settings (Step 23)
ALTER TABLE sites ADD COLUMN IF NOT EXISTS favicon_media_id uuid;
--> statement-breakpoint
ALTER TABLE sites ADD COLUMN IF NOT EXISTS logo_media_id uuid;
--> statement-breakpoint
ALTER TABLE sites ADD COLUMN IF NOT EXISTS theme_config jsonb;
--> statement-breakpoint
ALTER TABLE sites ADD COLUMN IF NOT EXISTS custom_head_html text;
--> statement-breakpoint
ALTER TABLE sites ADD COLUMN IF NOT EXISTS custom_css text;
--> statement-breakpoint
ALTER TABLE sites ADD COLUMN IF NOT EXISTS analytics_config jsonb;
--> statement-breakpoint
ALTER TABLE sites ADD COLUMN IF NOT EXISTS social_links jsonb;
--> statement-breakpoint
ALTER TABLE sites ADD COLUMN IF NOT EXISTS error_pages jsonb;
--> statement-breakpoint
ALTER TABLE sites ADD COLUMN IF NOT EXISTS settings jsonb;
--> statement-breakpoint
ALTER TABLE sites ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
--> statement-breakpoint

-- Add indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_sites_deleted_at ON sites(deleted_at);
--> statement-breakpoint

-- Add comments for documentation
COMMENT ON COLUMN sites.favicon_media_id IS 'Media ID for site favicon (32x32)';
--> statement-breakpoint
COMMENT ON COLUMN sites.logo_media_id IS 'Media ID for site logo';
--> statement-breakpoint
COMMENT ON COLUMN sites.theme_config IS 'Theme configuration: { primary, secondary, accent, bodyFont, headingFont, borderRadius, darkMode }';
--> statement-breakpoint
COMMENT ON COLUMN sites.custom_head_html IS 'Custom HTML injected in <head> tag';
--> statement-breakpoint
COMMENT ON COLUMN sites.custom_css IS 'Custom CSS for the site';
--> statement-breakpoint
COMMENT ON COLUMN sites.analytics_config IS 'Analytics configuration: { ga4Id, gtmId, plausibleDomain, customScripts }';
--> statement-breakpoint
COMMENT ON COLUMN sites.social_links IS 'Social media links: { twitter, facebook, instagram, linkedin, youtube, github, tiktok, website }';
--> statement-breakpoint
COMMENT ON COLUMN sites.error_pages IS 'Error page config: { 404: { title, message, pageId }, 500: { title, message, pageId }, maintenanceMode: { enabled, title, message } }';
--> statement-breakpoint
COMMENT ON COLUMN sites.settings IS 'General settings: { defaultLanguage, timezone }';
--> statement-breakpoint
COMMENT ON COLUMN sites.deleted_at IS 'Soft delete timestamp';
