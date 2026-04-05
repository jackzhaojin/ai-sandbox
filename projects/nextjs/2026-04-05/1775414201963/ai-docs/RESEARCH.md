# B2B Postal Checkout Flow - Research & Architecture Plan

**Created**: April 5, 2026  
**Status**: Draft  
**Project**: B2B Postal Checkout Flow  
**Contract**: contract-1775414201963  
**Step**: 1 of 18

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Requirements Analysis](#requirements-analysis)
3. [Data Model Architecture](#data-model-architecture)
4. [Tech Stack Analysis](#tech-stack-analysis)
5. [Project Structure](#project-structure)
6. [Supabase Schema Design](#supabase-schema-design)
7. [API Route Architecture](#api-route-architecture)
8. [Component Hierarchy](#component-hierarchy)
9. [Form Validation Strategy](#form-validation-strategy)
10. [State Management Approach](#state-management-approach)
11. [Testing Strategy](#testing-strategy)
12. [Implementation Roadmap](#implementation-roadmap)
13. [Risk Assessment](#risk-assessment)
14. [References](#references)

---

## Executive Summary

This document provides comprehensive research and architectural planning for a **B2B Postal Checkout Flow** built with Next.js 15, Supabase, shadcn/ui, and Tailwind v4. The system will handle multi-step checkout processes for business-to-business postal services, including organization management, address validation, shipping options, payment processing, and order tracking.

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Next.js 15 (App Router) | Server Components, SSR, optimal performance |
| **Database** | Supabase (PostgreSQL) | Real-time capabilities, Auth, RLS policies |
| **UI Library** | shadcn/ui + Tailwind v4 | Accessible, customizable, modern styling |
| **Forms** | React Hook Form + Zod | Type-safe validation, performance |
| **State Management** | Zustand + URL state | Lightweight, persistent step navigation |
| **Testing** | Playwright | E2E testing for critical checkout flows |

---

## Requirements Analysis

### Functional Requirements

Based on the B2B postal checkout domain, the following core features are identified:

#### 1. Organization Management
- Multi-user organization accounts
- Role-based access control (Admin, Manager, User)
- Organization profile and billing settings
- Department/team management

#### 2. Address Management
- Multiple shipping/billing addresses per organization
- Address validation integration
- Address book with favorites/recent
- International address support

#### 3. Multi-Step Checkout Flow
- **Step 1**: Sender Information (organization, contact, address)
- **Step 2**: Recipient Information (address, contact details)
- **Step 3**: Package Details (dimensions, weight, contents)
- **Step 4**: Shipping Options (carrier, service level, rates)
- **Step 5**: Review & Confirm (summary, terms)
- **Step 6**: Payment (stored methods, new payment)
- **Step 7**: Confirmation (tracking, receipt)

#### 4. Shipping & Rates
- Real-time rate calculation
- Multiple carrier support (USPS, UPS, FedEx, DHL)
- Service level selection
- Delivery estimate display

#### 5. Payment Processing
- Multiple payment methods (card, ACH, wire)
- Stored payment methods
- Invoice/billing account options
- Payment terms for trusted organizations

#### 6. Order Management
- Order history and tracking
- Bulk operations
- Order status updates
- Shipping label generation

### Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Page load < 2s, API response < 500ms |
| **Security** | RLS policies, input sanitization, HTTPS only |
| **Accessibility** | WCAG 2.1 AA compliance |
| **Scalability** | Support 10k+ concurrent users |
| **Reliability** | 99.9% uptime, graceful error handling |

---

## Data Model Architecture

### Entity Relationship Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   organizations │────▶│      users       │◀────│  user_roles     │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         │         ┌──────────────────┐
         └────────▶│  org_addresses   │
                   └──────────────────┘
                            │
┌─────────────────┐         │         ┌──────────────────┐
│   shipments     │◀────────┘         │   addresses      │
└────────┬────────┘                   └──────────────────┘
         │
         │         ┌──────────────────┐
         ├────────▶│  packages        │
         │         └──────────────────┘
         │
         │         ┌──────────────────┐
         ├────────▶│  shipping_rates  │
         │         └──────────────────┘
         │
         │         ┌──────────────────┐
         └────────▶│  payments        │
                   └──────────────────┘
                            │
                   ┌──────────────────┐
                   │  payment_methods │
                   └──────────────────┘
```

### Core Entities

#### 1. Organizations
```typescript
interface Organization {
  id: string                    // UUID
  name: string                  // Company name
  slug: string                  // URL-friendly identifier
  tax_id?: string              // Tax/VAT ID
  billing_email: string
  billing_address_id?: string
  payment_terms: 'immediate' | 'net15' | 'net30' | 'net60'
  credit_limit?: decimal
  status: 'active' | 'suspended' | 'inactive'
  created_at: timestamp
  updated_at: timestamp
}
```

#### 2. Users
```typescript
interface User {
  id: string                    // UUID (matches Supabase Auth)
  email: string
  first_name: string
  last_name: string
  phone?: string
  organization_id: string
  role: 'admin' | 'manager' | 'user'
  is_active: boolean
  last_login_at?: timestamp
  created_at: timestamp
  updated_at: timestamp
}
```

#### 3. Addresses
```typescript
interface Address {
  id: string
  organization_id: string
  label: string                 // "Main Office", "Warehouse", etc.
  recipient_name: string
  recipient_phone?: string
  line1: string
  line2?: string
  city: string
  state: string                 // State/Province
  postal_code: string
  country: string               // ISO 3166-1 alpha-2
  is_verified: boolean
  verification_service?: string // USPS, Google, etc.
  is_default_shipping: boolean
  is_default_billing: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

#### 4. Shipments
```typescript
interface Shipment {
  id: string
  organization_id: string
  user_id: string              // Created by
  
  // Sender
  sender_address_id: string
  sender_contact_name: string
  sender_contact_phone?: string
  sender_contact_email?: string
  
  // Recipient
  recipient_address_id: string
  recipient_contact_name: string
  recipient_contact_phone?: string
  recipient_contact_email?: string
  
  // Package Details
  package_type: 'box' | 'envelope' | 'tube' | 'pallet'
  weight: decimal              // in kg
  dimensions: {
    length: decimal            // in cm
    width: decimal
    height: decimal
  }
  declared_value?: decimal
  contents_description: string
  is_fragile: boolean
  requires_signature: boolean
  
  // Shipping
  carrier: 'usps' | 'ups' | 'fedex' | 'dhl'
  service_level: string
  estimated_delivery: timestamp
  
  // Rates
  base_rate: decimal
  fuel_surcharge: decimal
  insurance_cost?: decimal
  total_cost: decimal
  currency: string
  
  // Status
  status: 'draft' | 'pending_payment' | 'paid' | 'label_generated' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
  tracking_number?: string
  
  // Payment
  payment_id?: string
  
  created_at: timestamp
  updated_at: timestamp
}
```

#### 5. Payment Methods
```typescript
interface PaymentMethod {
  id: string
  organization_id: string
  type: 'card' | 'ach' | 'wire' | 'billing_account'
  
  // For cards (stored via Stripe/Payment provider)
  provider_customer_id?: string
  provider_payment_method_id?: string
  
  // Display info (masked)
  display_brand?: string        // "visa", "mastercard"
  display_last4?: string
  display_exp_month?: number
  display_exp_year?: number
  
  // For ACH
  bank_name?: string
  account_type?: 'checking' | 'savings'
  account_last4?: string
  
  // For billing accounts
  billing_account_number?: string
  
  is_default: boolean
  is_verified: boolean
  status: 'active' | 'expired' | 'failed'
  
  created_at: timestamp
  updated_at: timestamp
}
```

#### 6. Payments
```typescript
interface Payment {
  id: string
  organization_id: string
  payment_method_id?: string
  
  amount: decimal
  currency: string
  
  // Provider details
  provider: 'stripe' | 'internal'
  provider_payment_intent_id?: string
  provider_charge_id?: string
  
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded'
  failure_message?: string
  
  // Invoice reference
  invoice_number?: string
  
  created_at: timestamp
  updated_at: timestamp
}
```

---

## Tech Stack Analysis

### Core Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 15.x | React framework with App Router |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **UI Components** | shadcn/ui | latest | Accessible component library |
| **Database** | Supabase | latest | PostgreSQL + Auth + Realtime |
| **ORM** | Supabase Client | latest | Database queries |

### Form & Validation

| Library | Purpose |
|---------|---------|
| react-hook-form | Form state management |
| zod | Schema validation |
| @hookform/resolvers | Zod integration |

### State Management

| Library | Purpose |
|---------|---------|
| zustand | Global state (cart, user) |
| nuqs | URL state (checkout steps) |
| @tanstack/react-query | Server state |

### Testing

| Tool | Purpose |
|------|---------|
| Playwright | E2E testing |
| @testing-library/react | Component testing |
| vitest | Unit testing |

### Additional Libraries

| Library | Purpose |
|---------|---------|
| date-fns | Date formatting |
| currency.js | Money calculations |
| libphonenumber-js | Phone validation |
| zxcvbn | Password strength |

---

## Project Structure

```
my-app/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── layout.tsx
│   ├── (dashboard)/              # Dashboard route group
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard home
│   │   ├── shipments/
│   │   ├── addresses/
│   │   ├── payment-methods/
│   │   ├── team/
│   │   └── settings/
│   ├── checkout/                 # Checkout flow (no dashboard layout)
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Redirects to step 1
│   │   ├── sender/
│   │   ├── recipient/
│   │   ├── package/
│   │   ├── shipping/
│   │   ├── review/
│   │   ├── payment/
│   │   └── confirmation/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── shipments/
│   │   ├── addresses/
│   │   ├── rates/
│   │   ├── payments/
│   │   └── webhooks/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Marketing home
│   └── globals.css
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Form components
│   ├── checkout/                 # Checkout-specific components
│   ├── dashboard/                # Dashboard components
│   └── shared/                   # Shared components
├── lib/                          # Utilities
│   ├── supabase/                 # Supabase client & types
│   ├── validations/              # Zod schemas
│   ├── hooks/                    # Custom hooks
│   ├── utils/                    # Helper functions
│   └── constants.ts              # App constants
├── types/                        # TypeScript types
│   ├── database.ts               # Database types
│   ├── api.ts                    # API types
│   └── index.ts
├── e2e/                          # Playwright tests
│   ├── auth.spec.ts
│   ├── checkout.spec.ts
│   └── dashboard.spec.ts
├── supabase/                     # Supabase config
│   ├── migrations/
│   └── seed.sql
├── public/                       # Static assets
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Supabase Schema Design

### Full SQL Schema

```sql
-- ============================================
-- 1. ENUMS & TYPES
-- ============================================

create type user_role as enum ('admin', 'manager', 'user');
create type organization_status as enum ('active', 'suspended', 'inactive');
create type payment_term as enum ('immediate', 'net15', 'net30', 'net60');
create type address_type as enum ('residential', 'commercial');
create type package_type as enum ('box', 'envelope', 'tube', 'pallet');
create type carrier as enum ('usps', 'ups', 'fedex', 'dhl');
create type shipment_status as enum (
  'draft', 'pending_payment', 'paid', 'label_generated', 
  'picked_up', 'in_transit', 'delivered', 'cancelled'
);
create type payment_method_type as enum ('card', 'ach', 'wire', 'billing_account');
create type payment_status as enum ('pending', 'processing', 'succeeded', 'failed', 'refunded');

-- ============================================
-- 2. ORGANIZATIONS
-- ============================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  tax_id text,
  billing_email text not null,
  billing_address_id uuid,
  payment_terms payment_term default 'immediate',
  credit_limit decimal(12,2),
  status organization_status default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 3. USERS
-- ============================================

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  first_name text not null,
  last_name text not null,
  phone text,
  organization_id uuid not null references organizations(id) on delete cascade,
  role user_role default 'user',
  is_active boolean default true,
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 4. ADDRESSES
-- ============================================

create table addresses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  label text not null,
  recipient_name text not null,
  recipient_phone text,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'US',
  address_type address_type default 'commercial',
  is_verified boolean default false,
  verification_service text,
  verification_raw_response jsonb,
  is_default_shipping boolean default false,
  is_default_billing boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 5. SHIPMENTS
-- ============================================

create table shipments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id),
  
  -- Sender
  sender_address_id uuid not null references addresses(id),
  sender_contact_name text not null,
  sender_contact_phone text,
  sender_contact_email text,
  
  -- Recipient
  recipient_address_id uuid not null references addresses(id),
  recipient_contact_name text not null,
  recipient_contact_phone text,
  recipient_contact_email text,
  
  -- Package
  package_type package_type not null,
  weight decimal(10,3) not null,
  length decimal(10,2) not null,
  width decimal(10,2) not null,
  height decimal(10,2) not null,
  declared_value decimal(12,2),
  contents_description text not null,
  is_fragile boolean default false,
  requires_signature boolean default false,
  
  -- Shipping
  carrier carrier not null,
  service_level text not null,
  estimated_delivery timestamptz,
  
  -- Rates
  base_rate decimal(10,2) not null,
  fuel_surcharge decimal(10,2) default 0,
  insurance_cost decimal(10,2) default 0,
  total_cost decimal(10,2) not null,
  currency text default 'USD',
  
  -- Status
  status shipment_status default 'draft',
  tracking_number text,
  label_url text,
  
  -- Payment
  payment_id uuid,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 6. PAYMENT METHODS
-- ============================================

create table payment_methods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  type payment_method_type not null,
  
  -- Provider IDs (Stripe, etc.)
  provider text default 'stripe',
  provider_customer_id text,
  provider_payment_method_id text,
  
  -- Display info (masked)
  display_brand text,
  display_last4 text,
  display_exp_month integer,
  display_exp_year integer,
  
  -- ACH
  bank_name text,
  account_type text,
  account_last4 text,
  
  -- Billing account
  billing_account_number text,
  
  is_default boolean default false,
  is_verified boolean default false,
  status text default 'active',
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 7. PAYMENTS
-- ============================================

create table payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  payment_method_id uuid references payment_methods(id),
  
  amount decimal(10,2) not null,
  currency text default 'USD',
  
  provider text default 'stripe',
  provider_payment_intent_id text,
  provider_charge_id text,
  
  status payment_status default 'pending',
  failure_message text,
  
  invoice_number text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 8. ACTIVITY LOG
-- ============================================

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

-- ============================================
-- 9. INDEXES
-- ============================================

create index idx_users_org on users(organization_id);
create index idx_users_email on users(email);
create index idx_addresses_org on addresses(organization_id);
create index idx_shipments_org on shipments(organization_id);
create index idx_shipments_user on shipments(user_id);
create index idx_shipments_status on shipments(status);
create index idx_shipments_tracking on shipments(tracking_number);
create index idx_payments_org on payments(organization_id);
create index idx_payment_methods_org on payment_methods(organization_id);
create index idx_activity_org on activity_log(organization_id);
create index idx_activity_created on activity_log(created_at);

-- ============================================
-- 10. RLS POLICIES
-- ============================================

alter table organizations enable row level security;
alter table users enable row level security;
alter table addresses enable row level security;
alter table shipments enable row level security;
alter table payment_methods enable row level security;
alter table payments enable row level security;
alter table activity_log enable row level security;

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

-- Users: Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON users FOR UPDATE 
  USING (id = auth.uid());

-- Addresses: Users can view org addresses
CREATE POLICY "Users can view org addresses" 
  ON addresses FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Addresses: Admins and managers can modify
CREATE POLICY "Admins can manage addresses" 
  ON addresses FOR ALL 
  USING (organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
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

-- Shipments: Users can update their own shipments
CREATE POLICY "Users can update own shipments" 
  ON shipments FOR UPDATE 
  USING (user_id = auth.uid());

-- Payment Methods: Users can view org payment methods
CREATE POLICY "Users can view org payment methods" 
  ON payment_methods FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Payment Methods: Admins can manage
CREATE POLICY "Admins can manage payment methods" 
  ON payment_methods FOR ALL 
  USING (organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Payments: Users can view org payments
CREATE POLICY "Users can view org payments" 
  ON payments FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Activity Log: Users can view org activity
CREATE POLICY "Users can view org activity" 
  ON activity_log FOR SELECT 
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- ============================================
-- 11. FUNCTIONS & TRIGGERS
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

CREATE TRIGGER payment_methods_updated_at 
  BEFORE UPDATE ON payment_methods 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Log activity function
CREATE OR REPLACE FUNCTION log_activity(
  p_organization_id uuid,
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb DEFAULT null
)
RETURNS void AS $$
BEGIN
  INSERT INTO activity_log (
    organization_id, user_id, action, entity_type, entity_id, metadata
  ) VALUES (
    p_organization_id, p_user_id, p_action, p_entity_type, p_entity_id, p_metadata
  );
END;
$$ LANGUAGE plpgsql;
```

---

## API Route Architecture

### Route Structure

```
app/api/
├── auth/
│   ├── callback/route.ts       # OAuth callback
│   ├── invite/route.ts         # Invite user
│   └── reset-password/route.ts
├── addresses/
│   ├── route.ts                # GET list, POST create
│   └── [id]/
│       ├── route.ts            # GET, PUT, DELETE
│       └── verify/route.ts     # POST verify address
├── shipments/
│   ├── route.ts                # GET list, POST create
│   ├── [id]/
│   │   ├── route.ts            # GET, PUT
│   │   ├── cancel/route.ts     # POST cancel
│   │   └── label/route.ts      # GET label
│   └── draft/route.ts          # GET/POST draft shipment
├── rates/
│   └── calculate/route.ts      # POST calculate rates
├── payments/
│   ├── methods/
│   │   ├── route.ts            # GET list, POST create
│   │   └── [id]/
│   │       ├── route.ts        # PUT, DELETE
│   │       └── default/route.ts # POST set default
│   └── process/route.ts        # POST process payment
└── webhooks/
    ├── stripe/route.ts         # Stripe webhooks
    └── carrier/route.ts        # Carrier status updates
```

### API Endpoint Specifications

#### Addresses

```typescript
// GET /api/addresses
// Response
interface GetAddressesResponse {
  addresses: Address[]
}

// POST /api/addresses
// Request
interface CreateAddressRequest {
  label: string
  recipient_name: string
  recipient_phone?: string
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default_shipping?: boolean
  is_default_billing?: boolean
}

// POST /api/addresses/[id]/verify
// Response
interface VerifyAddressResponse {
  is_valid: boolean
  suggestions?: AddressSuggestion[]
  normalized_address?: Address
}
```

#### Shipments

```typescript
// GET /api/shipments
// Query params: status, page, limit, sort
// Response
interface GetShipmentsResponse {
  shipments: Shipment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// POST /api/shipments
// Request
interface CreateShipmentRequest {
  sender_address_id: string
  sender_contact: ContactInfo
  recipient_address_id: string
  recipient_contact: ContactInfo
  package: PackageDetails
  carrier: Carrier
  service_level: string
  rates: RateInfo
  payment_method_id?: string
}

// Response
interface CreateShipmentResponse {
  shipment: Shipment
  payment_required: boolean
  client_secret?: string // For Stripe payment
}
```

#### Rates

```typescript
// POST /api/rates/calculate
// Request
interface CalculateRatesRequest {
  sender_address_id: string
  recipient_address_id: string
  package: {
    weight: number
    length: number
    width: number
    height: number
  }
}

// Response
interface CalculateRatesResponse {
  rates: {
    carrier: Carrier
    service_level: string
    service_name: string
    estimated_delivery: string
    base_rate: number
    fuel_surcharge: number
    total: number
    currency: string
  }[]
}
```

#### Payments

```typescript
// POST /api/payments/process
// Request
interface ProcessPaymentRequest {
  shipment_id: string
  payment_method_id: string
}

// Response
interface ProcessPaymentResponse {
  success: boolean
  payment_id: string
  status: PaymentStatus
  client_secret?: string
}
```

---

## Component Hierarchy

### Shared Components

```
components/
├── ui/                         # shadcn/ui components (auto-generated)
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── label.tsx
│   ├── toast.tsx
│   └── ...
├── forms/                      # Form field components
│   ├── AddressForm.tsx         # Reusable address form
│   ├── ContactForm.tsx         # Contact info fields
│   ├── PackageForm.tsx         # Package details form
│   └── PaymentMethodForm.tsx   # Payment method form
├── checkout/                   # Checkout-specific
│   ├── StepIndicator.tsx       # Progress stepper
│   ├── StepLayout.tsx          # Common step layout
│   ├── RateCard.tsx            # Shipping rate display
│   ├── OrderSummary.tsx        # Order summary sidebar
│   └── AddressSelector.tsx     # Address dropdown/selector
├── dashboard/                  # Dashboard-specific
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── DataTable.tsx
│   └── StatCard.tsx
└── shared/                     # Shared across features
    ├── AddressDisplay.tsx
    ├── ShipmentStatusBadge.tsx
    ├── CurrencyDisplay.tsx
    ├── DateDisplay.tsx
    └── LoadingState.tsx
```

### Component Specifications

#### StepIndicator

```typescript
interface StepIndicatorProps {
  steps: {
    id: string
    label: string
    description?: string
  }[]
  currentStep: string
  completedSteps: string[]
}
```

#### AddressForm

```typescript
interface AddressFormProps {
  defaultValues?: Partial<AddressFormData>
  onSubmit: (data: AddressFormData) => void
  onVerify?: (data: AddressVerificationResult) => void
  showVerification?: boolean
  submitLabel?: string
}

interface AddressFormData {
  label: string
  recipient_name: string
  recipient_phone?: string
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}
```

#### RateCard

```typescript
interface RateCardProps {
  rate: ShippingRate
  isSelected: boolean
  onSelect: () => void
}

interface ShippingRate {
  carrier: Carrier
  service_level: string
  service_name: string
  estimated_delivery: Date
  base_rate: number
  fuel_surcharge: number
  total: number
  currency: string
}
```

---

## Form Validation Strategy

### Zod Schema Definitions

```typescript
// lib/validations/address.ts
import { z } from 'zod'

export const addressSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50),
  recipient_name: z.string().min(1, 'Recipient name is required').max(100),
  recipient_phone: z.string().optional(),
  line1: z.string().min(1, 'Address line 1 is required').max(100),
  line2: z.string().max(100).optional(),
  city: z.string().min(1, 'City is required').max(50),
  state: z.string().min(1, 'State is required').max(50),
  postal_code: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().length(2, 'Country code must be 2 characters'),
  is_default_shipping: z.boolean().default(false),
  is_default_billing: z.boolean().default(false),
})

export type AddressFormData = z.infer<typeof addressSchema>

// lib/validations/package.ts
export const packageSchema = z.object({
  package_type: z.enum(['box', 'envelope', 'tube', 'pallet']),
  weight: z.number().positive('Weight must be greater than 0').max(1000),
  length: z.number().positive('Length is required').max(300),
  width: z.number().positive('Width is required').max(300),
  height: z.number().positive('Height is required').max(300),
  declared_value: z.number().min(0).optional(),
  contents_description: z.string().min(1, 'Contents description is required').max(500),
  is_fragile: z.boolean().default(false),
  requires_signature: z.boolean().default(false),
})

export type PackageFormData = z.infer<typeof packageSchema>

// lib/validations/shipment.ts
export const shipmentSenderSchema = z.object({
  sender_address_id: z.string().uuid('Please select a sender address'),
  sender_contact_name: z.string().min(1, 'Contact name is required'),
  sender_contact_phone: z.string().optional(),
  sender_contact_email: z.string().email('Invalid email').optional(),
})

export const shipmentRecipientSchema = z.object({
  recipient_address_id: z.string().uuid('Please select a recipient address'),
  recipient_contact_name: z.string().min(1, 'Contact name is required'),
  recipient_contact_phone: z.string().optional(),
  recipient_contact_email: z.string().email('Invalid email').optional(),
})

export const shipmentShippingSchema = z.object({
  carrier: z.enum(['usps', 'ups', 'fedex', 'dhl']),
  service_level: z.string().min(1, 'Please select a service level'),
})

export const shipmentPaymentSchema = z.object({
  payment_method_id: z.string().uuid('Please select a payment method'),
  save_payment_method: z.boolean().default(false),
})
```

### Form Implementation Pattern

```typescript
// Example: Sender Step Form
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { shipmentSenderSchema, type ShipmentSenderFormData } from '@/lib/validations/shipment'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { AddressSelector } from '@/components/checkout/AddressSelector'

interface SenderStepFormProps {
  defaultValues?: Partial<ShipmentSenderFormData>
  onSubmit: (data: ShipmentSenderFormData) => void
}

export function SenderStepForm({ defaultValues, onSubmit }: SenderStepFormProps) {
  const form = useForm<ShipmentSenderFormData>({
    resolver: zodResolver(shipmentSenderSchema),
    defaultValues: {
      sender_address_id: '',
      sender_contact_name: '',
      sender_contact_phone: '',
      sender_contact_email: '',
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="sender_address_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sender Address</FormLabel>
              <FormControl>
                <AddressSelector 
                  value={field.value} 
                  onChange={field.onChange}
                  type="sender"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="sender_contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Additional fields... */}
        
        <Button type="submit">Continue</Button>
      </form>
    </Form>
  )
}
```

---

## State Management Approach

### Multi-Step Checkout State

```typescript
// lib/stores/checkout.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CheckoutState {
  // Step tracking
  currentStep: string
  completedSteps: string[]
  
  // Form data (accumulated across steps)
  senderData: SenderData | null
  recipientData: RecipientData | null
  packageData: PackageData | null
  shippingData: ShippingData | null
  paymentData: PaymentData | null
  
  // Draft shipment
  draftShipmentId: string | null
  
  // Actions
  setStep: (step: string) => void
  markStepComplete: (step: string) => void
  markStepIncomplete: (step: string) => void
  
  setSenderData: (data: SenderData) => void
  setRecipientData: (data: RecipientData) => void
  setPackageData: (data: PackageData) => void
  setShippingData: (data: ShippingData) => void
  setPaymentData: (data: PaymentData) => void
  
  setDraftShipmentId: (id: string) => void
  
  // Reset
  reset: () => void
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      currentStep: 'sender',
      completedSteps: [],
      senderData: null,
      recipientData: null,
      packageData: null,
      shippingData: null,
      paymentData: null,
      draftShipmentId: null,
      
      setStep: (step) => set({ currentStep: step }),
      
      markStepComplete: (step) => 
        set((state) => ({
          completedSteps: [...new Set([...state.completedSteps, step])],
        })),
      
      markStepIncomplete: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.filter((s) => s !== step),
        })),
      
      setSenderData: (data) => set({ senderData: data }),
      setRecipientData: (data) => set({ recipientData: data }),
      setPackageData: (data) => set({ packageData: data }),
      setShippingData: (data) => set({ shippingData: data }),
      setPaymentData: (data) => set({ paymentData: data }),
      
      setDraftShipmentId: (id) => set({ draftShipmentId: id }),
      
      reset: () =>
        set({
          currentStep: 'sender',
          completedSteps: [],
          senderData: null,
          recipientData: null,
          packageData: null,
          shippingData: null,
          paymentData: null,
          draftShipmentId: null,
        }),
    }),
    {
      name: 'checkout-storage',
      partialize: (state) => ({
        senderData: state.senderData,
        recipientData: state.recipientData,
        packageData: state.packageData,
        shippingData: state.shippingData,
        paymentData: state.paymentData,
        draftShipmentId: state.draftShipmentId,
        completedSteps: state.completedSteps,
      }),
    }
  )
)
```

### URL State for Step Navigation

```typescript
// lib/hooks/useCheckoutStep.ts
import { useQueryState } from 'nuqs'
import { useCheckoutStore } from '@/lib/stores/checkout'

const STEPS = ['sender', 'recipient', 'package', 'shipping', 'review', 'payment', 'confirmation']

export function useCheckoutStep() {
  const [stepParam, setStepParam] = useQueryState('step')
  const { currentStep, setStep, completedSteps } = useCheckoutStore()
  
  const activeStep = stepParam || currentStep
  
  const canAccessStep = (step: string) => {
    const stepIndex = STEPS.indexOf(step)
    const completedIndex = Math.max(
      ...completedSteps.map((s) => STEPS.indexOf(s)),
      -1
    )
    return stepIndex <= completedIndex + 1
  }
  
  const navigateToStep = (step: string) => {
    if (!canAccessStep(step)) return false
    setStep(step)
    setStepParam(step)
    return true
  }
  
  const goToNextStep = () => {
    const currentIndex = STEPS.indexOf(activeStep)
    if (currentIndex < STEPS.length - 1) {
      navigateToStep(STEPS[currentIndex + 1])
    }
  }
  
  const goToPreviousStep = () => {
    const currentIndex = STEPS.indexOf(activeStep)
    if (currentIndex > 0) {
      navigateToStep(STEPS[currentIndex - 1])
    }
  }
  
  return {
    currentStep: activeStep,
    setStep: navigateToStep,
    goToNextStep,
    goToPreviousStep,
    canAccessStep,
    isFirstStep: STEPS.indexOf(activeStep) === 0,
    isLastStep: STEPS.indexOf(activeStep) === STEPS.length - 1,
  }
}
```

---

## Testing Strategy

### Playwright E2E Tests

```typescript
// e2e/checkout.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login and setup
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('complete checkout flow', async ({ page }) => {
    // Start checkout
    await page.goto('/checkout')
    
    // Step 1: Sender
    await page.selectOption('[name="sender_address_id"]', 'addr-1')
    await page.fill('[name="sender_contact_name"]', 'John Doe')
    await page.click('button:has-text("Continue")')
    
    // Step 2: Recipient
    await page.selectOption('[name="recipient_address_id"]', 'addr-2')
    await page.fill('[name="recipient_contact_name"]', 'Jane Smith')
    await page.click('button:has-text("Continue")')
    
    // Step 3: Package
    await page.selectOption('[name="package_type"]', 'box')
    await page.fill('[name="weight"]', '5')
    await page.fill('[name="length"]', '12')
    await page.fill('[name="width"]', '10')
    await page.fill('[name="height"]', '8')
    await page.fill('[name="contents_description"]', 'Documents')
    await page.click('button:has-text("Continue")')
    
    // Step 4: Shipping
    await page.click('[data-testid="rate-card"]:first-child')
    await page.click('button:has-text("Continue")')
    
    // Step 5: Review
    await page.click('button:has-text("Confirm & Pay")')
    
    // Step 6: Payment
    await page.selectOption('[name="payment_method_id"]', 'pm-1')
    await page.click('button:has-text("Pay Now")')
    
    // Step 7: Confirmation
    await expect(page).toHaveURL(/\/checkout\/confirmation/)
    await expect(page.locator('h1')).toContainText('Order Confirmed')
  })

  test('prevents skipping steps', async ({ page }) => {
    await page.goto('/checkout/shipping')
    // Should redirect to sender step
    await expect(page).toHaveURL(/\/checkout\/sender/)
  })

  test('validates required fields', async ({ page }) => {
    await page.goto('/checkout')
    await page.click('button:has-text("Continue")')
    
    await expect(page.locator('[data-testid="error-sender_address_id"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-sender_contact_name"]')).toBeVisible()
  })
})
```

### Component Tests

```typescript
// components/checkout/RateCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { RateCard } from './RateCard'

const mockRate = {
  carrier: 'usps' as const,
  service_level: 'priority',
  service_name: 'USPS Priority Mail',
  estimated_delivery: new Date('2026-04-08'),
  base_rate: 10.50,
  fuel_surcharge: 1.25,
  total: 11.75,
  currency: 'USD',
}

describe('RateCard', () => {
  it('displays rate information', () => {
    render(
      <RateCard 
        rate={mockRate} 
        isSelected={false} 
        onSelect={() => {}} 
      />
    )
    
    expect(screen.getByText('USPS Priority Mail')).toBeInTheDocument()
    expect(screen.getByText('$11.75')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn()
    render(
      <RateCard 
        rate={mockRate} 
        isSelected={false} 
        onSelect={onSelect} 
      />
    )
    
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalled()
  })
})
```

### Test Coverage Goals

| Category | Coverage Target |
|----------|-----------------|
| E2E Critical Paths | 100% |
| Component Unit Tests | 80% |
| API Integration Tests | 80% |
| Utility Functions | 90% |

---

## Implementation Roadmap

### Phase 1: Foundation (Steps 1-4)

| Step | Task | Duration | Dependencies |
|------|------|----------|--------------|
| 1 | Research & Architecture | 4h | - |
| 2 | Initialize Next.js Project | 2h | Step 1 |
| 3 | Setup Supabase Schema | 3h | Step 2 |
| 4 | Build Shared Components | 4h | Step 2 |

### Phase 2: Core Features (Steps 5-9)

| Step | Task | Duration | Dependencies |
|------|------|----------|--------------|
| 5 | Authentication & Organization | 4h | Step 3 |
| 6 | Address Management | 4h | Step 4, 5 |
| 7 | Checkout Step 1-2 (Sender/Recipient) | 4h | Step 6 |
| 8 | Checkout Step 3-4 (Package/Shipping) | 4h | Step 7 |
| 9 | Rate Calculation Integration | 3h | Step 8 |

### Phase 3: Payment & Completion (Steps 10-13)

| Step | Task | Duration | Dependencies |
|------|------|----------|--------------|
| 10 | Payment Methods | 4h | Step 5 |
| 11 | Checkout Step 5-6 (Review/Payment) | 4h | Step 9, 10 |
| 12 | Checkout Step 7 (Confirmation) | 2h | Step 11 |
| 13 | Order Management Dashboard | 4h | Step 12 |

### Phase 4: Polish & Testing (Steps 14-18)

| Step | Task | Duration | Dependencies |
|------|------|----------|--------------|
| 14 | Error Handling & Validation | 3h | Steps 7-12 |
| 15 | Loading States & Optimistic UI | 3h | Step 14 |
| 16 | Accessibility Improvements | 3h | All above |
| 17 | E2E Testing with Playwright | 4h | All above |
| 18 | Final Review & Deployment | 2h | Step 17 |

### Total Estimated Duration

- **Development**: 55 hours
- **Buffer (10%)**: 5.5 hours
- **Total**: ~60 hours (7-8 work days)

---

## Risk Assessment

### High Priority Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Address validation API unavailable** | High | Medium | Implement fallback validation, cache results |
| **Rate calculation API latency** | Medium | High | Add loading states, cache rates, implement timeouts |
| **Payment processing failures** | High | Medium | Implement retry logic, comprehensive error handling |
| **Multi-step form state loss** | High | Low | Use Zustand persistence, auto-save drafts |

### Medium Priority Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Supabase RLS complexity** | Medium | Medium | Thorough testing, clear documentation |
| **Responsive design issues** | Medium | Medium | Mobile-first approach, device testing |
| **Browser compatibility** | Low | Low | Test on target browsers, polyfills if needed |

### Technical Debt Prevention

1. **Type Safety**: Strict TypeScript configuration
2. **Code Organization**: Clear component boundaries
3. **Testing**: E2E tests for critical paths
4. **Documentation**: Inline comments for complex logic

---

## References

### Documentation

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS v4](https://tailwindcss.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)
- [Zustand State Management](https://docs.pmnd.rs/zustand)
- [Playwright Testing](https://playwright.dev)

### Best Practices

- [Next.js App Router Patterns](https://nextjs.org/docs/app/building-your-application/routing)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Form Validation Patterns](https://react-hook-form.com/get-started#SchemaValidation)
- [Multi-step Form State Management](https://github.com/pmndrs/zustand)

### Similar Projects

- `/Users/jackjin/dev/ai-sandbox/projects/nextjs/2026-02-04/1770180822334` - PageForge CMS (similar 18-step structure)
- `/Users/jackjin/dev/ai-sandbox/projects/react/2026-03-31/finance-dashboard-claude` - Finance Dashboard patterns

---

## Next Steps

**Step 2: Initialize Next.js project and dependencies**

Actions:
1. Create Next.js 15 project with TypeScript
2. Install and configure Tailwind CSS v4
3. Install shadcn/ui components
4. Install required dependencies (Zustand, React Hook Form, Zod, etc.)
5. Configure project structure
6. Initialize Git repository
7. Create initial layout components

Success Criteria:
- Project runs locally (`npm run dev`)
- Tailwind CSS working
- shadcn/ui components available
- Clean project structure established
- First commit made

---

**Step 1 Status: IN PROGRESS**
**Research and architectural planning for B2B Postal Checkout Flow**
