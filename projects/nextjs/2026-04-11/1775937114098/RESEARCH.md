# B2B Postal Checkout Flow - Research & Implementation Plan

**Project**: B2B Postal Checkout Flow  
**Contract**: contract-1775937114098  
**Step**: 1 of 47  
**Date**: April 11, 2026  
**Status**: Research Complete  

---

## Executive Summary

This document provides comprehensive research findings and a detailed implementation plan for the B2B Postal Checkout Flow project. Based on analysis of previous runs (particularly the 2026-04-06 failure), this plan establishes a **vertical-slice development approach** to ensure working end-to-end flows at every checkpoint.

### Critical Lesson from Previous Run

The 2026-04-06 postal-checkout run failed with: **32 steps, 52 commits, 0 working end-to-end flows**. The primary anti-pattern was building components against hardcoded mock data when the database was available, leading to beautiful parts that didn't connect.

**This run's approach**: Every step must be verified end-to-end through the cloud database — no localStorage, no hardcoded mocks when DB is available.

---

## Full User Journey Analysis

### Complete 6-Step Flow Overview

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

### Route Structure

```
/shipments/new                    → Create new shipment (Step 1)
/shipments/[id]/rates            → Rate selection (Step 2)
/shipments/[id]/payment          → Payment methods (Step 3)
/shipments/[id]/pickup           → Pickup scheduling (Step 4)
/shipments/[id]/review           → Review & confirm (Step 5)
/shipments/[id]/confirmation     → Order confirmation (Step 6)
/shipments/[id]                  → View shipment (post-confirmation)
```

---

## Requirements Analysis

### Functional Requirements

#### Step 1: Shipment Details
- **Origin Address**: Full address form with validation (line1, line2, city, state, postal_code, country)
- **Destination Address**: Same as origin
- **Package Configuration**: Type (box/envelope/tube/pallet), dimensions, weight, declared value
- **Special Handling**: Fragile, hazardous, temperature-controlled, signature options
- **Reference Information**: PO number, reference numbers
- **Multi-piece support**: Up to 20 packages per shipment

#### Step 2: Rate Selection
- **Real-time quotes**: Fetched from `/api/rates` endpoint reading from Supabase
- **Multi-carrier display**: 4 mock carriers (PEX, VC, EFL, FS) with ratings
- **Service categories**: Ground, Express, Overnight, Freight, International
- **Pricing breakdown**: Base rate, fuel surcharge, fees, total
- **Carbon footprint**: Environmental impact display (optional)

#### Step 3: Payment (5 B2B Methods)
1. **Purchase Order (PO)**: PO number, authorized_by
2. **Net Terms** (15/30/60 days): Credit limit, available credit check
3. **Bill of Lading (BOL)**: BOL number, carrier reference
4. **Third Party Billing**: Account number, billing address
5. **Corporate Account**: Account number, department code

#### Step 4: Pickup Scheduling
- **Available slots**: Fetched from `/api/pickup-slots` endpoint
- **Date/time selection**: Calendar with available windows
- **Access requirements**: Gate codes, dock numbers, building type
- **Equipment needs**: Pallet jack, forklift, liftgate requirements
- **Contact personnel**: Authorized signers with phone/email

#### Step 5: Review
- **Complete summary**: All persisted data from previous steps
- **Edit navigation**: Links back to each step for corrections
- **Terms acceptance**: Required checkbox before confirm
- **Final validation**: All data verified before submission

#### Step 6: Confirmation
- **Tracking number**: Auto-generated (format: SHP-YYYY-XXXXXX)
- **Reference query**: View at `/shipments/{id}`
- **Documentation**: Label download, receipt
- **Next steps**: Pickup checklist, tracking information

### Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Database** | Cloud Supabase only — NO localStorage for wizard state |
| **Schema** | ALL tables in `postal_v2` schema (NOT public) |
| **Performance** | Page load < 2s, API response < 500ms |
| **Security** | RLS policies, input validation, HTTPS only |
| **Accessibility** | WCAG 2.1 AA compliance |
| **Testing** | E2E journey.spec.ts extended at every checkpoint |

---

## Data Model & Schema Design

### Core Tables (29 total in postal_v2 schema)

#### Organization & Users
```sql
postal_v2.organizations (id, name, slug, tax_id, billing_email, payment_terms, credit_limit)
postal_v2.users (id, email, first_name, last_name, organization_id, role)
postal_v2.addresses (id, organization_id, label, line1, line2, city, state, postal_code, country)
```

#### Shipping Core
```sql
postal_v2.shipments (
  id, organization_id, user_id, status,
  sender_address_id, sender_contact_name, sender_contact_phone, sender_contact_email,
  recipient_address_id, recipient_contact_name, recipient_contact_phone, recipient_contact_email,
  package_type, weight, length, width, height, declared_value, contents_description,
  carrier_id, service_type_id, total_cost, tracking_number
)
postal_v2.shipment_packages (id, shipment_id, package details)
postal_v2.shipment_special_handling (id, shipment_id, handling_type, fee)
postal_v2.shipment_delivery_preferences (id, shipment_id, saturday_delivery, signature_required)
postal_v2.hazmat_details (id, shipment_id, is_hazmat, hazmat_class, un_number)
```

#### Carriers & Services
```sql
postal_v2.carriers (id, code, name, display_name, rating, multiplier, logo_url)
postal_v2.service_types (id, carrier_id, code, name, category, base_rate_per_lb, max_weight, estimated_days)
```

#### Quotes
```sql
postal_v2.quotes (
  id, shipment_id, carrier_id, service_type_id,
  base_rate, fuel_surcharge, total_cost, estimated_delivery, is_selected
)
```

#### Payment (5 B2B Methods)
```sql
postal_v2.payment_info (id, organization_id, type, status)
postal_v2.payment_purchase_orders (id, payment_info_id, po_number, authorized_by)
postal_v2.payment_bills_of_lading (id, payment_info_id, bol_number)
postal_v2.payment_third_party (id, payment_info_id, account_number, billing_address_id)
postal_v2.payment_net_terms (id, payment_info_id, term_days, credit_limit, available_credit)
postal_v2.payment_corporate_accounts (id, payment_info_id, account_number, department_code)
postal_v2.payments (id, shipment_id, payment_info_id, amount, status, processed_at)
```

#### Pickup
```sql
postal_v2.pickup_details (id, shipment_id, pickup_date, time_window_start, time_window_end, status)
postal_v2.pickup_contacts (id, pickup_id, name, phone, email)
postal_v2.pickup_access_requirements (id, pickup_id, gate_code, dock_number, building_type, instructions)
postal_v2.pickup_equipment_needs (id, pickup_id, equipment_type, quantity)
```

#### Tracking & Audit
```sql
postal_v2.shipment_events (id, shipment_id, status, location, timestamp, notes)
postal_v2.activity_log (id, organization_id, user_id, action, entity_type, entity_id, metadata)
```

### ENUM Types
- `user_role`: admin, manager, user
- `organization_status`: active, suspended, inactive
- `payment_term`: immediate, net15, net30, net60
- `package_type`: box, envelope, tube, pallet
- `shipment_status`: draft, pending_payment, paid, label_generated, picked_up, in_transit, delivered, cancelled
- `carrier_code`: pex, vc, efl, fs
- `service_category`: ground, express, overnight, freight, international
- `payment_method_type`: purchase_order, net_terms, bill_of_lading, third_party, corporate_account
- `handling_type`: fragile, hazardous, temperature_controlled, signature_required, adult_signature, hold_for_pickup, appointment_delivery

---

## Cloud Supabase Configuration

### Credentials (from .env.app)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://lmbrqiwzowiquebtsfyc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Critical Configuration

**Supabase Client MUST use postal_v2 schema:**

```typescript
// lib/supabase/client.ts
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'postal_v2'  // CRITICAL: NOT 'public'
  }
})
```

### Seed Data Strategy

**Mock Carriers** (4):
| Code | Name | Rating | Multiplier |
|------|------|--------|------------|
| PEX | Parcel Express | 4.5/5 | 1.0 |
| VC | Velocity Courier | 4.8/5 | 1.15 |
| EFL | Eagle Freight Lines | 4.2/5 | 0.9 |
| FS | FastShip Global | 4.0/5 | 1.2 |

**Service Types** (21 across carriers):
- Ground: Standard, Economy, Freight LTL
- Express: 2-Day, 3-Day, Saver
- Overnight: Priority, First Overnight
- International: Worldwide Express, International Economy

**Sample Organization**:
- Acme Corporation with 3 addresses
- 1 complete test shipment
- 3 payment methods (PO, Net 30, Corporate)

---

## API Route Architecture

### Core Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/health` | GET | Service health check | `{ status: 'ok', timestamp }` |
| `/api/form-config` | GET | Dropdown options & validation rules | Carriers, services, payment methods |
| `/api/shipments` | POST | Create new shipment | `{ shipment: { id, ... } }` |
| `/api/shipments/[id]` | GET/PATCH | Shipment CRUD | Shipment details |
| `/api/rates` | POST | Calculate multi-carrier quotes | `{ quotes: [...] }` |
| `/api/rates/select` | POST | Select a rate for shipment | `{ success: true }` |
| `/api/payments/process` | POST | Process payment | `{ payment: { id, status } }` |
| `/api/pickup-slots` | GET | Available pickup slots | `{ slots: [...] }` |
| `/api/pickups` | POST | Schedule pickup | `{ pickup: { id } }` |
| `/api/shipments/[id]/confirm` | POST | Final confirmation | `{ tracking_number }` |

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
│       └── confirmation/page.tsx # Step 6: Confirmation
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
│   ├── ProgressIndicator.tsx
│   └── LoadingSpinner.tsx
├── shipments/                    # Shipment-specific
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
│   ├── client.ts                 # Browser client with postal_v2 schema
│   ├── server.ts                 # Server client
│   └── middleware.ts             # Session middleware
├── validation/                   # Zod schemas
│   ├── shipment-details-schema.ts
│   ├── api-schemas.ts
│   └── quote-schemas.ts
├── api/                          # API utilities
│   └── response.ts               # Standardized responses
└── data/                         # Static data
    └── shipment-presets.ts

types/
├── database.ts                   # Generated Supabase types
└── index.ts                      # Application types

tests/e2e/
└── journey.spec.ts               # Complete E2E journey test (append-only)
```

### Key Components

#### StepIndicator
```typescript
interface StepIndicatorProps {
  steps: { id: string; label: string; description?: string }[];
  currentStep: number;
  completedSteps: number[];
}
```

#### AddressInput
```typescript
interface AddressInputProps {
  value?: AddressFormData;
  onChange: (value: AddressFormData) => void;
  label?: string;
  error?: string;
}
```

#### RateCard
```typescript
interface RateCardProps {
  quote: Quote;
  isSelected: boolean;
  onSelect: () => void;
}
```

---

## Validation Strategy

### Zod Schema Pattern

```typescript
// lib/validation/shipment-details-schema.ts
import { z } from 'zod';

export const addressSchema = z.object({
  line1: z.string().min(1, 'Address is required').max(100),
  line2: z.string().max(100).optional(),
  city: z.string().min(1, 'City is required').max(50),
  state: z.string().min(1, 'State is required').max(50),
  postal_code: z.string().min(5, 'Valid ZIP required').max(20),
  country: z.string().length(2, 'Country code must be 2 characters').default('US'),
});

export const packageSchema = z.object({
  package_type: z.enum(['box', 'envelope', 'tube', 'pallet']),
  weight: z.number().positive('Weight must be greater than 0').max(1000),
  length: z.number().positive('Length is required').max(300),
  width: z.number().positive('Width is required').max(300),
  height: z.number().positive('Height is required').max(300),
  declared_value: z.number().min(0).optional(),
  contents_description: z.string().min(1, 'Contents description is required').max(500),
});

export const shipmentDetailsSchema = z.object({
  sender: z.object({
    address: addressSchema,
    contact_name: z.string().min(1, 'Contact name is required'),
    contact_phone: z.string().optional(),
    contact_email: z.string().email().optional(),
  }),
  recipient: z.object({
    address: addressSchema,
    contact_name: z.string().min(1, 'Contact name is required'),
    contact_phone: z.string().optional(),
    contact_email: z.string().email().optional(),
  }),
  package: packageSchema,
});

export type ShipmentDetailsFormData = z.infer<typeof shipmentDetailsSchema>;
```

---

## State Management Strategy

### Critical Constraint: NO localStorage

**All wizard state MUST be persisted to cloud Supabase.**

### State Flow

1. **Step 1 → Step 2**: Create shipment in DB, get UUID, pass via URL (`/shipments/[id]/rates`)
2. **Step 2 → Step 3**: Update shipment with selected quote_id, navigate to payment
3. **Step 3 → Step 4**: Create payment record, update shipment status, navigate to pickup
4. **Step 4 → Step 5**: Create pickup record, navigate to review
5. **Step 5 → Step 6**: Finalize shipment, generate tracking, show confirmation

### URL State Pattern

```typescript
// Navigation uses shipment_id in URL
/shipments/new                    → Create new (no ID yet)
/shipments/[id]/rates            → Step 2 (ID from Step 1 creation)
/shipments/[id]/payment          → Step 3
/shipments/[id]/pickup           → Step 4
/shipments/[id]/review           → Step 5
/shipments/[id]/confirmation     → Step 6
/shipments/[id]                  → View shipment (post-confirmation)
```

---

## journey.spec.ts Testing Strategy

### Append-Only Test File

**Rule**: Never rewrite prior blocks — extend only.

```typescript
// tests/e2e/journey.spec.ts
import { test, expect, Page } from '@playwright/test';

export async function completePriorSteps(page: Page, opts: { through: number; shipmentId?: string }) {
  // Step 1: Shipment Details
  if (opts.through >= 1) {
    await page.goto('/shipments/new');
    await page.fill('[name="sender.address.line1"]', '123 Sender St');
    await page.fill('[name="sender.address.city"]', 'New York');
    await page.fill('[name="sender.address.state"]', 'NY');
    await page.fill('[name="sender.address.postal_code"]', '10001');
    await page.fill('[name="sender.contact_name"]', 'John Sender');
    await page.fill('[name="recipient.address.line1"]', '456 Recipient Ave');
    await page.fill('[name="recipient.address.city"]', 'Los Angeles');
    await page.fill('[name="recipient.address.state"]', 'CA');
    await page.fill('[name="recipient.address.postal_code"]', '90001');
    await page.fill('[name="recipient.contact_name"]', 'Jane Recipient');
    await page.selectOption('[name="package.package_type"]', 'box');
    await page.fill('[name="package.weight"]', '5');
    await page.fill('[name="package.length"]', '12');
    await page.fill('[name="package.width"]', '10');
    await page.fill('[name="package.height"]', '8');
    await page.fill('[name="package.contents_description"]', 'Test documents');
    await page.click('button:has-text("Continue")');
    await expect(page).toHaveURL(/\/shipments\/[\w-]+\/rates/);
  }
  
  if (opts.through >= 2) {
    // Step 2: Select first rate
    await page.click('[data-rate-card]');
    await page.click('button:has-text("Continue")');
    await expect(page).toHaveURL(/\/payment/);
  }
  
  // ... etc for steps 3-5
}

test('complete checkout flow', async ({ page }) => {
  await completePriorSteps(page, { through: 5 });
  await page.click('button:has-text("Confirm Shipment")');
  await expect(page).toHaveURL(/\/confirmation/);
  await expect(page.getByText(/tracking/i)).toBeVisible();
});
```

### Checkpoint Gates

| Checkpoint | Steps Verified | Gate Condition |
|------------|----------------|----------------|
| Gate 1 | 1-3 | Shipment → Rates → Payment persists to DB |
| Gate 2 | 1-4 | Full flow through Pickup scheduling |
| Gate 3 | 1-5 | Full flow through Review |
| Gate 4 | 1-6 | Complete end-to-end flow with tracking |

---

## Implementation Phases (47 Steps)

### Phase 1: Foundation (Steps 2-6)
| Step | Task | Output |
|------|------|--------|
| 2 | Initialize Next.js 15 project | package.json, app/, build passes |
| 3 | Create postal_v2 schema + tables | Migration file, tables in cloud DB |
| 4 | **[GATE]** E2E verification checkpoint 1 | Health check API, seed data queryable |
| 5 | Build shared components | FormField, AddressInput, StepIndicator |
| 6 | Seed carriers/services/rates | Seed.sql, data queryable in DB |

### Phase 2: Step 1 - Shipment Details (Steps 7-12)
| Step | Task | Output |
|------|------|--------|
| 7 | API: POST /api/shipments | Creates shipment in DB |
| 8 | UI: Address forms | Origin/destination with validation |
| 9 | UI: Package config | Type, dimensions, weight inputs |
| 10 | UI: Special handling | Fragile, hazmat, signature options |
| 11 | Wire Step 1 together | Form submits, creates shipment, navigates |
| 12 | **[GATE]** Step 1 verification | E2E test: form → DB → navigation |

### Phase 3: Step 2 - Rate Selection (Steps 13-17)
| Step | Task | Output |
|------|------|--------|
| 13 | API: POST /api/rates | Returns quotes from DB |
| 14 | UI: Rate cards | Display carrier options |
| 15 | UI: Rate comparison | Grid/table view |
| 16 | Wire Step 2 together | Select rate, update shipment |
| 17 | **[GATE]** Step 2 verification | E2E test: select rate persists |

### Phase 4: Step 3 - Payment (Steps 18-25)
| Step | Task | Output |
|------|------|--------|
| 18 | API: Payment validation rules | 5 B2B method validators |
| 19 | API: POST /api/payments/process | Creates payment record |
| 20 | UI: Payment method selector | Tabs for 5 methods |
| 21 | UI: Purchase Order form | PO number, authorized_by |
| 22 | UI: Net Terms form | Credit limit check |
| 23 | UI: Other payment forms | BOL, Third Party, Corporate |
| 24 | Wire Step 3 together | Process payment, update status |
| 25 | **[GATE]** Step 3 verification | E2E test: payment persists |

### Phase 5: Step 4 - Pickup (Steps 26-31)
| Step | Task | Output |
|------|------|--------|
| 26 | API: GET /api/pickup-slots | Returns available slots |
| 27 | API: POST /api/pickups | Schedules pickup |
| 28 | UI: Pickup scheduler | Calendar, time windows |
| 29 | UI: Access requirements | Gate codes, dock, building |
| 30 | Wire Step 4 together | Schedule pickup, create record |
| 31 | **[GATE]** Step 4 verification | E2E test: pickup persists |

### Phase 6: Step 5-6 - Review & Confirm (Steps 32-38)
| Step | Task | Output |
|------|------|--------|
| 32 | UI: Review page | Display all persisted data |
| 33 | UI: Edit navigation | Links back to each step |
| 34 | API: POST /api/shipments/[id]/confirm | Finalize, generate tracking |
| 35 | UI: Confirmation page | Tracking number display |
| 36 | **[GATE]** Step 5-6 verification | E2E test: full flow complete |
| 37 | journey.spec.ts complete | All steps tested |
| 38 | **[GATE]** Final verification | Full E2E journey passes |

### Phase 7: Polish & Testing (Steps 39-47)
| Step | Task | Output |
|------|------|--------|
| 39-41 | Error handling & validation | Toast notifications, error boundaries |
| 42-44 | Loading states | Skeletons, optimistic UI |
| 45-46 | Accessibility | WCAG 2.1 AA compliance |
| 47 | Final documentation | README, API docs |

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
- Seed data available from Step 6
- Every component must read/write to real database
- Gate checkpoints enforce real data verification

### High Risk: Schema Namespace

**Risk**: Tables created in `public` schema instead of `postal_v2`.  
**Mitigation**:
- All migrations must prefix tables with `postal_v2.`
- Supabase client configured with `db: { schema: 'postal_v2' }`
- Verification query checks table namespace

### Medium Risk: Cloud-Only Database Access

**Risk**: Development requires live Supabase connection.  
**Mitigation**:
- Credentials pre-configured in .env.app
- Connection pooling for performance
- Fallback error messages if unavailable

### Medium Risk: Payment Validation Complexity

**Risk**: 5 B2B payment methods with complex validation rules.  
**Mitigation**:
- Implement one method at a time
- Each method has isolated validation function
- Unit tests for each validation rule

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 15.x (App Router) |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | latest |
| Database | Supabase | Cloud (postal_v2 schema) |
| Forms | React Hook Form | 7.x |
| Validation | Zod | 3.x |
| Testing | Playwright | latest |

---

## Immediate Next Steps

### Step 2: Initialize Next.js 15 Project
1. Create project with shadcn/ui template
2. Install dependencies: @supabase/ssr, react-hook-form, zod, @hookform/resolvers, sonner
3. Configure Tailwind v4
4. Set up folder structure
5. Configure Supabase client with postal_v2 schema

### Step 3: Create postal_v2 Schema
1. Create migration file with all 29 tables
2. Define 12 ENUM types
3. Create indexes and RLS policies
4. Run migration against cloud Supabase
5. Verify tables exist in postal_v2 schema

### Step 4: [GATE] End-to-End Verification Checkpoint 1
1. Verify Supabase connection works
2. Verify postal_v2 schema exists
3. Create basic health check API
4. Verify build passes
5. Document any blockers

---

## References

### Previous Project Analysis
- **Failed Run**: `/Users/jackjin/dev/ai-sandbox/projects/nextjs/2026-04-05/1775414201963/`
- **Failure Analysis**: 32 steps, 52 commits, 0 working flows — hardcoded mock data
- **Partial Success**: `/Users/jackjin/dev/ai-sandbox/projects/nextjs/2026-04-11/1775931318881/` — initialized with postal_v2 schema

### Documentation
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side)
- [shadcn/ui Components](https://ui.shadcn.com)
- [React Hook Form Docs](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)
- [Playwright Testing](https://playwright.dev)

---

## Success Criteria

This research step is complete when:

1. ✅ Full user journey documented with data flow
2. ✅ Data model and schema design documented
3. ✅ Cloud Supabase setup requirements specified
4. ✅ Implementation phases planned (47 steps)
5. ✅ Integration points identified
6. ✅ Risk assessment completed
7. ✅ journey.spec.ts testing strategy defined

The next step (Step 2) can begin with confidence in the architectural approach.
