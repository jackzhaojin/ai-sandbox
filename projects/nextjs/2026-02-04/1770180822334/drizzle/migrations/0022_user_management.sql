-- Step 29: User Management and Invitations
-- Update user_role enum to support viewer, author, admin (replace editor with author)
ALTER TYPE "public"."user_role" RENAME TO "user_role_old";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('viewer', 'author', 'admin');--> statement-breakpoint

-- Update profiles table to use new enum
ALTER TABLE "profiles"
  ALTER COLUMN "role" TYPE "user_role"
  USING (
    CASE
      WHEN "role"::text = 'editor' THEN 'author'::user_role
      ELSE "role"::text::user_role
    END
  );--> statement-breakpoint

-- Update profiles role constraint
ALTER TABLE "profiles"
  ALTER COLUMN "role" SET DEFAULT 'author';--> statement-breakpoint

-- Drop old enum
DROP TYPE "user_role_old";--> statement-breakpoint

-- Create site_members table for per-site role assignments
CREATE TABLE "site_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "site_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" "user_role" NOT NULL,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_active_at" timestamp with time zone,
  CONSTRAINT "unique_site_user" UNIQUE("site_id", "user_id")
);--> statement-breakpoint

-- Add foreign keys for site_members
ALTER TABLE "site_members"
  ADD CONSTRAINT "site_members_site_id_sites_id_fk"
  FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id")
  ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "site_members"
  ADD CONSTRAINT "site_members_user_id_profiles_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id")
  ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Create indexes for site_members
CREATE INDEX "idx_site_members_site_id" ON "site_members" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_site_members_user_id" ON "site_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_site_members_role" ON "site_members" USING btree ("site_id", "role");--> statement-breakpoint

-- Update invitations table to add status field
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint

ALTER TABLE "invitations"
  ADD COLUMN "status" "invitation_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint

-- Fix invitations.site_id foreign key (currently incorrectly pointing to profiles)
ALTER TABLE "invitations"
  DROP CONSTRAINT IF EXISTS "invitations_site_id_profiles_id_fk";--> statement-breakpoint

ALTER TABLE "invitations"
  ADD CONSTRAINT "invitations_site_id_sites_id_fk"
  FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id")
  ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Create index for invitations status
CREATE INDEX "idx_invitations_status" ON "invitations" USING btree ("site_id", "status");--> statement-breakpoint

-- Enable RLS for site_members
ALTER TABLE site_members ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- RLS Policies for site_members
-- Users can view site members for sites they belong to
CREATE POLICY "site_members_select"
  ON site_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM site_members sm
      WHERE sm.site_id = site_members.site_id
      AND sm.user_id = auth.uid()
    )
  );--> statement-breakpoint

-- Only admins can add members
CREATE POLICY "site_members_insert"
  ON site_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM site_members sm
      WHERE sm.site_id = site_members.site_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'admin'
    )
  );--> statement-breakpoint

-- Only admins can update member roles (except their own)
CREATE POLICY "site_members_update"
  ON site_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM site_members sm
      WHERE sm.site_id = site_members.site_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'admin'
    )
    AND site_members.user_id != auth.uid()
  );--> statement-breakpoint

-- Only admins can remove members (except themselves if they're the last admin)
CREATE POLICY "site_members_delete"
  ON site_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM site_members sm
      WHERE sm.site_id = site_members.site_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'admin'
    )
    AND (
      site_members.user_id != auth.uid()
      OR (
        SELECT COUNT(*) FROM site_members sm2
        WHERE sm2.site_id = site_members.site_id
        AND sm2.role = 'admin'
      ) > 1
    )
  );--> statement-breakpoint

-- Update RLS policies for invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Users can view invitations for sites they're admins of
CREATE POLICY "invitations_select"
  ON invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM site_members sm
      WHERE sm.site_id = invitations.site_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'admin'
    )
    OR invitations.email = (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  );--> statement-breakpoint

-- Only admins can create invitations
CREATE POLICY "invitations_insert"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM site_members sm
      WHERE sm.site_id = invitations.site_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'admin'
    )
  );--> statement-breakpoint

-- Only admins can update invitations (resend, revoke)
CREATE POLICY "invitations_update"
  ON invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM site_members sm
      WHERE sm.site_id = invitations.site_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'admin'
    )
  );--> statement-breakpoint

-- Migrate existing site creators to site_members as admins
INSERT INTO site_members (site_id, user_id, role, joined_at)
SELECT id, created_by, 'admin'::user_role, created_at
FROM sites
ON CONFLICT (site_id, user_id) DO NOTHING;--> statement-breakpoint
