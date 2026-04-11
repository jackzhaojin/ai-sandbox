# B2B Postal Checkout Flow - Research & Implementation Plan

**Status**: Research Complete  
**Date**: April 11, 2026  
**Contract**: contract-1775939155064  
**Step**: 1 of 47  
**Project**: B2B Postal Checkout Flow

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Constraints (v2.1.7 Harness)](#critical-constraints-v217-harness)
3. [User Journey Analysis](#user-journey-analysis)
4. [Requirements Analysis (9 Documents)](#requirements-analysis-9-documents)
5. [Data Model Architecture](#data-model-architecture)
6. [Database Schema Design (postal_v2)](#database-schema-design-postal_v2)
7. [API Architecture](#api-architecture)
8. [Component Hierarchy](#component-hierarchy)
9. [State Management Strategy](#state-management-strategy)
10. [Seed Data Strategy](#seed-data-strategy)
11. [Integration Points & Critical Paths](#integration-points--critical-paths)
12. [Implementation Roadmap](#implementation-roadmap)
13. [Step 0 Completion Handoff Plan](#step-0-completion-handoff-plan)
14. [Risk Assessment](#risk-assessment)
15. [References](#references)

---

## Executive Summary

This document provides comprehensive research and planning for the B2B Postal Checkout Flow project. Based on analysis of previous project runs (particularly the failed 2026-04-06 attempt with 32 steps, 52 commits, 0 working end-to-end flows), this plan establishes a strict vertical-slice development approach with integration gates every 3 steps.

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Next.js 15 (App Router) | Server Components, SSR, optimal performance |
| **Database** | Cloud Supabase ONLY | postal_v2 schema, no localStorage constraint |
| **UI Library** | shadcn/ui + Tailwind v4 | Accessible, customizable, modern styling |
| **Forms** | React Hook Form + Zod | Type-safe validation, performance |
| **State Management** | URL + Database ONLY | Constraint: NO localStorage |
| **Testing** | Playwright with append-only journey.spec.ts | E2E for critical checkout flows |

### Critical Lesson from Previous Run

The 2026-04-06 postal-checkout run failed because developers built components against hardcoded mock data when the database was available. This led to "beautiful parts that didn't connect."

**This run's mandate**: Every step must be verified end-to-end through the cloud database — NO localStorage, NO hardcoded mocks when DB is available.

---

## Critical Constraints (v2.1.7 Harness)

### 1. Cloud Supabase ONLY
- **NO local Docker**, no `supabase start`
- **ALL tables in postal_v2 schema** (never touch public schema)
- Credentials from `.env.app` (APP_SUPABASE_*)
- Connection pooling for performance

### 2. No localStorage for Wizard State
- All state persisted to cloud Supabase
- URL-based navigation with shipment_id
- Data must survive page reloads

### 3. Integration Gates Every 3 Steps
| Gate | Steps | Verification |
|------|-------|--------------|
| Gate 1 | Steps 1-3 | Shipment → Rates → Select Rate → Persist |
| Gate 2 | Steps 4-6 | Full flow through Payment |
| Gate 3 | Steps 7-9 | Full flow through Pickup |
| Gate 4 | Steps 10-12 | Full flow through Review |
| Gate 5 | Steps 13-15 | Complete end-to-end flow |

### 4. Append-Only journey.spec.ts
- `tests/e2e/journey.spec.ts` grows with each step
- Never rewrite prior blocks — extend only
- Each gate extends the helper function

---

## User Journey Analysis

### Complete 6-Step Checkout Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         B2B POSTAL CHECKOUT FLOW                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  STEP 1                    STEP 2                    STEP 3                     │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐             │
│  │ /shipments/ │    →     │   /rates    │    →     │  /payment   │             │
│  │    new      │          │   SELECT    │          │   SELECT    │             │
│  └─────────────┘          └─────────────┘          └─────────────┘             │
│        │                        │                        │                      │
│        ▼                        ▼                        ▼                      │
│  • Origin Address         • Fetch quotes            • 5 B2B methods            │
│  • Dest Address           • Compare carriers        • Validation rules         │
│  • Package config         • Select rate             • Credit checks            │
│  • POST /api/shipments    • PATCH /api/shipments    • POST /api/payments       │
│                                                                                 │
│  STEP 4                    STEP 5                    STEP 6                     │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐             │
│  │  /pickup    │    →     │  /review    │    →     │  /confirm   │             │
│  │  SCHEDULE   │          │   REVIEW    │          │ CONFIRMED   │             │
│  └─────────────┘          └─────────────┘          └─────────────┘             │
│        │                        │                        │                      │
│        ▼                        ▼                        ▼                      │
│  • Date/time slots        • Full summary            • Tracking number          │
│  • Access requirements    • All data visible        • /shipments/{id}          │
│  • GET /api/pickup-slots  • Confirm → create        • Queryable in DB          │
│  • POST /api/pickups      • POST /api/confirm       • Email confirmation       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Between Steps

| From Step | To Step | Data Passed | Persistence |
|-----------|---------|-------------|-------------|
| 1 (Details) | 2 (Rates) | shipment_id (UUID) | Supabase `shipments` table |
| 2 (Rates) | 3 (Payment) | selected_quote_id | Supabase `quotes` table + shipment update |
| 3 (Payment) | 4 (Pickup) | payment_id, status='paid' | Supabase `payments` table |
| 4 (Pickup) | 5 (Review) | pickup_details_id | Supabase `pickup_details` table |
| 5 (Review) | 6 (Confirm) | confirmed_shipment with tracking | Final state in DB |

---

## Requirements Analysis (9 Documents)

### 1. Overview (01-overview.md)

**Core Functionality:**
- Multi-step checkout wizard for B2B postal shipments
- Organization-based access (multi-user accounts)
- Real-time rate calculation from multiple carriers
- Multiple B2B payment methods
- Pickup scheduling with time slots
- Order tracking and confirmation

**Key Features:**
- Origin/Destination Address with validation
- Package Configuration: Type, dimensions, weight, declared value
- Special Handling: Fragile, hazardous, temperature-controlled, signature options
- Reference Information: PO number, reference numbers
- Multi-piece support: Up to 20 packages per shipment

### 2. Data Models (02-data-models.md)

**Core Entities:**

```typescript
// Organization & Users
interface Organization {
  id: string;
  name: string;
  slug: string;
  tax_id?: string;
  billing_email: string;
  payment_terms: 'immediate' | 'net15' | 'net30' | 'net60';
  credit_limit?: number;
  status: 'active' | 'suspended' | 'inactive';
}

interface User {
  id: string;  // Matches Supabase Auth
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  organization_id: string;
  role: 'admin' | 'manager' | 'user';
}

interface Address {
  id: string;
  organization_id: string;
  label: string;  // "Main Office", "Warehouse"
  recipient_name: string;
  recipient_phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;  // ISO 3166-1 alpha-2
  is_verified: boolean;
  is_default_shipping: boolean;
  is_default_billing: boolean;
}

interface Shipment {
  id: string;
  organization_id: string;
  user_id: string;
  status: ShipmentStatus;
  
  // Sender
  sender_address_id: string;
  sender_contact_name: string;
  sender_contact_phone?: string;
  sender_contact_email?: string;
  
  // Recipient
  recipient_address_id: string;
  recipient_contact_name: string;
  recipient_contact_phone?: string;
  recipient_contact_email?: string;
  
  // Package
  package_type: 'box' | 'envelope' | 'tube' | 'pallet';
  weight: number;
  length: number;
  width: number;
  height: number;
  declared_value?: number;
  contents_description: string;
  
  // Shipping
  carrier_id?: string;
  service_type_id?: string;
  estimated_delivery?: Date;
  
  // Rates
  base_rate?: number;
  fuel_surcharge?: number;
  total_cost?: number;
  currency: string;
  
  // Tracking
  tracking_number?: string;
  
  // Relations
  selected_quote_id?: string;
  payment_id?: string;
}
```

### 3. API Endpoints (03-api-endpoints.md)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Service health check |
| `/api/shipments` | POST | Create new shipment (Step 1) |
| `/api/shipments/[id]` | GET/PATCH | Shipment CRUD |
| `/api/rates` | POST | Calculate multi-carrier quotes (Step 2) |
| `/api/rates/select` | POST | Select a rate for shipment |
| `/api/payments/process` | POST | Process payment (Step 3) |
| `/api/pickup-slots` | GET | Available pickup slots (Step 4) |
| `/api/pickups` | POST | Schedule pickup |
| `/api/shipments/[id]/confirm` | POST | Final confirmation (Step 6) |

### 4. Business Logic (04-business-logic.md)

**Pricing Engine:**
- Base rate from carrier + service_type
- Fuel surcharge calculation (varies by carrier)
- Special handling fees (fragile: +$5, hazardous: +$25, etc.)
- Volume discounts for high-value accounts

**Pickup Rules:**
- Same-day cutoff: 2 PM local time
- Weekend pickup premiums (+$50)
- Residential vs commercial fees (+$15 for residential)
- After-hours pickup: +$25

### 5. Components (05-components.md)

**Component Hierarchy:**
```
app/
├── shipments/
│   ├── new/page.tsx              # Step 1: Shipment details
│   └── [id]/
│       ├── rates/page.tsx        # Step 2: Rate selection
│       ├── payment/page.tsx      # Step 3: Payment
│       ├── pickup/page.tsx       # Step 4: Pickup scheduling
│       ├── review/page.tsx       # Step 5: Review
│       └── confirm/page.tsx      # Step 6: Confirmation

components/
├── ui/                           # shadcn/ui components
├── shared/                       # Reusable form components
│   ├── FormField.tsx
│   ├── AddressInput.tsx
│   ├── ContactInput.tsx
│   ├── StepIndicator.tsx
│   └── LoadingSpinner.tsx
├── shipments/                    # Shipment-specific
├── rates/                        # Rate selection
├── payment/                      # Payment
├── pickup/                       # Pickup
└── review/                       # Review
```

### 6. Design System (06-design-system.md)

- **Framework**: Tailwind CSS v4 with shadcn/ui
- **Color palette**: Primary (slate), Accent (blue)
- **Typography**: Inter font family
- **Spacing**: 4px base unit
- **Components**: Button, Input, Select, Card, Dialog, Form, Label, Toast

### 7. Pickup Scheduling (07-pickup-scheduling.md)

**Calendar Logic:**
- Available slots from `pickup_slots` table
- Business days only (Mon-Fri)
- 2-hour time windows (9-11 AM, 11 AM-1 PM, 1-3 PM, 3-5 PM)
- Cutoff: 2 PM for next-day pickup

**Access Requirements:**
- Gate codes / Access instructions
- Building type (warehouse, office, residential)
- Floor/Unit number
- Elevator availability
- Loading dock access

### 8. Payment Methods (08-payment-methods.md)

**5 B2B Payment Methods:**

1. **Purchase Order (PO)**
   - PO number input
   - Authorized by field
   - PO document upload (optional)

2. **Net Terms (15/30/60 days)**
   - Credit limit check
   - Available credit display
   - Approval workflow

3. **Bill of Lading (BOL)**
   - BOL number input
   - Carrier reference

4. **Third Party Billing**
   - Account number
   - Carrier selection
   - Billing address

5. **Corporate Account**
   - Account number
   - Pre-registered account

### 9. Validation Rules (09-validation-rules.md)

**Zod Schemas Required:**

```typescript
// Shipment details validation
const shipmentDetailsSchema = z.object({
  sender_address: addressSchema,
  recipient_address: addressSchema,
  package: z.object({
    type: z.enum(['box', 'envelope', 'tube', 'pallet']),
    weight: z.number().positive().max(150), // lbs
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    }),
    declared_value: z.number().optional(),
  }),
  contents_description: z.string().min(10).max(500),
});

// Address validation
const addressSchema = z.object({
  recipient_name: z.string().min(2).max(100),
  line1: z.string().min(5).max(100),
  line2: z.string().max(100).optional(),
  city: z.string().min(2).max(50),
  state: z.string().length(2), // US state code
  postal_code: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.string().length(2).default('US'),
});
```

---

## Data Model Architecture

### Entity Relationship Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   organizations │────▶│      users       │◀────│  auth.users     │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         │         ┌──────────────────┐
         └────────▶│  addresses       │
                   └──────────────────┘
                            │
┌─────────────────┐         │         ┌──────────────────┐
│   shipments     │◀────────┘         │   carriers       │
└────────┬────────┘                   └────────┬─────────┘
         │                                     │
         │         ┌──────────────────┐        │
         ├────────▶│  quotes          │        │
         │         └──────────────────┘        │
         │                                     │
         │         ┌──────────────────┐        │
         ├────────▶│  payments        │        │
         │         └──────────────────┘        │
         │                                     │
         │         ┌──────────────────┐        │
         └────────▶│  pickup_details  │        │
                   └──────────────────┘        │
                                               │
                   ┌──────────────────┐        │
                   │  service_types   │◀───────┘
                   └──────────────────┘
```

---

## Database Schema Design (postal_v2)

### Full SQL Schema

```sql
-- ============================================
-- 1. SCHEMA CREATION
-- ============================================
CREATE SCHEMA IF NOT EXISTS postal_v2;
SET search_path TO postal_v2;

-- ============================================
-- 2. ENUM TYPES
-- ============================================
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE organization_status AS ENUM ('active', 'suspended', 'inactive');
CREATE TYPE payment_term AS ENUM ('immediate', 'net15', 'net30', 'net60');
CREATE TYPE address_type AS ENUM ('residential', 'commercial');
CREATE TYPE package_type AS ENUM ('box', 'envelope', 'tube', 'pallet');
CREATE TYPE shipment_status AS ENUM (
  'draft', 'pending_payment', 'paid', 'label_generated', 
  'picked_up', 'in_transit', 'delivered', 'cancelled'
);
CREATE TYPE carrier_code AS ENUM ('pex', 'vc', 'efl', 'fs');
CREATE TYPE service_category AS ENUM ('ground', 'air', 'express', 'freight', 'international');
CREATE TYPE payment_method_type AS ENUM ('purchase_order', 'net_terms', 'bill_of_lading', 'third_party', 'corporate_account');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');
CREATE TYPE handling_type AS ENUM ('fragile', 'hazardous', 'temperature_controlled', 'signature_required', 'adult_signature', 'hold_for_pickup', 'appointment_delivery');

-- ============================================
-- 3. ORGANIZATIONS
-- ============================================
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  tax_id text,
  billing_email text NOT NULL,
  billing_address_id uuid,
  payment_terms payment_term DEFAULT 'immediate',
  credit_limit decimal(12,2),
  status organization_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 4. USERS
-- ============================================
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role user_role DEFAULT 'user',
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 5. ADDRESSES
-- ============================================
CREATE TABLE addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label text NOT NULL,
  recipient_name text NOT NULL,
  recipient_phone text,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'US',
  address_type address_type DEFAULT 'commercial',
  is_verified boolean DEFAULT false,
  is_default_shipping boolean DEFAULT false,
  is_default_billing boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 6. CARRIERS
-- ============================================
CREATE TABLE carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code carrier_code NOT NULL UNIQUE,
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
CREATE TABLE service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id uuid NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  category service_category NOT NULL,
  base_rate decimal(10,2) NOT NULL,
  transit_days_min integer NOT NULL,
  transit_days_max integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 8. SHIPMENTS
-- ============================================
CREATE TABLE shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  
  -- Sender
  sender_address_id uuid NOT NULL REFERENCES addresses(id),
  sender_contact_name text NOT NULL,
  sender_contact_phone text,
  sender_contact_email text,
  
  -- Recipient
  recipient_address_id uuid NOT NULL REFERENCES addresses(id),
  recipient_contact_name text NOT NULL,
  recipient_contact_phone text,
  recipient_contact_email text,
  
  -- Package
  package_type package_type NOT NULL,
  weight decimal(10,3) NOT NULL,
  length decimal(10,2) NOT NULL,
  width decimal(10,2) NOT NULL,
  height decimal(10,2) NOT NULL,
  declared_value decimal(12,2),
  contents_description text NOT NULL,
  
  -- Shipping
  carrier_id uuid REFERENCES carriers(id),
  service_type_id uuid REFERENCES service_types(id),
  estimated_delivery timestamptz,
  
  -- Rates
  base_rate decimal(10,2),
  fuel_surcharge decimal(10,2) DEFAULT 0,
  insurance_cost decimal(10,2) DEFAULT 0,
  total_cost decimal(10,2),
  currency text DEFAULT 'USD',
  
  -- Status
  status shipment_status DEFAULT 'draft',
  tracking_number text,
  label_url text,
  
  -- Relations
  selected_quote_id uuid,
  payment_id uuid,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 9. QUOTES
-- ============================================
CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  carrier_id uuid NOT NULL REFERENCES carriers(id),
  service_type_id uuid NOT NULL REFERENCES service_types(id),
  base_rate decimal(10,2) NOT NULL,
  fuel_surcharge decimal(10,2) NOT NULL DEFAULT 0,
  total_cost decimal(10,2) NOT NULL,
  estimated_delivery timestamptz NOT NULL,
  is_selected boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 10. PAYMENT INFO (Parent table)
-- ============================================
CREATE TABLE payment_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type payment_method_type NOT NULL,
  status text DEFAULT 'active',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 11. PAYMENT METHOD: PURCHASE ORDER
-- ============================================
CREATE TABLE payment_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_id uuid NOT NULL REFERENCES payment_info(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  authorized_by text,
  po_document_url text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 12. PAYMENT METHOD: NET TERMS
-- ============================================
CREATE TABLE payment_net_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_id uuid NOT NULL REFERENCES payment_info(id) ON DELETE CASCADE,
  term_days integer NOT NULL CHECK (term_days IN (15, 30, 60)),
  credit_limit decimal(12,2) NOT NULL,
  available_credit decimal(12,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 13. PAYMENT METHOD: BILL OF LADING
-- ============================================
CREATE TABLE payment_bills_of_lading (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_id uuid NOT NULL REFERENCES payment_info(id) ON DELETE CASCADE,
  bol_number text NOT NULL,
  carrier text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 14. PAYMENT METHOD: THIRD PARTY
-- ============================================
CREATE TABLE payment_third_party (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_id uuid NOT NULL REFERENCES payment_info(id) ON DELETE CASCADE,
  account_number text NOT NULL,
  carrier text NOT NULL,
  billing_address_id uuid REFERENCES addresses(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 15. PAYMENT METHOD: CORPORATE ACCOUNT
-- ============================================
CREATE TABLE payment_corporate_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_id uuid NOT NULL REFERENCES payment_info(id) ON DELETE CASCADE,
  account_number text NOT NULL,
  account_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 16. PAYMENTS (Transaction records)
-- ============================================
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shipment_id uuid NOT NULL REFERENCES shipments(id),
  payment_info_id uuid REFERENCES payment_info(id),
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  status payment_status DEFAULT 'pending',
  failure_message text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 17. PICKUP SLOTS (Available time windows)
-- ============================================
CREATE TABLE pickup_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date date NOT NULL,
  time_window text NOT NULL, -- e.g., "09:00-11:00"
  is_available boolean DEFAULT true,
  capacity integer DEFAULT 10,
  booked_count integer DEFAULT 0,
  fee decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 18. PICKUP DETAILS
-- ============================================
CREATE TABLE pickup_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  pickup_slot_id uuid NOT NULL REFERENCES pickup_slots(id),
  pickup_address_id uuid REFERENCES addresses(id),
  instructions text,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 19. INDEXES
-- ============================================
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_addresses_org ON addresses(organization_id);
CREATE INDEX idx_shipments_org ON shipments(organization_id);
CREATE INDEX idx_shipments_user ON shipments(user_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX idx_quotes_shipment ON quotes(shipment_id);
CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payment_info_org ON payment_info(organization_id);
CREATE INDEX idx_pickup_details_shipment ON pickup_details(shipment_id);
CREATE INDEX idx_pickup_slots_date ON pickup_slots(slot_date);

-- ============================================
-- 20. RLS POLICIES
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_details ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can view their own org
CREATE POLICY "Users can view their organization" 
  ON organizations FOR SELECT 
  USING (id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Users: Users can view other users in their org
CREATE POLICY "Users can view org members" 
  ON users FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Addresses: Users can view org addresses
CREATE POLICY "Users can view org addresses" 
  ON addresses FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Shipments: Users can view org shipments
CREATE POLICY "Users can view org shipments" 
  ON shipments FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Shipments: Users can create shipments
CREATE POLICY "Users can create shipments" 
  ON shipments FOR INSERT 
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- ============================================
-- 21. FUNCTIONS & TRIGGERS
-- ============================================
-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER addresses_updated_at 
  BEFORE UPDATE ON addresses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER shipments_updated_at 
  BEFORE UPDATE ON shipments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_number IS NULL AND NEW.status = 'label_generated' THEN
    NEW.tracking_number := 'TRK-' || to_char(now(), 'YYYYMMDD') || '-' || substring(md5(random()::text), 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shipments_tracking_number
  BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION generate_tracking_number();
```

---

## API Architecture

### Response Format Standard

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### Endpoint Specifications

#### POST /api/shipments
```typescript
// Request
interface CreateShipmentRequest {
  sender_address: AddressInput;
  recipient_address: AddressInput;
  package: PackageInput;
  contents_description: string;
}

// Response
interface CreateShipmentResponse {
  shipment: Shipment;
  next_step_url: string; // /shipments/{id}/rates
}
```

#### POST /api/rates
```typescript
// Request
interface CalculateRatesRequest {
  shipment_id: string;
}

// Response
interface CalculateRatesResponse {
  quotes: Quote[];
}
```

#### POST /api/rates/select
```typescript
// Request
interface SelectRateRequest {
  shipment_id: string;
  quote_id: string;
}

// Response
interface SelectRateResponse {
  shipment: Shipment;
  next_step_url: string; // /shipments/{id}/payment
}
```

#### POST /api/payments/process
```typescript
// Request
interface ProcessPaymentRequest {
  shipment_id: string;
  payment_info_id: string;
  payment_method_type: PaymentMethodType;
  payment_details: PaymentDetails;
}

// Response
interface ProcessPaymentResponse {
  payment: Payment;
  next_step_url: string; // /shipments/{id}/pickup
}
```

#### GET /api/pickup-slots
```typescript
// Query params: from_date, to_date

// Response
interface PickupSlotsResponse {
  slots: PickupSlot[];
}
```

#### POST /api/pickups
```typescript
// Request
interface SchedulePickupRequest {
  shipment_id: string;
  pickup_slot_id: string;
  instructions?: string;
}

// Response
interface SchedulePickupResponse {
  pickup: PickupDetails;
  next_step_url: string; // /shipments/{id}/review
}
```

#### POST /api/shipments/[id]/confirm
```typescript
// Response
interface ConfirmShipmentResponse {
  shipment: Shipment;
  tracking_number: string;
  confirmation_url: string; // /shipments/{id}/confirm
}
```

---

## Component Hierarchy

### Directory Structure

```
app/
├── shipments/
│   ├── new/
│   │   └── page.tsx              # Step 1: Shipment details form
│   └── [id]/
│       ├── rates/
│       │   └── page.tsx          # Step 2: Rate selection
│       ├── payment/
│       │   └── page.tsx          # Step 3: Payment method
│       ├── pickup/
│       │   └── page.tsx          # Step 4: Pickup scheduling
│       ├── review/
│       │   └── page.tsx          # Step 5: Review & confirm
│       ├── confirm/
│       │   └── page.tsx          # Step 6: Confirmation
│       └── page.tsx              # View shipment details
├── api/
│   ├── shipments/
│   │   ├── route.ts
│   │   └── [id]/
│   │       ├── route.ts
│   │       └── confirm/
│   │           └── route.ts
│   ├── rates/
│   │   ├── route.ts
│   │   └── select/
│   │       └── route.ts
│   ├── payments/
│   │   └── process/
│   │       └── route.ts
│   └── pickup-slots/
│       └── route.ts
├── layout.tsx
└── page.tsx                      # Marketing home

components/
├── ui/                           # shadcn/ui components (auto-installed)
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── label.tsx
│   └── toast.tsx
├── shared/                       # Reusable form components
│   ├── FormField.tsx
│   ├── AddressInput.tsx
│   ├── ContactInput.tsx
│   ├── StepIndicator.tsx
│   ├── ProgressIndicator.tsx
│   └── LoadingSpinner.tsx
├── shipments/                    # Shipment-specific components
│   ├── PackageTypeSelector.tsx
│   ├── DimensionsInput.tsx
│   ├── WeightInput.tsx
│   └── PackageSummary.tsx
├── rates/                        # Rate selection components
│   ├── RateCard.tsx
│   ├── RateComparison.tsx
│   └── CarrierLogo.tsx
├── payment/                      # Payment components
│   ├── PaymentMethodSelector.tsx
│   ├── PurchaseOrderForm.tsx
│   ├── NetTermsSelector.tsx
│   ├── BillOfLadingForm.tsx
│   ├── ThirdPartyForm.tsx
│   └── CorporateAccountForm.tsx
├── pickup/                       # Pickup components
│   ├── PickupCalendar.tsx
│   ├── TimeWindowSelector.tsx
│   └── AccessRequirementsForm.tsx
└── review/                       # Review components
    ├── ShipmentReview.tsx
    ├── AddressReview.tsx
    └── CostBreakdown.tsx

lib/
├── supabase/                     # Supabase clients
│   ├── client.ts                 # Browser client
│   ├── server.ts                 # Server client
│   └── middleware.ts             # Session middleware
├── validation/                   # Zod schemas
│   ├── shipment-schema.ts
│   ├── address-schema.ts
│   ├── payment-schema.ts
│   └── pickup-schema.ts
├── api/                          # API utilities
│   └── response.ts               # Standardized responses
└── utils.ts                      # Helper functions

types/
└── database.ts                   # Generated Supabase types

tests/
└── e2e/
    └── journey.spec.ts           # Append-only E2E tests
```

---

## State Management Strategy

### Critical Constraint: NO localStorage

All wizard state MUST be persisted to cloud Supabase.

### State Flow Diagram

```
Step 1: /shipments/new
│
├── Create shipment via POST /api/shipments
├── Persist to postal_v2.shipments table
└── Navigate to /shipments/{id}/rates
    
Step 2: /shipments/{id}/rates
│
├── Fetch quotes via POST /api/rates
├── Persist quotes to postal_v2.quotes table
├── User selects rate
├── Update shipment.selected_quote_id
└── Navigate to /shipments/{id}/payment

Step 3: /shipments/{id}/payment
│
├── User selects payment method
├── Process via POST /api/payments/process
├── Persist to postal_v2.payments table
├── Update shipment.status = 'paid'
└── Navigate to /shipments/{id}/pickup

Step 4: /shipments/{id}/pickup
│
├── Fetch slots via GET /api/pickup-slots
├── User selects slot
├── Schedule via POST /api/pickups
├── Persist to postal_v2.pickup_details table
└── Navigate to /shipments/{id}/review

Step 5: /shipments/{id}/review
│
├── Fetch all persisted data from DB
├── Display complete summary
├── User confirms
└── Navigate to /shipments/{id}/confirm

Step 6: /shipments/{id}/confirm
│
├── Finalize via POST /api/shipments/{id}/confirm
├── Generate tracking_number
├── Update shipment.status = 'confirmed'
└── Display confirmation with tracking
```

### URL State Pattern

```typescript
// Navigation uses shipment_id in URL
/shipments/new                    → Create new shipment
/shipments/[id]/rates            → Step 2: Select rate
/shipments/[id]/payment          → Step 3: Payment
/shipments/[id]/pickup           → Step 4: Pickup
/shipments/[id]/review           → Step 5: Review
/shipments/[id]/confirm          → Step 6: Confirmation
/shipments/[id]                  → View shipment (post-confirmation)
```

---

## Seed Data Strategy

### File: `supabase/seed.sql`

### 1. Mock Carriers (3 carriers)

| Code | Name | Rating | Multiplier |
|------|------|--------|------------|
| PEX | Parcel Express | 4.5/5 | 1.0000 |
| VC | Velocity Courier | 4.8/5 | 1.1500 |
| EFL | Eagle Freight Lines | 4.2/5 | 0.9000 |

```sql
INSERT INTO postal_v2.carriers (code, name, display_name, rating, rate_multiplier) VALUES
('pex', 'Parcel Express', 'Parcel Express', 4.5, 1.0000),
('vc', 'Velocity Courier', 'Velocity Courier', 4.8, 1.1500),
('efl', 'Eagle Freight Lines', 'Eagle Freight Lines', 4.2, 0.9000);
```

### 2. Service Types (5 rates per carrier = 15 total)

```sql
-- Parcel Express services (5)
INSERT INTO postal_v2.service_types (carrier_id, code, name, category, base_rate, transit_days_min, transit_days_max) 
SELECT id, 'PEX-GND', 'Ground', 'ground', 8.50, 3, 5 FROM postal_v2.carriers WHERE code = 'pex';
-- ... 4 more services per carrier

-- Velocity Courier services (5)
INSERT INTO postal_v2.service_types (carrier_id, code, name, category, base_rate, transit_days_min, transit_days_max) 
SELECT id, 'VC-SD', 'Same Day', 'express', 45.00, 0, 0 FROM postal_v2.carriers WHERE code = 'vc';
-- ... 4 more services

-- Eagle Freight Lines services (5)
INSERT INTO postal_v2.service_types (carrier_id, code, name, category, base_rate, transit_days_min, transit_days_max) 
SELECT id, 'EFL-LTL', 'LTL Freight', 'freight', 125.00, 2, 5 FROM postal_v2.carriers WHERE code = 'efl';
-- ... 4 more services
```

### 3. Pickup Slots (3 available slots)

```sql
INSERT INTO postal_v2.pickup_slots (slot_date, time_window, is_available, capacity, fee) VALUES
(current_date + interval '1 day', '09:00-11:00', true, 10, 0),
(current_date + interval '1 day', '13:00-15:00', true, 10, 0),
(current_date + interval '2 days', '09:00-11:00', true, 10, 0);
```

### 4. Sample Organization & Shipment (for testing)

```sql
-- Sample organization
INSERT INTO postal_v2.organizations (name, slug, billing_email, payment_terms) VALUES
('Acme Corporation', 'acme-corp', 'billing@acme.com', 'net30');

-- Sample addresses (would need org_id from above)
-- Sample shipment (would need org_id, addresses)
```

---

## Integration Points & Critical Paths

### UI ↔ API ↔ Database Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│     UI      │────▶│     API     │────▶│   Supabase  │
│  Component  │     │    Route    │     │   (cloud)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
React Hook Form    Zod Validation       PostgreSQL
useForm()          schema.safeParse()   RLS Policies
onSubmit ─────────► POST handler ─────► INSERT/UPDATE
```

### Critical Integration Checkpoints

| Integration | From | To | Verification |
|-------------|------|-----|--------------|
| Shipment Create | /shipments/new | POST /api/shipments | Row in `postal_v2.shipments` table |
| Quote Fetch | /rates | POST /api/rates | Rows in `postal_v2.quotes` table |
| Rate Select | Rate card click | PATCH /api/shipments | `selected_quote_id` updated in DB |
| Payment Process | /payment | POST /api/payments | Row in `postal_v2.payments` table |
| Pickup Schedule | /pickup | POST /api/pickups | Row in `postal_v2.pickup_details` table |
| Final Confirm | /review | POST /api/confirm | Status='confirmed', tracking generated |

---

## Implementation Roadmap

### Phase 1: Foundation (Steps 2-4)
- **Step 2**: Set up cloud Supabase schema
  - Create postal_v2 schema
  - Run migration with all tables
  - Apply RLS policies
- **Step 3**: Seed database with test data
  - Insert 3 carriers
  - Insert 5 rates per carrier (15 total)
  - Insert 3 pickup slots
  - Create 1 sample shipment for testing
- **Step 4**: [GATE] End-to-end journey verification — checkpoint 1
  - Verify Supabase connection
  - Verify seed data accessible
  - Create health check API

### Phase 2: Project Setup (Steps 5-7)
- **Step 5**: Initialize Next.js 15 project with shadcn/ui
  - Install dependencies
  - Configure Tailwind v4
  - Set up folder structure
- **Step 6**: Configure Supabase client
  - Browser client
  - Server client
  - TypeScript types
- **Step 7**: Build shared components
  - FormField, AddressInput, StepIndicator
  - LoadingSpinner, ErrorBoundary

### Phase 3: Core Flow (Steps 8-20)
- **Steps 8-10**: Shipment details page
  - /shipments/new form
  - POST /api/shipments endpoint
  - Address validation
- **Steps 11-13**: Rate selection page
  - /shipments/[id]/rates page
  - POST /api/rates endpoint
  - RateCard component
- **Step 14**: [GATE] Checkpoint 2 (Details → Rates works)
- **Steps 15-17**: Payment page foundation
  - /shipments/[id]/payment page
  - 5 B2B payment method components
- **Steps 18-20**: Payment processing
  - POST /api/payments/process endpoint
  - Validation rules for each method
- **Step 21**: [GATE] Checkpoint 3 (through Payment works)

### Phase 4: Completion (Steps 22-35)
- **Steps 22-24**: Pickup scheduling
  - /shipments/[id]/pickup page
  - GET /api/pickup-slots endpoint
  - POST /api/pickups endpoint
- **Step 25**: [GATE] Checkpoint 4 (through Pickup works)
- **Steps 26-28**: Review page
  - /shipments/[id]/review page
  - Complete summary display
- **Steps 29-31**: Confirmation page
  - /shipments/[id]/confirm page
  - POST /api/shipments/[id]/confirm endpoint
  - Tracking number generation
- **Step 32**: [GATE] Checkpoint 5 (complete flow works)
- **Steps 33-35**: Dashboard pages
  - /shipments list page
  - /shipments/[id] detail page

### Phase 5: Polish & Testing (Steps 36-47)
- **Steps 36-40**: E2E test expansion
  - Extend journey.spec.ts
  - Add error scenario tests
- **Steps 41-45**: Performance optimization
  - Image optimization
  - Code splitting
  - API response caching
- **Steps 46-47**: Final verification
  - Complete E2E test suite
  - Documentation
  - Final [GATE] verification

---

## Step 0 Completion Handoff Plan

### Prerequisites for Step 1 (Foundation)

The following items must be completed by Step 0 (pre-work):

| # | Item | Verification Command | Expected Result |
|---|------|---------------------|-----------------|
| 1 | Cloud Supabase connection confirmed | `curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/` | Returns 401 (auth required) |
| 2 | postal_v2 schema created | `\dn postal_v2` in SQL Editor | Schema exists |
| 3 | All tables migrated | `\dt postal_v2.*` in SQL Editor | 20+ tables listed |
| 4 | Seed data loaded | `SELECT COUNT(*) FROM postal_v2.carriers` | Returns 3 |
| 5 | Next.js project initialized | `ls package.json` | File exists |
| 6 | shadcn/ui installed | `ls components/ui/button.tsx` | File exists |
| 7 | Basic routing structure | `ls app/shipments/new/page.tsx` | File exists |

### Step 1-4 Quick Reference

**Step 2: Set up cloud Supabase schema**
```bash
# Apply migration
supabase db push

# Verify
supabase migration list
```

**Step 3: Seed database with test data**
```bash
# Run seed SQL
supabase db reset --linked
# OR
supabase sql < supabase/seed.sql
```

**Step 4: [GATE] End-to-end journey verification — checkpoint 1**
```bash
# Run verification
npm run test:e2e -- tests/e2e/journey.spec.ts

# Should verify:
# - Supabase connection works
# - Seed data accessible
# - Health check API responds
```

---

## Risk Assessment

### High Risk: localStorage Prohibition

**Risk**: Developers may default to localStorage for wizard state.  
**Mitigation**:
- Document constraint prominently
- Code review check for `localStorage` usage
- E2E tests verify data persists across page reloads

### High Risk: Mock Data vs Real Integration

**Risk**: Building components with hardcoded data instead of real API integration.  
**Mitigation**:
- Seed data available from Step 3
- Every component must read/write to real database
- Gate checkpoints enforce real data verification
- Code review rejects hardcoded mock data

### Medium Risk: Cloud-Only Database Access

**Risk**: Development requires live Supabase connection.  
**Mitigation**:
- Document environment setup clearly
- Use Supabase free tier for development
- Connection pooling for performance
- Document fallback strategy if connection fails

### Medium Risk: Payment Validation Complexity

**Risk**: 5 B2B payment methods with complex validation rules.  
**Mitigation**:
- Implement one method at a time
- Each method has isolated validation function
- Unit tests for each validation rule
- Clear error messages for validation failures

### Low Risk: TypeScript Type Generation

**Risk**: Supabase types may drift from schema.  
**Mitigation**:
- Type generation script in package.json
- CI check for type consistency
- Regular type regeneration

---

## References

### Previous Projects

| Project | Path | Notes |
|---------|------|-------|
| B2B Postal Checkout (Apr 5) | `/Users/jackjin/dev/ai-sandbox/projects/nextjs/2026-04-05/1775414201963/` | 32 steps, 0 working flows |
| B2B Postal Checkout (Apr 11) | `/Users/jackjin/dev/ai-sandbox/projects/nextjs/2026-04-11/1775931318881/` | Similar requirements |
| B2B Postal Checkout (Apr 11) | `/Users/jackjin/dev/ai-sandbox/projects/nextjs/2026-04-11/1775938112028/` | 30-step variant |

### Documentation

- Next.js 15 Docs: https://nextjs.org/docs
- Supabase SSR Guide: https://supabase.com/docs/guides/auth/server-side
- shadcn/ui: https://ui.shadcn.com
- React Hook Form: https://react-hook-form.com
- Zod Validation: https://zod.dev

---

## Success Criteria

This research step is complete when:

1. ✅ All requirements documents analyzed (01-overview through 09-validation-rules)
2. ✅ Full user journey documented with data flow between steps
3. ✅ Complete database schema designed for postal_v2 (all 20+ tables)
4. ✅ Seed data strategy documented (3 carriers, 5 rates each, 3 pickup slots)
5. ✅ API architecture and endpoints specified
6. ✅ Component hierarchy and file structure defined
7. ✅ State management strategy (NO localStorage) documented
8. ✅ Integration points and critical paths mapped
9. ✅ Implementation roadmap with 47 steps planned
10. ✅ Step 0 completion handoff plan created
11. ✅ Risk assessment completed

The next step (Step 2) can begin with confidence in the architectural approach.

---

*Document Version: 1.0*  
*Last Updated: 2026-04-11*  
*Author: Research Step (Step 1 of 47)*
