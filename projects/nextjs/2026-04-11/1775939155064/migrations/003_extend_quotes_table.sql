-- ============================================
-- B2B Postal Checkout Flow - Extend Quotes Table
-- ============================================
-- Step 14: Add extended fields for full pricing calculation breakdown

-- Add JSONB columns for calculation basis and fee breakdown
ALTER TABLE postal_v2.quotes 
  ADD COLUMN IF NOT EXISTS calculation_basis jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fee_breakdown jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '1 hour');

-- Add index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_quotes_expires_at ON postal_v2.quotes(expires_at);

-- Add composite index for common lookups
CREATE INDEX IF NOT EXISTS idx_quotes_shipment_selected ON postal_v2.quotes(shipment_id, is_selected);

-- ============================================
-- SCHEMA EXTENSION COMPLETE
-- ============================================
