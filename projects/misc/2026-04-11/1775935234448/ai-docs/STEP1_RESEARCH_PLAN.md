# Step 1: Research and Plan Implementation Approach

**Status**: Complete  
**Date**: April 11, 2026  
**Contract**: contract-1775935234448  
**Project**: B2B Postal Checkout Flow  
**Step**: 1 of 71

---

## Executive Summary

This document provides comprehensive research findings and a detailed implementation plan for the B2B Postal Checkout Flow project. Based on analysis of previous project runs (notably 2026-04-05, contract-1775414201963, and 2026-04-11, contract-1775931318881), this plan establishes a vertical-slice development approach to ensure working end-to-end flows at every checkpoint.

### Critical Lesson from Previous Runs

**The 2026-04-05 postal-checkout run failed with: 32 steps, 52 commits, 0 working end-to-end flows.**

The primary anti-patterns identified:
1. Building components against hardcoded mock data when the database was available
2. Writing E2E tests for APIs that weren't smoke-tested first
3. Marking wizard steps complete when submit buttons didn't persist or navigate
4. Treating steps as isolated rather than part of a connected flow

**This run's approach**: Every step must be verified end-to-end through the cloud database — no localStorage, no hardcoded mocks when DB is available.

---

## Requirements Analysis (01-09 Overview)

Based on the B2B postal checkout domain and previous project documentation:

### 1. Overview (01-overview)
- Multi-step checkout wizard for B2B postal services
- Cloud Supabase database (postal_v2 schema) — NO localStorage
- Next.js 15 with App Router
- 6-step wizard flow with real-time data persistence

### 2. Shipment Details (02-shipment-details)
- **Origin/Destination Address**: Full address form with validation
- **Package Configuration**: Type (Box/Envelope/Tube/Pallet), dimensions, weight
- **Special Handling**: Fragile, hazardous, temperature-controlled, signature options
- **Reference Information**: PO number, reference numbers
- **Multi-piece support**: Up to 20 packages per shipment

### 3. Rate Selection (03-rate-selection)
- **Real-time quotes**: Fetched from `/api/rates` endpoint
- **Multi-carrier display**: PEX, VC, EFL, FS carriers with ratings
- **Service categories**: Ground, Air, Express, Freight, International
- **Pricing breakdown**: Base rate, fuel surcharge, fees
- **Carbon footprint**: Environmental impact display

### 4. Payment Methods (04-payment-methods)
- **5 B2B Payment Methods**:
  1. Purchase Order (PO)
  2. Net Terms (15/30/60 days)
  3. Bill of Lading (BOL)
  4. Third Party Billing
  5. Corporate Account
- **Validation rules**: Credit limits, approval workflows
- **Method-specific fields**: PO number, authorization codes

### 5. Pickup Scheduling (05-pickup-scheduling)
- **Available slots**: Fetched from `/api/pickup-slots`
- **Access requirements**: Gate codes, dock numbers, building type
- **Equipment needs**: Pallet jack, forklift, liftgate
- **Contact personnel**: Authorized signers

### 6. Review & Confirmation (06-review-confirmation)
- **Complete summary**: All persisted data displayed
- **Edit navigation**: Links back to each step
- **Terms acceptance**: Required checkbox
- **Tracking number**: Generated and queryable at `/shipments/{id}`

### 7-9. API Specs, Database Schema, Validation Rules
- Standardized API response format
- 29 tables in postal_v2 schema
- Zod validation schemas for all forms

---

## Full User Journey Analysis

### Complete Flow Overview

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

### URL State Pattern

```typescript
// Navigation uses shipment_id in URL
/shipments/new                    → Create new (Step 1)
/shipments/[id]/rates            → Step 2: Rate selection
/shipments/[id]/payment          → Step 3: Payment
/shipments/[id]/pickup           → Step 4: Pickup scheduling
/shipments/[id]/review           → Step 5: Review
/shipments/[id]/confirm          → Step 6: Confirmation
/shipments/[id]                  → View shipment (post-confirmation)
```

---

## Cloud Supabase Setup Requirements

### Schema Setup Strategy

**Critical**: Use `postal_v2` schema ONLY — never touch `public` schema.

**Migration File**: `supabase/migrations/000001_initial_schema.sql`

```sql
-- Prerequisite: Drop and recreate schema
DROP SCHEMA IF EXISTS postal_v2 CASCADE;
CREATE SCHEMA postal_v2;

-- Set search path for this migration
SET search_path TO postal_v2;

-- 1. ENUM Types (12 types)
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE organization_status AS ENUM ('active', 'suspended', 'inactive');
CREATE TYPE payment_term AS ENUM ('immediate', 'net15', 'net30', 'net60');
CREATE TYPE package_type AS ENUM ('box', 'envelope', 'tube', 'pallet');
CREATE TYPE shipment_status AS ENUM (
  'draft', 'pending_payment', 'paid', 'label_generated', 
  'picked_up', 'in_transit', 'delivered', 'cancelled'
);
CREATE TYPE carrier_code AS ENUM ('pex', 'vc', 'efl', 'fs');
CREATE TYPE service_category AS ENUM ('ground', 'air', 'freight', 'express', 'international');
CREATE TYPE payment_method_type AS ENUM ('purchase_order', 'net_terms', 'bill_of_lading', 'third_party', 'corporate_account');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');
CREATE TYPE handling_type AS ENUM ('fragile', 'hazardous', 'temperature_controlled', 'signature_required', 'adult_signature', 'hold_for_pickup', 'appointment_delivery');
CREATE TYPE hazmat_class AS ENUM ('class_1', 'class_2', 'class_3', 'class_4', 'class_5', 'class_6', 'class_7', 'class_8', 'class_9');

-- 2. Core Tables (29 total)
-- Organizations, Users, Addresses
-- Carriers, Service Types
-- Shipments, Shipment Packages, Special Handling, Delivery Preferences, Hazmat Details
-- Quotes
-- Payment Info (5 B2B methods)
-- Pickup Details, Contacts, Access Requirements, Equipment Needs
-- Shipment Events, Activity Log

-- 3. Indexes (35+ for performance)
-- 4. RLS Policies (organization-based access)
-- 5. Functions: update_updated_at(), generate_shipment_number(), log_activity()
-- 6. Triggers for auto-updating timestamps
```

### Seed Data Strategy

**File**: `supabase/seed.sql`

1. **Mock Carriers** (4):
   - PEX (Parcel Express) - Rating 4.5/5, Multiplier 1.0
   - VC (Velocity Courier) - Rating 4.8/5, Multiplier 1.15
   - EFL (Eagle Freight Lines) - Rating 4.2/5, Multiplier 0.9
   - FS (FastShip Global) - Rating 4.0/5, Multiplier 1.2

2. **Service Types** (21 across carriers):
   - Ground services
   - Express services
   - Overnight services
   - LTL/FTL freight
   - International services

3. **Sample Organization**:
   - Acme Corporation
   - 3 addresses (Main Office, Warehouse, West Coast)
   - 1 complete test shipment
   - 3 payment methods (PO, Net 30, Corporate)

### Idempotent Seed Script

```sql
-- Seed script must be idempotent (can run multiple times safely)
-- Use INSERT ... ON CONFLICT (id) DO UPDATE pattern
-- Or TRUNCATE + INSERT for seed data that should reset
```

### Environment Variables

```bash
# Required in .env.app (already exists)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## API Route Architecture

### Core Endpoints

| Endpoint | Method | Purpose | Step |
|----------|--------|---------|------|
| `/api/health` | GET | Service health check | 2 |
| `/api/form-config` | GET | Dropdown options & validation rules | 4 |
| `/api/shipments` | POST | Create new shipment | 5 |
| `/api/shipments/[id]` | GET/PATCH | Shipment CRUD | 5+ |
| `/api/rates` | POST | Calculate multi-carrier quotes | 8 |
| `/api/rates/select` | POST | Select a rate for shipment | 8 |
| `/api/payments/process` | POST | Process payment | 12 |
| `/api/pickup-slots` | GET | Available pickup slots | 15 |
| `/api/pickups` | POST | Schedule pickup | 16 |
| `/api/shipments/[id]/confirm` | POST | Final confirmation | 20 |

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
  };
}
```

### API Implementation Pattern

```typescript
// app/api/shipments/route.ts
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createShipmentSchema = z.object({
  sender_address: z.object({ /* ... */ }),
  recipient_address: z.object({ /* ... */ }),
  package_details: z.object({ /* ... */ }),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  
  // 1. Parse and validate
  const body = await request.json();
  const result = createShipmentSchema.safeParse(body);
  
  if (!result.success) {
    return Response.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: result.error.flatten().fieldErrors,
      },
      meta: { timestamp: new Date().toISOString() },
    }, { status: 400 });
  }
  
  // 2. Insert to database
  const { data, error } = await supabase
    .from('shipments')
    .insert(result.data)
    .select()
    .single();
  
  if (error) {
    return Response.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error.message,
      },
      meta: { timestamp: new Date().toISOString() },
    }, { status: 500 });
  }
  
  // 3. Return success
  return Response.json({
    success: true,
    data: { shipment: data },
    meta: { timestamp: new Date().toISOString() },
  });
}
```

---

## Component Architecture

### Directory Structure

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
├── api/                          # API routes
├── layout.tsx                    # Root layout
└── page.tsx                      # Home/marketing page

components/
├── ui/                           # shadcn/ui components
├── shared/                       # Reusable form components
│   ├── FormField.tsx
│   ├── AddressInput.tsx
│   ├── ContactInput.tsx
│   ├── StepIndicator.tsx
│   └── LoadingSpinner.tsx
├── shipments/                    # Shipment-specific
│   ├── PresetSelector.tsx
│   ├── PackageTypeSelector.tsx
│   ├── DimensionsInput.tsx
│   ├── WeightInput.tsx
│   └── PackageSummary.tsx
├── rates/                        # Rate selection
│   ├── RateCard.tsx
│   └── RateComparison.tsx
├── payment/                      # Payment
│   ├── PaymentMethodSelector.tsx
│   ├── PurchaseOrderForm.tsx
│   ├── NetTermsSelector.tsx
│   └── CorporateAccountForm.tsx
├── pickup/                       # Pickup
│   ├── PickupScheduler.tsx
│   └── TimeWindowSelector.tsx
└── review/                       # Review
    └── ShipmentReview.tsx

lib/
├── supabase/                     # Supabase clients
│   ├── client.ts                 # Browser client
│   ├── server.ts                 # Server client
│   └── middleware.ts             # Session middleware
├── validation/                   # Zod schemas
│   ├── shipment-details-schema.ts
│   ├── api-schemas.ts
│   └── quote-schemas.ts
├── api/                          # API utilities
│   └── response.ts               # Standardized responses
├── pricing/                      # Pricing engine
│   └── engine.ts
└── data/                         # Static data
    └── shipment-presets.ts

types/
└── database.ts                   # Generated Supabase types

tests/e2e/
└── journey.spec.ts               # Append-only journey test
```

### Component Implementation Rules

1. **NO hardcoded mock data** — always read/write from Supabase
2. **Form state** — React Hook Form with Zod validation
3. **Loading states** — Skeleton components while data loads
4. **Error handling** — Error boundaries + toast notifications
5. **Accessibility** — ARIA labels, keyboard navigation, focus management

---

## State Management Strategy

### Critical Constraint: NO localStorage

**All wizard state MUST be persisted to cloud Supabase.**

### State Flow

```
Step 1 → Step 2: Create shipment in DB, get UUID, pass via URL
Step 2 → Step 3: Update shipment with selected quote_id
Step 3 → Step 4: Create payment record, update shipment status
Step 4 → Step 5: Create pickup record
Step 5 → Step 6: Finalize shipment, generate tracking
```

### Supabase Client Configuration

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'postal_v2',  // CRITICAL: Always use postal_v2
      },
    }
  );
}

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';

export async function createClient() {
  // ... cookie handling ...
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'postal_v2',  // CRITICAL: Always use postal_v2
      },
      cookies: { /* ... */ },
    }
  );
}
```

---

## journey.spec.ts Testing Strategy

### Append-Only Test File

**Rule**: Never rewrite prior blocks — extend only.

```typescript
// tests/e2e/journey.spec.ts
import { test, expect, Page } from '@playwright/test';

/**
 * Helper to complete all prior steps up to a certain point in the flow.
 * Each step that adds a gate extends this helper with its own segment.
 */
export async function completePriorSteps(page: Page, opts: { through: number }) {
  // Step 1: Shipment details
  if (opts.through >= 1) {
    await page.goto('/shipments/new');
    await page.fill('[name="sender.line1"]', '123 Sender St');
    await page.fill('[name="sender.city"]', 'New York');
    await page.fill('[name="sender.state"]', 'NY');
    await page.fill('[name="sender.postal_code"]', '10001');
    await page.fill('[name="recipient.line1"]', '456 Recipient Ave');
    await page.fill('[name="recipient.city"]', 'Los Angeles');
    await page.fill('[name="recipient.state"]', 'CA');
    await page.fill('[name="recipient.postal_code"]', '90001');
    await page.selectOption('[name="package_type"]', 'box');
    await page.fill('[name="weight"]', '5');
    await page.click('button:has-text("Continue")');
    await expect(page).toHaveURL(/\/shipments\/[\w-]+\/rates/);
  }
  
  // Step 2: Rate selection (added at Gate 1)
  if (opts.through >= 2) {
    await page.click('[data-rate-card]');
    await page.click('button:has-text("Continue")');
    await expect(page).toHaveURL(/\/payment/);
  }
  
  // Future steps append here...
}

// Gate 1: Verify Step 1 → Step 2 works
test('gate 1: shipment creation persists and navigates to rates', async ({ page }) => {
  await completePriorSteps(page, { through: 1 });
  // Verify shipment exists in DB and rates load
  await expect(page.locator('[data-testid="rate-card"]')).toHaveCount(4);
});
```

### Checkpoint Gates

| Checkpoint | Steps Verified | Gate Condition | Journey Test |
|------------|----------------|----------------|--------------|
| Gate 1 | 1-2 | Shipment → Rates → Select Rate → Persist | `completePriorSteps(through: 2)` |
| Gate 2 | 1-3 | Full flow through Payment | `completePriorSteps(through: 3)` |
| Gate 3 | 1-4 | Full flow through Pickup | `completePriorSteps(through: 4)` |
| Gate 4 | 1-5 | Full flow through Review | `completePriorSteps(through: 5)` |
| Gate 5 | 1-6 | Complete end-to-end flow | `completePriorSteps(through: 6)` |

---

## Implementation Phase Plan

### Phase 1: Foundation (Steps 2-6)

| Step | Task | Verification |
|------|------|--------------|
| 2 | Initialize Next.js 15 + shadcn/ui + Supabase | `npm run dev` starts, build passes |
| 3 | Cloud Supabase schema + seed data | Tables exist, seed data queryable |
| 4 | **GATE 1**: End-to-end verification | Schema accessible, health check works |
| 5 | Shared components (FormField, AddressInput, StepIndicator) | Components render with real data |
| 6 | API endpoints (shipments, rates) | Endpoints return valid responses |

### Phase 2: Core Flow (Steps 7-20)

| Step | Task | Gate |
|------|------|------|
| 7-10 | Shipment details page + API integration | - |
| 11-14 | Rate selection page + quotes API | - |
| 15 | **GATE 2**: Checkpoint (Details → Rates works) | `completePriorSteps(through: 2)` passes |
| 16-19 | Payment page + 5 B2B methods | - |
| 20 | **GATE 3**: Checkpoint (through Payment works) | `completePriorSteps(through: 3)` passes |

### Phase 3: Completion (Steps 21-35)

| Step | Task | Gate |
|------|------|------|
| 21-24 | Pickup scheduling + slots API | - |
| 25 | **GATE 4**: Checkpoint (through Pickup works) | `completePriorSteps(through: 4)` passes |
| 26-29 | Review page with full summary | - |
| 30-33 | Confirmation page + tracking | - |
| 34 | **GATE 5**: Checkpoint (complete flow works) | `completePriorSteps(through: 6)` passes |
| 35 | Journey verification test suite | All gates pass |

### Phase 4: Polish & Testing (Steps 36-71)

| Step Range | Focus |
|------------|-------|
| 36-50 | Dashboard pages (shipments list, detail view) |
| 51-60 | E2E test coverage expansion |
| 61-65 | Performance optimization |
| 66-71 | Accessibility audit & documentation |

---

## Integration Points & Verification

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
| Shipment Create | /shipments/new | POST /api/shipments | Row in `shipments` table |
| Quote Fetch | /rates | POST /api/rates | Rows in `quotes` table |
| Rate Select | Rate card click | PATCH /api/shipments | `selected_quote_id` updated |
| Payment Process | /payment | POST /api/payments | Row in `payments` table |
| Pickup Schedule | /pickup | POST /api/pickups | Row in `pickup_details` table |
| Final Confirm | /review | POST /api/confirm | Status='confirmed', tracking generated |

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

### High Risk: Isolated Builds

**Risk**: Building components without wiring them into the user journey.  
**Mitigation**:
- Vertical slice approach — each step must connect to prior/next
- Integration gates every 3 steps
- journey.spec.ts must pass before proceeding

### Medium Risk: Cloud-Only Database Access

**Risk**: Development requires live Supabase connection.  
**Mitigation**:
- Document environment setup clearly
- Use Supabase free tier for development
- Connection pooling for performance

### Medium Risk: Payment Validation Complexity

**Risk**: 5 B2B payment methods with complex validation rules.  
**Mitigation**:
- Implement one method at a time
- Each method has isolated validation function
- Unit tests for each validation rule

---

## Critical Anti-Patterns (From 2026-04-05 Retro)

### DO NOT:

1. **Build components against hardcoded mock data when the DB is available**
   - If schema and credentials exist, write real data and read it back
   - Mock data hides integration bugs that ship to the user

2. **Write E2E test specs that depend on APIs you haven't smoke-tested first**
   - If you can't `curl` the endpoint and get a plausible response, don't write 40 test cases asserting its shape

3. **Mark a wizard step complete when its submit button doesn't persist or navigate**
   - A button that looks right but does nothing is not "done"

4. **Treat your step as isolated**
   - Your task exists in a flow
   - If the flow doesn't work end-to-end after your change, your change is incomplete

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 15.x (App Router) |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | latest |
| Database | Supabase | cloud |
| Forms | React Hook Form | 7.x |
| Validation | Zod | 3.x |
| Testing | Playwright | latest |

---

## Success Criteria for Step 1

This research step is complete when:

1. ✅ All requirements documents analyzed (01-overview through 09-validation-rules)
2. ✅ Full user journey documented with data flow
3. ✅ Data model and schema design documented
4. ✅ Cloud Supabase setup requirements specified
5. ✅ API route architecture defined
6. ✅ Component hierarchy planned
7. ✅ Integration gate checkpoints mapped
8. ✅ journey.spec.ts testing strategy defined
9. ✅ Risk assessment completed with mitigations
10. ✅ Critical anti-patterns from retro documented

**Output**: This comprehensive plan document ready for Step 2 implementation.

---

## References

- Previous Failed Run: `/Users/jackjin/dev/ai-sandbox/projects/nextjs/2026-04-05/1775414201963/`
- Previous Successful Research: `/Users/jackjin/dev/ai-sandbox/projects/nextjs/2026-04-11/1775931318881/`
- Integration Validator Skill: `.claude/skills/integration-validator/SKILL.md`
- Worker Base Instructions: `.claude/skills/worker-base/SKILL.md`
- Next.js 15 Docs: https://nextjs.org/docs
- Supabase SSR Guide: https://supabase.com/docs/guides/auth/server-side
- shadcn/ui: https://ui.shadcn.com
