-- ============================================
-- B2B Postal Checkout Flow - Seed Data
-- ============================================

-- ============================================
-- 1. MOCK CARRIERS (PEX, VC, EFL, FS)
-- ============================================

INSERT INTO carriers (
  code, name, display_name, description, website, support_phone, support_email,
  base_rate_multiplier, fuel_surcharge_multiplier, residential_delivery_fee, extended_area_surcharge,
  reliability_rating, speed_rating, value_rating, customer_service_rating,
  is_active, sort_order
) VALUES
(
  'pex', 'Parcel Express', 'PEX - Parcel Express',
  'Reliable ground and express shipping with extensive domestic coverage. Best for small to medium packages with competitive rates.',
  'https://www.parcelexpress.example', '1-800-PEX-SHIP', 'support@parcelexpress.example',
  1.0000, 1.0000, 4.50, 8.00,
  4.5, 4.0, 4.5, 4.0,
  true, 1
),
(
  'vc', 'Velocity Courier', 'VC - Velocity Courier',
  'Premium express delivery with same-day and next-day options. Ideal for time-sensitive shipments with guaranteed delivery windows.',
  'https://www.velocitycourier.example', '1-800-VC-FAST', 'support@velocitycourier.example',
  1.1500, 1.1000, 5.00, 10.00,
  4.8, 4.9, 3.5, 4.5,
  true, 2
),
(
  'efl', 'Eagle Freight Lines', 'EFL - Eagle Freight Lines',
  'Heavy freight and LTL specialists with nationwide coverage. Best for large shipments, pallets, and commercial deliveries.',
  'https://www.eaglefreight.example', '1-800-EGL-FLGT', 'support@eaglefreight.example',
  0.9000, 0.9500, 0.00, 15.00,
  4.2, 3.5, 4.8, 3.8,
  true, 3
),
(
  'fs', 'FastShip Global', 'FS - FastShip Global',
  'International shipping experts with customs clearance services. Specialized in cross-border commerce and global logistics.',
  'https://www.fastship.example', '1-800-FS-GLOBE', 'support@fastship.example',
  1.2000, 1.2500, 6.00, 12.00,
  4.0, 3.8, 3.5, 4.2,
  true, 4
);

-- ============================================
-- 2. SERVICE TYPES (~20 services across categories)
-- ============================================

-- Get carrier IDs for reference
DO $$
DECLARE
  pex_id UUID;
  vc_id UUID;
  efl_id UUID;
  fs_id UUID;
BEGIN
  SELECT id INTO pex_id FROM carriers WHERE code = 'pex';
  SELECT id INTO vc_id FROM carriers WHERE code = 'vc';
  SELECT id INTO efl_id FROM carriers WHERE code = 'efl';
  SELECT id INTO fs_id FROM carriers WHERE code = 'fs';

  -- PEX - Parcel Express Services (Ground focus)
  INSERT INTO service_types (
    carrier_id, code, name, display_name, description, category,
    is_trackable, is_insurable, is_signature_available, is_international,
    min_delivery_days, max_delivery_days,
    max_weight, max_length, max_width, max_height,
    base_rate, rate_per_kg, fuel_surcharge_percent,
    is_active, sort_order
  ) VALUES
  (
    pex_id, 'pex_ground', 'PEX Ground', 'PEX Ground', 
    'Economical ground shipping for non-urgent deliveries', 'ground',
    true, true, true, false,
    3, 7, 68.0, 274.0, 152.0, 152.0,
    8.50, 0.4500, 8.5,
    true, 1
  ),
  (
    pex_id, 'pex_ground_premium', 'PEX Ground Premium', 'PEX Ground Premium',
    'Faster ground service with delivery confirmation', 'ground',
    true, true, true, false,
    2, 5, 68.0, 274.0, 152.0, 152.0,
    12.00, 0.5500, 8.5,
    true, 2
  ),
  (
    pex_id, 'pex_2day', 'PEX 2-Day', 'PEX 2-Day Express',
    'Guaranteed 2 business day delivery', 'express',
    true, true, true, false,
    2, 2, 68.0, 274.0, 152.0, 152.0,
    18.50, 0.8500, 10.0,
    true, 3
  ),
  (
    pex_id, 'pex_overnight', 'PEX Overnight', 'PEX Overnight',
    'Next business day delivery by end of day', 'express',
    true, true, true, false,
    1, 1, 68.0, 274.0, 152.0, 152.0,
    28.00, 1.2500, 12.0,
    true, 4
  ),
  (
    pex_id, 'pex_priority', 'PEX Priority', 'PEX Priority Overnight',
    'Next business day delivery by 10:30 AM', 'express',
    true, true, true, false,
    1, 1, 45.0, 152.0, 122.0, 91.0,
    38.00, 1.6500, 12.0,
    true, 5
  ),
  (
    pex_id, 'pex_first', 'PEX First Overnight', 'PEX First Overnight',
    'Next business day delivery by 8:30 AM', 'express',
    true, true, true, false,
    1, 1, 22.0, 91.0, 61.0, 61.0,
    55.00, 2.5000, 15.0,
    true, 6
  );

  -- VC - Velocity Courier Services (Express/Same-day focus)
  INSERT INTO service_types (
    carrier_id, code, name, display_name, description, category,
    is_trackable, is_insurable, is_signature_available, is_international,
    min_delivery_days, max_delivery_days,
    max_weight, max_length, max_width, max_height,
    base_rate, rate_per_kg, fuel_surcharge_percent,
    is_active, sort_order
  ) VALUES
  (
    vc_id, 'vc_same_day', 'VC Same Day', 'VC Same Day',
    'Same day delivery within metro areas', 'express',
    true, true, true, false,
    0, 0, 22.0, 91.0, 61.0, 61.0,
    45.00, 2.0000, 0.0,
    true, 1
  ),
  (
    vc_id, 'vc_rush', 'VC Rush', 'VC Rush Delivery',
    '4-hour delivery for urgent shipments', 'express',
    true, true, true, false,
    0, 0, 11.0, 61.0, 46.0, 46.0,
    65.00, 3.5000, 0.0,
    true, 2
  ),
  (
    vc_id, 'vc_express', 'VC Express', 'VC Express',
    'Next business day by 3:00 PM', 'express',
    true, true, true, false,
    1, 1, 68.0, 274.0, 152.0, 152.0,
    32.00, 1.4500, 10.0,
    true, 3
  ),
  (
    vc_id, 'vc_early', 'VC Early Express', 'VC Early Express',
    'Next business day by 9:00 AM', 'express',
    true, true, true, false,
    1, 1, 45.0, 152.0, 122.0, 91.0,
    48.00, 2.1000, 12.0,
    true, 4
  ),
  (
    vc_id, 'vc_weekend', 'VC Weekend', 'VC Weekend Delivery',
    'Saturday and Sunday delivery available', 'express',
    true, true, true, false,
    1, 2, 68.0, 274.0, 152.0, 152.0,
    42.00, 1.8500, 12.0,
    true, 5
  );

  -- EFL - Eagle Freight Lines Services (Freight focus)
  INSERT INTO service_types (
    carrier_id, code, name, display_name, description, category,
    is_trackable, is_insurable, is_signature_available, is_international,
    min_delivery_days, max_delivery_days,
    max_weight, max_length, max_width, max_height,
    base_rate, rate_per_kg, fuel_surcharge_percent,
    is_active, sort_order
  ) VALUES
  (
    efl_id, 'efl_ltl', 'EFL LTL', 'EFL LTL Freight',
    'Less-than-truckload freight shipping', 'freight',
    true, true, true, false,
    2, 6, 2268.0, 610.0, 244.0, 213.0,
    125.00, 0.3500, 18.0,
    true, 1
  ),
  (
    efl_id, 'efl_ltl_expedited', 'EFL LTL Expedited', 'EFL LTL Expedited',
    'Faster LTL with guaranteed delivery', 'freight',
    true, true, true, false,
    1, 3, 2268.0, 610.0, 244.0, 213.0,
    185.00, 0.5200, 20.0,
    true, 2
  ),
  (
    efl_id, 'efl_ftl', 'EFL FTL', 'EFL Full Truckload',
    'Dedicated full truckload shipping', 'freight',
    true, true, true, false,
    1, 5, 24000.0, 1626.0, 259.0, 284.0,
    850.00, 0.0350, 22.0,
    true, 3
  ),
  (
    efl_id, 'efl_volume', 'EFL Volume', 'EFL Volume LTL',
    'Volume pricing for larger LTL shipments', 'freight',
    true, true, true, false,
    2, 5, 1588.0, 488.0, 213.0, 183.0,
    95.00, 0.2800, 18.0,
    true, 4
  ),
  (
    efl_id, 'efl_white_glove', 'EFL White Glove', 'EFL White Glove',
    'Inside delivery with setup and debris removal', 'freight',
    true, true, true, false,
    3, 7, 680.0, 305.0, 183.0, 152.0,
    225.00, 0.6500, 18.0,
    true, 5
  );

  -- FS - FastShip Global Services (International focus)
  INSERT INTO service_types (
    carrier_id, code, name, display_name, description, category,
    is_trackable, is_insurable, is_signature_available, is_international,
    min_delivery_days, max_delivery_days,
    max_weight, max_length, max_width, max_height,
    base_rate, rate_per_kg, fuel_surcharge_percent,
    is_active, sort_order
  ) VALUES
  (
    fs_id, 'fs_intl_economy', 'FS Intl Economy', 'FS International Economy',
    'Cost-effective international shipping', 'international',
    true, true, true, true,
    5, 10, 68.0, 150.0, 120.0, 90.0,
    35.00, 1.2000, 15.0,
    true, 1
  ),
  (
    fs_id, 'fs_intl_standard', 'FS Intl Standard', 'FS International Standard',
    'Reliable international delivery with tracking', 'international',
    true, true, true, true,
    3, 7, 68.0, 150.0, 120.0, 90.0,
    55.00, 1.8500, 15.0,
    true, 2
  ),
  (
    fs_id, 'fs_intl_priority', 'FS Intl Priority', 'FS International Priority',
    'Fast international delivery to major markets', 'international',
    true, true, true, true,
    1, 3, 68.0, 150.0, 120.0, 90.0,
    85.00, 2.7500, 18.0,
    true, 3
  ),
  (
    fs_id, 'fs_intl_express', 'FS Intl Express', 'FS International Express',
    'Express worldwide delivery with customs clearance', 'international',
    true, true, true, true,
    1, 2, 45.0, 120.0, 90.0, 75.0,
    120.00, 3.8500, 20.0,
    true, 4
  ),
  (
    fs_id, 'fs_cross_border', 'FS Cross Border', 'FS Cross Border Ground',
    'Ground shipping to Canada and Mexico', 'international',
    true, true, true, true,
    3, 7, 68.0, 274.0, 152.0, 152.0,
    28.00, 0.9500, 12.0,
    true, 5
  );

END $$;

-- ============================================
-- 3. SAMPLE ORGANIZATION
-- ============================================

INSERT INTO organizations (
  id, name, slug, tax_id, billing_email, payment_terms, credit_limit, status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Acme Corporation',
  'acme-corporation',
  '12-3456789',
  'billing@acme.example',
  'net30',
  50000.00,
  'active'
);

-- ============================================
-- 4. SAMPLE ADDRESSES
-- ============================================

INSERT INTO addresses (
  id, organization_id, label, recipient_name, recipient_phone,
  line1, line2, city, state, postal_code, country, address_type,
  is_verified, is_default_shipping, is_default_billing
) VALUES
(
  '660e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Main Office',
  'Acme Corporation',
  '555-0100',
  '123 Business Plaza',
  'Suite 500',
  'New York',
  'NY',
  '10001',
  'US',
  'commercial',
  true,
  true,
  true
),
(
  '660e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  'Warehouse',
  'Acme Distribution Center',
  '555-0101',
  '456 Industrial Blvd',
  'Building C',
  'Jersey City',
  'NJ',
  '07305',
  'US',
  'commercial',
  true,
  false,
  false
),
(
  '660e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  'West Coast Office',
  'Acme West',
  '555-0102',
  '789 Tech Drive',
  NULL,
  'San Francisco',
  'CA',
  '94105',
  'US',
  'commercial',
  true,
  false,
  false
);

-- Update organization billing address
UPDATE organizations 
SET billing_address_id = '660e8400-e29b-41d4-a716-446655440001'
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- ============================================
-- 5. SAMPLE SHIPMENT (Complete test shipment)
-- ============================================

DO $$
DECLARE
  sample_shipment_id UUID := '770e8400-e29b-41d4-a716-446655440001';
  pex_id UUID;
  pex_ground_id UUID;
BEGIN
  SELECT id INTO pex_id FROM carriers WHERE code = 'pex';
  SELECT id INTO pex_ground_id FROM service_types WHERE code = 'pex_ground';

  -- Main shipment
  INSERT INTO shipments (
    id, organization_id, user_id, shipment_number, reference_number, po_number,
    sender_address_id, sender_contact_name, sender_contact_phone, sender_contact_email,
    recipient_address_id, recipient_contact_name, recipient_contact_phone, recipient_contact_email,
    package_type, weight, length, width, height, declared_value, contents_description,
    carrier_id, service_type_id, estimated_delivery,
    base_rate, fuel_surcharge, insurance_cost, handling_fees, taxes, total_cost, currency,
    status, tracking_number, special_instructions, internal_notes
  ) VALUES (
    sample_shipment_id,
    '550e8400-e29b-41d4-a716-446655440000',
    '770e8400-e29b-41d4-a716-446655440000', -- Will reference a user later
    'SHP-2026-000001',
    'REF-2026-0425',
    'PO-12345',
    '660e8400-e29b-41d4-a716-446655440001',
    'John Smith',
    '555-0100',
    'john.smith@acme.example',
    '660e8400-e29b-41d4-a716-446655440003',
    'Sarah Johnson',
    '555-0200',
    'sarah.johnson@acmewest.example',
    'box',
    5.5,
    30.0,
    25.0,
    20.0,
    250.00,
    'Product samples and marketing materials',
    pex_id,
    pex_ground_id,
    NOW() + INTERVAL '5 days',
    28.50,
    2.43,
    2.50,
    0.00,
    2.48,
    35.91,
    'USD',
    'draft',
    NULL,
    'Please handle with care - contains fragile samples',
    'Rush order for Q2 presentation'
  );

  -- Special handling
  INSERT INTO shipment_special_handling (shipment_id, handling_type, is_applied, fee, instructions)
  VALUES 
    (sample_shipment_id, 'fragile', true, 0, 'Handle with care'),
    (sample_shipment_id, 'signature_required', true, 3.50, 'Adult signature required');

  -- Delivery preferences
  INSERT INTO shipment_delivery_preferences (
    shipment_id, delivery_date, delivery_time_start, delivery_time_end,
    saturday_delivery, signature_required, delivery_instructions
  ) VALUES (
    sample_shipment_id,
    CURRENT_DATE + 5,
    '09:00:00',
    '17:00:00',
    false,
    true,
    'Deliver to receiving dock. Call 30 minutes before arrival.'
  );

  -- Hazmat details (negative - not hazmat)
  INSERT INTO hazmat_details (shipment_id, is_hazmat)
  VALUES (sample_shipment_id, false);

END $$;

-- ============================================
-- 6. SAMPLE PAYMENT METHODS
-- ============================================

INSERT INTO payment_info (
  id, organization_id, payment_type, display_name, is_default, is_verified, status
) VALUES
(
  '880e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'purchase_order',
  'Purchase Order',
  true,
  true,
  'active'
),
(
  '880e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  'net_terms',
  'Net 30 Terms',
  false,
  true,
  'active'
),
(
  '880e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  'corporate_account',
  'Corporate Account',
  false,
  true,
  'active'
);

-- Purchase Order details
INSERT INTO payment_purchase_orders (
  payment_info_id, po_number, po_expiry_date, authorized_amount, remaining_amount,
  department, cost_center, gl_account, approver_name, approver_email
) VALUES (
  '880e8400-e29b-41d4-a716-446655440001',
  'PO-2026-001',
  '2026-12-31',
  25000.00,
  18500.00,
  'Operations',
  'CC-001',
  'GL-5000',
  'Jane Doe',
  'jane.doe@acme.example'
);

-- Net Terms details
INSERT INTO payment_net_terms (
  payment_info_id, terms_days, credit_limit, current_balance, available_credit,
  credit_approved_by, credit_approved_date, payment_due_date,
  early_payment_discount_percent, early_payment_discount_days, late_fee_percent
) VALUES (
  '880e8400-e29b-41d4-a716-446655440002',
  30,
  50000.00,
  12500.00,
  37500.00,
  'CFO Office',
  '2026-01-15',
  '2026-05-15',
  2.0,
  10,
  1.5
);

-- Corporate Account details
INSERT INTO payment_corporate_accounts (
  payment_info_id, account_number, department_code, cost_center, project_code,
  monthly_limit, current_month_spend
) VALUES (
  '880e8400-e29b-41d4-a716-446655440003',
  'ACC-123456789',
  'DEPT-OPS',
  'CC-001',
  'PROJ-2026-Q2',
  10000.00,
  3250.00
);

-- ============================================
-- 7. SAMPLE PICKUP DETAILS
-- ============================================

DO $$
DECLARE
  pickup_uuid UUID := '990e8400-e29b-41d4-a716-446655440001';
  shipment_uuid UUID := '770e8400-e29b-41d4-a716-446655440001';
  pex_id UUID;
BEGIN
  SELECT id INTO pex_id FROM carriers WHERE code = 'pex';

  INSERT INTO pickup_details (
    id, shipment_id, pickup_number, carrier_id, pickup_address_id,
    pickup_date, ready_time, close_time, status, special_instructions
  ) VALUES (
    pickup_uuid,
    shipment_uuid,
    'PUP-2026-000001',
    pex_id,
    '660e8400-e29b-41d4-a716-446655440001',
    CURRENT_DATE + 1,
    '09:00:00',
    '17:00:00',
    'pending',
    'Ring bell for shipping department'
  );

  -- Pickup contacts
  INSERT INTO pickup_contacts (pickup_id, contact_name, contact_phone, contact_email, is_primary)
  VALUES 
    (pickup_uuid, 'Mike Wilson', '555-0103', 'mike.wilson@acme.example', true),
    (pickup_uuid, 'Shipping Desk', '555-0104', 'shipping@acme.example', false);

  -- Access requirements
  INSERT INTO pickup_access_requirements (pickup_id, access_type, instructions, security_code)
  VALUES 
    (pickup_uuid, 'loading_dock', 'Use south side loading dock', '1234'),
    (pickup_uuid, 'security_gate', 'Check in with security first', NULL);

  -- Equipment needs
  INSERT INTO pickup_equipment_needs (pickup_id, equipment_type, quantity, is_required, notes)
  VALUES 
    (pickup_uuid, 'hand_truck', 2, true, 'For boxes up to 50 lbs'),
    (pickup_uuid, 'liftgate', 1, false, 'May be needed for heavy pallets');

  -- Authorized personnel
  INSERT INTO pickup_authorized_personnel (pickup_id, person_name, person_title, id_type, id_number, is_primary_contact)
  VALUES 
    (pickup_uuid, 'Mike Wilson', 'Shipping Manager', 'Employee ID', 'EMP-1234', true);

  -- Notifications
  INSERT INTO pickup_notifications (pickup_id, notification_type, recipient, recipient_name, notify_on_confirm, notify_on_pickup, notify_on_exception)
  VALUES 
    (pickup_uuid, 'email', 'mike.wilson@acme.example', 'Mike Wilson', true, true, true),
    (pickup_uuid, 'email', 'shipping@acme.example', 'Shipping Department', true, true, false);

END $$;

-- ============================================
-- 8. SAMPLE SHIPMENT EVENTS
-- ============================================

INSERT INTO shipment_events (
  shipment_id, event_code, event_name, event_description,
  location_city, location_state, location_country,
  occurred_at, carrier_status_code, carrier_status_description,
  is_internal
) VALUES
(
  '770e8400-e29b-41d4-a716-446655440001',
  'SHIPMENT_CREATED',
  'Shipment Created',
  'Shipment record created in system',
  'New York',
  'NY',
  'US',
  NOW() - INTERVAL '2 hours',
  NULL,
  NULL,
  true
),
(
  '770e8400-e29b-41d4-a716-446655440001',
  'PICKUP_SCHEDULED',
  'Pickup Scheduled',
  'Pickup scheduled for next business day',
  'New York',
  'NY',
  'US',
  NOW() - INTERVAL '1 hour',
  NULL,
  NULL,
  true
);

-- ============================================
-- 9. SAMPLE QUOTES
-- ============================================

DO $$
DECLARE
  org_id UUID := '550e8400-e29b-41d4-a716-446655440000';
  shipment_id UUID := '770e8400-e29b-41d4-a716-446655440001';
  pex_id UUID;
  vc_id UUID;
  efl_id UUID;
  pex_ground UUID;
  pex_2day UUID;
  vc_express UUID;
  efl_ltl UUID;
BEGIN
  SELECT id INTO pex_id FROM carriers WHERE code = 'pex';
  SELECT id INTO vc_id FROM carriers WHERE code = 'vc';
  SELECT id INTO efl_id FROM carriers WHERE code = 'efl';
  SELECT id INTO pex_ground FROM service_types WHERE code = 'pex_ground';
  SELECT id INTO pex_2day FROM service_types WHERE code = 'pex_2day';
  SELECT id INTO vc_express FROM service_types WHERE code = 'vc_express';
  SELECT id INTO efl_ltl FROM service_types WHERE code = 'efl_ltl';

  INSERT INTO quotes (
    shipment_id, organization_id, carrier_id, service_type_id,
    weight, length, width, height,
    base_rate, fuel_surcharge, total_cost, currency,
    estimated_delivery, is_selected, expires_at
  ) VALUES
  (shipment_id, org_id, pex_id, pex_ground, 5.5, 30.0, 25.0, 20.0, 28.50, 2.43, 35.91, 'USD', NOW() + INTERVAL '5 days', true, NOW() + INTERVAL '7 days'),
  (shipment_id, org_id, pex_id, pex_2day, 5.5, 30.0, 25.0, 20.0, 45.00, 4.50, 54.50, 'USD', NOW() + INTERVAL '2 days', false, NOW() + INTERVAL '7 days'),
  (shipment_id, org_id, vc_id, vc_express, 5.5, 30.0, 25.0, 20.0, 52.00, 5.20, 62.70, 'USD', NOW() + INTERVAL '1 day', false, NOW() + INTERVAL '7 days'),
  (shipment_id, org_id, efl_id, efl_ltl, 5.5, 30.0, 25.0, 20.0, 125.00, 22.50, 147.50, 'USD', NOW() + INTERVAL '4 days', false, NOW() + INTERVAL '7 days');

END $$;

-- ============================================
-- 10. SAMPLE ACTIVITY LOG
-- ============================================

INSERT INTO activity_log (
  organization_id, action, entity_type, entity_id, metadata
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440000',
  'organization.created',
  'organization',
  '550e8400-e29b-41d4-a716-446655440000',
  '{"source": "seed_data", "plan": "enterprise"}'::jsonb
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'address.created',
  'address',
  '660e8400-e29b-41d4-a716-446655440001',
  '{"label": "Main Office", "city": "New York"}'::jsonb
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'shipment.created',
  'shipment',
  '770e8400-e29b-41d4-a716-446655440001',
  '{"shipment_number": "SHP-2026-000001", "status": "draft"}'::jsonb
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'pickup.scheduled',
  'pickup',
  '990e8400-e29b-41d4-a716-446655440001',
  '{"pickup_number": "PUP-2026-000001", "date": "' || (CURRENT_DATE + 1)::text || '"}'::jsonb
);

-- ============================================
-- SEED DATA COMPLETE
-- ============================================
