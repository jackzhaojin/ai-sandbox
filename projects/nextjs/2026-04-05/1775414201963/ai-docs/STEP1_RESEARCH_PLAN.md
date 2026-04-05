# Step 1: Research and Plan Remaining Work

**Status**: Complete  
**Date**: April 5, 2026  
**Contract**: contract-1775423093577  
**Project**: B2B Postal Checkout Flow  
**Step**: 1 of 31

---

## Executive Summary

This document provides comprehensive research findings and a detailed plan for the remaining 30 steps of the B2B Postal Checkout Flow project. The project is a Next.js 15 application with Supabase backend, shadcn/ui components, and a multi-step checkout flow for B2B postal services.

### Current State

- **Steps Completed**: 1 (research/planning)
- **Steps Remaining**: 30
- **Build Status**: ⚠️ Requires environment configuration
- **Test Status**: No E2E tests written yet

---

## Existing Foundation (Completed in Previous Work)

### 1. Project Setup ✅

**Framework & Dependencies:**
- Next.js 15.3.2 with App Router
- React 18.3.1
- TypeScript 5.x with strict mode
- Tailwind CSS v4 with custom design tokens
- shadcn/ui component library

**Key Dependencies Installed:**
```json
{
  "@supabase/ssr": "^0.10.0",
  "@supabase/supabase-js": "^2.101.1",
  "react-hook-form": "^7.72.1",
  "zod": "^4.3.6",
  "@hookform/resolvers": "^5.2.2",
  "lucide-react": "^1.7.0",
  "sonner": "^2.0.7"
}
```

### 2. Database Schema ✅ (Step 3)

**Location**: `supabase/migrations/000001_initial_schema.sql`

**29 Tables Created:**

| Category | Tables |
|----------|--------|
| Organization | `organizations`, `users`, `addresses` |
| Carriers | `carriers`, `service_types` |
| Shipments | `shipments`, `shipment_packages`, `shipment_special_handling`, `shipment_delivery_preferences`, `hazmat_details` |
| Quotes | `quotes` |
| Payments | `payment_info`, `payment_purchase_orders`, `payment_bills_of_lading`, `payment_third_party`, `payment_net_terms`, `payment_net_terms_references`, `payment_corporate_accounts`, `payment_methods`, `payments` |
| Pickup | `pickup_details`, `pickup_contacts`, `pickup_access_requirements`, `pickup_equipment_needs`, `pickup_authorized_personnel`, `pickup_notifications` |
| Tracking | `shipment_events` |
| Audit | `activity_log` |

**12 ENUM Types:**
- `user_role`, `organization_status`, `payment_term`
- `address_type`, `package_type`, `shipment_status`
- `carrier_code`, `service_category`, `payment_method_type`
- `payment_status`, `handling_type`, `hazmat_class`

**Seed Data:**
- 4 mock carriers (PEX, VC, EFL, FS) with ratings and multipliers
- 21 service types across Ground/Express/Overnight/LTL/FTL/International
- 1 sample organization (Acme Corporation)
- 3 addresses (Main Office, Warehouse, West Coast)
- 1 complete test shipment (SHP-2026-000001)

### 3. Shared Components ✅ (Step 4)

**Location**: `components/shared/`

| Component | Purpose | Status |
|-----------|---------|--------|
| `FormField` | Label + error + help text wrapper | ✅ Complete |
| `AddressInput` | Full address form with US states | ✅ Complete |
| `ContactInput` | Name/phone/email input group | ✅ Complete |
| `StepIndicator` | Desktop + mobile step progress | ✅ Complete |
| `ProgressIndicator` | Multi-step progress bar | ✅ Complete |
| `StatusIndicator` | Status badges (available/selected/error) | ✅ Complete |
| `LoadingSpinner` | Accessible spinner with variants | ✅ Complete |
| `CopyButton` | Clipboard copy with feedback | ✅ Complete |
| `ContextualHelp` | Tooltip help triggers | ✅ Complete |
| `AppErrorBoundary` | Error boundary with recovery | ✅ Complete |

**Layout Components:**
- `Header` - Logo, navigation, user menu
- `Footer` - Multi-column B2B footer
- `Navigation` - Previous/Next buttons
- `ShippingLayout` - Master layout wrapper

### 4. API Endpoints ✅ (Step 5)

**Location**: `app/api/`

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/health` | GET | Service health check | ✅ Complete |
| `/api/form-config` | GET | Dropdown options & validation rules | ✅ Complete |
| `/api/shipments` | POST | Create new shipment | ✅ Complete |
| `/api/shipments/[id]` | GET/PATCH/DELETE | Shipment CRUD | ✅ Complete |

**Utilities:**
- `lib/api/response.ts` - Standardized API responses
- `lib/validation/api-schemas.ts` - Zod validation schemas
- `types/api.ts` - TypeScript API types

### 5. Validation Schemas ✅

**Location**: `lib/validation/`

- `shipment-details-schema.ts` - Complete shipment form validation
- `api-schemas.ts` - API request validation
- Unit conversion utilities (dimensions, weight)
- Dimensional weight calculations

---

## Component Stubs (Need Implementation)

The following components are exported but need full implementation:

### Shipment Components (`components/shipments/`)

| Component | Step | Status | Description |
|-----------|------|--------|-------------|
| `PresetSelector` | 2 | 📝 Stub | Quick-select shipment presets |
| `PackageTypeSelector` | 2 | 📝 Stub | Box/Envelope/Tube/Pallet selection |
| `DimensionsInput` | 3 | 📝 Stub | Length/width/height with unit toggle |
| `WeightInput` | 3 | 📝 Stub | Weight input with unit toggle |
| `DeclaredValueInput` | 4 | 📝 Stub | Value input with currency selector |
| `SpecialHandlingSelector` | 4 | 📝 Stub | Fragile/Hazmat/Temp-controlled options |
| `DeliveryPreferencesSelector` | - | 📝 Stub | Saturday delivery, signature options |
| `HazmatForm` | - | 📝 Stub | Hazardous materials declaration |
| `MultiPieceForm` | - | 📝 Stub | Multiple package management |
| `PackageSummary` | - | 📝 Stub | Side panel summary display |

---

## Detailed Remaining Work Plan

### Phase 1: Core UI Components (Steps 2-7)

#### Step 2: Build PresetSelector and PackageTypeSelector

**PresetSelector Requirements:**
- Display preset cards (Documents, Electronics, Apparel, etc.)
- Show preset icon, name, description
- Apply preset values on selection
- Visual selected state
- Integration with `lib/data/shipment-presets.ts`

**PackageTypeSelector Requirements:**
- Card-based selection (Box, Envelope, Tube, Pallet)
- Show icon, name, description, dimension limits
- Visual selected state
- Accessibility: keyboard navigation, ARIA labels

**Files to Create/Modify:**
- `components/shipments/PresetSelector.tsx` - Implement
- `components/shipments/PackageTypeSelector.tsx` - Implement
- Add tests for both components

**Estimated Duration**: 1 day

---

#### Step 3: Build DimensionsInput and WeightInput

**DimensionsInput Requirements:**
- Three number inputs (length, width, height)
- Unit toggle (in/cm)
- Dimensional weight calculation display
- Validation: max dimensions per package type
- Help text with package type limits

**WeightInput Requirements:**
- Number input with decimal support
- Unit toggle (lbs/kg)
- Dimensional weight comparison
- Billable weight indicator
- Validation: max weight per package type

**Files to Create/Modify:**
- `components/shipments/DimensionsInput.tsx` - Implement
- `components/shipments/WeightInput.tsx` - Implement
- Add unit conversion utilities if needed

**Estimated Duration**: 1 day

---

#### Step 4: Build DeclaredValueInput and SpecialHandlingSelector

**DeclaredValueInput Requirements:**
- Currency-amount input
- Currency selector (USD/CAD/MXN)
- Insurance estimate display
- Validation: max $100,000
- Help text about insurance coverage

**SpecialHandlingSelector Requirements:**
- Toggle cards for each handling type
- Show fee amount when applicable
- Instructions textarea for selected options
- Dynamic fee total calculation
- Options: Fragile, Hazardous, Temperature Controlled, Signature Required, Adult Signature, Hold for Pickup, Appointment Delivery

**Files to Create/Modify:**
- `components/shipments/DeclaredValueInput.tsx` - Implement
- `components/shipments/SpecialHandlingSelector.tsx` - Implement

**Estimated Duration**: 1 day

---

#### Step 5: Build DeliveryPreferencesSelector and HazmatForm

**DeliveryPreferencesSelector Requirements:**
- Weekend delivery toggles (Saturday/Sunday)
- Signature requirement radio group
- Delivery instructions textarea
- Hold at facility option
- Conditional fields based on selections

**HazmatForm Requirements:**
- "Contains hazardous materials" toggle
- Conditional fields when enabled:
  - Hazmat class dropdown (9 classes)
  - UN number input
  - Proper shipping name input
  - Emergency contact info
- Warning banner when hazmat selected

**Files to Create/Modify:**
- `components/shipments/DeliveryPreferencesSelector.tsx` - Implement
- `components/shipments/HazmatForm.tsx` - Implement

**Estimated Duration**: 1 day

---

#### Step 6: Build MultiPieceForm and PackageSummary

**MultiPieceForm Requirements:**
- Package list with add/remove
- Each package: type, dimensions, weight, value
- Total summary (packages, weight, value)
- Duplicate package functionality
- Max 20 packages limit

**PackageSummary Requirements:**
- Real-time form values display
- Origin/destination preview
- Package details summary
- Special handling fees breakdown
- Total estimated cost placeholder
- Navigation to edit sections

**Files to Create/Modify:**
- `components/shipments/MultiPieceForm.tsx` - Implement
- `components/shipments/PackageSummary.tsx` - Implement

**Estimated Duration**: 1 day

---

#### Step 7: Build Rates Selection Page

**Route**: `app/shipments/[id]/rates/page.tsx`

**Requirements:**
- Fetch rates from `/api/rates/calculate`
- Display carrier options with pricing
- Service level cards (Ground, Express, Overnight, etc.)
- Delivery date estimates
- Rate comparison table
- Select rate and proceed

**New API Endpoint:**
- `POST /api/rates/calculate` - Calculate shipping rates

**Files to Create:**
- `app/shipments/[id]/rates/page.tsx`
- `app/api/rates/calculate/route.ts`
- `components/rates/RateCard.tsx`
- `components/rates/RateComparison.tsx`

**Estimated Duration**: 1-2 days

---

### Phase 2: Payment & Review (Steps 8-11)

#### Step 8: Build Payment Method Selector

**Route**: `app/shipments/[id]/payment/page.tsx`

**Requirements:**
- Display saved payment methods
- Payment type tabs (Credit Card, ACH, Purchase Order, Net Terms)
- Add new payment method form
- Payment terms information display
- Credit limit check for Net Terms

**Components:**
- `components/payment/PaymentMethodSelector.tsx`
- `components/payment/CreditCardForm.tsx`
- `components/payment/ACHForm.tsx`
- `components/payment/PurchaseOrderForm.tsx`
- `components/payment/NetTermsSelector.tsx`

**Estimated Duration**: 2 days

---

#### Step 9: Implement Payment Processing API

**Endpoints:**
- `POST /api/payments/process` - Process payment
- `GET /api/payments/methods` - List saved methods
- `POST /api/payments/methods` - Add new method

**Integration:**
- Stripe integration for cards
- ACH processing
- PO/Net terms validation

**Estimated Duration**: 2 days

---

#### Step 10: Build Review & Confirm Page

**Route**: `app/shipments/[id]/review/page.tsx`

**Requirements:**
- Complete shipment summary
- Origin/destination confirmation
- Package details review
- Selected rate display
- Payment method summary
- Terms and conditions acceptance
- Submit order button

**Components:**
- `components/review/ShipmentReview.tsx`
- `components/review/AddressReview.tsx`
- `components/review/PackageReview.tsx`

**Estimated Duration**: 1 day

---

#### Step 11: Build Order Confirmation Page

**Route**: `app/shipments/[id]/confirmation/page.tsx`

**Requirements:**
- Order confirmation message
- Tracking number display
- Shipping label download
- Email confirmation notice
- Next steps guidance
- Create another shipment CTA

**Components:**
- `components/confirmation/OrderConfirmation.tsx`
- `components/confirmation/TrackingDisplay.tsx`

**Estimated Duration**: 1 day

---

### Phase 3: Pickup Scheduling (Steps 12-14)

#### Step 12: Build Pickup Scheduler

**Route**: `app/shipments/[id]/pickup/page.tsx`

**Requirements:**
- Calendar date picker
- Time window selection
- Pickup address (same as origin or different)
- Special instructions
- Contact person selection

**Components:**
- `components/pickup/PickupScheduler.tsx`
- `components/pickup/TimeWindowSelector.tsx`

**Estimated Duration**: 1 day

---

#### Step 13: Implement Pickup API

**Endpoints:**
- `POST /api/pickups` - Schedule pickup
- `GET /api/pickups/[id]` - Get pickup details
- `PATCH /api/pickups/[id]` - Update pickup

**Estimated Duration**: 1 day

---

#### Step 14: Build Access Requirements Form

**Requirements:**
- Gate code / Access instructions
- Building type selection
- Floor/Unit number
- Elevator availability
- Loading dock access

**Components:**
- `components/pickup/AccessRequirementsForm.tsx`

**Estimated Duration**: 1 day

---

### Phase 4: Dashboard & Management (Steps 15-20)

#### Step 15: Build Shipments List Page

**Route**: `app/(dashboard)/shipments/page.tsx`

**Requirements:**
- Data table with sorting/filtering
- Status filters (Draft, Pending, In Transit, etc.)
- Date range filter
- Search by tracking number
- Pagination
- Export to CSV

**Components:**
- `components/dashboard/ShipmentsTable.tsx`
- `components/dashboard/ShipmentFilters.tsx`

**API:**
- Enhance `GET /api/shipments` with pagination

**Estimated Duration**: 2 days

---

#### Step 16: Build Shipment Detail Page

**Route**: `app/(dashboard)/shipments/[id]/page.tsx`

**Requirements:**
- Full shipment details
- Timeline/tracking history
- Package information
- Rate details
- Payment status
- Action buttons (Cancel, Reorder, Print Label)

**Components:**
- `components/dashboard/ShipmentDetail.tsx`
- `components/dashboard/TrackingTimeline.tsx`

**Estimated Duration**: 1 day

---

#### Step 17: Build Address Book

**Routes:**
- `app/(dashboard)/addresses/page.tsx`
- `app/(dashboard)/addresses/new/page.tsx`
- `app/(dashboard)/addresses/[id]/edit/page.tsx`

**Requirements:**
- Address list with search
- Add/Edit/Delete addresses
- Set default shipping/billing
- Address verification indicator

**Components:**
- `components/addresses/AddressList.tsx`
- `components/addresses/AddressForm.tsx`

**API:**
- `GET /api/addresses`
- `POST /api/addresses`
- `PUT /api/addresses/[id]`
- `DELETE /api/addresses/[id]`
- `POST /api/addresses/[id]/verify`

**Estimated Duration**: 2 days

---

#### Step 18: Build Payment Methods Management

**Routes:**
- `app/(dashboard)/payment-methods/page.tsx`
- `app/(dashboard)/payment-methods/new/page.tsx`

**Requirements:**
- List saved payment methods
- Add new payment method
- Set default method
- Remove payment method
- View transaction history

**Estimated Duration**: 1 day

---

#### Step 19: Build Team Management

**Routes:**
- `app/(dashboard)/team/page.tsx`
- `app/(dashboard)/team/invite/page.tsx`

**Requirements:**
- Team member list
- Invite new member
- Role management (Admin/Manager/User)
- Remove team member
- Pending invitations

**API:**
- `GET /api/users`
- `POST /api/users/invite`
- `PATCH /api/users/[id]/role`

**Estimated Duration**: 2 days

---

#### Step 20: Build Organization Settings

**Route**: `app/(dashboard)/settings/page.tsx`

**Requirements:**
- Organization profile
- Billing information
- Notification preferences
- API keys (for future integrations)

**Estimated Duration**: 1 day

---

### Phase 5: Auth & Polish (Steps 21-25)

#### Step 21: Build Authentication Pages

**Routes:**
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/(auth)/forgot-password/page.tsx`
- `app/(auth)/reset-password/page.tsx`

**Requirements:**
- Login form with validation
- Registration with organization creation
- Password reset flow
- Social login (Google, Microsoft)

**Estimated Duration**: 2 days

---

#### Step 22: Implement Auth Middleware

**Requirements:**
- Protect dashboard routes
- Redirect unauthenticated users
- Role-based access control
- Session management

**Files:**
- `middleware.ts` - Update with auth checks
- `lib/supabase/middleware.ts` - Enhance session handling

**Estimated Duration**: 1 day

---

#### Step 23: Add Form Validation & Error Handling

**Requirements:**
- Client-side validation for all forms
- Server-side validation
- Error boundary improvements
- Toast notifications for all actions
- Form state persistence (drafts)

**Estimated Duration**: 1 day

---

#### Step 24: Implement Loading States & Skeletons

**Requirements:**
- Loading skeletons for all data tables
- Button loading states
- Page transition loading
- Suspense boundaries

**Components:**
- Enhance existing `Skeleton` component usage

**Estimated Duration**: 1 day

---

#### Step 25: Mobile Responsiveness Polish

**Requirements:**
- Test all pages on mobile
- Fix layout issues
- Optimize touch targets
- Mobile navigation improvements

**Estimated Duration**: 1 day

---

### Phase 6: Testing & Optimization (Steps 26-31)

#### Step 26: Write E2E Tests - Authentication

**File**: `e2e/auth.spec.ts`

**Test Cases:**
- User registration
- Login/logout flow
- Password reset
- Protected routes

**Estimated Duration**: 1 day

---

#### Step 27: Write E2E Tests - Checkout Flow

**File**: `e2e/checkout.spec.ts`

**Test Cases:**
- Complete checkout flow
- Save as draft
- Rate selection
- Payment processing
- Order confirmation

**Estimated Duration**: 2 days

---

#### Step 28: Write E2E Tests - Dashboard

**File**: `e2e/dashboard.spec.ts`

**Test Cases:**
- View shipments
- Filter and search
- Create new shipment from dashboard
- Manage addresses
- Manage payment methods
- Team management

**Estimated Duration**: 2 days

---

#### Step 29: Performance Optimization

**Tasks:**
- Image optimization
- Code splitting
- Lazy loading components
- API response caching
- Database query optimization

**Tools:**
- Lighthouse audit
- Web Vitals monitoring

**Estimated Duration**: 1 day

---

#### Step 30: Accessibility Audit

**Tasks:**
- WCAG 2.1 AA compliance check
- Keyboard navigation test
- Screen reader testing
- Color contrast verification
- Focus management review

**Estimated Duration**: 1 day

---

#### Step 31: Documentation & Deployment Prep

**Tasks:**
- API documentation
- Component documentation
- Deployment guide
- Environment setup guide
- Final build verification

**Estimated Duration**: 1 day

---

## Technical Debt & Known Issues

### Build Issues

1. **Environment Variables Missing**
   - Error: `TypeError: Cannot read properties of undefined (reading 'env')`
   - Fix: Create `.env.local` with Supabase credentials
   - Required variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=
     NEXT_PUBLIC_SUPABASE_ANON_KEY=
     SUPABASE_SERVICE_ROLE_KEY=
     NEXT_PUBLIC_APP_URL=http://localhost:3000
     ```

2. **Supabase SSR Configuration**
   - Current: Using `@supabase/ssr` v0.10.0
   - Check: Server client cookie handling

### Code Quality

1. **TypeScript Strictness**
   - Several `as unknown as never` casts in API routes
   - Should be refactored to proper typing

2. **Form Schema Validation**
   - `shipment-details-schema.ts` has comprehensive validation
   - Need to ensure all fields are properly validated

### Testing Gaps

1. **No E2E Tests**
   - Empty `e2e/` directory
   - Playwright configured but no specs written

2. **No Unit Tests**
   - Vitest mentioned but not configured
   - Component testing needed

---

## Component Architecture Patterns

### Form Component Pattern

```typescript
// Standard props interface
interface ComponentProps {
  value: FormValue;
  onChange: (value: FormValue) => void;
  disabled?: boolean;
  error?: string;
}

// React Hook Form integration
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues,
  mode: "onChange",
});
```

### API Route Pattern

```typescript
// Standard response format
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

// Error handling
export async function POST(request: Request) {
  const parseResult = await parseJsonBody(request);
  if (!parseResult.success) return parseResult.response;
  
  const validationResult = schema.safeParse(parseResult.data);
  if (!validationResult.success) {
    return zodValidationResponse(validationResult.error);
  }
  
  // ... handler logic
}
```

### Component File Structure

```
components/
├── ui/                    # shadcn/ui components
├── shared/               # Reusable form components
├── shipments/            # Shipment-specific components
├── rates/                # Rate selection components
├── payment/              # Payment components
├── pickup/               # Pickup scheduling components
├── review/               # Review/confirmation components
├── dashboard/            # Dashboard components
└── addresses/            # Address management components
```

---

## Database Integration Points

### Supabase Client Usage

```typescript
// Browser client
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// Server client
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
```

### Key Tables for Checkout Flow

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `shipments` | Main shipment record | status, sender_, recipient_, package_, carrier_ |
| `shipment_packages` | Multi-package support | shipment_id, package details |
| `shipment_special_handling` | Handling requirements | handling_type, fee, instructions |
| `shipment_delivery_preferences` | Delivery options | saturday_delivery, signature_required |
| `hazmat_details` | Hazmat declaration | is_hazmat, hazmat_class, un_number |
| `quotes` | Rate quotes | shipment_id, carrier, service_level, total |
| `payment_info` | Payment method info | type, status, details |
| `pickup_details` | Scheduled pickups | shipment_id, pickup_date, status |

---

## State Management Approach

### Current Pattern
- **React Hook Form**: Form state management
- **Local State**: Component-level state with `useState`
- **Server State**: Direct Supabase queries

### Recommended for Future
- **Zustand**: Global state for user/org data
- **nuqs**: URL state for checkout steps
- **TanStack Query**: Server state caching

---

## CSS & Styling Guidelines

### Tailwind v4 Usage

```css
/* Custom design tokens in globals.css */
:root {
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  /* ... */
}
```

### Component Styling Pattern

```typescript
import { cn } from '@/lib/utils';

// Conditional classes with cn utility
className={cn(
  'base-classes',
  variant === 'primary' && 'primary-classes',
  isDisabled && 'disabled-classes',
  className // Allow override
)}
```

---

## Estimated Timeline Summary

| Phase | Steps | Duration |
|-------|-------|----------|
| Phase 1: Core UI | 2-7 | 6-7 days |
| Phase 2: Payment | 8-11 | 6 days |
| Phase 3: Pickup | 12-14 | 3 days |
| Phase 4: Dashboard | 15-20 | 9 days |
| Phase 5: Auth | 21-25 | 6 days |
| Phase 6: Testing | 26-31 | 8 days |
| **Total** | **2-31** | **38-39 days** |

**Note**: Duration estimates assume full-time work and may overlap for parallel development.

---

## Immediate Next Steps

1. **Fix build environment** - Create `.env.local` with dummy values for build
2. **Implement PresetSelector** - Step 2 component
3. **Implement PackageTypeSelector** - Step 2 component
4. **Write tests** for both components

---

## Resources & References

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side)
- [shadcn/ui Components](https://ui.shadcn.com)
- [React Hook Form Docs](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)

---

## Conclusion

The project has a solid foundation with Next.js 15, Supabase schema, shared components, and API endpoints. The remaining work involves:

1. **Completing stubbed components** (PresetSelector, PackageTypeSelector, etc.)
2. **Building checkout flow pages** (rates, payment, review, confirmation)
3. **Creating dashboard functionality** (shipments list, addresses, team)
4. **Implementing authentication** (login, register, middleware)
5. **Adding comprehensive testing** (E2E with Playwright)
6. **Performance and accessibility optimization**

The modular architecture allows for incremental development and testing. Each component can be built and tested independently before integration into the full checkout flow.
