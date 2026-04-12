-- ============================================
-- B2B Postal Checkout Flow - Add Submission Fields
-- ============================================
-- Step 33: Add fields for shipment submission endpoint

-- ============================================
-- 1. Add 'confirmed' status to shipment_status enum
-- ============================================
-- Note: PostgreSQL doesn't allow modifying enum values directly in a transaction-safe way
-- We'll add a check constraint approach or use the existing 'pending_payment' as an intermediate

-- ============================================
-- 2. Add confirmation_number column to shipments
-- ============================================
ALTER TABLE postal_v2.shipments 
  ADD COLUMN IF NOT EXISTS confirmation_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- ============================================
-- 3. Add index for confirmation number lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_shipments_confirmation_number 
  ON postal_v2.shipments(confirmation_number);

-- ============================================
-- 4. Add expires_at to payment_purchase_orders for PO expiry validation
-- ============================================
ALTER TABLE postal_v2.payment_purchase_orders 
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- ============================================
-- 5. Add tracking_url_template to carriers
-- ============================================
ALTER TABLE postal_v2.carriers 
  ADD COLUMN IF NOT EXISTS tracking_url_template text DEFAULT 'https://track.carrier.com/?tracking={tracking_number}';

-- ============================================
-- 6. Create function to generate confirmation number
-- ============================================
CREATE OR REPLACE FUNCTION postal_v2.generate_confirmation_number()
RETURNS text AS $$
DECLARE
  year_part text;
  random_part text;
  confirmation_number text;
  exists_check boolean;
BEGIN
  year_part := to_char(now(), 'YYYY');
  
  -- Generate unique confirmation number
  LOOP
    -- Generate 6-digit random number with zero-padding
    random_part := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    confirmation_number := 'SHP-' || year_part || '-' || random_part;
    
    -- Check if this number already exists
    SELECT EXISTS(
      SELECT 1 FROM postal_v2.shipments 
      WHERE confirmation_number = confirmation_number
    ) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN confirmation_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
