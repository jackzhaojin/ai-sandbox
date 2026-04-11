-- ============================================
-- B2B Postal Checkout Flow - postal_v2 Schema
-- ============================================
-- Step 2: Cloud Supabase Schema Setup
-- Contract: contract-1775939480657

-- ============================================
-- 1. SCHEMA CREATION
-- ============================================
DROP SCHEMA IF EXISTS postal_v2 CASCADE;
CREATE SCHEMA postal_v2;

-- ============================================
-- 2. ENUM TYPES
-- ============================================
CREATE TYPE postal_v2.user_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE postal_v2.organization_status AS ENUM ('active', 'suspended', 'inactive');
CREATE TYPE postal_v2.payment_term AS ENUM ('immediate', 'net15', 'net30', 'net60');
CREATE TYPE postal_v2.address_type AS ENUM ('residential', 'commercial');
CREATE TYPE postal_v2.package_type AS ENUM ('box', 'envelope', 'tube', 'pallet');
CREATE TYPE postal_v2.shipment_status AS ENUM (
  'draft', 'pending_payment', 'paid', 'label_generated', 
  'picked_up', 'in_transit', 'delivered', 'cancelled'
);
CREATE TYPE postal_v2.carrier_code AS ENUM ('pex', 'vc', 'efl', 'fs');
CREATE TYPE postal_v2.service_category AS ENUM ('ground', 'air', 'express', 'freight', 'international');
CREATE TYPE postal_v2.payment_method_type AS ENUM ('purchase_order', 'net_terms', 'bill_of_lading', 'third_party', 'corporate_account');
CREATE TYPE postal_v2.payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');
CREATE TYPE postal_v2.handling_type AS ENUM ('fragile', 'hazardous', 'temperature_controlled', 'signature_required', 'adult_signature', 'hold_for_pickup', 'appointment_delivery');

-- ============================================
-- 3. ORGANIZATIONS
-- ============================================
CREATE TABLE postal_v2.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  tax_id text,
  billing_email text NOT NULL,
  billing_address_id uuid,
  payment_terms postal_v2.payment_term DEFAULT 'immediate',
  credit_limit decimal(12,2),
  status postal_v2.organization_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 4. USERS
-- ============================================
CREATE TABLE postal_v2.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  organization_id uuid NOT NULL REFERENCES postal_v2.organizations(id) ON DELETE CASCADE,
  role postal_v2.user_role DEFAULT 'user',
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 5. ADDRESSES
-- ============================================
CREATE TABLE postal_v2.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES postal_v2.organizations(id) ON DELETE CASCADE,
  label text NOT NULL,
  recipient_name text NOT NULL,
  recipient_phone text,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'US',
  address_type postal_v2.address_type DEFAULT 'commercial',
  is_verified boolean DEFAULT false,
  is_default_shipping boolean DEFAULT false,
  is_default_billing boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key for billing_address_id after addresses table exists
ALTER TABLE postal_v2.organizations 
  ADD CONSTRAINT fk_org_billing_address 
  FOREIGN KEY (billing_address_id) REFERENCES postal_v2.addresses(id) ON DELETE SET NULL;

-- ============================================
-- 6. CARRIERS
-- ============================================
CREATE TABLE postal_v2.carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code postal_v2.carrier_code NOT NULL UNIQUE,
  name text NOT NULL,
  display_name text NOT NULL,
  rating decimal(2,1) NOT NULL DEFAULT 4.0,
  rate_multiplier decimal(4,4) NOT NULL DEFAULT 1.0000,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 7. SERVICE TYPES
-- ============================================
CREATE TABLE postal_v2.service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id uuid NOT NULL REFERENCES postal_v2.carriers(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  category postal_v2.service_category NOT NULL,
  base_rate decimal(10,2) NOT NULL,
  transit_days_min integer NOT NULL,
  transit_days_max integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 8. SHIPMENTS
-- ============================================
CREATE TABLE postal_v2.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES postal_v2.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES postal_v2.users(id),
  
  -- Sender
  sender_address_id uuid NOT NULL REFERENCES postal_v2.addresses(id),
  sender_contact_name text NOT NULL,
  sender_contact_phone text,
  sender_contact_email text,
  
  -- Recipient
  recipient_address_id uuid NOT NULL REFERENCES postal_v2.addresses(id),
  recipient_contact_name text NOT NULL,
  recipient_contact_phone text,
  recipient_contact_email text,
  
  -- Package
  package_type postal_v2.package_type NOT NULL,
  weight decimal(10,3) NOT NULL,
  length decimal(10,2) NOT NULL,
  width decimal(10,2) NOT NULL,
  height decimal(10,2) NOT NULL,
  declared_value decimal(12,2),
  contents_description text NOT NULL,
  
  -- Shipping
  carrier_id uuid REFERENCES postal_v2.carriers(id),
  service_type_id uuid REFERENCES postal_v2.service_types(id),
  estimated_delivery timestamptz,
  
  -- Rates
  base_rate decimal(10,2),
  fuel_surcharge decimal(10,2) DEFAULT 0,
  insurance_cost decimal(10,2) DEFAULT 0,
  total_cost decimal(10,2),
  currency text DEFAULT 'USD',
  
  -- Status
  status postal_v2.shipment_status DEFAULT 'draft',
  tracking_number text,
  label_url text,
  
  -- Relations
  selected_quote_id uuid,
  payment_id uuid,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 9. SHIPMENT PACKAGES (Multi-piece support)
-- ============================================
CREATE TABLE postal_v2.shipment_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES postal_v2.shipments(id) ON DELETE CASCADE,
  package_index integer NOT NULL DEFAULT 1,
  package_type postal_v2.package_type NOT NULL,
  weight decimal(10,3) NOT NULL,
  length decimal(10,2) NOT NULL,
  width decimal(10,2) NOT NULL,
  height decimal(10,2) NOT NULL,
  declared_value decimal(12,2),
  contents_description text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 10. SHIPMENT SPECIAL HANDLING
-- ============================================
CREATE TABLE postal_v2.shipment_special_handling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES postal_v2.shipments(id) ON DELETE CASCADE,
  handling_type postal_v2.handling_type NOT NULL,
  fee decimal(10,2) DEFAULT 0,
  instructions text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 11. SHIPMENT DELIVERY PREFERENCES
-- ============================================
CREATE TABLE postal_v2.shipment_delivery_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES postal_v2.shipments(id) ON DELETE CASCADE,
  delivery_instructions text,
  preferred_time_window text,
  leave_at_door boolean DEFAULT false,
  require_signature boolean DEFAULT false,
  alternate_contact_name text,
  alternate_contact_phone text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 12. HAZMAT DETAILS
-- ============================================
CREATE TABLE postal_v2.hazmat_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES postal_v2.shipments(id) ON DELETE CASCADE,
  un_number text,
  proper_shipping_name text,
  hazard_class text,
  packing_group text,
  emergency_contact_phone text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 13. QUOTES
-- ============================================
CREATE TABLE postal_v2.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES postal_v2.shipments(id) ON DELETE CASCADE,
  carrier_id uuid NOT NULL REFERENCES postal_v2.carriers(id),
  service_type_id uuid NOT NULL REFERENCES postal_v2.service_types(id),
  base_rate decimal(10,2) NOT NULL,
  fuel_surcharge decimal(10,2) NOT NULL DEFAULT 0,
  total_cost decimal(10,2) NOT NULL,
  estimated_delivery timestamptz NOT NULL,
  is_selected boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 14. PAYMENT INFO (Parent table)
-- ============================================
CREATE TABLE postal_v2.payment_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES postal_v2.organizations(id) ON DELETE CASCADE,
  type postal_v2.payment_method_type NOT NULL,
  status text DEFAULT 'active',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 15. PAYMENT METHOD: PURCHASE ORDER
-- ============================================
CREATE TABLE postal_v2.payment_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_id uuid NOT NULL REFERENCES postal_v2.payment_info(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  authorized_by text,
  po_document_url text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 16. PAYMENT METHOD: NET TERMS
-- ============================================
CREATE TABLE postal_v2.payment_net_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_id uuid NOT NULL REFERENCES postal_v2.payment_info(id) ON DELETE CASCADE,
  term_days integer NOT NULL CHECK (term_days IN (15, 30, 60)),
  credit_limit decimal(12,2) NOT NULL,
  available_credit decimal(12,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 17. PAYMENT METHOD: NET TERMS REFERENCES
-- ============================================
CREATE TABLE postal_v2.payment_net_terms_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  net_terms_id uuid NOT NULL REFERENCES postal_v2.payment_net_terms(id) ON DELETE CASCADE,
  reference_type text NOT NULL,
  reference_value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 18. PAYMENT METHOD: BILL OF LADING
-- ============================================
CREATE TABLE postal_v2.payment_bills_of_lading (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_id uuid NOT NULL REFERENCES postal_v2.payment_info(id) ON DELETE CASCADE,
  bol_number text NOT NULL,
  carrier text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 19. PAYMENT METHOD: THIRD PARTY
-- ============================================
CREATE TABLE postal_v2.payment_third_party (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_id uuid NOT NULL REFERENCES postal_v2.payment_info(id) ON DELETE CASCADE,
  account_number text NOT NULL,
  carrier text NOT NULL,
  billing_address_id uuid REFERENCES postal_v2.addresses(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 20. PAYMENT METHOD: CORPORATE ACCOUNT
-- ============================================
CREATE TABLE postal_v2.payment_corporate_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_id uuid NOT NULL REFERENCES postal_v2.payment_info(id) ON DELETE CASCADE,
  account_number text NOT NULL,
  account_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 21. PAYMENTS (Transaction records)
-- ============================================
CREATE TABLE postal_v2.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES postal_v2.organizations(id) ON DELETE CASCADE,
  shipment_id uuid NOT NULL REFERENCES postal_v2.shipments(id),
  payment_info_id uuid REFERENCES postal_v2.payment_info(id),
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  status postal_v2.payment_status DEFAULT 'pending',
  failure_message text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key for shipments.payment_id
ALTER TABLE postal_v2.shipments 
  ADD CONSTRAINT fk_shipment_payment 
  FOREIGN KEY (payment_id) REFERENCES postal_v2.payments(id) ON DELETE SET NULL;

-- Add foreign key for shipments.selected_quote_id
ALTER TABLE postal_v2.shipments 
  ADD CONSTRAINT fk_shipment_selected_quote 
  FOREIGN KEY (selected_quote_id) REFERENCES postal_v2.quotes(id) ON DELETE SET NULL;

-- ============================================
-- 22. PICKUP SLOTS (Available time windows)
-- ============================================
CREATE TABLE postal_v2.pickup_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date date NOT NULL,
  time_window text NOT NULL,
  is_available boolean DEFAULT true,
  capacity integer DEFAULT 10,
  booked_count integer DEFAULT 0,
  fee decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 23. PICKUP DETAILS
-- ============================================
CREATE TABLE postal_v2.pickup_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES postal_v2.shipments(id) ON DELETE CASCADE,
  pickup_slot_id uuid NOT NULL REFERENCES postal_v2.pickup_slots(id),
  pickup_address_id uuid REFERENCES postal_v2.addresses(id),
  instructions text,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 24. PICKUP CONTACTS
-- ============================================
CREATE TABLE postal_v2.pickup_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_details_id uuid NOT NULL REFERENCES postal_v2.pickup_details(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  contact_email text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 25. PICKUP ACCESS REQUIREMENTS
-- ============================================
CREATE TABLE postal_v2.pickup_access_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_details_id uuid NOT NULL REFERENCES postal_v2.pickup_details(id) ON DELETE CASCADE,
  requirement_type text NOT NULL,
  requirement_value text NOT NULL,
  instructions text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 26. PICKUP EQUIPMENT NEEDS
-- ============================================
CREATE TABLE postal_v2.pickup_equipment_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_details_id uuid NOT NULL REFERENCES postal_v2.pickup_details(id) ON DELETE CASCADE,
  equipment_type text NOT NULL,
  quantity integer DEFAULT 1,
  special_instructions text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 27. PICKUP AUTHORIZED PERSONNEL
-- ============================================
CREATE TABLE postal_v2.pickup_authorized_personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_details_id uuid NOT NULL REFERENCES postal_v2.pickup_details(id) ON DELETE CASCADE,
  personnel_name text NOT NULL,
  personnel_id text,
  authorization_type text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 28. PICKUP NOTIFICATIONS
-- ============================================
CREATE TABLE postal_v2.pickup_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_details_id uuid NOT NULL REFERENCES postal_v2.pickup_details(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  recipient_email text,
  recipient_phone text,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 29. SHIPMENT EVENTS (Tracking history)
-- ============================================
CREATE TABLE postal_v2.shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES postal_v2.shipments(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_description text NOT NULL,
  location text,
  event_timestamp timestamptz DEFAULT now(),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 30. INDEXES
-- ============================================
-- Users indexes
CREATE INDEX idx_users_org ON postal_v2.users(organization_id);
CREATE INDEX idx_users_email ON postal_v2.users(email);

-- Addresses indexes
CREATE INDEX idx_addresses_org ON postal_v2.addresses(organization_id);

-- Shipments indexes
CREATE INDEX idx_shipments_org ON postal_v2.shipments(organization_id);
CREATE INDEX idx_shipments_user ON postal_v2.shipments(user_id);
CREATE INDEX idx_shipments_status ON postal_v2.shipments(status);
CREATE INDEX idx_shipments_tracking ON postal_v2.shipments(tracking_number);
CREATE INDEX idx_shipments_sender_address ON postal_v2.shipments(sender_address_id);
CREATE INDEX idx_shipments_recipient_address ON postal_v2.shipments(recipient_address_id);
CREATE INDEX idx_shipments_carrier ON postal_v2.shipments(carrier_id);
CREATE INDEX idx_shipments_service_type ON postal_v2.shipments(service_type_id);

-- Quotes indexes
CREATE INDEX idx_quotes_shipment ON postal_v2.quotes(shipment_id);
CREATE INDEX idx_quotes_carrier ON postal_v2.quotes(carrier_id);

-- Payments indexes
CREATE INDEX idx_payments_org ON postal_v2.payments(organization_id);
CREATE INDEX idx_payments_shipment ON postal_v2.payments(shipment_id);

-- Payment info indexes
CREATE INDEX idx_payment_info_org ON postal_v2.payment_info(organization_id);

-- Pickup indexes
CREATE INDEX idx_pickup_details_shipment ON postal_v2.pickup_details(shipment_id);
CREATE INDEX idx_pickup_details_slot ON postal_v2.pickup_details(pickup_slot_id);
CREATE INDEX idx_pickup_slots_date ON postal_v2.pickup_slots(slot_date);

-- Service types indexes
CREATE INDEX idx_service_types_carrier ON postal_v2.service_types(carrier_id);

-- Shipment events indexes
CREATE INDEX idx_shipment_events_shipment ON postal_v2.shipment_events(shipment_id);
CREATE INDEX idx_shipment_events_timestamp ON postal_v2.shipment_events(event_timestamp);

-- ============================================
-- 31. RLS POLICIES (Permissive for development)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE postal_v2.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.shipment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.shipment_special_handling ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.shipment_delivery_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.hazmat_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.payment_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.payment_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.payment_net_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.payment_net_terms_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.payment_bills_of_lading ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.payment_third_party ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.payment_corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.pickup_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.pickup_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.pickup_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.pickup_access_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.pickup_equipment_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.pickup_authorized_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.pickup_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_v2.shipment_events ENABLE ROW LEVEL SECURITY;

-- Development policy: Allow all authenticated users full access
-- WARNING: Replace with proper org-based policies for production

-- Organizations: Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read organizations" 
  ON postal_v2.organizations FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert organizations" 
  ON postal_v2.organizations FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update organizations" 
  ON postal_v2.organizations FOR UPDATE 
  TO authenticated
  USING (true);

-- Users: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to users" 
  ON postal_v2.users FOR ALL 
  TO authenticated
  USING (true);

-- Addresses: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to addresses" 
  ON postal_v2.addresses FOR ALL 
  TO authenticated
  USING (true);

-- Carriers: Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read carriers" 
  ON postal_v2.carriers FOR SELECT 
  TO authenticated
  USING (true);

-- Service Types: Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read service_types" 
  ON postal_v2.service_types FOR SELECT 
  TO authenticated
  USING (true);

-- Shipments: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to shipments" 
  ON postal_v2.shipments FOR ALL 
  TO authenticated
  USING (true);

-- Shipment Packages: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to shipment_packages" 
  ON postal_v2.shipment_packages FOR ALL 
  TO authenticated
  USING (true);

-- Shipment Special Handling: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to shipment_special_handling" 
  ON postal_v2.shipment_special_handling FOR ALL 
  TO authenticated
  USING (true);

-- Shipment Delivery Preferences: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to shipment_delivery_preferences" 
  ON postal_v2.shipment_delivery_preferences FOR ALL 
  TO authenticated
  USING (true);

-- Hazmat Details: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to hazmat_details" 
  ON postal_v2.hazmat_details FOR ALL 
  TO authenticated
  USING (true);

-- Quotes: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to quotes" 
  ON postal_v2.quotes FOR ALL 
  TO authenticated
  USING (true);

-- Payment Info: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to payment_info" 
  ON postal_v2.payment_info FOR ALL 
  TO authenticated
  USING (true);

-- Payment Purchase Orders: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to payment_purchase_orders" 
  ON postal_v2.payment_purchase_orders FOR ALL 
  TO authenticated
  USING (true);

-- Payment Net Terms: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to payment_net_terms" 
  ON postal_v2.payment_net_terms FOR ALL 
  TO authenticated
  USING (true);

-- Payment Net Terms References: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to payment_net_terms_references" 
  ON postal_v2.payment_net_terms_references FOR ALL 
  TO authenticated
  USING (true);

-- Payment Bills of Lading: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to payment_bills_of_lading" 
  ON postal_v2.payment_bills_of_lading FOR ALL 
  TO authenticated
  USING (true);

-- Payment Third Party: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to payment_third_party" 
  ON postal_v2.payment_third_party FOR ALL 
  TO authenticated
  USING (true);

-- Payment Corporate Accounts: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to payment_corporate_accounts" 
  ON postal_v2.payment_corporate_accounts FOR ALL 
  TO authenticated
  USING (true);

-- Payments: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to payments" 
  ON postal_v2.payments FOR ALL 
  TO authenticated
  USING (true);

-- Pickup Slots: Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read pickup_slots" 
  ON postal_v2.pickup_slots FOR SELECT 
  TO authenticated
  USING (true);

-- Pickup Details: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to pickup_details" 
  ON postal_v2.pickup_details FOR ALL 
  TO authenticated
  USING (true);

-- Pickup Contacts: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to pickup_contacts" 
  ON postal_v2.pickup_contacts FOR ALL 
  TO authenticated
  USING (true);

-- Pickup Access Requirements: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to pickup_access_requirements" 
  ON postal_v2.pickup_access_requirements FOR ALL 
  TO authenticated
  USING (true);

-- Pickup Equipment Needs: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to pickup_equipment_needs" 
  ON postal_v2.pickup_equipment_needs FOR ALL 
  TO authenticated
  USING (true);

-- Pickup Authorized Personnel: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to pickup_authorized_personnel" 
  ON postal_v2.pickup_authorized_personnel FOR ALL 
  TO authenticated
  USING (true);

-- Pickup Notifications: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to pickup_notifications" 
  ON postal_v2.pickup_notifications FOR ALL 
  TO authenticated
  USING (true);

-- Shipment Events: Allow all authenticated users full access
CREATE POLICY "Allow authenticated users full access to shipment_events" 
  ON postal_v2.shipment_events FOR ALL 
  TO authenticated
  USING (true);

-- ============================================
-- 32. FUNCTIONS & TRIGGERS
-- ============================================
-- Update timestamps function
CREATE OR REPLACE FUNCTION postal_v2.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to tables with updated_at
CREATE TRIGGER organizations_updated_at 
  BEFORE UPDATE ON postal_v2.organizations 
  FOR EACH ROW EXECUTE FUNCTION postal_v2.update_updated_at();

CREATE TRIGGER users_updated_at 
  BEFORE UPDATE ON postal_v2.users 
  FOR EACH ROW EXECUTE FUNCTION postal_v2.update_updated_at();

CREATE TRIGGER addresses_updated_at 
  BEFORE UPDATE ON postal_v2.addresses 
  FOR EACH ROW EXECUTE FUNCTION postal_v2.update_updated_at();

CREATE TRIGGER shipments_updated_at 
  BEFORE UPDATE ON postal_v2.shipments 
  FOR EACH ROW EXECUTE FUNCTION postal_v2.update_updated_at();

CREATE TRIGGER payment_info_updated_at 
  BEFORE UPDATE ON postal_v2.payment_info 
  FOR EACH ROW EXECUTE FUNCTION postal_v2.update_updated_at();

CREATE TRIGGER payment_net_terms_updated_at 
  BEFORE UPDATE ON postal_v2.payment_net_terms 
  FOR EACH ROW EXECUTE FUNCTION postal_v2.update_updated_at();

CREATE TRIGGER payments_updated_at 
  BEFORE UPDATE ON postal_v2.payments 
  FOR EACH ROW EXECUTE FUNCTION postal_v2.update_updated_at();

CREATE TRIGGER pickup_details_updated_at 
  BEFORE UPDATE ON postal_v2.pickup_details 
  FOR EACH ROW EXECUTE FUNCTION postal_v2.update_updated_at();

-- Generate tracking number function
CREATE OR REPLACE FUNCTION postal_v2.generate_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_number IS NULL AND NEW.status IN ('label_generated', 'picked_up', 'in_transit', 'delivered') THEN
    NEW.tracking_number := 'TRK-' || to_char(now(), 'YYYYMMDD') || '-' || substring(md5(random()::text), 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shipments_tracking_number
  BEFORE UPDATE ON postal_v2.shipments
  FOR EACH ROW EXECUTE FUNCTION postal_v2.generate_tracking_number();

-- ============================================
-- SCHEMA SETUP COMPLETE
-- ============================================
