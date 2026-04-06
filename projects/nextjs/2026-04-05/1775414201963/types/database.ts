/**
 * B2B Postal Checkout Flow - Database Types
 * Generated from Supabase schema
 */

// ============================================
// ENUM TYPES
// ============================================

export type UserRole = 'admin' | 'manager' | 'user';
export type OrganizationStatus = 'active' | 'suspended' | 'inactive';
export type PaymentTerm = 'immediate' | 'net15' | 'net30' | 'net60';
export type AddressType = 'residential' | 'commercial';
export type PackageType = 'box' | 'envelope' | 'tube' | 'pallet';
export type ShipmentStatus = 
  | 'draft' 
  | 'pending_payment' 
  | 'paid' 
  | 'label_generated' 
  | 'confirmed'
  | 'picked_up' 
  | 'in_transit' 
  | 'delivered' 
  | 'cancelled';
export type CarrierCode = 'pex' | 'vc' | 'efl' | 'fs';
export type ServiceCategory = 'ground' | 'air' | 'freight' | 'express' | 'international';
export type PaymentMethodType = 
  | 'card' 
  | 'ach' 
  | 'wire' 
  | 'billing_account' 
  | 'purchase_order' 
  | 'net_terms' 
  | 'corporate_account' 
  | 'third_party';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';
export type HandlingType = 
  | 'fragile' 
  | 'hazardous' 
  | 'temperature_controlled' 
  | 'signature_required' 
  | 'adult_signature' 
  | 'hold_for_pickup' 
  | 'appointment_delivery';
export type HazmatClass = 
  | 'class_1' 
  | 'class_2' 
  | 'class_3' 
  | 'class_4' 
  | 'class_5' 
  | 'class_6' 
  | 'class_7' 
  | 'class_8' 
  | 'class_9';
export type PickupStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type AccessType = 
  | 'loading_dock' 
  | 'front_door' 
  | 'side_door' 
  | 'rear_door' 
  | 'security_gate' 
  | 'call_on_arrival';
export type EquipmentType = 
  | 'pallet_jack' 
  | 'forklift' 
  | 'hand_truck' 
  | 'liftgate' 
  | 'dock_leveler';

// ============================================
// TABLE TYPES
// ============================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tax_id: string | null;
  billing_email: string;
  billing_address_id: string | null;
  payment_terms: PaymentTerm;
  credit_limit: number | null;
  status: OrganizationStatus;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  organization_id: string;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  organization_id: string;
  label: string;
  recipient_name: string;
  recipient_phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: AddressType;
  is_verified: boolean;
  verification_service: string | null;
  verification_raw_response: Record<string, unknown> | null;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  created_at: string;
  updated_at: string;
}

export interface Carrier {
  id: string;
  code: CarrierCode;
  name: string;
  display_name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  support_phone: string | null;
  support_email: string | null;
  base_rate_multiplier: number;
  fuel_surcharge_multiplier: number;
  residential_delivery_fee: number;
  extended_area_surcharge: number;
  reliability_rating: number | null;
  speed_rating: number | null;
  value_rating: number | null;
  customer_service_rating: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceType {
  id: string;
  carrier_id: string;
  code: string;
  name: string;
  display_name: string;
  description: string | null;
  category: ServiceCategory;
  is_trackable: boolean;
  is_insurable: boolean;
  is_signature_available: boolean;
  is_international: boolean;
  min_delivery_days: number | null;
  max_delivery_days: number | null;
  max_weight: number | null;
  max_length: number | null;
  max_width: number | null;
  max_height: number | null;
  base_rate: number;
  rate_per_kg: number;
  fuel_surcharge_percent: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  organization_id: string;
  user_id: string;
  shipment_number: string | null;
  reference_number: string | null;
  po_number: string | null;
  sender_address_id: string;
  sender_contact_name: string;
  sender_contact_phone: string | null;
  sender_contact_email: string | null;
  recipient_address_id: string;
  recipient_contact_name: string;
  recipient_contact_phone: string | null;
  recipient_contact_email: string | null;
  package_type: PackageType;
  weight: number;
  length: number;
  width: number;
  height: number;
  declared_value: number | null;
  contents_description: string;
  carrier_id: string | null;
  service_type_id: string | null;
  estimated_delivery: string | null;
  base_rate: number | null;
  fuel_surcharge: number;
  insurance_cost: number;
  handling_fees: number;
  taxes: number;
  total_cost: number | null;
  currency: string;
  status: ShipmentStatus;
  tracking_number: string | null;
  label_url: string | null;
  label_data: string | null;
  payment_id: string | null;
  pickup_id: string | null;
  special_instructions: string | null;
  internal_notes: string | null;
  confirmation_number: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShipmentPackage {
  id: string;
  shipment_id: string;
  package_number: number;
  package_type: PackageType;
  weight: number;
  length: number;
  width: number;
  height: number;
  declared_value: number | null;
  contents_description: string | null;
  tracking_number: string | null;
  created_at: string;
}

export interface ShipmentSpecialHandling {
  id: string;
  shipment_id: string;
  handling_type: HandlingType;
  is_applied: boolean;
  fee: number;
  instructions: string | null;
  created_at: string;
}

export interface ShipmentDeliveryPreferences {
  id: string;
  shipment_id: string;
  delivery_date: string | null;
  delivery_time_start: string | null;
  delivery_time_end: string | null;
  saturday_delivery: boolean;
  sunday_delivery: boolean;
  hold_at_facility: boolean;
  hold_facility_address_id: string | null;
  leave_without_signature: boolean;
  signature_required: boolean;
  adult_signature_required: boolean;
  delivery_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface HazmatDetails {
  id: string;
  shipment_id: string;
  is_hazmat: boolean;
  hazmat_class: HazmatClass | null;
  un_number: string | null;
  proper_shipping_name: string | null;
  hazard_class: string | null;
  packing_group: string | null;
  quantity: number | null;
  unit_of_measure: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  technical_name: string | null;
  subsidiary_risk: string | null;
  limited_quantity: boolean;
  reportable_quantity: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  shipment_id: string | null;
  organization_id: string;
  carrier_id: string;
  service_type_id: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  base_rate: number;
  fuel_surcharge: number;
  residential_fee: number;
  extended_area_fee: number;
  handling_fees: number;
  insurance_cost: number;
  total_cost: number;
  currency: string;
  estimated_delivery: string | null;
  is_selected: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface PaymentInfo {
  id: string;
  organization_id: string;
  payment_type: PaymentMethodType;
  display_name: string;
  is_default: boolean;
  is_verified: boolean;
  status: string;
  billing_address_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentPurchaseOrder {
  id: string;
  payment_info_id: string;
  po_number: string;
  po_expiry_date: string | null;
  authorized_amount: number | null;
  remaining_amount: number | null;
  department: string | null;
  cost_center: string | null;
  gl_account: string | null;
  approver_name: string | null;
  approver_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentBillOfLading {
  id: string;
  payment_info_id: string;
  bol_number: string;
  carrier_id: string | null;
  account_number: string | null;
  authorized_amount: number | null;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentThirdParty {
  id: string;
  payment_info_id: string;
  company_name: string;
  account_number: string;
  address_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  authorization_on_file: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentNetTerms {
  id: string;
  payment_info_id: string;
  terms_days: number;
  credit_limit: number | null;
  current_balance: number;
  available_credit: number | null;
  credit_approved_by: string | null;
  credit_approved_date: string | null;
  payment_due_date: string | null;
  early_payment_discount_percent: number;
  early_payment_discount_days: number;
  late_fee_percent: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentNetTermsReference {
  id: string;
  net_terms_id: string;
  reference_type: string;
  reference_id: string;
  reference_number: string | null;
  amount: number;
  created_at: string;
}

export interface PaymentCorporateAccount {
  id: string;
  payment_info_id: string;
  account_number: string;
  department_code: string | null;
  cost_center: string | null;
  project_code: string | null;
  authorized_users: string[] | null;
  monthly_limit: number | null;
  current_month_spend: number;
  created_at: string;
  updated_at: string;
}

export interface PickupDetails {
  id: string;
  shipment_id: string;
  pickup_number: string | null;
  carrier_id: string | null;
  pickup_address_id: string;
  pickup_date: string;
  ready_time: string;
  close_time: string;
  status: PickupStatus;
  special_instructions: string | null;
  driver_instructions: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_number: string | null;
  picked_up_at: string | null;
  pickup_proof_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PickupContact {
  id: string;
  pickup_id: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  is_primary: boolean;
  available_from: string | null;
  available_until: string | null;
  created_at: string;
}

export interface PickupAccessRequirement {
  id: string;
  pickup_id: string;
  access_type: AccessType;
  instructions: string | null;
  security_code: string | null;
  created_at: string;
}

export interface PickupEquipmentNeed {
  id: string;
  pickup_id: string;
  equipment_type: EquipmentType;
  quantity: number;
  is_required: boolean;
  notes: string | null;
  created_at: string;
}

export interface PickupAuthorizedPersonnel {
  id: string;
  pickup_id: string;
  person_name: string;
  person_title: string | null;
  id_type: string | null;
  id_number: string | null;
  is_primary_contact: boolean;
  created_at: string;
}

export interface PickupNotification {
  id: string;
  pickup_id: string;
  notification_type: string;
  recipient: string;
  recipient_name: string | null;
  notify_on_confirm: boolean;
  notify_on_pickup: boolean;
  notify_on_exception: boolean;
  created_at: string;
}

export interface ShipmentEvent {
  id: string;
  shipment_id: string;
  event_code: string;
  event_name: string;
  event_description: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  location_postal_code: string | null;
  occurred_at: string;
  recorded_at: string;
  carrier_status_code: string | null;
  carrier_status_description: string | null;
  raw_data: Record<string, unknown> | null;
  is_internal: boolean;
  created_by: string | null;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  organization_id: string;
  type: PaymentMethodType;
  provider: string;
  provider_customer_id: string | null;
  provider_payment_method_id: string | null;
  display_brand: string | null;
  display_last4: string | null;
  display_exp_month: number | null;
  display_exp_year: number | null;
  bank_name: string | null;
  account_type: string | null;
  account_last4: string | null;
  billing_account_number: string | null;
  is_default: boolean;
  is_verified: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  organization_id: string;
  payment_method_id: string | null;
  payment_info_id: string | null;
  amount: number;
  currency: string;
  provider: string;
  provider_payment_intent_id: string | null;
  provider_charge_id: string | null;
  status: PaymentStatus;
  failure_message: string | null;
  invoice_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================
// DATABASE SCHEMA TYPE
// ============================================

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      addresses: {
        Row: Address;
        Insert: Omit<Address, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Address, 'id' | 'created_at' | 'updated_at'>>;
      };
      carriers: {
        Row: Carrier;
        Insert: Omit<Carrier, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Carrier, 'id' | 'created_at' | 'updated_at'>>;
      };
      service_types: {
        Row: ServiceType;
        Insert: Omit<ServiceType, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<ServiceType, 'id' | 'created_at' | 'updated_at'>>;
      };
      shipments: {
        Row: Shipment;
        Insert: Omit<Shipment, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Shipment, 'id' | 'created_at' | 'updated_at'>>;
      };
      shipment_packages: {
        Row: ShipmentPackage;
        Insert: Omit<ShipmentPackage, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<ShipmentPackage, 'id' | 'created_at'>>;
      };
      shipment_special_handling: {
        Row: ShipmentSpecialHandling;
        Insert: Omit<ShipmentSpecialHandling, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<ShipmentSpecialHandling, 'id' | 'created_at'>>;
      };
      shipment_delivery_preferences: {
        Row: ShipmentDeliveryPreferences;
        Insert: Omit<ShipmentDeliveryPreferences, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<ShipmentDeliveryPreferences, 'id' | 'created_at' | 'updated_at'>>;
      };
      hazmat_details: {
        Row: HazmatDetails;
        Insert: Omit<HazmatDetails, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<HazmatDetails, 'id' | 'created_at' | 'updated_at'>>;
      };
      quotes: {
        Row: Quote;
        Insert: Omit<Quote, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Quote, 'id' | 'created_at'>>;
      };
      payment_info: {
        Row: PaymentInfo;
        Insert: Omit<PaymentInfo, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<PaymentInfo, 'id' | 'created_at' | 'updated_at'>>;
      };
      payment_purchase_orders: {
        Row: PaymentPurchaseOrder;
        Insert: Omit<PaymentPurchaseOrder, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<PaymentPurchaseOrder, 'id' | 'created_at' | 'updated_at'>>;
      };
      payment_bills_of_lading: {
        Row: PaymentBillOfLading;
        Insert: Omit<PaymentBillOfLading, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<PaymentBillOfLading, 'id' | 'created_at' | 'updated_at'>>;
      };
      payment_third_party: {
        Row: PaymentThirdParty;
        Insert: Omit<PaymentThirdParty, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<PaymentThirdParty, 'id' | 'created_at' | 'updated_at'>>;
      };
      payment_net_terms: {
        Row: PaymentNetTerms;
        Insert: Omit<PaymentNetTerms, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<PaymentNetTerms, 'id' | 'created_at' | 'updated_at'>>;
      };
      payment_net_terms_references: {
        Row: PaymentNetTermsReference;
        Insert: Omit<PaymentNetTermsReference, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<PaymentNetTermsReference, 'id' | 'created_at'>>;
      };
      payment_corporate_accounts: {
        Row: PaymentCorporateAccount;
        Insert: Omit<PaymentCorporateAccount, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<PaymentCorporateAccount, 'id' | 'created_at' | 'updated_at'>>;
      };
      pickup_details: {
        Row: PickupDetails;
        Insert: Omit<PickupDetails, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<PickupDetails, 'id' | 'created_at' | 'updated_at'>>;
      };
      pickup_contacts: {
        Row: PickupContact;
        Insert: Omit<PickupContact, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<PickupContact, 'id' | 'created_at'>>;
      };
      pickup_access_requirements: {
        Row: PickupAccessRequirement;
        Insert: Omit<PickupAccessRequirement, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<PickupAccessRequirement, 'id' | 'created_at'>>;
      };
      pickup_equipment_needs: {
        Row: PickupEquipmentNeed;
        Insert: Omit<PickupEquipmentNeed, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<PickupEquipmentNeed, 'id' | 'created_at'>>;
      };
      pickup_authorized_personnel: {
        Row: PickupAuthorizedPersonnel;
        Insert: Omit<PickupAuthorizedPersonnel, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<PickupAuthorizedPersonnel, 'id' | 'created_at'>>;
      };
      pickup_notifications: {
        Row: PickupNotification;
        Insert: Omit<PickupNotification, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<PickupNotification, 'id' | 'created_at'>>;
      };
      shipment_events: {
        Row: ShipmentEvent;
        Insert: Omit<ShipmentEvent, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<ShipmentEvent, 'id' | 'created_at'>>;
      };
      payment_methods: {
        Row: PaymentMethod;
        Insert: Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Payment, 'id' | 'created_at' | 'updated_at'>>;
      };
      activity_log: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<ActivityLog, 'id' | 'created_at'>>;
      };
    };
  };
}
