# Expense Tracker — Supabase CRUD — Research & Implementation Plan

**Step:** 1 of 16  
**Date:** 2026-04-18  
**Scope:** Research and planning only — no application code.

---

## 1. Requirements Recap

End-to-end user journey:

1. Open `/expenses` → page renders 10 seeded expenses grouped by month with category badges and a running total fetched live from cloud Supabase.
2. Click "Add Expense" → `/expenses/new` opens with category dropdown populated from the `categories` table.
3. Fill amount/category/date/note → submit → POST writes to Supabase and redirects to `/expenses` with the new row visible at the top.
4. Open `/summary` → page shows current-month totals per category computed by a Supabase SQL aggregation (not client-side reduce) and matches what a manual SUM of the seeded + new rows would produce.

**Tech stack:** Next.js 15 (App Router), plain JavaScript, Supabase cloud PostgreSQL, Playwright E2E.
**Custom schema:** `expense_tracker_v1`

---

## 2. Research Findings

### 2.1 Next.js 15 App Router — Server vs Client Components

**The one-line rule:** If a component uses browser APIs (`window`, `document`, `localStorage`), React hooks (`useState`, `useEffect`, `useRef`), event handlers (`onClick`, `onChange`), or real-time subscriptions, it must be a Client Component with `"use client"`. Everything else should be a Server Component.

**Boundary pattern — push Client Components to the leaves:**
- Page shells (layout, data fetching, static structure) = Server Components.
- Interactive pieces (forms with `onSubmit`, dropdowns with `onChange`, buttons) = Client Components.
- This minimizes the JS bundle sent to the browser.

**Key Next.js 15 changes relevant to this project:**
- `cookies()` is now async — must `await cookies()` in Server Components/Server Actions.
- `fetch` requests and route segments are **not cached by default** — data is fresh on every request unless explicitly cached. This is desirable for our expense list.
- Server Actions are stable and are the recommended pattern for form submissions and data mutations.
- `params` in page components is now a Promise — must `await params` if used.

**References:**
- https://www.groovyweb.co/blog/nextjs-project-structure-full-stack
- https://www.youngju.dev/blog/culture/2026-03-23-nextjs-15-react-19-complete-guide-2025.en

### 2.2 Supabase Client Setup with Custom Schema (`expense_tracker_v1`)

**Critical finding:** The `@supabase/ssr` package (used for auth/session cookie management) does **not** support custom schema configuration. To use a custom schema like `expense_tracker_v1`, we must use the base `@supabase/supabase-js` package and configure the `db.schema` option.

**Server Component / Server Action client:**
```javascript
import { createClient } from '@supabase/supabase-js'

export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,  // service_role for server-side
    {
      db: { schema: 'expense_tracker_v1' }
    }
  )
}
```

**Client Component client (if needed):**
```javascript
import { createClient } from '@supabase/supabase-js'

export function createBrowserSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      db: { schema: 'expense_tracker_v1' }
    }
  )
}
```

**Important:** Since this app does **not** use Supabase Auth (no login/session), we do not need the `@supabase/ssr` package at all. We can use `@supabase/supabase-js` directly on both server and client. This simplifies setup significantly — no cookie handling, no middleware, no session refresh.

**Per-query schema override (alternative):**
```javascript
const { data, error } = await supabase
  .schema('expense_tracker_v1')
  .from('expenses')
  .select('*')
```
For consistency, global schema config in `createClient` is preferred.

**Reference:** https://dev.to/ramunarasinga-11/custom-schema-specific-supabase-server-component-clients-in-grida-form-workspace-35nh

### 2.3 Server Action Patterns for Form Submission

**Pattern: Server Action bound directly to `<form action>`**

```javascript
// app/actions/expenses.js
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'

export async function createExpense(formData) {
  const supabase = createServerSupabase()

  const amount = parseFloat(formData.get('amount'))
  const category_id = formData.get('category_id')
  const date = formData.get('date')
  const note = formData.get('note')

  // Basic validation
  if (!amount || amount <= 0 || !category_id || !date) {
    return { error: 'Amount, category, and date are required' }
  }

  const { error } = await supabase
    .from('expenses')
    .insert({ amount, category_id, date, note })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/expenses')
  redirect('/expenses')
}
```

**Form component (Client Component):**
```javascript
'use client'

import { createExpense } from '@/app/actions/expenses'
import { useActionState } from 'react'

export function ExpenseForm({ categories }) {
  const [state, formAction, isPending] = useActionState(createExpense, null)

  return (
    <form action={formAction}>
      {/* fields */}
      {state?.error && <p className="error">{state.error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Add Expense'}
      </button>
    </form>
  )
}
```

**Key points:**
- `useActionState` (React 19 / Next.js 15) replaces `useFormState` for handling Server Action return values.
- `revalidatePath('/expenses')` clears the Next.js cache so the list page re-fetches fresh data.
- `redirect('/expenses')` navigates after successful submission.
- Progressive enhancement: the form works without JavaScript because `action` is bound to the Server Action.

**References:**
- https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
- https://jameslittle.me/blog/2023/nextjs-forms/

### 2.4 SQL Aggregation Queries via Supabase JS Client

**Requirement:** `/summary` page must show current-month totals per category computed by a Supabase SQL aggregation, NOT client-side reduce.

**Approach 1: PostgREST aggregate functions (PostgREST v12+)**
Supabase JS now supports aggregate functions directly:
```javascript
const { data, error } = await supabase
  .from('expenses')
  .select('category_id, amount.sum()', { count: 'exact' })
  .gte('date', `${year}-${month}-01`)
  .lt('date', `${nextYear}-${nextMonth}-01`)
  .group('category_id')
```
However, aggregate support in the JS client is limited and the syntax can be brittle for complex grouping with date filtering.

**Approach 2: PostgreSQL RPC function (RECOMMENDED)**
Create a stored function in the migration that computes exactly what the summary needs:
```sql
CREATE OR REPLACE FUNCTION expense_tracker_v1.get_monthly_summary(
  year_month text  -- format: '2026-04'
)
RETURNS TABLE (
  category_id bigint,
  category_name text,
  total_amount numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS category_id,
    c.name AS category_name,
    COALESCE(SUM(e.amount), 0) AS total_amount
  FROM expense_tracker_v1.categories c
  LEFT JOIN expense_tracker_v1.expenses e
    ON e.category_id = c.id
    AND TO_CHAR(e.date, 'YYYY-MM') = year_month
  GROUP BY c.id, c.name
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;
```

Call from JS:
```javascript
const { data, error } = await supabase
  .rpc('get_monthly_summary', { year_month: '2026-04' })
```

**Why RPC is recommended:**
- Exact control over the SQL.
- Works reliably with custom schemas.
- Easier to test and reason about.
- Matches the requirement "computed by a Supabase SQL aggregation" perfectly.

**Reference:** https://stackoverflow.com/questions/69376153/run-sum-on-supabase

### 2.5 Playwright Testing Against Live Cloud DB

**Strategy:**
Since we are using a live cloud Supabase instance, the E2E tests will exercise the real database. We need a clean, reproducible data strategy.

**Recommended approach — seeded known state + unique test data:**
1. **Seed script** runs before tests (or is assumed to have run) to create the 10 baseline expenses.
2. **Each test** that creates data uses a unique identifier (e.g., `test-expense-${Date.now()}` or a UUID) to avoid collisions in parallel runs.
3. **Cleanup:** After tests, optionally delete rows created by the test. However, since the project uses a dedicated sandbox project, and we have only a few tests, periodic manual cleanup or simply accepting test data accumulation is acceptable.

**Test structure (`tests/e2e/journey.spec.ts`):**
```typescript
import { test, expect } from '@playwright/test'

test('full expense journey', async ({ page }) => {
  // 1. Visit /expenses and verify seeded data
  await page.goto('/expenses')
  await expect(page.getByText('Coffee')).toBeVisible()
  await expect(page.locator('[data-testid="expense-row"]')).toHaveCount(10)

  // 2. Click "Add Expense" and navigate to /expenses/new
  await page.getByRole('link', { name: /add expense/i }).click()
  await expect(page).toHaveURL('/expenses/new')

  // 3. Fill and submit form
  await page.fill('[name="amount"]', '42.50')
  await page.selectOption('[name="category_id"]', '1') // Groceries
  await page.fill('[name="date"]', '2026-04-15')
  await page.fill('[name="note"]', 'Weekly groceries')
  await page.click('button[type="submit"]')

  // 4. Redirect back to /expenses, verify new row
  await expect(page).toHaveURL('/expenses')
  await expect(page.getByText('Weekly groceries')).toBeVisible()

  // 5. Visit /summary and verify aggregation
  await page.goto('/summary')
  await expect(page.getByText('Groceries')).toBeVisible()
  await expect(page.getByText(/42\.50/)).toBeVisible()
})
```

**Playwright config considerations:**
- Set `fullyParallel: false` if tests mutate shared seeded data to avoid conflicts.
- Alternatively, use `test.describe.serial()` for the journey test.
- Base URL should be `http://localhost:3000` (or detected port).

**References:**
- https://mainmatter.com/blog/2025/08/21/mock-database-in-svelte-tests/
- https://dev.to/testdino01/5-ways-to-handle-test-data-in-playwright-1l32

---

## 3. Implementation Plan

### 3.1 File Structure

```
expense-tracker-supabase/
├── app/
│   ├── layout.jsx              # Root layout (Server Component)
│   ├── page.jsx                # Home page (redirect to /expenses)
│   ├── expenses/
│   │   ├── page.jsx            # List expenses (Server Component)
│   │   ├── new/
│   │   │   └── page.jsx        # Add expense form page (Server Component wrapping Client Form)
│   │   └── loading.jsx         # Loading UI for expenses list
│   └── summary/
│       └── page.jsx            # Monthly summary (Server Component)
├── components/
│   ├── expense-list.jsx        # Client Component — renders grouped list
│   ├── expense-form.jsx        # Client Component — form with useActionState
│   ├── expense-row.jsx         # Presentational component
│   ├── category-badge.jsx      # Presentational component
│   └── summary-table.jsx       # Presentational component
├── lib/
│   ├── supabase/
│   │   ├── server.js           # Server-side Supabase client factory
│   │   └── client.js           # Browser Supabase client factory
│   └── utils.js                # Helper functions (currency formatting, date grouping)
├── actions/
│   └── expenses.js             # Server Actions for CRUD
├── tests/
│   └── e2e/
│       └── journey.spec.ts     # Playwright E2E journey test
├── sql/
│   ├── schema.sql              # Migration: schema + tables + function
│   └── seed.sql                # Idempotent seed data (10 expenses + categories)
└── .env.local                  # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SECRET_KEY
```

### 3.2 Database Schema (Custom Schema: `expense_tracker_v1`)

```sql
-- Create custom schema
CREATE SCHEMA IF NOT EXISTS expense_tracker_v1;

-- Grant usage and privileges
GRANT USAGE ON SCHEMA expense_tracker_v1 TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA expense_tracker_v1
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- Categories table
CREATE TABLE IF NOT EXISTS expense_tracker_v1.categories (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL UNIQUE,
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expense_tracker_v1.expenses (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  category_id bigint NOT NULL REFERENCES expense_tracker_v1.categories(id),
  date date NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

-- Index for efficient date filtering
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expense_tracker_v1.expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expense_tracker_v1.expenses(category_id);

-- RPC function for monthly summary
CREATE OR REPLACE FUNCTION expense_tracker_v1.get_monthly_summary(year_month text)
RETURNS TABLE (category_id bigint, category_name text, total_amount numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    COALESCE(SUM(e.amount), 0)::numeric
  FROM expense_tracker_v1.categories c
  LEFT JOIN expense_tracker_v1.expenses e
    ON e.category_id = c.id
    AND TO_CHAR(e.date, 'YYYY-MM') = year_month
  GROUP BY c.id, c.name
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;
```

### 3.3 Seed Script (Idempotent)

```sql
-- Idempotent category inserts
INSERT INTO expense_tracker_v1.categories (id, name, color) VALUES
  (1, 'Food', '#ef4444'),
  (2, 'Transport', '#3b82f6'),
  (3, 'Utilities', '#10b981'),
  (4, 'Entertainment', '#f59e0b'),
  (5, 'Groceries', '#8b5cf6')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color;

-- Idempotent expense inserts (reset sequence after)
INSERT INTO expense_tracker_v1.expenses (amount, category_id, date, note) VALUES
  (12.50, 1, '2026-04-01', 'Coffee'),
  (45.00, 5, '2026-04-02', 'Weekly groceries'),
  (8.75, 2, '2026-04-03', 'Bus fare'),
  (120.00, 3, '2026-03-15', 'Electric bill'),
  (35.00, 4, '2026-03-20', 'Movie night'),
  (22.30, 1, '2026-03-22', 'Lunch'),
  (60.00, 5, '2026-03-25', 'Groceries'),
  (15.00, 2, '2026-02-10', 'Taxi'),
  (90.00, 3, '2026-02-12', 'Internet'),
  (25.00, 4, '2026-02-14', 'Concert')
ON CONFLICT DO NOTHING;
```

**Note:** Since `expenses.id` is `GENERATED ALWAYS AS IDENTITY`, we cannot explicitly insert IDs. The seed uses `ON CONFLICT DO NOTHING` which won't actually prevent duplicates (no unique constraint on amount/date/note). For truly idempotent seeds, either:
- Add a `seed_key` column with a UNIQUE constraint, or
- Accept that re-running seed.sql may create duplicates and plan to `TRUNCATE` before seeding in test environments, or
- Use `ON CONFLICT` with a deterministic unique key.

**Recommended for this project:** Do not worry about duplicate prevention on expenses — the seed runs once during setup. For tests, use a cleanup strategy.

### 3.4 Component Boundaries & Data Flow

**Page: `/expenses` (Server Component)**
```
app/expenses/page.jsx (Server Component)
  ↓ fetches data via createServerSupabase()
  ↓ groups by month in JS (for display structure)
  ↓ passes grouped data to ExpenseList (Client Component)
      ↓ renders month groups, running totals
      ↓ each row = ExpenseRow + CategoryBadge
```

**Why group in JS, not SQL?** The requirement says "grouped by month" for display. A simple `ORDER BY date DESC` query returns all rows; client-side grouping by month is trivial and avoids complex SQL. The **summary page** uses SQL aggregation as required.

**Page: `/expenses/new` (Server Component wrapping Client Form)**
```
app/expenses/new/page.jsx (Server Component)
  ↓ fetches categories via createServerSupabase()
  ↓ passes categories to ExpenseForm (Client Component)
      ↓ uses useActionState with createExpense Server Action
      ↓ form submission → Server Action → Supabase insert → redirect
```

**Page: `/summary` (Server Component)**
```
app/summary/page.jsx (Server Component)
  ↓ calls supabase.rpc('get_monthly_summary', { year_month: '2026-04' })
  ↓ passes result to SummaryTable (Client or Server — presentational)
```

### 3.5 Supabase Client Initialization Code

**`lib/supabase/server.js`:**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase server environment variables')
}

export function createServerSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: 'expense_tracker_v1' }
  })
}
```

**`lib/supabase/client.js`:**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase client environment variables')
}

export function createBrowserSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: 'expense_tracker_v1' }
  })
}
```

**`.env.local` mapping from `.env.app`:**
```
NEXT_PUBLIC_SUPABASE_URL=<from APP_SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from APP_SUPABASE_PUBLISHABLE_KEY>
SUPABASE_SECRET_KEY=<from APP_SUPABASE_SECRET_KEY>
```

### 3.6 Migration Strategy

Since this project does not use the Supabase CLI locally (no `supabase/` directory with local stack), the migration will be applied directly to the cloud Supabase instance.

**Options:**
1. **Supabase Dashboard SQL Editor** — copy/paste `sql/schema.sql` and run. Good for one-off setup.
2. **psql via connection string** — use the direct Postgres connection (from Supabase dashboard → Settings → Database → Connection string). Requires `psql` CLI.
3. **Supabase REST API** — not suitable for schema creation.

**Recommended:** Option 1 (SQL Editor) for schema creation, since it's a one-time setup. For idempotent re-runs, the SQL uses `IF NOT EXISTS` everywhere.

**For seed data:** Same approach — run `sql/seed.sql` in the SQL Editor after schema creation.

### 3.7 Validation Strategy

**Server-side validation (in Server Action):**
- `amount` must be a positive number.
- `category_id` must be a non-empty string/number referencing an existing category.
- `date` must be a valid date string.
- Return validation errors as a plain object `{ error: string }` which `useActionState` surfaces.

**Client-side validation (optional enhancement):**
- HTML5 form validation (`required`, `min`, `type="date"`).
- No complex client validation library needed.

**Data integrity (database level):**
- `amount numeric(10,2) CHECK (amount > 0)`
- `category_id` foreign key constraint

### 3.8 Running Total on `/expenses`

The running total should be computed client-side from the fetched data, since it needs to be a cumulative sum across the grouped list. Alternatively, compute it in SQL with a window function:

```sql
SELECT *, SUM(amount) OVER (ORDER BY date DESC, id DESC) as running_total
FROM expense_tracker_v1.expenses
ORDER BY date DESC
```

However, since we also group by month for display, computing the running total in JS after fetching is simpler and more flexible for the UI layout.

### 3.9 Step-by-Step Build Plan (for subsequent steps)

| Step | Task | Key Files |
|------|------|-----------|
| 2 | Create worktree and initialize Next.js project | `package.json`, `app/`, `next.config.js` |
| 3 | Create Supabase client utilities | `lib/supabase/server.js`, `lib/supabase/client.js`, `.env.local` |
| 4 | Write and apply database migration | `sql/schema.sql`, run in Supabase SQL Editor |
| 5 | Create seed script and seed DB | `sql/seed.sql`, run in Supabase SQL Editor |
| 6 | Build `/expenses` list page | `app/expenses/page.jsx`, `components/expense-list.jsx` |
| 7 | Build `/expenses/new` form page | `app/expenses/new/page.jsx`, `components/expense-form.jsx`, `actions/expenses.js` |
| 8 | Build `/summary` page with RPC aggregation | `app/summary/page.jsx`, `components/summary-table.jsx` |
| 9 | Add navigation and layout polish | `app/layout.jsx`, header/nav components |
| 10 | Add basic styling | Tailwind or plain CSS |
| 11 | Write Playwright E2E journey test | `tests/e2e/journey.spec.ts` |
| 12 | Run E2E test and fix issues | iterate on tests + code |
| 13 | Visual testing with playwright-cli | screenshots, snapshots |
| 14 | Edge case testing | empty states, validation errors |
| 15 | Performance and cleanup | bundle analysis, code review |
| 16 | Final verification and handoff | run full journey, commit |

---

## 4. Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Custom schema not exposed in Supabase REST API | Low | High | Verify schema is exposed in Supabase Dashboard → Settings → API → Exposed schemas. Add `expense_tracker_v1` if missing. |
| Service role key blocked by RLS | Low | Medium | Service role bypasses RLS by design. If using anon key, disable RLS or add policies. |
| Playwright tests flaky due to async DB writes | Medium | Medium | Add `await expect(...)` with auto-retry, or use `page.waitForURL` after form submit. |
| Date grouping behavior differs by timezone | Low | Medium | Store dates as `date` (not `timestamptz`) to avoid TZ issues. Use `TO_CHAR(date, 'YYYY-MM')` for grouping. |
| Seed data duplicates on re-run | Medium | Low | Accept duplicates in dev; for tests, use unique identifiers or cleanup. |

---

## 5. Key Decisions Log

1. **No TypeScript:** Plain JavaScript per technology preference.
2. **No Supabase Auth:** The app is a simple CRUD tracker without user accounts. Server-side uses service_role key.
3. **No `@supabase/ssr`:** Auth is not used, so cookie/session management is unnecessary. Base `@supabase/supabase-js` is sufficient.
4. **RPC for aggregation:** The `/summary` page uses a PostgreSQL function (`get_monthly_summary`) to ensure aggregation happens server-side in SQL, not client-side.
5. **Server Actions for mutations:** Form submissions use Next.js Server Actions bound to `<form action>` for simplicity and progressive enhancement.
6. **Client Components at leaves:** Interactive forms are Client Components; pages and data fetching are Server Components.
