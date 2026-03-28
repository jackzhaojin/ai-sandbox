-- Migration: Add publish workflow fields and update status enum

-- Update page_status enum to use 'in_review' instead of 'review'
ALTER TYPE page_status RENAME TO page_status_old;
CREATE TYPE page_status AS ENUM ('draft', 'in_review', 'scheduled', 'published', 'archived');

-- Add new columns to pages table
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

-- Update status column to use new enum
ALTER TABLE pages ALTER COLUMN status TYPE page_status USING
  CASE
    WHEN status::text = 'review' THEN 'in_review'::page_status
    ELSE status::text::page_status
  END;

-- Drop old enum
DROP TYPE page_status_old;

-- Add reviewer_notes and reviewed_by to review_requests
ALTER TABLE review_requests
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);

-- Create index for locked pages
CREATE INDEX IF NOT EXISTS idx_pages_locked_by ON pages(locked_by);
CREATE INDEX IF NOT EXISTS idx_pages_locked_at ON pages(locked_at);
CREATE INDEX IF NOT EXISTS idx_pages_scheduled_publish ON pages(scheduled_publish_at) WHERE status = 'scheduled';

COMMENT ON COLUMN pages.published_by IS 'User who published the page';
COMMENT ON COLUMN pages.locked_by IS 'User who currently has the page locked for editing';
COMMENT ON COLUMN pages.locked_at IS 'When the page was locked';
COMMENT ON COLUMN review_requests.reviewer_notes IS 'Notes from the reviewer (visible to author)';
COMMENT ON COLUMN review_requests.reviewed_by IS 'User who reviewed the request';
