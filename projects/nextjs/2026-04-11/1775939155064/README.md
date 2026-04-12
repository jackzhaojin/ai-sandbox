# B2B Postal Checkout Flow

A 6-step wizard for business-to-business shipping with multi-carrier rate shopping, B2B payment methods, and cloud Supabase integration.

## Overview

This Next.js application provides a complete B2B postal checkout experience:

1. **Shipment Details** - Enter origin/destination addresses and package configuration
2. **Rate Shopping** - Compare real-time quotes from multiple carriers
3. **Payment** - Select from 5 B2B payment methods (Credit Card, ACH, Purchase Order, Wire Transfer, Net 30)
4. **Pickup Scheduling** - Choose available pickup time slots
5. **Review** - Validate all shipment details before submission
6. **Confirmation** - Receive tracking number and confirmation details

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL with postal_v2 schema)
- **State Management**: React Context + React Hook Form
- **Validation**: Zod
- **Testing**: Playwright (E2E)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (cloud or self-hosted)

## Local Setup

### 1. Clone and Install

```bash
cd projects/nextjs/2026-04-11/1775939155064
npm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```bash
# Get these from your Supabase Dashboard > Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...
```

### 3. Database Setup

Apply the schema and seed data:

```bash
# Apply schema to cloud Supabase
npm run db:apply-schema

# Seed the database with carriers, service types, and sample data
npm run db:seed

# Verify the setup
npm run db:verify
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Run E2E tests
npm run test:e2e
```

## Cloud Supabase Setup

### 1. Create Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Note your project reference (the random string in the URL)
3. Save your database password securely

### 2. Get Credentials

From your Supabase Dashboard:

- **Project Settings > API**: 
  - `NEXT_PUBLIC_SUPABASE_URL` (Project URL)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon/public)
  - `SUPABASE_SERVICE_ROLE_KEY` (service_role/secret)

- **Project Settings > Database > Connection string**:
  - `DATABASE_URL` (for seed scripts)

### 3. Apply Schema

The schema uses a dedicated `postal_v2` schema (not the default `public` schema):

```bash
# Option 1: Using the provided script
npm run db:apply-schema

# Option 2: Via Supabase SQL Editor
# Copy contents of migrations/001_create_postal_v2_schema.sql
# Paste into Supabase Dashboard > SQL Editor > New query
```

### 4. Seed Data

```bash
npm run db:seed
```

This creates:
- 4 shipping carriers (PEX, Velocity Couriers, Express Freight Lines, Global Post)
- ~20 service types across carriers
- 3 default pickup slots
- 1 sample shipment

### 5. Verify Setup

```bash
npm run db:verify
```

## Project Structure

```
app/
├── api/                  # API routes
│   ├── shipments/        # Shipment CRUD operations
│   ├── quote/            # Rate generation
│   ├── pickup-availability/  # Pickup slots
│   └── ...
├── shipments/
│   ├── new/              # Step 1: Shipment details
│   └── [id]/
│       ├── rates/        # Step 2: Rate shopping
│       ├── pricing/      # Alternative rate page
│       ├── payment/      # Step 3: Payment
│       ├── pickup/       # Step 4: Pickup scheduling
│       ├── review/       # Step 5: Review
│       └── confirmation/ # Step 6: Confirmation
├── layout.tsx            # Root layout with providers
└── page.tsx              # Home page

components/
├── ui/                   # shadcn/ui components
├── shipment/             # Shipment form components
├── payment/              # Payment method components
├── pickup/               # Pickup scheduling components
├── review/               # Review page components
└── error/                # Error boundaries

lib/
├── supabase/             # Supabase client configs
├── validation.ts         # Zod validation schemas
├── pricing.ts            # Pricing calculation engine
├── hooks.ts              # Custom React hooks
├── retry.ts              # Retry logic
└── apiErrorHandler.ts    # API error handling

tests/
└── e2e/                  # Playwright E2E tests
    ├── journey.spec.ts   # Full journey tests
    └── step*.spec.ts     # Step-specific tests

migrations/
└── 001_create_postal_v2_schema.sql  # Database schema
```

## Key Features

### Multi-Carrier Rate Shopping
- Real-time quotes from multiple carriers
- Pricing based on: distance, zone, weight (actual vs dimensional), carrier multipliers
- Fee breakdown: base rate, fuel surcharge, insurance, handling fees, taxes
- Carbon footprint calculation

### B2B Payment Methods
1. **Credit Card** - Standard card payment
2. **ACH Bank Transfer** - US bank account transfer
3. **Purchase Order** - PO number with optional expiration
4. **Wire Transfer** - International/domestic wire instructions
5. **Net 30** - B2B credit terms with reference number

### Address Management
- Address validation with country-specific rules (US/CA/MX)
- Address autocomplete integration
- Residential/commercial location type detection

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader announcements via live regions
- Skip links for keyboard users
- Focus management

### Error Handling
- Automatic retry with exponential backoff
- User-friendly error messages
- Graceful degradation when APIs fail
- Loading states and skeletons

## Known Limitations

1. **Rate Generation**: Rates are calculated using a deterministic algorithm, not real carrier APIs
2. **Address Search**: Uses mock data - integrate with a real address validation service for production
3. **Payment Processing**: No actual payment processing - integrate with Stripe/PayPal for production
4. **Label Generation**: Labels are mockups - integrate with carrier APIs for real shipping labels
5. **Email Notifications**: Not implemented - add email service for confirmations

## Development Guidelines

### Code Style
- ESLint and Prettier configurations included
- Run `npm run lint` before committing
- Follow existing patterns for consistency

### Adding New Features
1. Follow the 6-step wizard pattern for new flows
2. Add Zod validation schemas in `lib/validation.ts`
3. Update E2E tests in `tests/e2e/`
4. Document API changes

### Testing
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/journey.spec.ts

# Run with UI mode for debugging
npx playwright test --ui
```

### Database Changes
1. Add migrations to `migrations/`
2. Use the `postal_v2` schema (not `public`)
3. Update seed scripts if needed
4. Run verification after changes

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | Yes |
| `SUPABASE_URL` | Server-side Supabase URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Private service role key | Yes |
| `DATABASE_URL` | PostgreSQL connection string | For seeds |
| `NODE_ENV` | Environment mode | No |

## License

Private - For demonstration purposes only.

## Support

For issues or questions, refer to the project documentation in the `ai-docs/` directory.
