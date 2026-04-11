# Step 1: Research and Plan Implementation Approach

**Status**: Complete  
**Date**: April 11, 2026  
**Contract**: contract-1775938112028  
**Project**: B2B Postal Checkout Flow  
**Step**: 1 of 30

---

## Executive Summary

This document provides comprehensive research findings and a detailed implementation plan for the B2B Postal Checkout Flow project. Based on analysis of previous project runs (contract-1775414201963 from 2026-04-05 and contract-1775931318881 from 2026-04-11), this plan establishes a vertical-slice development approach to ensure working end-to-end flows at every checkpoint.

### Critical Lesson from Previous Runs

The 2026-04-06 postal-checkout run failed with: **32 steps, 52 commits, 0 working end-to-end flows**. The primary anti-pattern was building components against hardcoded mock data when the database was available.

**This run's approach**: Every step must be verified end-to-end through the cloud database — no localStorage, no hardcoded mocks when DB is available.

---

## Full User Journey Analysis

### 6-Step Checkout Flow

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

## Critical Constraints Analysis

### Cloud Supabase ONLY
- **NO local Docker**, no `supabase start`
- **ALL tables in postal_v2 schema** (never touch public schema)
- Credentials from `.env.app` (APP_SUPABASE_*)
- Connection pooling for performance

### No localStorage for Wizard State
- All state persisted to cloud Supabase
- URL-based navigation with shipment_id
- Data must survive page reloads

### Append-Only E2E Tests
- `tests/e2e/journey.spec.ts` grows with each step
- Never rewrite prior blocks — extend only
- Integration gates at checkpoints

### Seed Data Requirements
- 3 carriers (PEX, VC, EFL, FS)
- 5 rates per carrier
- 3 pickup_slots
- 1 sample shipment for testing

---

## Requirements Analysis (01-overview through 09-validation-rules)

### 1. Shipment Details (Step 1) - 01-overview.md
- **Origin/Destination Address**: Full address form with validation
- **Package Configuration**: Type, dimensions, weight, declared value
- **Special Handling**: Fragile, hazardous, temperature-controlled, signature options
- **Reference Information**: PO number, reference numbers
- **Multi-piece support**: Up to 20 packages per shipment

### 2. Data Models - 02-data-models.md
**Core Tables (postal_v2 schema)**:
```sql
-- Organization & Users
organizations (id, name, slug, tax_id, billing_email, payment_terms, credit_limit)
users (id, email, first_name, last_name, organization_id, role)
addresses (id, organization_id, label, line1, line2, city, state, postal_code, country)

-- Shipping Core
shipments (id, organization_id, user_id, status, sender_address_id, recipient_address_id,
           package_type, weight, dimensions, carrier_id, service_type_id, total_cost)
shipment_packages (id, shipment_id, package details)
shipment_special_handling (id, shipment_id, handling_type, fee)

-- Carriers & Services
carriers (id, code, name, display_name, ratings, multipliers)
service_types (id, carrier_id, code, name, category, pricing)

-- Quotes
quotes (id, shipment_id, carrier_id, service_type_id, base_rate, fuel_surcharge,
        total_cost, estimated_delivery, is_selected)
```

### 3. API Endpoints - 03-api-endpoints.md
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Service health check |
| `/api/shipments` | POST | Create new shipment |
| `/api/shipments/[id]` | GET/PATCH | Shipment CRUD |
| `/api/rates` | POST | Calculate multi-carrier quotes |
| `/api/rates/select` | POST | Select a rate for shipment |
| `/api/payments/process` | POST | Process payment |
| `/api/pickup-slots` | GET | Available pickup slots |
| `/api/pickups` | POST | Schedule pickup |
| `/api/shipments/[id]/confirm` | POST | Final confirmation |

### 4. Business Logic - 04-business-logic.md
**Pricing Engine**:
- Base rate from carrier + service_type
- Fuel surcharge calculation
- Special handling fees
- Volume discounts

**Pickup Rules**:
- Same-day cutoff: 2 PM local time
- Weekend pickup premiums
- Residential vs commercial fees

### 5. Components - 05-components.md
**Component Hierarchy**:
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
│   ├── StepIndicator.tsx
│   └── LoadingSpinner.tsx
├── shipments/                    # Shipment-specific
├── rates/                        # Rate selection
├── payment/                      # Payment
├── pickup/                       # Pickup
└── review/                       # Review
```

### 6. Design System - 06-design-system.md
- **Tailwind CSS v4** with shadcn/ui
- **Color palette**: Primary (slate), Accent (blue)
- **Typography**: Inter font family
- **Spacing**: 4px base unit
- **Components**: Button, Input, Select, Card, Dialog, Form

### 7. Pickup Scheduling - 07-pickup-scheduling.md
**Calendar Logic**:
- Available slots from `pickup_slots` table
- Business days only (Mon-Fri)
- 2-hour time windows
- Cutoff: 2 PM for next-day pickup

**Fees**:
- Standard pickup: $0
- After-hours: $25
- Weekend: $50
- Residential: $15

### 8. Payment Methods - 08-payment-methods.md
**5 B2B Payment Methods**:
1. **Purchase Order (PO)**: PO number, authorized_by
2. **Net Terms (15/30/60 days)**: credit_limit, available_credit
3. **Bill of Lading (BOL)**: bol_number
4. **Third Party Billing**: account_number, carrier
5. **Corporate Account**: account_number

### 9. Validation Rules - 09-validation-rules.md
**Zod Schemas**:
- Shipment details: required fields, address format
- Package: weight > 0, dimensions valid
- Payment: method-specific validation
- Pickup: valid slot selection

---

## Tech Stack Analysis

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 15.x (App Router) |
| Language | TypeScript | 5.x (strict mode) |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | latest |
| Database | Supabase | cloud |
| Forms | React Hook Form | 7.x |
| Validation | Zod | 3.x |
| Testing | Playwright | latest |

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
  if (opts.through >= 1) {
    await page.goto('/shipments/new')
    await page.fill('[name="sender.line1"]', '123 Sender St')
    // ... more fields
    await page.click('button:has-text("Continue")')
    await expect(page).toHaveURL(/\/shipments\/[\w-]+\/rates/)
  }
  if (opts.through >= 2) {
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

## Implementation Roadmap

### Phase 1: Foundation (Steps 2-6)
- **Step 2**: Initialize Next.js 15 project with dependencies
- **Step 3**: Create postal_v2 schema and core tables
- **Step 4**: [GATE] End-to-end verification checkpoint 1
- **Step 5**: Build shared components (FormField, AddressInput, StepIndicator)
- **Step 6**: Build API endpoints (shipments, rates)

### Phase 2: Core Flow (Steps 7-15)
- **Steps 7-10**: Shipment details page + API integration
- **Steps 11-13**: Rate selection page + quotes API
- **Step 14**: [GATE] Checkpoint 2 (Details → Rates works)
- **Step 15**: Payment page foundation

### Phase 3: Completion (Steps 16-25)
- **Steps 16-18**: 5 B2B payment methods
- **Step 19**: [GATE] Checkpoint 3 (through Payment works)
- **Steps 20-22**: Pickup scheduling + slots API
- **Step 23**: [GATE] Checkpoint 4 (through Pickup works)
- **Steps 24-25**: Review + Confirmation pages

### Phase 4: Final Verification (Steps 26-30)
- **Step 26**: [GATE] Checkpoint 5 (complete flow works)
- **Steps 27-28**: Dashboard pages (shipments list, detail view)
- **Steps 29-30**: Final E2E test coverage

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

---

## File Structure Convention

```
projects/nextjs/2026-04-11/1775938112028/
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
├── tests/e2e/
│   └── journey.spec.ts
└── package.json
```

---

## Environment Variables

```bash
# From .env.app
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

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

- Previous Project (2026-04-05): `/Users/jackjin/dev/ai-sandbox/projects/nextjs/2026-04-05/1775414201963/`
- Similar Project (2026-04-11): `/Users/jackjin/dev/ai-sandbox/projects/nextjs/2026-04-11/1775931318881/`
- Next.js 15 Docs: https://nextjs.org/docs
- Supabase SSR Guide: https://supabase.com/docs/guides/auth/server-side
- shadcn/ui: https://ui.shadcn.com
