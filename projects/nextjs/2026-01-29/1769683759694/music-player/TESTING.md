# Testing Documentation

## Overview

This document describes the testing strategy and implementation for the Music Player Platform. The application uses **Jest** as the test framework and **React Testing Library** for component testing.

## Test Coverage Summary

- ✅ **72 total tests** passing
- ✅ **5 test suites**
- ✅ **100% coverage** for tested utility functions
- ✅ **100% coverage** for tested components

### Coverage Breakdown

| Area | Files Tested | Coverage |
|------|-------------|----------|
| **Utility Functions** | password.ts, utils.ts | 100% |
| **API Client** | api-client.ts | 62.56% |
| **UI Components** | button.tsx | 100% |
| **Music Components** | track-item.tsx | 100% |

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test <path-to-test-file>
```

Examples:
```bash
npm test lib/__tests__/password.test.ts
npm test components/ui/__tests__/button.test.tsx
```

## Test Structure

Tests are organized alongside the code they test, following Next.js conventions:

```
music-player/
├── lib/
│   ├── __tests__/
│   │   ├── password.test.ts
│   │   ├── utils.test.ts
│   │   └── api-client.test.ts
│   ├── password.ts
│   ├── utils.ts
│   └── api-client.ts
├── components/
│   ├── ui/
│   │   ├── __tests__/
│   │   │   └── button.test.tsx
│   │   └── button.tsx
│   └── music/
│       ├── __tests__/
│       │   └── track-item.test.tsx
│       └── track-item.tsx
```

## Test Categories

### 1. Unit Tests

**Purpose:** Test individual functions and utilities in isolation.

**Location:** `lib/__tests__/`

**Examples:**
- `password.test.ts` - Password hashing, validation, and email validation
- `utils.test.ts` - Tailwind class merging utility

**Coverage:**
```
lib/password.ts: 100% coverage
lib/utils.ts: 100% coverage
```

**Key Tests:**
- ✅ Password hashing with bcrypt
- ✅ Password verification
- ✅ Password strength validation (8+ chars, uppercase, lowercase, number)
- ✅ Email format validation
- ✅ Tailwind CSS class merging with twMerge

### 2. Integration Tests

**Purpose:** Test API client functions and data fetching logic.

**Location:** `lib/__tests__/api-client.test.ts`

**Coverage:** 20 tests covering all client-side API methods

**Key Tests:**
- ✅ Fetch tracks, albums, artists, playlists
- ✅ Fetch single entities by ID
- ✅ Add/remove favorites
- ✅ Record play history
- ✅ Create, update, delete playlists
- ✅ Add/remove tracks from playlists
- ✅ Error handling for network failures
- ✅ Query parameter building

**Example:**
```typescript
it('should add track to favorites', async () => {
  const result = await addToFavorites('track-123');
  expect(result).toBe(true);
  expect(fetch).toHaveBeenCalledWith('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackId: 'track-123' }),
  });
});
```

### 3. Component Tests

**Purpose:** Test React component rendering, user interactions, and behavior.

**Location:** `components/<category>/__tests__/`

**Libraries Used:**
- `@testing-library/react` - Component rendering and queries
- `@testing-library/user-event` - Simulating user interactions
- `@testing-library/jest-dom` - DOM matchers

#### Button Component Tests (17 tests)

**File:** `components/ui/__tests__/button.test.tsx`

**Coverage:** 100%

**Tests Include:**
- ✅ Rendering with different variants (default, destructive, outline, secondary, ghost, link)
- ✅ Rendering with different sizes (sm, default, lg, icon)
- ✅ Click event handling
- ✅ Disabled state
- ✅ Custom className support
- ✅ Type attribute support
- ✅ Ref forwarding

#### TrackItem Component Tests (14 tests)

**File:** `components/music/__tests__/track-item.test.tsx`

**Coverage:** 100%

**Tests Include:**
- ✅ Rendering track information (title, artist, album)
- ✅ Play button interaction
- ✅ Favorite toggle functionality
- ✅ Playing state styling
- ✅ Favorited state styling
- ✅ Album art display
- ✅ Duration formatting
- ✅ Click event propagation
- ✅ Conditional rendering (showAlbum prop)

**Example:**
```typescript
it('should call onPlay when track is clicked', async () => {
  const handlePlay = jest.fn();
  render(<TrackItem track={mockTrack} onPlay={handlePlay} />);

  await user.click(screen.getByText('Test Track'));

  expect(handlePlay).toHaveBeenCalledWith(mockTrack);
});
```

## Testing Best Practices

### 1. Arrange-Act-Assert Pattern

All tests follow the AAA pattern:

```typescript
it('should do something', () => {
  // Arrange - Set up test data and mocks
  const mockData = { /* ... */ };

  // Act - Execute the code under test
  const result = someFunction(mockData);

  // Assert - Verify the expected outcome
  expect(result).toBe(expected);
});
```

### 2. Mocking

**Global Fetch Mock:**
```typescript
global.fetch = jest.fn();
```

**Next.js Image Mock:**
```typescript
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));
```

### 3. User Interactions

Use `@testing-library/user-event` for realistic user interactions:

```typescript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
await user.click(button);
await user.type(input, 'text');
```

### 4. Accessibility

Tests use accessible queries when possible:
- `getByRole` - Find by ARIA role
- `getByLabelText` - Find by label
- `getByText` - Find by text content

## Edge Cases Tested

### Password Validation
- ✅ Passwords shorter than 8 characters
- ✅ Passwords without uppercase letters
- ✅ Passwords without lowercase letters
- ✅ Passwords without numbers
- ✅ Empty passwords

### Email Validation
- ✅ Invalid formats (no @, no domain, spaces)
- ✅ Valid formats (various TLDs, with tags)
- ✅ Minimal valid emails (a@b.c)

### API Client
- ✅ Network errors
- ✅ HTTP error responses
- ✅ Malformed JSON responses
- ✅ Empty response arrays

### Components
- ✅ Missing optional props
- ✅ Disabled states
- ✅ Click propagation
- ✅ Conditional rendering

## Test Configuration

### Jest Configuration (`jest.config.ts`)

```typescript
{
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!lib/generated/**',
  ],
}
```

### Setup File (`jest.setup.ts`)

```typescript
import '@testing-library/jest-dom';
```

## Future Testing Improvements

### 1. API Route Tests
- [ ] Test actual API route handlers with mocked Prisma
- [ ] Test authentication middleware
- [ ] Test authorization logic

### 2. Integration Tests
- [ ] End-to-end user flows (signup → login → play track)
- [ ] Database integration tests with test database
- [ ] Real API calls with test data

### 3. Additional Component Tests
- [ ] Player controls (play, pause, skip, volume)
- [ ] Forms (signin, register)
- [ ] Layout components (header, sidebar)
- [ ] Music components (album-card, artist-card, playlist-card)

### 4. Performance Tests
- [ ] Component render performance
- [ ] Large list rendering
- [ ] Memory leak detection

### 5. Visual Regression Tests
- [ ] Screenshot comparison tests
- [ ] Cross-browser visual tests

## Continuous Integration

Tests are ready to be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test -- --coverage --passWithNoTests

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Common Issues and Solutions

### Issue: Tests fail with "Cannot find module '@/...'"

**Solution:** Ensure `moduleNameMapper` in `jest.config.ts` includes the path alias:
```typescript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### Issue: Next.js Image component causes errors

**Solution:** Mock the Image component in test files:
```typescript
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));
```

### Issue: Tests pass locally but fail in CI

**Solution:** Ensure consistent Node.js versions and install all dependencies:
```bash
npm ci  # Use ci instead of install for reproducible builds
```

## Debugging Tests

### Run tests with verbose output
```bash
npm test -- --verbose
```

### Run a single test
```bash
npm test -- -t "test name"
```

### Debug in VS Code
Add this configuration to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Conclusion

The Music Player Platform has a solid testing foundation with:
- ✅ 72 passing tests
- ✅ Unit tests for critical utility functions
- ✅ Integration tests for API client
- ✅ Component tests for UI elements
- ✅ Comprehensive coverage reporting

The test suite ensures code quality, catches regressions early, and provides confidence when refactoring or adding new features.
