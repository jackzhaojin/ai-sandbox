-- ============================================
-- B2B Postal Checkout Flow - Add Shipment Confirmation Fields
-- Adds confirmation_number, submitted_at, and confirmed_at to shipments
-- Adds 'confirmed' status to shipment_status enum
-- ============================================

-- Add 'confirmed' status to the shipment_status enum
ALTER TYPE shipment_status ADD VALUE IF NOT EXISTS 'confirmed';

-- Add confirmation fields to shipments table
ALTER TABLE shipments 
  ADD COLUMN IF NOT EXISTS confirmation_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Create index for confirmation number lookups
CREATE INDEX IF NOT EXISTS idx_shipments_confirmation_number 
  ON shipments(confirmation_number) 
  WHERE confirmation_number IS NOT NULL;

-- Create index for submitted_at for querying recent submissions
CREATE INDEX IF NOT EXISTS idx_shipments_submitted_at 
  ON shipments(submitted_at) 
  WHERE submitted_at IS NOT NULL;

-- Update generate_shipment_number function to also set confirmation_number on status change to confirmed
CREATE OR REPLACE FUNCTION generate_shipment_number()
RETURNS TRIGGER AS $$
DECLARE
  year TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  -- Generate shipment_number if not set
  IF NEW.shipment_number IS NULL THEN
    year := TO_CHAR(NOW(), 'YYYY');
    
    -- Get the next sequence number for this year
    SELECT COUNT(*) + 1 INTO sequence_num
    FROM shipments
    WHERE shipment_number LIKE 'SHP-' || year || '-%';
    
    -- Generate the shipment number
    new_number := 'SHP-' || year || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    NEW.shipment_number := new_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
