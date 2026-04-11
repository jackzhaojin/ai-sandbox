-- ============================================
-- B2B Postal Checkout Flow - Initial Schema
-- Schema: postal_v2
-- ============================================

-- Drop and recreate schema for clean setup
DROP SCHEMA IF EXISTS postal_v2 CASCADE;
CREATE SCHEMA postal_v2;

-- Set search path for this migration
SET search_path TO postal_v2;

-- ============================================
-- 1. ENUMS & TYPES
-- ============================================

-- User and organization enums
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE organization_status AS ENUM ('active', 'suspended', 'inactive');
CREATE TYPE payment_term AS ENUM ('immediate', 'net15', 'net30', 'net60');

-- Address enums
CREATE TYPE address_type AS ENUM ('residential', 'commercial');

-- Package and shipment enums
CREATE TYPE package_type AS ENUM ('box', 'envelope', 'tube', 'pallet');
CREATE TYPE shipment_status AS ENUM (
  'draft', 'pending_payment', 'paid', 'label_generated', 
  'picked_up', 'in_transit', 'delivered', 'cancelled'
);

-- Carrier and service enums
CREATE TYPE carrier_code AS ENUM ('pex', 'vc', 'efl', 'fs');
CREATE TYPE service_category AS ENUM ('ground', 'air', 'freight', 'express', 'international');

-- Payment enums
CREATE TYPE payment_method_type AS ENUM ('card', 'ach', 'wire', 'billing_account', 'purchase_order', 'net_terms', 'corporate_account', 'third_party');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled');

-- Special handling enums
CREATE TYPE handling_type AS ENUM ('fragile', 'hazardous', 'temperature_controlled', 'signature_required', 'adult_signature', 'hold_for_pickup', 'appointment_delivery');
CREATE TYPE hazmat_class AS ENUM ('class_1', 'class_2', 'class_3', 'class_4', 'class_5', 'class_6', 'class_7', 'class_8', 'class_9');

-- Pickup enums
CREATE TYPE pickup_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE access_type AS ENUM ('loading_dock', 'front_door', 'side_door', 'rear_door', 'security_gate', 'call_on_arrival');
CREATE TYPE equipment_type AS ENUM ('pallet_jack', 'forklift', 'hand_truck', 'liftgate', 'dock_leveler');

-- ============================================
-- 2. ORGANIZATIONS
-- ============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tax_id TEXT,
  billing_email TEXT NOT NULL,
  billing_address_id UUID,
  payment_terms payment_term DEFAULT 'immediate',
  credit_limit DECIMAL(12,2),
  status organization_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. USERS
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role user_role DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ADDRESSES
-- ============================================

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  address_type address_type DEFAULT 'commercial',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_service TEXT,
  verification_raw_response JSONB,
  is_default_shipping BOOLEAN DEFAULT FALSE,
  is_default_billing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. CARRIERS
-- ============================================

CREATE TABLE carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code carrier_code NOT NULL UNIQUE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  support_phone TEXT,
  support_email TEXT,
  -- Pricing multipliers
  base_rate_multiplier DECIMAL(5,4) DEFAULT 1.0000,
  fuel_surcharge_multiplier DECIMAL(5,4) DEFAULT 1.0000,
  residential_delivery_fee DECIMAL(10,2) DEFAULT 0,
  extended_area_surcharge DECIMAL(10,2) DEFAULT 0,
  -- Ratings
  reliability_rating DECIMAL(3,2) CHECK (reliability_rating >= 0 AND reliability_rating <= 5),
  speed_rating DECIMAL(3,2) CHECK (speed_rating >= 0 AND speed_rating <= 5),
  value_rating DECIMAL(3,2) CHECK (value_rating >= 0 AND value_rating <= 5),
  customer_service_rating DECIMAL(3,2) CHECK (customer_service_rating >= 0 AND customer_service_rating <= 5),
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. SERVICE TYPES
-- ============================================

CREATE TABLE service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category service_category NOT NULL,
  -- Service characteristics
  is_trackable BOOLEAN DEFAULT TRUE,
  is_insurable BOOLEAN DEFAULT TRUE,
  is_signature_available BOOLEAN DEFAULT TRUE,
  is_international BOOLEAN DEFAULT FALSE,
  -- Delivery estimates (business days)
  min_delivery_days INTEGER,
  max_delivery_days INTEGER,
  -- Restrictions
  max_weight DECIMAL(10,3),
  max_length DECIMAL(10,2),
  max_width DECIMAL(10,2),
  max_height DECIMAL(10,2),
  -- Pricing
  base_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  rate_per_kg DECIMAL(10,4) DEFAULT 0,
  fuel_surcharge_percent DECIMAL(5,2) DEFAULT 0,
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(carrier_id, code)
);

-- ============================================
-- 7. SHIPMENTS
-- ============================================

CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Reference numbers
  shipment_number TEXT UNIQUE,
  reference_number TEXT,
  po_number TEXT,
  
  -- Sender
  sender_address_id UUID NOT NULL REFERENCES addresses(id),
  sender_contact_name TEXT NOT NULL,
  sender_contact_phone TEXT,
  sender_contact_email TEXT,
  
  -- Recipient
  recipient_address_id UUID NOT NULL REFERENCES addresses(id),
  recipient_contact_name TEXT NOT NULL,
  recipient_contact_phone TEXT,
  recipient_contact_email TEXT,
  
  -- Package details (stored directly on shipment for simplicity)
  package_type package_type NOT NULL,
  weight DECIMAL(10,3) NOT NULL,
  length DECIMAL(10,2) NOT NULL,
  width DECIMAL(10,2) NOT NULL,
  height DECIMAL(10,2) NOT NULL,
  declared_value DECIMAL(12,2),
  contents_description TEXT NOT NULL,
  
  -- Shipping selection
  carrier_id UUID REFERENCES carriers(id),
  service_type_id UUID REFERENCES service_types(id),
  estimated_delivery TIMESTAMPTZ,
  
  -- Rates
  base_rate DECIMAL(10,2),
  fuel_surcharge DECIMAL(10,2) DEFAULT 0,
  insurance_cost DECIMAL(10,2) DEFAULT 0,
  handling_fees DECIMAL(10,2) DEFAULT 0,
  taxes DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status shipment_status DEFAULT 'draft',
  tracking_number TEXT,
  label_url TEXT,
  label_data TEXT,
  
  -- Payment reference (will be set after payment is created)
  payment_id UUID,
  
  -- Pickup reference
  pickup_id UUID,
  
  -- Metadata
  special_instructions TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. SHIPMENT PACKAGES (for multi-package shipments)
-- ============================================

CREATE TABLE shipment_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  package_number INTEGER NOT NULL,
  package_type package_type NOT NULL,
  weight DECIMAL(10,3) NOT NULL,
  length DECIMAL(10,2) NOT NULL,
  width DECIMAL(10,2) NOT NULL,
  height DECIMAL(10,2) NOT NULL,
  declared_value DECIMAL(12,2),
  contents_description TEXT,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shipment_id, package_number)
);

-- ============================================
-- 9. SHIPMENT SPECIAL HANDLING
-- ============================================

CREATE TABLE shipment_special_handling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  handling_type handling_type NOT NULL,
  is_applied BOOLEAN DEFAULT TRUE,
  fee DECIMAL(10,2) DEFAULT 0,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shipment_id, handling_type)
);

-- ============================================
-- 10. SHIPMENT DELIVERY PREFERENCES
-- ============================================

CREATE TABLE shipment_delivery_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  delivery_date DATE,
  delivery_time_start TIME,
  delivery_time_end TIME,
  saturday_delivery BOOLEAN DEFAULT FALSE,
  sunday_delivery BOOLEAN DEFAULT FALSE,
  hold_at_facility BOOLEAN DEFAULT FALSE,
  hold_facility_address_id UUID REFERENCES addresses(id),
  leave_without_signature BOOLEAN DEFAULT FALSE,
  signature_required BOOLEAN DEFAULT FALSE,
  adult_signature_required BOOLEAN DEFAULT FALSE,
  delivery_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. HAZMAT DETAILS
-- ============================================

CREATE TABLE hazmat_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  is_hazmat BOOLEAN DEFAULT FALSE,
  hazmat_class hazmat_class,
  un_number TEXT,
  proper_shipping_name TEXT,
  hazard_class TEXT,
  packing_group TEXT,
  quantity DECIMAL(10,3),
  unit_of_measure TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  technical_name TEXT,
  subsidiary_risk TEXT,
  limited_quantity BOOLEAN DEFAULT FALSE,
  reportable_quantity BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. QUOTES (rate quotes stored for reference)
-- ============================================

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Quote details
  carrier_id UUID NOT NULL REFERENCES carriers(id),
  service_type_id UUID NOT NULL REFERENCES service_types(id),
  
  -- Package specs used for quote
  weight DECIMAL(10,3) NOT NULL,
  length DECIMAL(10,2) NOT NULL,
  width DECIMAL(10,2) NOT NULL,
  height DECIMAL(10,2) NOT NULL,
  
  -- Rate breakdown
  base_rate DECIMAL(10,2) NOT NULL,
  fuel_surcharge DECIMAL(10,2) DEFAULT 0,
  residential_fee DECIMAL(10,2) DEFAULT 0,
  extended_area_fee DECIMAL(10,2) DEFAULT 0,
  handling_fees DECIMAL(10,2) DEFAULT 0,
  insurance_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Delivery estimate
  estimated_delivery TIMESTAMPTZ,
  
  -- Quote status
  is_selected BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 13. PAYMENT INFO (parent table for payment methods)
-- ============================================

CREATE TABLE payment_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_type payment_method_type NOT NULL,
  display_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  billing_address_id UUID REFERENCES addresses(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14. PAYMENT PURCHASE ORDERS
-- ============================================

CREATE TABLE payment_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_id UUID NOT NULL REFERENCES payment_info(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  po_expiry_date DATE,
  authorized_amount DECIMAL(12,2),
  remaining_amount DECIMAL(12,2),
  department TEXT,
  cost_center TEXT,
  gl_account TEXT,
  approver_name TEXT,
  approver_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 15. PAYMENT BILLS OF LADING
-- ============================================

CREATE TABLE payment_bills_of_lading (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_id UUID NOT NULL REFERENCES payment_info(id) ON DELETE CASCADE,
  bol_number TEXT NOT NULL,
  carrier_id UUID REFERENCES carriers(id),
  account_number TEXT,
  authorized_amount DECIMAL(12,2),
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 16. PAYMENT THIRD PARTY
-- ============================================

CREATE TABLE payment_third_party (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_id UUID NOT NULL REFERENCES payment_info(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  address_id UUID REFERENCES addresses(id),
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  authorization_on_file BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 17. PAYMENT NET TERMS
-- ============================================

CREATE TABLE payment_net_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_id UUID NOT NULL REFERENCES payment_info(id) ON DELETE CASCADE,
  terms_days INTEGER NOT NULL CHECK (terms_days IN (15, 30, 45, 60, 90)),
  credit_limit DECIMAL(12,2),
  current_balance DECIMAL(12,2) DEFAULT 0,
  available_credit DECIMAL(12,2),
  credit_approved_by TEXT,
  credit_approved_date DATE,
  payment_due_date DATE,
  early_payment_discount_percent DECIMAL(5,2) DEFAULT 0,
  early_payment_discount_days INTEGER DEFAULT 0,
  late_fee_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 18. PAYMENT NET TERMS REFERENCES
-- ============================================

CREATE TABLE payment_net_terms_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  net_terms_id UUID NOT NULL REFERENCES payment_net_terms(id) ON DELETE CASCADE,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('po', 'invoice', 'shipment', 'quote')),
  reference_id UUID NOT NULL,
  reference_number TEXT,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 19. PAYMENT CORPORATE ACCOUNTS
-- ============================================

CREATE TABLE payment_corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_id UUID NOT NULL REFERENCES payment_info(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  department_code TEXT,
  cost_center TEXT,
  project_code TEXT,
  authorized_users UUID[], -- array of user IDs
  monthly_limit DECIMAL(12,2),
  current_month_spend DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 20. PICKUP DETAILS
-- ============================================

CREATE TABLE pickup_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  pickup_number TEXT UNIQUE,
  carrier_id UUID REFERENCES carriers(id),
  
  -- Pickup location (may differ from sender address)
  pickup_address_id UUID NOT NULL REFERENCES addresses(id),
  
  -- Scheduling
  pickup_date DATE NOT NULL,
  ready_time TIME NOT NULL,
  close_time TIME NOT NULL,
  
  -- Status
  status pickup_status DEFAULT 'pending',
  
  -- Instructions
  special_instructions TEXT,
  driver_instructions TEXT,
  
  -- Confirmation
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES users(id),
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_number TEXT,
  
  -- Completion
  picked_up_at TIMESTAMPTZ,
  pickup_proof_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 21. PICKUP CONTACTS
-- ============================================

CREATE TABLE pickup_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id UUID NOT NULL REFERENCES pickup_details(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  available_from TIME,
  available_until TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 22. PICKUP ACCESS REQUIREMENTS
-- ============================================

CREATE TABLE pickup_access_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id UUID NOT NULL REFERENCES pickup_details(id) ON DELETE CASCADE,
  access_type access_type NOT NULL,
  instructions TEXT,
  security_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 23. PICKUP EQUIPMENT NEEDS
-- ============================================

CREATE TABLE pickup_equipment_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id UUID NOT NULL REFERENCES pickup_details(id) ON DELETE CASCADE,
  equipment_type equipment_type NOT NULL,
  quantity INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 24. PICKUP AUTHORIZED PERSONNEL
-- ============================================

CREATE TABLE pickup_authorized_personnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id UUID NOT NULL REFERENCES pickup_details(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  person_title TEXT,
  id_type TEXT,
  id_number TEXT,
  is_primary_contact BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 25. PICKUP NOTIFICATIONS
-- ============================================

CREATE TABLE pickup_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id UUID NOT NULL REFERENCES pickup_details(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms', 'phone')),
  recipient TEXT NOT NULL,
  recipient_name TEXT,
  notify_on_confirm BOOLEAN DEFAULT TRUE,
  notify_on_pickup BOOLEAN DEFAULT TRUE,
  notify_on_exception BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 26. SHIPMENT EVENTS (tracking history)
-- ============================================

CREATE TABLE shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  event_code TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_description TEXT,
  
  -- Location
  location_city TEXT,
  location_state TEXT,
  location_country TEXT,
  location_postal_code TEXT,
  
  -- Timestamps
  occurred_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Additional data
  carrier_status_code TEXT,
  carrier_status_description TEXT,
  raw_data JSONB,
  
  -- For internal events
  is_internal BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 27. PAYMENT METHODS (legacy - for card/ach/billing_account)
-- ============================================

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type payment_method_type NOT NULL,
  
  -- Provider IDs (Stripe, etc.)
  provider TEXT DEFAULT 'stripe',
  provider_customer_id TEXT,
  provider_payment_method_id TEXT,
  
  -- Display info (masked)
  display_brand TEXT,
  display_last4 TEXT,
  display_exp_month INTEGER,
  display_exp_year INTEGER,
  
  -- ACH
  bank_name TEXT,
  account_type TEXT,
  account_last4 TEXT,
  
  -- Billing account
  billing_account_number TEXT,
  
  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 28. PAYMENTS
-- ============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES payment_methods(id),
  payment_info_id UUID REFERENCES payment_info(id),
  
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  provider TEXT DEFAULT 'stripe',
  provider_payment_intent_id TEXT,
  provider_charge_id TEXT,
  
  status payment_status DEFAULT 'pending',
  failure_message TEXT,
  
  invoice_number TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 29. ACTIVITY LOG
-- ============================================

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 30. INDEXES
-- ============================================

-- Users indexes
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- Addresses indexes
CREATE INDEX idx_addresses_org ON addresses(organization_id);
CREATE INDEX idx_addresses_default_shipping ON addresses(organization_id, is_default_shipping) WHERE is_default_shipping = TRUE;
CREATE INDEX idx_addresses_default_billing ON addresses(organization_id, is_default_billing) WHERE is_default_billing = TRUE;

-- Carriers and service types indexes
CREATE INDEX idx_carriers_code ON carriers(code);
CREATE INDEX idx_carriers_active ON carriers(is_active);
CREATE INDEX idx_service_types_carrier ON service_types(carrier_id);
CREATE INDEX idx_service_types_category ON service_types(category);
CREATE INDEX idx_service_types_active ON service_types(is_active);

-- Shipments indexes
CREATE INDEX idx_shipments_org ON shipments(organization_id);
CREATE INDEX idx_shipments_user ON shipments(user_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX idx_shipments_carrier ON shipments(carrier_id);
CREATE INDEX idx_shipments_created ON shipments(created_at);
CREATE INDEX idx_shipments_number ON shipments(shipment_number);

-- Shipment related indexes
CREATE INDEX idx_shipment_packages_shipment ON shipment_packages(shipment_id);
CREATE INDEX idx_shipment_handling_shipment ON shipment_special_handling(shipment_id);
CREATE INDEX idx_shipment_delivery_prefs_shipment ON shipment_delivery_preferences(shipment_id);
CREATE INDEX idx_hazmat_details_shipment ON hazmat_details(shipment_id);

-- Quotes indexes
CREATE INDEX idx_quotes_shipment ON quotes(shipment_id);
CREATE INDEX idx_quotes_org ON quotes(organization_id);
CREATE INDEX idx_quotes_carrier ON quotes(carrier_id);

-- Payment indexes
CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_method ON payments(payment_method_id);
CREATE INDEX idx_payments_info ON payments(payment_info_id);
CREATE INDEX idx_payment_methods_org ON payment_methods(organization_id);
CREATE INDEX idx_payment_info_org ON payment_info(organization_id);

-- Pickup indexes
CREATE INDEX idx_pickup_details_shipment ON pickup_details(shipment_id);
CREATE INDEX idx_pickup_details_carrier ON pickup_details(carrier_id);
CREATE INDEX idx_pickup_details_status ON pickup_details(status);
CREATE INDEX idx_pickup_details_date ON pickup_details(pickup_date);
CREATE INDEX idx_pickup_contacts_pickup ON pickup_contacts(pickup_id);
CREATE INDEX idx_pickup_access_pickup ON pickup_access_requirements(pickup_id);
CREATE INDEX idx_pickup_equipment_pickup ON pickup_equipment_needs(pickup_id);
CREATE INDEX idx_pickup_personnel_pickup ON pickup_authorized_personnel(pickup_id);
CREATE INDEX idx_pickup_notifications_pickup ON pickup_notifications(pickup_id);

-- Shipment events indexes
CREATE INDEX idx_shipment_events_shipment ON shipment_events(shipment_id);
CREATE INDEX idx_shipment_events_occurred ON shipment_events(occurred_at);
CREATE INDEX idx_shipment_events_code ON shipment_events(event_code);

-- Activity log indexes
CREATE INDEX idx_activity_org ON activity_log(organization_id);
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_created ON activity_log(created_at);

-- ============================================
-- 31. RLS POLICIES (Permissive for v1)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_special_handling ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_delivery_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE hazmat_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_bills_of_lading ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_third_party ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_net_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_net_terms_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_access_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_equipment_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_authorized_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can view their own org
CREATE POLICY "Users can view their organization" 
  ON organizations FOR SELECT 
  USING (id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their organization" 
  ON organizations FOR UPDATE 
  USING (id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Users: Users can view other users in their org
CREATE POLICY "Users can view org members" 
  ON users FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  USING (id = auth.uid());

-- Addresses: Users can view org addresses
CREATE POLICY "Users can view org addresses" 
  ON addresses FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create org addresses" 
  ON addresses FOR INSERT 
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage addresses" 
  ON addresses FOR ALL 
  USING (organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Carriers: Public read access (for v1)
CREATE POLICY "Anyone can view carriers" 
  ON carriers FOR SELECT 
  TO authenticated, anon
  USING (true);

-- Service Types: Public read access (for v1)
CREATE POLICY "Anyone can view service types" 
  ON service_types FOR SELECT 
  TO authenticated, anon
  USING (true);

-- Shipments: Users can view org shipments
CREATE POLICY "Users can view org shipments" 
  ON shipments FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create shipments" 
  ON shipments FOR INSERT 
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own shipments" 
  ON shipments FOR UPDATE 
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Shipment related tables
CREATE POLICY "Users can view shipment packages" 
  ON shipment_packages FOR SELECT 
  USING (shipment_id IN (
    SELECT id FROM shipments WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage shipment packages" 
  ON shipment_packages FOR ALL 
  USING (shipment_id IN (
    SELECT id FROM shipments WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can view shipment handling" 
  ON shipment_special_handling FOR SELECT 
  USING (shipment_id IN (
    SELECT id FROM shipments WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage shipment handling" 
  ON shipment_special_handling FOR ALL 
  USING (shipment_id IN (
    SELECT id FROM shipments WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can view shipment delivery prefs" 
  ON shipment_delivery_preferences FOR SELECT 
  USING (shipment_id IN (
    SELECT id FROM shipments WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage shipment delivery prefs" 
  ON shipment_delivery_preferences FOR ALL 
  USING (shipment_id IN (
    SELECT id FROM shipments WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can view hazmat details" 
  ON hazmat_details FOR SELECT 
  USING (shipment_id IN (
    SELECT id FROM shipments WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage hazmat details" 
  ON hazmat_details FOR ALL 
  USING (shipment_id IN (
    SELECT id FROM shipments WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

-- Quotes
CREATE POLICY "Users can view org quotes" 
  ON quotes FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create quotes" 
  ON quotes FOR INSERT 
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Payment Info
CREATE POLICY "Users can view org payment info" 
  ON payment_info FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage payment info" 
  ON payment_info FOR ALL 
  USING (organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Payment sub-tables
CREATE POLICY "Users can view payment purchase orders" 
  ON payment_purchase_orders FOR SELECT 
  USING (payment_info_id IN (
    SELECT id FROM payment_info WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can view payment bills of lading" 
  ON payment_bills_of_lading FOR SELECT 
  USING (payment_info_id IN (
    SELECT id FROM payment_info WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can view payment third party" 
  ON payment_third_party FOR SELECT 
  USING (payment_info_id IN (
    SELECT id FROM payment_info WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can view payment net terms" 
  ON payment_net_terms FOR SELECT 
  USING (payment_info_id IN (
    SELECT id FROM payment_info WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can view payment corporate accounts" 
  ON payment_corporate_accounts FOR SELECT 
  USING (payment_info_id IN (
    SELECT id FROM payment_info WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

-- Pickup tables
CREATE POLICY "Users can view pickup details" 
  ON pickup_details FOR SELECT 
  USING (shipment_id IN (
    SELECT id FROM shipments WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage pickup details" 
  ON pickup_details FOR ALL 
  USING (shipment_id IN (
    SELECT id FROM shipments WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can view pickup contacts" 
  ON pickup_contacts FOR SELECT 
  USING (pickup_id IN (
    SELECT id FROM pickup_details WHERE shipment_id IN (
      SELECT id FROM shipments WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can manage pickup contacts" 
  ON pickup_contacts FOR ALL 
  USING (pickup_id IN (
    SELECT id FROM pickup_details WHERE shipment_id IN (
      SELECT id FROM shipments WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can view pickup access requirements" 
  ON pickup_access_requirements FOR SELECT 
  USING (pickup_id IN (
    SELECT id FROM pickup_details WHERE shipment_id IN (
      SELECT id FROM shipments WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can manage pickup access requirements" 
  ON pickup_access_requirements FOR ALL 
  USING (pickup_id IN (
    SELECT id FROM pickup_details WHERE shipment_id IN (
      SELECT id FROM shipments WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can view pickup equipment needs" 
  ON pickup_equipment_needs FOR SELECT 
  USING (pickup_id IN (
    SELECT id FROM pickup_details WHERE shipment_id IN (
      SELECT id FROM shipments WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can manage pickup equipment needs" 
  ON pickup_equipment_needs FOR ALL 
  USING (pickup_id IN (
    SELECT id FROM pickup_details WHERE shipment_id IN (
      SELECT id FROM shipments WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can view pickup authorized personnel" 
  ON pickup_authorized_personnel FOR SELECT 
  USING (pickup_id IN (
    SELECT id FROM pickup_details WHERE shipment_id IN (
      SELECT id FROM shipments WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can manage pickup authorized personnel" 
  ON pickup_authorized_personnel FOR ALL 
  USING (pickup_id IN (
    SELECT id FROM pickup_details WHERE shipment_id IN (
      SELECT id FROM shipments WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can view pickup notifications" 
  ON pickup_notifications FOR SELECT 
  USING (pickup_id IN (
    SELECT id FROM pickup_details WHERE shipment_id IN (
      SELECT id FROM shipments WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can manage pickup notifications" 
  ON pickup_notifications FOR ALL 
  USING (pickup_id IN (
    SELECT id FROM pickup_details WHERE shipment_id IN (
      SELECT id FROM shipments WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  ));

-- Shipment Events
CREATE POLICY "Users can view shipment events" 
  ON shipment_events FOR SELECT 
  USING (shipment_id IN (
    SELECT id FROM shipments WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can create shipment events" 
  ON shipment_events FOR INSERT 
  WITH CHECK (shipment_id IN (
    SELECT id FROM shipments WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

-- Payment Methods
CREATE POLICY "Users can view org payment methods" 
  ON payment_methods FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage payment methods" 
  ON payment_methods FOR ALL 
  USING (organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Payments
CREATE POLICY "Users can view org payments" 
  ON payments FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create payments" 
  ON payments FOR INSERT 
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Activity Log
CREATE POLICY "Users can view org activity" 
  ON activity_log FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "System can create activity" 
  ON activity_log FOR INSERT 
  WITH CHECK (true);

-- ============================================
-- 32. FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER addresses_updated_at 
  BEFORE UPDATE ON addresses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER carriers_updated_at 
  BEFORE UPDATE ON carriers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER service_types_updated_at 
  BEFORE UPDATE ON service_types 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER shipments_updated_at 
  BEFORE UPDATE ON shipments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER shipment_packages_updated_at 
  BEFORE UPDATE ON shipment_packages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER shipment_delivery_preferences_updated_at 
  BEFORE UPDATE ON shipment_delivery_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER hazmat_details_updated_at 
  BEFORE UPDATE ON hazmat_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payment_info_updated_at 
  BEFORE UPDATE ON payment_info 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payment_purchase_orders_updated_at 
  BEFORE UPDATE ON payment_purchase_orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payment_bills_of_lading_updated_at 
  BEFORE UPDATE ON payment_bills_of_lading 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payment_third_party_updated_at 
  BEFORE UPDATE ON payment_third_party 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payment_net_terms_updated_at 
  BEFORE UPDATE ON payment_net_terms 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payment_corporate_accounts_updated_at 
  BEFORE UPDATE ON payment_corporate_accounts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pickup_details_updated_at 
  BEFORE UPDATE ON pickup_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payment_methods_updated_at 
  BEFORE UPDATE ON payment_methods 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate shipment number function
CREATE OR REPLACE FUNCTION generate_shipment_number()
RETURNS TRIGGER AS $$
DECLARE
  year TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
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

CREATE TRIGGER shipments_generate_number
  BEFORE INSERT ON shipments
  FOR EACH ROW EXECUTE FUNCTION generate_shipment_number();

-- Generate pickup number function
CREATE OR REPLACE FUNCTION generate_pickup_number()
RETURNS TRIGGER AS $$
DECLARE
  year TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  IF NEW.pickup_number IS NULL THEN
    year := TO_CHAR(NOW(), 'YYYY');
    
    -- Get the next sequence number for this year
    SELECT COUNT(*) + 1 INTO sequence_num
    FROM pickup_details
    WHERE pickup_number LIKE 'PUP-' || year || '-%';
    
    -- Generate the pickup number
    new_number := 'PUP-' || year || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    NEW.pickup_number := new_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pickup_details_generate_number
  BEFORE INSERT ON pickup_details
  FOR EACH ROW EXECUTE FUNCTION generate_pickup_number();

-- Log activity function
CREATE OR REPLACE FUNCTION log_activity(
  p_organization_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO activity_log (
    organization_id, user_id, action, entity_type, entity_id, metadata
  ) VALUES (
    p_organization_id, p_user_id, p_action, p_entity_type, p_entity_id, p_metadata
  );
END;
$$ LANGUAGE plpgsql;

-- Update available credit function
CREATE OR REPLACE FUNCTION update_net_terms_available_credit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.available_credit := NEW.credit_limit - NEW.current_balance;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_net_terms_update_credit
  BEFORE INSERT OR UPDATE ON payment_net_terms
  FOR EACH ROW EXECUTE FUNCTION update_net_terms_available_credit();
