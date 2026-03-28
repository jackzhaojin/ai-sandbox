-- Add new columns to form_submissions table
ALTER TABLE "form_submissions" ADD COLUMN "form_id" text NOT NULL DEFAULT 'legacy-form';
ALTER TABLE "form_submissions" ADD COLUMN "submitted_by_ip" text;
ALTER TABLE "form_submissions" ADD COLUMN "is_read" boolean DEFAULT false NOT NULL;
ALTER TABLE "form_submissions" ADD COLUMN "is_spam" boolean DEFAULT false NOT NULL;

-- Remove default after adding the column (for future inserts to require form_id)
ALTER TABLE "form_submissions" ALTER COLUMN "form_id" DROP DEFAULT;

-- Create indexes for new columns
CREATE INDEX "idx_form_submissions_form_id" ON "form_submissions" USING btree ("form_id");
CREATE INDEX "idx_form_submissions_is_read" ON "form_submissions" USING btree ("is_read");
CREATE INDEX "idx_form_submissions_is_spam" ON "form_submissions" USING btree ("is_spam");

-- Drop old ip_address column and rename submitted_by_ip (if needed)
-- Note: This migration keeps both for backward compatibility
-- Future cleanup can remove ip_address if no longer needed
