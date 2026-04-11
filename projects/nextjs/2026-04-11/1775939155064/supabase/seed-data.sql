-- ============================================
-- B2B Postal Checkout Flow - Seed Data
-- ============================================
-- Contract: contract-1775940940859
-- Applied via: supabase/seed-and-verify.js

-- ============================================
-- 1. SEED CARRIERS (3 carriers)
-- rate_multiplier must be < 1.0 (decimal(4,4) constraint)
-- ============================================
INSERT INTO postal_v2.carriers (code, name, display_name, rating, rate_multiplier, is_active) VALUES
  ('pex', 'Parcel Express', 'Parcel Express', 4.5, 0.8500, true),
  ('vc', 'Velocity Couriers', 'Velocity Couriers', 4.3, 0.9000, true),
  ('efl', 'Express Freight Lines', 'Express Freight Lines', 4.7, 0.9500, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. SEED SERVICE TYPES (5 per carrier = 15 total)
-- These serve as the "rates" table from the spec
-- ============================================
DO $$
DECLARE
  pex_id uuid;
  vc_id uuid;
  efl_id uuid;
BEGIN
  SELECT id INTO pex_id FROM postal_v2.carriers WHERE code = 'pex';
  SELECT id INTO vc_id FROM postal_v2.carriers WHERE code = 'vc';
  SELECT id INTO efl_id FROM postal_v2.carriers WHERE code = 'efl';

  -- Parcel Express services (5)
  INSERT INTO postal_v2.service_types (carrier_id, code, name, category, base_rate, transit_days_min, transit_days_max, is_active) VALUES
    (pex_id, 'pex-ground', 'Ground Standard', 'ground', 12.99, 3, 5, true),
    (pex_id, 'pex-air', 'Air Express', 'air', 24.99, 1, 2, true),
    (pex_id, 'pex-overnight', 'Overnight Priority', 'express', 45.99, 1, 1, true),
    (pex_id, 'pex-freight', 'LTL Freight', 'freight', 89.99, 2, 4, true),
    (pex_id, 'pex-intl', 'International Standard', 'international', 34.99, 5, 10, true);

  -- Velocity Couriers services (5)
  INSERT INTO postal_v2.service_types (carrier_id, code, name, category, base_rate, transit_days_min, transit_days_max, is_active) VALUES
    (vc_id, 'vc-ground', 'Economy Ground', 'ground', 10.99, 4, 6, true),
    (vc_id, 'vc-expedited', 'Expedited', 'air', 29.99, 2, 3, true),
    (vc_id, 'vc-same-day', 'Same Day', 'express', 89.99, 1, 1, true),
    (vc_id, 'vc-freight', 'Volume Freight', 'freight', 79.99, 3, 5, true),
    (vc_id, 'vc-intl', 'Global Priority', 'international', 44.99, 3, 7, true);

  -- Express Freight Lines services (5)
  INSERT INTO postal_v2.service_types (carrier_id, code, name, category, base_rate, transit_days_min, transit_days_max, is_active) VALUES
    (efl_id, 'efl-ground', 'Direct Ground', 'ground', 14.99, 2, 4, true),
    (efl_id, 'efl-premium', 'Premium Air', 'air', 32.99, 1, 2, true),
    (efl_id, 'efl-critical', 'Critical Same Day', 'express', 125.00, 1, 1, true),
    (efl_id, 'efl-freight', 'Full Truckload', 'freight', 299.99, 1, 3, true),
    (efl_id, 'efl-intl', 'Worldwide Express', 'international', 54.99, 2, 5, true);
END $$;

-- ============================================
-- 3. SEED PICKUP SLOTS (3 slots)
-- ============================================
INSERT INTO postal_v2.pickup_slots (slot_date, time_window, is_available, capacity, booked_count, fee) VALUES
  (CURRENT_DATE + INTERVAL '1 day', '09:00-12:00', true, 10, 0, 0),
  (CURRENT_DATE + INTERVAL '1 day', '13:00-17:00', true, 10, 0, 0),
  (CURRENT_DATE + INTERVAL '2 days', '09:00-17:00', true, 20, 0, 0);

-- ============================================
-- 4. SEED SAMPLE ORGANIZATION
-- ============================================
INSERT INTO postal_v2.organizations (id, name, slug, tax_id, billing_email, payment_terms, credit_limit, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Acme Corp', 'acme-corp', '12-3456789', 'billing@acme.example.com', 'net30', 50000.00, 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. SEED SAMPLE ADDRESSES (shipment_addresses)
-- ============================================
INSERT INTO postal_v2.addresses (id, organization_id, label, recipient_name, recipient_phone, line1, city, state, postal_code, country, address_type, is_default_shipping) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Main Warehouse', 'Acme Shipping Dept', '555-0101', '123 Industrial Blvd', 'Austin', 'TX', '78701', 'US', 'commercial', true),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Branch Office', 'Acme Receiving', '555-0102', '456 Commerce St', 'Dallas', 'TX', '75201', 'US', 'commercial', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. SEED SAMPLE USER
-- Requires an existing auth.users record
-- ============================================
INSERT INTO postal_v2.users (id, email, first_name, last_name, phone, organization_id, role, is_active)
SELECT id, email, 'John', 'Doe', '555-0000', '550e8400-e29b-41d4-a716-446655440000', 'user', true
FROM auth.users
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 7. SEED SAMPLE SHIPMENT (1 sample)
-- ============================================
DO $$
DECLARE
  org_id uuid := '550e8400-e29b-41d4-a716-446655440000'::uuid;
  sender_addr_id uuid := '660e8400-e29b-41d4-a716-446655440001'::uuid;
  recipient_addr_id uuid := '660e8400-e29b-41d4-a716-446655440002'::uuid;
  pex_id uuid;
  svc_id uuid;
  user_id uuid;
BEGIN
  SELECT id INTO pex_id FROM postal_v2.carriers WHERE code = 'pex';
  SELECT id INTO svc_id FROM postal_v2.service_types WHERE code = 'pex-ground';
  SELECT id INTO user_id FROM postal_v2.users LIMIT 1;

  IF pex_id IS NOT NULL AND svc_id IS NOT NULL AND user_id IS NOT NULL THEN
    INSERT INTO postal_v2.shipments (
      id, organization_id, user_id,
      sender_address_id, sender_contact_name, sender_contact_phone, sender_contact_email,
      recipient_address_id, recipient_contact_name, recipient_contact_phone, recipient_contact_email,
      package_type, weight, length, width, height, declared_value, contents_description,
      carrier_id, service_type_id, estimated_delivery,
      base_rate, fuel_surcharge, insurance_cost, total_cost, currency, status
    ) VALUES (
      '770e8400-e29b-41d4-a716-446655440000'::uuid,
      org_id, user_id,
      sender_addr_id, 'John Shipper', '555-0101', 'shipping@acme.example.com',
      recipient_addr_id, 'Jane Receiver', '555-0102', 'receiving@acme.example.com',
      'box', 5.5, 12.0, 10.0, 8.0, 250.00, 'Sample electronics shipment',
      pex_id, svc_id, CURRENT_DATE + INTERVAL '3 days',
      12.99, 2.50, 0, 15.49, 'USD', 'draft'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- SEED DATA COMPLETE
-- ============================================
-- Verification query:
-- SELECT 
--   (SELECT COUNT(*) FROM postal_v2.carriers) as carriers,
--   (SELECT COUNT(*) FROM postal_v2.service_types) as rates,
--   (SELECT COUNT(*) FROM postal_v2.pickup_slots) as pickup_slots,
--   (SELECT COUNT(*) FROM postal_v2.shipments) as shipments;
