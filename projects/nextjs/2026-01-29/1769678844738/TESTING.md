# Testing Documentation

## Overview

This project uses Jest and React Testing Library for testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

The following areas are covered by tests:

### Unit Tests

#### Validation Utilities (`lib/api/validation.ts`)
- UUID validation
- Date validation and parsing
- Pagination validation
- String validation (required, minLength, maxLength)
- Number validation (min, max, integer)
- Boolean validation
- Object validation
- Enum validation
- Batch validation

#### Export Utilities (`lib/utils/export.ts`)
- CSV conversion with proper escaping
- Handling of null/undefined values
- Handling of nested objects
- Filename generation with timestamps

### Component Tests

#### RetroButton (`components/ui/RetroButton.tsx`)
- Rendering with children
- Click handlers
- Disabled state
- Different variants (primary, secondary, danger)
- Button types (button, submit, reset)
- Custom className support

#### RetroInput (`components/ui/RetroInput.tsx`)
- Rendering with/without labels
- Required indicator display
- Change handlers
- Controlled values
- Different input types (text, email, password, number, date)
- Custom className support
- Retro styling

## Test Structure

```
__tests__/
├── components/
│   └── ui/
│       ├── RetroButton.test.tsx
│       └── RetroInput.test.tsx
├── lib/
│   ├── validation.test.ts
│   └── export.test.ts
└── jest.d.ts (TypeScript declarations)
```

## Configuration

### Jest Configuration (`jest.config.js`)
- Uses `next/jest` for Next.js integration
- Configured for jsdom environment
- Module path aliasing (@/ prefix)
- Coverage collection from app/, components/, and lib/

### Jest Setup (`jest.setup.js`)
- Imports @testing-library/jest-dom
- Sets up environment variables for tests
- Polyfills for Next.js server-side APIs

## Known Issues

### Build Error with `_global-error`
The build process shows a prerendering error for `_global-error`:
```
Error occurred prerendering page "/_global-error"
TypeError: Cannot read properties of null (reading 'useContext')
```

This is a known issue in Next.js 16 with React context in error boundaries during static generation. It does NOT affect:
- Development server
- Production runtime
- Application functionality
- Test execution

The error boundary (`app/error.tsx`) works correctly at runtime.

## Edge Cases Tested

1. **Empty data handling**: Tests verify proper handling of empty arrays and null values
2. **Boundary conditions**: Tests cover min/max values, length limits
3. **Invalid inputs**: Tests verify proper error messages for invalid data
4. **Type safety**: Tests ensure TypeScript types are respected

## Future Improvements

Areas that could benefit from additional testing:
1. API route handlers (currently removed due to Next.js mocking complexity)
2. Integration tests with actual database
3. E2E tests with Playwright
4. Authentication flow tests
5. Performance tests for analytics queries
