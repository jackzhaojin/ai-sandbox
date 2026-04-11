# Step 1: Research and Plan Implementation Approach

**Status**: Complete  
**Date**: April 11, 2026  
**Contract**: contract-1775931318881  
**Project**: B2B Postal Checkout Flow  
**Step**: 1 of 70

---

## Executive Summary

This document provides comprehensive research findings and a detailed implementation plan for the B2B Postal Checkout Flow project. Based on analysis of the previous project run (2026-04-05, contract-1775414201963), this plan addresses the critical failure modes identified and establishes a vertical-slice development approach to ensure working end-to-end flows at every checkpoint.

### Key Lesson from Previous Run

The 2026-04-06 postal-checkout run failed with: **32 steps, 52 commits, 0 working end-to-end flows**. The primary anti-pattern was building components against hardcoded mock data when the database was available, leading to beautiful parts that didn't connect.

**This run's approach**: Every step must be verified end-to-end through the cloud database — no localStorage, no hardcoded mocks when DB is available.

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

---

## Requirements Analysis

### Functional Requirements (from 01-overview through 09-validation-rules)

#### 1. Shipment Details (Step 1)
- **Origin/Destination Address**: Full address form with validation
- **Package Configuration**: Type, dimensions, weight, declared value
- **Special Handling**: Fragile, hazardous, temperature-controlled, signature options
- **Reference Information**: PO number, reference numbers
- **Multi-piece support**: Up to 20 packages per shipment

#### 2. Rate Selection (Step 2)
- **Real-time quotes**: Fetched from `/api/rates` endpoint
- **Multi-carrier display**: PEX, VC, EFL, FS carriers with ratings
- **Service categories**: Ground, Air, Express, Freight, International
- **Pricing breakdown**: Base rate, fuel surcharge, fees
- **Carbon footprint**: Environmental impact display

#### 3. Payment (Step 3)
- **5 B2B Payment Methods**:
  1. Purchase Order (PO)
  2. Net Terms (15/30/60 days)
  3. Bill of Lading (BOL)
  4. Third Party Billing
  5. Corporate Account
- **Validation rules**: Credit limits, approval workflows
- **Method-specific fields**: PO number, authorization codes

#### 4. Pickup Scheduling (Step 4)
- **Available slots**: Fetched from `/api/pickup-slots`
- **Access requirements**: Gate codes, dock numbers, building type
- **Equipment needs**: Pallet jack, forklift, liftgate
- **Contact personnel**: Authorized signers

#### 5. Review (Step 5)
- **Complete summary**: All persisted data displayed
- **Edit navigation**: Links back to each step
- **Terms acceptance**: Required checkbox
- **Final validation**: All data verified before confirm

#### 6. Confirmation (Step 6)
- **Tracking number**: Generated and displayed
- **Reference query**: `/shipments/{id}` route
- **Documentation**: Label download, commercial invoice
- **Next steps**: Pickup checklist, tracking information

### Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Database** | Cloud Supabase only — NO localStorage |
| **Performance** | Page load < 2s, API response < 500ms |
| **Security** | RLS policies, input validation, HTTPS only |
| **Accessibility** | WCAG 2.1 AA compliance |
| **Testing** | E2E journey.spec.ts for every checkpoint |

---

## Data Model & Schema Design

### Core Tables (29 total)

Based on analysis of the previous project's schema:

#### Organization & Users
```sql
organizations (id, name, slug, tax_id, billing_email, payment_terms, credit_limit)
users (id, email, first_name, last_name, organization_id, role)
addresses (id, organization_id, label, line1, line2, city, state, postal_code, country)
```

#### Shipping Core
```sql
shipments (id, organization_id, user_id, status, sender_address_id, recipient_address_id, 
           package_type, weight, dimensions, carrier_id, service_type_id, total_cost)
shipment_packages (id, shipment_id, package details)
shipment_special_handling (id, shipment_id, handling_type, fee)
shipment_delivery_preferences (id, shipment_id, saturday_delivery, signature_required)
hazmat_details (id, shipment_id, is_hazmat, hazmat_class, un_number)
```

#### Carriers & Services
```sql
carriers (id, code, name, display_name, ratings, multipliers)
service_types (id, carrier_id, code, name, category, pricing)
```

#### Quotes
```sql
quotes (id, shipment_id, carrier_id, service_type_id, base_rate, fuel_surcharge, 
        total_cost, estimated_delivery, is_selected)
```

#### Payment (5 B2B Methods)
```sql
payment_info (id, organization_id, type, status)
payment_purchase_orders (id, payment_info_id, po_number, authorized_by)
payment_bills_of_lading (id, payment_info_id, bol_number)
payment_third_party (id, payment_info_id, account_number, carrier)
payment_net_terms (id, payment_info_id, term_days, credit_limit, available_credit)
payment_net_terms_references (id, net_terms_id, shipment_id, amount)
payment_corporate_accounts (id, payment_info_id, account_number)
```

#### Pickup
```sql
pickup_details (id, shipment_id, pickup_date, status)
pickup_contacts (id, pickup_id, name, phone, email)
pickup_access_requirements (id, pickup_id, access_type, instructions)
pickup_equipment_needs (id, pickup_id, equipment_type)
pickup_authorized_personnel (id, pickup_id, name, authorization_level)
```

#### Tracking & Audit
```sql
shipment_events (id, shipment_id, status, location, timestamp)
activity_log (id, organization_id, user_id, action, entity_type, entity_id)
```

### ENUM Types
- `user_role`: admin, manager, user
- `organization_status`: active, suspended, inactive
- `payment_term`: immediate, net15, net30, net60
- `package_type`: box, envelope, tube, pallet
- `shipment_status`: draft, pending_payment, paid, label_generated, picked_up, in_transit, delivered, cancelled
- `carrier_code`: pex, vc, efl, fs
- `service_category`: ground, air, freight, express, international
- `payment_method_type`: purchase_order, net_terms, bill_of_lading, third_party, corporate_account
- `handling_type`: fragile, hazardous, temperature_controlled, signature_required, adult_signature, hold_for_pickup, appointment_delivery

---

## Cloud Supabase Setup Requirements

### Schema Setup

**File**: `supabase/migrations/000001_initial_schema.sql`

1. **Create ENUM types** (12 types)
2. **Create tables** (29 tables with constraints)
3. **Create indexes** (35+ indexes for performance)
4. **Enable RLS** on all tables
5. **Create policies** for organization-based access
6. **Create functions**: update_updated_at(), generate_shipment_number(), log_activity()
7. **Create triggers** for auto-updating timestamps

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

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## API Route Architecture

### Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Service health check |
| `/api/form-config` | GET | Dropdown options & validation rules |
| `/api/shipments` | POST | Create new shipment |
| `/api/shipments/[id]` | GET/PATCH | Shipment CRUD |
| `/api/rates` | POST | Calculate multi-carrier quotes |
| `/api/rates/select` | POST | Select a rate for shipment |
| `/api/payments/process` | POST | Process payment |
| `/api/pickup-slots` | GET | Available pickup slots |
| `/api/pickups` | POST | Schedule pickup |
| `/api/shipments/[id]/confirm` | POST | Final confirmation |

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
├── api/                          # API routes (see above)
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

e2e/
└── journey.spec.ts               # Complete E2E journey test
```

---

## State Management Strategy

### Critical Constraint: NO localStorage

**All wizard state MUST be persisted to cloud Supabase.**

### State Flow

1. **Step 1 → Step 2**: Create shipment in DB, get UUID, pass via URL
2. **Step 2 → Step 3**: Update shipment with selected quote_id
3. **Step 3 → Step 4**: Create payment record, update shipment status
4. **Step 4 → Step 5**: Create pickup record
5. **Step 5 → Step 6**: Finalize shipment, generate tracking

### URL State Pattern

```typescript
// Navigation uses shipment_id in URL
/shipments/new                    → Create new
/shipments/[id]/rates            → Step 2
/shipments/[id]/payment          → Step 3
/shipments/[id]/pickup           → Step 4
/shipments/[id]/review           → Step 5
/shipments/[id]/confirm          → Step 6
/shipments/[id]                  → View shipment (post-confirmation)
```

---

## journey.spec.ts Testing Strategy

### Append-Only Test File

**Rule**: Never rewrite prior blocks — extend only.

```typescript
// tests/e2e/journey.spec.ts
import { test, expect, Page } from '@playwright/test'

export async function completePriorSteps(page: Page, opts: { through: number }) {
  // Each step extends this helper with its segment
  if (opts.through >= 1) {
    await page.goto('/shipments/new')
    // Fill origin address
    await page.fill('[name="sender.line1"]', '123 Sender St')
    // ... more fields
    await page.click('button:has-text("Continue")')
    await expect(page).toHaveURL(/\/shipments\/[\w-]+\/rates/)
  }
  if (opts.through >= 2) {
    // Step 2 segment...
    await page.click('[data-rate-card]')
    await page.click('button:has-text("Continue")')
    await expect(page).toHaveURL(/\/payment/)
  }
  // ...etc
}

test('complete checkout flow', async ({ page }) => {
  await completePriorSteps(page, { through: 5 })
  await page.click('button:has-text("Confirm Shipment")')
  await expect(page).toHaveURL(/\/confirm/)
  await expect(page.getByText(/tracking/i)).toBeVisible()
})
```

### Checkpoint Gates

| Checkpoint | Steps Verified | Gate Condition |
|------------|----------------|----------------|
| Gate 1 | 1-2 | Shipment → Rates → Select Rate → Persist |
| Gate 2 | 1-3 | Full flow through Payment |
| Gate 3 | 1-4 | Full flow through Pickup |
| Gate 4 | 1-5 | Full flow through Review |
| Gate 5 | 1-6 | Complete end-to-end flow |

---

## Implementation Phases

### Phase 1: Foundation (Steps 2-6)
- Step 2: Initialize Next.js 15 project with dependencies
- Step 3: Configure cloud Supabase client and schema
- Step 4: [GATE] End-to-end verification checkpoint 1
- Step 5: Build shared components (FormField, AddressInput, StepIndicator)
- Step 6: Build API endpoints (shipments, rates)

### Phase 2: Core Flow (Steps 7-20)
- Step 7-10: Shipment details page + API integration
- Step 11-14: Rate selection page + quotes API
- Step 15: [GATE] Checkpoint 2 (Details → Rates works)
- Step 16-19: Payment page + 5 B2B methods
- Step 20: [GATE] Checkpoint 3 (through Payment works)

### Phase 3: Completion (Steps 21-35)
- Step 21-24: Pickup scheduling + slots API
- Step 25: [GATE] Checkpoint 4 (through Pickup works)
- Step 26-29: Review page with full summary
- Step 30-33: Confirmation page + tracking
- Step 34: [GATE] Checkpoint 5 (complete flow works)
- Step 35: Journey verification test suite

### Phase 4: Polish & Testing (Steps 36-70)
- Steps 36-50: Dashboard pages (shipments list, detail view)
- Steps 51-60: E2E test coverage expansion
- Steps 61-65: Performance optimization
- Steps 66-70: Accessibility audit & documentation

---

## Integration Points

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

### Low Risk: TypeScript Type Generation

**Risk**: Supabase types may drift from schema.
**Mitigation**:
- Type generation script in package.json
- CI check for type consistency

---

## File Structure Convention

```
projects/nextjs/2026-04-11/1775931318881/
├── ai-docs/
│   ├── STEP1_RESEARCH_PLAN.md      # This document
│   ├── SCHEMA_SETUP.md             # Database schema details
│   └── STEP{N}_HANDOFF.md          # Per-step handoffs
├── app/
│   ├── shipments/
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── lib/
├── types/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── e2e/
│   └── journey.spec.ts
└── package.json
```

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

## Immediate Next Steps (Step 2-4)

### Step 2: Initialize Next.js 15 Project
- Create project with shadcn/ui
- Install dependencies: @supabase/ssr, react-hook-form, zod, sonner
- Configure Tailwind v4
- Set up folder structure

### Step 3: Configure Cloud Supabase
- Create or connect to Supabase project
- Run schema migration (000001_initial_schema.sql)
- Run seed data (seed.sql)
- Configure environment variables
- Test connection from Next.js

### Step 4: [GATE] End-to-End Verification Checkpoint 1
- Verify Supabase connection works
- Verify data seed is accessible
- Create basic health check API
- Verify build passes

---

## Success Criteria

This research step is complete when:

1. ✅ All requirements documents analyzed (01-overview through 09-validation-rules)
2. ✅ Full user journey documented with data flow
3. ✅ Data model and schema design documented
4. ✅ Cloud Supabase setup requirements specified
5. ✅ journey.spec.ts testing strategy defined
6. ✅ Implementation phases planned
7. ✅ Risk assessment completed
8. ✅ Integration points identified

The next step (Step 2) can begin with confidence in the architectural approach.

---

## References

- Previous Project: `/Users/jackjin/dev/ai-sandbox/projects/nextjs/2026-04-05/1775414201963/`
- Previous Research: `/Users/jackjin/dev/ai-sandbox/projects/nextjs/2026-04-05/1775414201963/ai-docs/RESEARCH.md`
- Previous Schema: `/Users/jackjin/dev/ai-sandbox/projects/nextjs/2026-04-05/1775414201963/ai-docs/SCHEMA_SETUP.md`
- Next.js 15 Docs: https://nextjs.org/docs
- Supabase SSR Guide: https://supabase.com/docs/guides/auth/server-side
- shadcn/ui: https://ui.shadcn.com
