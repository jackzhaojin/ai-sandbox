# Testing Guide

This document describes the testing strategy and test suites for the Chat Application.

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Test Suites](#test-suites)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Manual Testing Checklist](#manual-testing-checklist)
- [Known Issues](#known-issues)

## Testing Strategy

We follow a three-layer testing approach:

### 1. Unit Tests (Vitest + React Testing Library)

**Purpose:** Test individual functions, utilities, and components in isolation.

**Coverage:**
- Utility functions (`lib/utils.ts`)
- Validation schemas (`lib/validations.ts`)
- Error handling utilities (`lib/errors.ts`)

**Why Vitest?**
- 10-20× faster than Jest on large codebases
- Native ESM support
- Better integration with Vite/modern tooling
- Compatible with Jest API

### 2. Integration Tests

**Purpose:** Test how multiple units work together, including API routes and database interactions.

**Scope:**
- API endpoint testing (future enhancement)
- Server action testing (future enhancement)
- Component integration testing (future enhancement)

### 3. End-to-End Tests (Playwright)

**Purpose:** Test complete user flows from browser perspective.

**Coverage:**
- Authentication flows (login, register, logout)
- Chat functionality (send messages, receive AI responses)
- Conversation management (create, read, update, delete)

**Why Playwright?**
- Fast and reliable
- Excellent debugging tools
- Built-in test runner
- Cross-browser support

## Test Suites

### Unit Tests

Located in `lib/__tests__/`

#### `utils.test.ts`

Tests the `cn()` utility function for merging Tailwind CSS classes:
- ✅ Basic class merging
- ✅ Conditional classes
- ✅ Handling Tailwind conflicts
- ✅ Arrays and objects
- ✅ Edge cases (empty, undefined, null)

**Coverage:** 9 tests

#### `validations.test.ts`

Tests all Zod validation schemas:
- ✅ Email validation (format, length)
- ✅ Password validation (length constraints)
- ✅ Name validation (optional, length)
- ✅ Login/Register schemas
- ✅ Conversation validation (title, ID)
- ✅ Message validation (content, role)
- ✅ Chat request validation
- ✅ Pagination validation (defaults, coercion)
- ✅ Mark messages read validation

**Coverage:** 39 tests

#### `errors.test.ts`

Tests error handling utilities:
- ✅ Error response creation
- ✅ Success response creation
- ✅ Common error responses (401, 403, 404, 500, etc.)
- ✅ API error handler (Zod errors, API key errors, rate limits)
- ✅ Server action error handler
- ✅ Development vs Production error messages

**Coverage:** 26 tests

#### `api-chat.test.ts`

Tests chat API validation schemas:
- ✅ Valid chat requests with/without conversationId
- ✅ Empty message rejection
- ✅ Message length limits (10,000 chars)
- ✅ Invalid UUID rejection
- ✅ Special characters and emojis
- ✅ Newlines in messages
- ✅ Whitespace handling
- ✅ Unicode character support

**Coverage:** 15 tests

#### `api-conversations.test.ts`

Tests conversation API validation schemas:
- ✅ Create conversation with/without title
- ✅ Title length validation (200 chars)
- ✅ Update conversation validation
- ✅ UUID validation for IDs
- ✅ Empty title rejection
- ✅ Special characters in titles
- ✅ Emojis and Unicode in titles
- ✅ Whitespace handling

**Coverage:** 11 tests

#### `anthropic-client.test.ts`

Tests Anthropic client configuration:
- ✅ Module export verification
- ✅ Configuration constants validation
- ✅ Claude model identifier checks
- ✅ Token limits validation
- ✅ API key environment variable usage
- ✅ Security: no hardcoded secrets
- ✅ Graceful handling of missing API key

**Coverage:** 9 tests

**Total Unit Tests:** 109

### E2E Tests

Located in `e2e/`

#### `auth.spec.ts`

Tests authentication flows:
- ✅ Display login page
- ✅ Successful login redirects to chat
- ✅ Invalid credentials show error
- ✅ Email format validation
- ✅ Protected route redirect
- ✅ Navigate to register page
- ✅ Register new user
- ✅ Sign out successfully

**Coverage:** 8 tests

#### `chat.spec.ts`

Tests chat functionality:
- ✅ Display chat interface
- ✅ Show existing conversations
- ✅ Create new conversation
- ✅ Send message and receive AI response
- ✅ Send multiple messages
- ✅ Switch between conversations
- ✅ Prevent empty messages
- ✅ Persist messages after reload
- ✅ Handle special characters and emojis

**Coverage:** 9 tests

#### `conversations.spec.ts`

Tests conversation management:
- ✅ Display conversation list
- ✅ Create new conversation
- ✅ Create conversation with first message
- ✅ Select and display messages
- ✅ Update conversation title
- ✅ Delete conversation
- ✅ Show empty state
- ✅ Highlight selected conversation
- ✅ Display conversation preview
- ✅ Load messages when switching

**Coverage:** 10 tests

**Total E2E Tests:** 27

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run with watch mode
npm test -- --watch

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run with debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/auth.spec.ts
```

**Note:** E2E tests require the development server to be running. Playwright will automatically start it if not already running.

### All Tests

```bash
# Run both unit and E2E tests
npm test && npm run test:e2e
```

## Test Coverage

### Current Coverage

**Unit Tests:** 74 tests passing
- `lib/utils.ts` - 100% coverage
- `lib/validations.ts` - 100% coverage
- `lib/errors.ts` - 100% coverage

**E2E Tests:** 27 tests
- Authentication - 8 tests
- Chat functionality - 9 tests
- Conversation management - 10 tests

### Coverage Gaps

The following areas currently lack automated tests:

1. **Component Tests**
   - React components (ChatInterface, MessageList, etc.)
   - UI component behavior
   - Client-side state management

2. **API Integration Tests**
   - `/api/auth` endpoints
   - `/api/chat` streaming
   - `/api/conversations` CRUD operations

3. **Server Actions**
   - `app/actions/conversations.ts`
   - `app/actions/messages.ts`
   - `app/actions/auth.ts`

4. **Database Layer**
   - Prisma queries
   - Data integrity
   - Concurrent access

**Recommendation:** Add these tests in future iterations as the application grows.

## Manual Testing Checklist

Use this checklist to manually verify critical functionality:

### Authentication

- [ ] Login with valid credentials (alice@example.com / password123)
- [ ] Login with invalid credentials shows error
- [ ] Login with invalid email format shows validation error
- [ ] Register new user with unique email
- [ ] Register with existing email shows error
- [ ] Sign out returns to login page
- [ ] Accessing /chat without login redirects to /login

### Chat Functionality

- [ ] New chat button creates empty conversation
- [ ] Send message to new conversation
- [ ] Receive streaming AI response
- [ ] Send multiple messages in same conversation
- [ ] Messages display in correct order
- [ ] Timestamps display correctly
- [ ] Empty message cannot be sent
- [ ] Very long message (1000+ chars) works
- [ ] Special characters and emojis work
- [ ] Reload page preserves messages

### Conversation Management

- [ ] Sidebar shows list of conversations
- [ ] Click conversation loads its messages
- [ ] Switch between conversations works
- [ ] Active conversation is highlighted
- [ ] New conversation appears in sidebar after first message
- [ ] Delete conversation removes it from sidebar
- [ ] Delete confirmation dialog appears
- [ ] Conversation preview/timestamp updates

### Error Handling

- [ ] Network error shows user-friendly message
- [ ] Invalid API key shows configuration error
- [ ] Rate limit shows appropriate message
- [ ] Database error handled gracefully
- [ ] Streaming interrupted can be retried

### UI/UX

- [ ] Loading states show during operations
- [ ] Error messages are clear and actionable
- [ ] Empty states provide guidance
- [ ] Responsive design works on mobile
- [ ] Sidebar toggle works on small screens
- [ ] Keyboard navigation works
- [ ] Focus management is correct
- [ ] Dark/Light theme consistency (if applicable)

### Performance

- [ ] 50+ conversations load without lag
- [ ] 100+ messages scroll smoothly
- [ ] Streaming doesn't block UI
- [ ] No memory leaks after extended use
- [ ] Images/assets load efficiently

## Known Issues

### Test-Related Issues

1. **E2E Test Reliability**
   - Some tests may be flaky due to timing (wait for AI responses)
   - Selectors might need adjustment if UI changes
   - **Mitigation:** Use data-testid attributes consistently

2. **Mock Limitations**
   - Next.js navigation mocks in Vitest are basic
   - Next-auth mocking may not cover all edge cases
   - **Mitigation:** Rely more on E2E tests for integration scenarios

3. **Coverage Measurement**
   - Unit test coverage doesn't include components or API routes
   - E2E tests don't contribute to code coverage metrics
   - **Mitigation:** Run both test suites and review manually

### Application Issues Found During Testing

*This section will be updated as bugs are discovered and fixed.*

## Best Practices

### Writing Unit Tests

```typescript
// ✅ Good: Test behavior, not implementation
it('should validate email format', () => {
  expect(() => emailSchema.parse('invalid')).toThrow('Invalid email')
})

// ❌ Bad: Test internal implementation
it('should call regex.test()', () => {
  // Don't test how validation works internally
})
```

### Writing E2E Tests

```typescript
// ✅ Good: Use accessible selectors
await page.getByRole('button', { name: /sign in/i })

// ⚠️ Acceptable: Use test IDs when needed
await page.locator('[data-testid="conversation-123"]')

// ❌ Bad: Use fragile CSS selectors
await page.locator('.btn.primary.large')
```

### Test Organization

- One test file per source file for unit tests
- Group related E2E tests by feature
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

## Continuous Integration

### Recommended CI Pipeline

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
      - run: npm ci
      - run: npm test
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/guides/testing)

---

## Recent Updates

### 2026-01-29 - Step 8 Testing Enhancements

Added 35 new unit tests for comprehensive coverage:

1. **API Validation Tests** (`api-chat.test.ts`, `api-conversations.test.ts`)
   - Chat request schema validation
   - Conversation schema validation
   - Edge cases (special chars, emojis, Unicode)
   - Length limit testing
   - Whitespace handling

2. **Anthropic Client Tests** (`anthropic-client.test.ts`)
   - Configuration validation
   - Security checks (no hardcoded secrets)
   - Module structure verification
   - Environment variable usage

3. **Bug Analysis**
   - Comprehensive code review completed
   - Edge cases identified and documented
   - Security audit passed
   - Performance considerations noted

4. **Test Infrastructure**
   - Fixed Vitest config to exclude E2E tests
   - Resolved jsdom environment issues
   - All 109 unit tests passing
   - Test coverage: utilities (100%), validations (100%), errors (100%)

---

**Last Updated:** 2026-01-29
**Test Suite Version:** 1.1.0
**Total Tests:** 136 (109 unit + 27 E2E)
**Status:** ✅ All tests passing
