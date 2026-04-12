-- ============================================
-- B2B Postal Checkout Flow - Add Missing Columns
-- ============================================
-- Step 21: Add columns needed for payment integration

-- Add current_step to shipments table
ALTER TABLE postal_v2.shipments 
  ADD COLUMN IF NOT EXISTS current_step integer DEFAULT 1;

-- Add current_step validation check
ALTER TABLE postal_v2.shipments 
  DROP CONSTRAINT IF EXISTS check_current_step_range;

ALTER TABLE postal_v2.shipments 
  ADD CONSTRAINT check_current_step_range 
  CHECK (current_step >= 1 AND current_step <= 6);

-- ============================================
-- Update quotes table columns if they don't exist
-- ============================================

-- Add calculation_basis column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'postal_v2' 
    AND table_name = 'quotes' 
    AND column_name = 'calculation_basis'
  ) THEN
    ALTER TABLE postal_v2.quotes ADD COLUMN calculation_basis jsonb DEFAULT '{}';
  END IF;
END $$;

-- Add fee_breakdown column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'postal_v2' 
    AND table_name = 'quotes' 
    AND column_name = 'fee_breakdown'
  ) THEN
    ALTER TABLE postal_v2.quotes ADD COLUMN fee_breakdown jsonb DEFAULT '{}';
  END IF;
END $$;

-- Add expires_at column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'postal_v2' 
    AND table_name = 'quotes' 
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE postal_v2.quotes ADD COLUMN expires_at timestamptz DEFAULT (now() + interval '1 hour');
  END IF;
END $$;

-- Create indexes for quotes if not exist
CREATE INDEX IF NOT EXISTS idx_quotes_expires_at ON postal_v2.quotes(expires_at);
CREATE INDEX IF NOT EXISTS idx_quotes_shipment_selected ON postal_v2.quotes(shipment_id, is_selected);

-- ============================================
-- Create storage bucket for credit applications if not exists
-- ============================================

-- Note: Storage bucket creation requires Supabase dashboard or CLI
-- The application will attempt to create it programmatically if it doesn't exist

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
