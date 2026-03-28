# Testing Documentation

## Overview

This document describes the testing infrastructure and approach for the Recipe Discovery Platform.

## Testing Stack

- **Test Runner**: Jest 30.2.0
- **Testing Library**: @testing-library/react 16.3.2
- **Test Environment**: jsdom
- **Coverage Tool**: Jest's built-in coverage (v8)

## Setup

### Installation

All testing dependencies are installed as devDependencies:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest ts-node whatwg-fetch
```

### Configuration

**jest.config.js**
- Uses Next.js Jest configuration
- Sets up module name mapping for `@/` imports
- Configures coverage collection from key directories
- Excludes `.next/`, `node_modules/`, and coverage directories

**jest.setup.js**
- Imports `@testing-library/jest-dom` for custom matchers
- Imports `whatwg-fetch` for Response/Request polyfills
- Mocks `next/navigation` hooks (useRouter, usePathname, useSearchParams)
- Mocks `next-auth/react` for authentication

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Coverage

### Current Coverage Summary

**Overall Coverage:**
- **Components**: 34.81% statements, 87.17% branches
- **Lib**: 67.79% statements, 95.23% branches

**Fully Tested (100% Coverage):**
- ✅ `components/favorite-button.tsx`
- ✅ `components/recipe-card.tsx`
- ✅ `lib/validation.ts`
- ✅ `lib/utils.ts`
- ✅ `components/search-filters.tsx` (98.55% - near perfect)

**Components with Partial Coverage:**
- `components/ui/badge.tsx` - 100% statements
- `components/ui/button.tsx` - 100% statements
- `components/ui/label.tsx` - 100% statements
- `components/ui/select.tsx` - 83.68% statements
- `components/ui/card.tsx` - 67.39% statements

**Not Yet Tested (0% Coverage):**
- Pages (app directory)
- API routes
- Server actions
- Database utilities
- Authentication

## Test Suites

### 1. Component Tests

#### RecipeCard (`__tests__/components/recipe-card.test.tsx`)

**Tests (9):**
- ✅ Renders recipe card with all information
- ✅ Calculates and displays total time correctly
- ✅ Displays servings information
- ✅ Displays dietary tags
- ✅ Limits dietary tags to 3 and shows overflow count
- ✅ Applies correct difficulty color classes
- ✅ Renders without optional fields
- ✅ Renders placeholder image when no imageUrl is provided
- ✅ Creates correct link to recipe detail page

**Key Features Tested:**
- Time calculation (prepTime + cookTime)
- Difficulty badge color variants (easy=green, medium=yellow, hard=red)
- Dietary tags display and overflow handling
- Optional fields (cuisineType, imageUrl, authorName)
- Fallback ChefHat icon when no image

#### SearchFilters (`__tests__/components/search-filters.test.tsx`)

**Tests (11):**
- ✅ Renders filter component with all sections
- ✅ Loads and displays dietary tags from database
- ✅ Uses provided dietary tags instead of loading from database
- ✅ Toggles dietary tag selection
- ✅ Allows multiple dietary tags to be selected
- ✅ Shows clear all button when filters are active
- ✅ Clears all filters when clear button is clicked
- ✅ Renders difficulty select with label
- ✅ Displays loading state for dietary tags
- ✅ Renders with default cuisines
- ✅ Uses custom cuisines when provided

**Key Features Tested:**
- Dynamic dietary tags loading from server action
- Multi-select dietary tags with badge toggles
- Filter state management
- Clear all filters functionality
- Loading states
- Prop-based customization

#### FavoriteButton (`__tests__/components/favorite-button.test.tsx`)

**Tests (6):**
- ✅ Checks favorite status on mount
- ✅ Renders unfavorited state correctly
- ✅ Renders favorited state correctly
- ✅ Toggles favorite status when clicked
- ✅ Disables button while loading
- ✅ Handles toggle failure gracefully

**Key Features Tested:**
- Server action integration (isFavorited, toggleFavorite)
- Loading states during async operations
- Visual state changes (filled/unfilled heart)
- Error handling
- Button disabled state

### 2. Utility Tests

#### Validation (`__tests__/lib/validation.test.ts`)

**Tests (34):**

**UUID Validation:**
- ✅ Validates correct UUIDs
- ✅ Rejects invalid UUIDs

**Email Validation:**
- ✅ Validates correct emails
- ✅ Rejects invalid emails

**Difficulty Validation:**
- ✅ Validates correct difficulty levels (easy, medium, hard)
- ✅ Rejects invalid difficulty levels

**Ingredient Category Validation:**
- ✅ Validates correct categories (10 categories)
- ✅ Rejects invalid categories

**Unit Validation:**
- ✅ Validates correct measurement units (13 units)
- ✅ Rejects invalid units

**String Sanitization:**
- ✅ Trims whitespace
- ✅ Replaces multiple spaces with single space
- ✅ Handles already clean strings

**Number Validation:**
- ✅ Validates positive integers
- ✅ Validates non-negative integers
- ✅ Validates ratings (1-5)
- ✅ Rejects invalid numbers

**String Length Validation:**
- ✅ Validates strings within length range
- ✅ Rejects strings outside range
- ✅ Trims before checking length

**Array Validation:**
- ✅ Validates non-empty arrays
- ✅ Rejects empty arrays
- ✅ Rejects non-arrays

**Response Helpers:**
- ✅ Creates error responses with default/custom status codes
- ✅ Creates success responses with default/custom status codes
- ✅ Sets correct content-type headers

## Testing Patterns

### 1. Component Testing Pattern

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComponentName } from '@/components/component-name';

// Mock external dependencies
jest.mock('@/actions/some-action', () => ({
  someAction: jest.fn().mockResolvedValue({ success: true }),
}));

describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<ComponentName prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    render(<ComponentName />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Updated Text')).toBeInTheDocument();
    });
  });
});
```

### 2. Utility Testing Pattern

```typescript
import { utilityFunction } from '@/lib/utility';

describe('utilityFunction', () => {
  it('handles valid input', () => {
    expect(utilityFunction('valid')).toBe(expectedResult);
  });

  it('handles invalid input', () => {
    expect(utilityFunction('invalid')).toBe(null);
  });
});
```

## Mocking Strategies

### 1. Next.js Navigation

```javascript
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))
```

### 2. Next-Auth

```javascript
jest.mock('next-auth/react', () => ({
  useSession() {
    return {
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
      status: 'authenticated',
    }
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
}))
```

### 3. Next.js Image

```javascript
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));
```

### 4. Server Actions

```javascript
jest.mock('@/actions/recipe-actions', () => ({
  createRecipe: jest.fn().mockResolvedValue({
    success: true,
    data: { recipeId: 'test-id' },
  }),
}));
```

## Known Limitations

### 1. API Route Testing

API route testing is not included in this test suite because:
- Requires complex database mocking
- Requires auth session mocking
- Better suited for integration tests in a test database environment

**Recommendation**: Use E2E tests or manual testing for API routes.

### 2. Server Components

Server components are not tested because:
- They require Next.js runtime
- Jest runs in Node environment without Next.js context
- Better suited for E2E tests

**Recommendation**: Use Playwright or Cypress for testing server components.

### 3. Radix UI Selects

Testing Radix UI Select components is challenging:
- Complex DOM structure
- Portal-based rendering
- Requires special testing setup

**Workaround**: Test that selects render correctly, not detailed interactions.

## Future Improvements

### High Priority

1. **E2E Tests with Playwright**
   - Test complete user flows
   - Test server components
   - Test API route integration
   - Test database interactions

2. **Integration Tests**
   - Test API routes with test database
   - Test server actions with mocked database
   - Test authentication flows

3. **Accessibility Tests**
   - Add jest-axe for a11y testing
   - Test keyboard navigation
   - Test screen reader compatibility

### Medium Priority

4. **Visual Regression Tests**
   - Use Percy or Chromatic
   - Catch visual bugs
   - Test responsive design

5. **Performance Tests**
   - Test render performance
   - Test bundle size
   - Test lighthouse scores

### Low Priority

6. **Snapshot Tests**
   - Add snapshot tests for components
   - Catch unintended changes
   - Review diffs in PRs

## Test Results

**Last Run**: February 1, 2026

```
Test Suites: 4 passed, 4 total
Tests:       60 passed, 60 total
Snapshots:   0 total
Time:        0.935 s
```

**Success Rate**: 100% ✅

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad:**
```typescript
expect(component.state.count).toBe(5);
```

✅ **Good:**
```typescript
expect(screen.getByText('Count: 5')).toBeInTheDocument();
```

### 2. Use Semantic Queries

**Query Priority:**
1. `getByRole` - Most accessible
2. `getByLabelText` - Form elements
3. `getByPlaceholderText` - Inputs
4. `getByText` - Non-interactive elements
5. `getByTestId` - Last resort

### 3. Async Testing

Always use `waitFor` for async state updates:

```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### 4. Clean Up After Each Test

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 5. Test Error States

```typescript
it('handles error gracefully', async () => {
  mockAction.mockRejectedValue(new Error('Failed'));
  render(<Component />);

  await waitFor(() => {
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });
});
```

## Continuous Integration

### Recommended CI Setup

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Troubleshooting

### Issue: Tests timing out

**Solution**: Increase timeout in jest.config.js:
```javascript
testTimeout: 10000
```

### Issue: Response is not defined

**Solution**: Import `whatwg-fetch` in jest.setup.js:
```javascript
import 'whatwg-fetch'
```

### Issue: act() warnings

**Solution**: Use `waitFor` for async state updates:
```typescript
await waitFor(() => {
  expect(component).toHaveState();
});
```

## Conclusion

The testing infrastructure is set up and working well for:
- ✅ Component unit tests
- ✅ Utility function tests
- ✅ Validation logic tests

Next steps should focus on:
- 🔄 E2E tests for user flows
- 🔄 Integration tests for API routes
- 🔄 Accessibility tests

**Current Status**: ✅ **Production Ready** for unit testing
