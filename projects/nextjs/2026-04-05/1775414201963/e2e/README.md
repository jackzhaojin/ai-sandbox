# B2B Postal Checkout Flow - E2E Tests

This directory contains Playwright E2E tests for the B2B Postal Checkout Flow application.

## Test Structure

```
e2e/
├── step1-shipment-details.spec.ts   # Step 1: Shipment Details tests
├── step2-rate-selection.spec.ts     # Step 2: Rate Selection tests
├── step3-payment.spec.ts            # Step 3: Payment tests
├── utils/
│   └── test-helpers.ts              # Shared test utilities
└── README.md                        # This file
```

## Test Coverage

### Step 1: Shipment Details (`step1-shipment-details.spec.ts`)

- **Page Rendering**: Verifies all form sections render correctly
- **Preset Selector**: Tests preset selection and auto-fill functionality
- **Address Form Validation**: Validates ZIP codes, phone numbers, required fields
- **Package Details**: Tests dimensions, weight calculation, unit toggles
- **Special Handling Options**: Tests all 8 handling options
- **Hazmat Conditional Form**: Tests hazmat checkbox and conditional fields
- **Delivery Preferences**: Tests delivery options
- **Form Submission**: Tests form validation and submission
- **Navigation Actions**: Tests Save as Draft and Start Over buttons
- **Accessibility**: Tests heading structure, labels, keyboard navigation

### Step 2: Rate Selection (`step2-rate-selection.spec.ts`)

- **Page Loading**: Tests loading states and shipment summary display
- **Category Tabs**: Tests filtering by service category
- **Sort Controls**: Tests sorting by price, transit time, reliability
- **Filter Controls**: Tests trackable, insurable, express filters
- **Quote Selection**: Tests selecting quotes and viewing details
- **Navigation**: Tests back button, save draft, continue to Step 3
- **Error Handling**: Tests error states and retry functionality
- **Accessibility**: Tests heading structure and keyboard navigation

### Step 3: Payment (`step3-payment.spec.ts`)

- **Page Rendering**: Tests payment page and shipment summary
- **Payment Method Selection**: Tests all 5 payment methods
- **Purchase Order Form**: Tests PO number, amount, date validation
- **Bill of Lading Form**: Tests BOL number format, freight terms
- **Third-Party Billing Form**: Tests company info, contact details
- **Net Terms Form**: Tests payment period, annual revenue, 3+ trade references
- **Corporate Account Form**: Tests corporate account details
- **Billing Address**: Tests "Same as Origin" checkbox
- **Cost Summary**: Tests fee calculation and total updates
- **Navigation**: Tests back button, save draft, continue to Step 4
- **Accessibility**: Tests heading structure and keyboard navigation

## Running Tests

### Run all tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test step1-shipment-details.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests with UI mode
```bash
npx playwright test --ui
```

### Debug tests
```bash
npx playwright test --debug
```

### Generate test report
```bash
npx playwright test --reporter=html
```

## Test Data

Tests use consistent test data defined in `utils/test-helpers.ts`:

- **Origin Address**: Austin, TX 78701
- **Destination Address**: Dallas, TX 75201
- **Package**: 12" × 10" × 8", 5 lbs
- **Payment Methods**: Sample data for each payment type

## Environment Requirements

- Node.js 18+
- Application running on `http://localhost:3000`
- Supabase connection for API calls
- Playwright browsers installed (`npx playwright install`)

## Known Issues

1. **Step 3 (Payment Page)**: The payment page (`/shipments/[id]/payment`) currently returns 404 as it hasn't been implemented yet. Tests for Step 3 are written to pass once the page exists.

2. **API Dependencies**: Tests require the Supabase backend to be accessible for creating shipments and fetching quotes.

## Writing New Tests

Use the helper functions from `utils/test-helpers.ts`:

```typescript
import { completeStep1, completeStep2, expectToBeOnRatesPage } from "./utils/test-helpers";

test("my test", async ({ page }) => {
  // Complete Step 1 and get shipment ID
  const shipmentId = await completeStep1(page);

  // Navigate to Step 2
  await page.goto(`/shipments/${shipmentId}/rates`);

  // Assert we're on the right page
  await expectToBeOnRatesPage(page);
});
```

## CI/CD Integration

Tests are configured to run in CI with the following features:
- Retries: 2 attempts in CI, 0 locally
- Workers: 1 in CI for sequential execution
- Reporter: HTML report generation
- Tracing: On first retry for debugging
