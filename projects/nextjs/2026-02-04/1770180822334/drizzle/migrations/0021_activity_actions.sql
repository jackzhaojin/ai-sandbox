-- Migration: Add new activity actions for publish workflow

-- Update activity_action enum
ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'restored';
ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'submitted_for_review';
ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'review_rejected';
ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'scheduled';
ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'schedule_cancelled';
ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'auto_published';
