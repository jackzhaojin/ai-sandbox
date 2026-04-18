import { test, expect, Page } from '@playwright/test';
import { Client } from 'pg';
import { readFileSync } from 'fs';

function loadEnvFile(path: string): void {
  try {
    const content = readFileSync(path, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // ignore missing env file
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env.app');

function buildConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const url = process.env.APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const password = process.env.APP_SUPABASE_PASSWORD;
  const region = process.env.APP_SUPABASE_POOLER_REGION;

  if (!url || !password) {
    throw new Error('Missing APP_SUPABASE_URL or APP_SUPABASE_PASSWORD');
  }

  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    throw new Error('Could not parse Supabase project ref from URL');
  }
  const ref = match[1];

  if (region) {
    return `postgresql://postgres.${ref}:${password}@${region}.pooler.supabase.com:5432/postgres`;
  }

  return `postgresql://postgres:${password}@db.${ref}.supabase.co:5432/postgres`;
}

async function queryDatabase<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const client = new Client({ connectionString: buildConnectionString() });
  await client.connect();
  const result = await client.query(sql, params);
  await client.end();
  return result.rows;
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  // Ensure clean database state before journey tests
  const { execSync } = require('child_process');
  execSync('npm run db:seed', {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
});

export async function completePriorSteps(page: Page, opts: { through: number }) {
  // Steps 1–3: Next.js scaffold + Supabase client setup — verify app loads
  if (opts.through >= 3) {
    await page.goto('/');
    await expect(page.getByText('To get started, edit the page.tsx file')).toBeVisible();
  }

  // Steps 4–5: Migration applied and database seeded with real data
  if (opts.through >= 5) {
    const categories = await queryDatabase('SELECT * FROM expense_tracker_v1.categories ORDER BY name');
    expect(categories.length).toBe(5);
    expect(categories.map((c: any) => c.name)).toEqual(
      expect.arrayContaining(['Entertainment', 'Food', 'Health', 'Travel', 'Utilities'])
    );

    const expenses = await queryDatabase('SELECT * FROM expense_tracker_v1.expenses');
    expect(expenses.length).toBe(10);

    // Verify schema columns exist
    const catColumns = await queryDatabase(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'expense_tracker_v1' AND table_name = 'categories' ORDER BY ordinal_position"
    );
    expect(catColumns.map((c: any) => c.column_name)).toEqual(['id', 'name', 'color']);

    const expColumns = await queryDatabase(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'expense_tracker_v1' AND table_name = 'expenses' ORDER BY ordinal_position"
    );
    expect(expColumns.map((c: any) => c.column_name)).toEqual([
      'id', 'amount_cents', 'category_id', 'occurred_on', 'note', 'created_at',
    ]);
  }
}

test('checkpoint 1: app scaffolded, db migrated and seeded', async ({ page }) => {
  await completePriorSteps(page, { through: 5 });
});

test('step 7: expenses list page renders with monthly grouping', async ({ page }) => {
  await completePriorSteps(page, { through: 5 });

  // Navigate to /expenses
  await page.goto('/expenses');
  await expect(page.getByRole('heading', { name: 'Expenses', level: 1 })).toBeVisible();

  // Verify "Add Expense" button links to /expenses/new
  const addButton = page.getByRole('link', { name: 'Add Expense' });
  await expect(addButton).toBeVisible();
  await expect(addButton).toHaveAttribute('href', '/expenses/new');

  // Verify monthly sections exist — seeded data spans at least 2 months
  const monthHeadings = page.getByRole('heading', { level: 2 });
  await expect(monthHeadings).toHaveCount(await monthHeadings.count()); // at least one
  const monthTexts = await monthHeadings.allTextContents();
  expect(monthTexts.length).toBeGreaterThanOrEqual(2);

  // Verify category badges are visible (colored pills with category names)
  // Only check categories that actually appear in seeded expenses (random seed may not cover all 5)
  const dbCategoryNames = await queryDatabase(
    `SELECT DISTINCT c.name
     FROM expense_tracker_v1.categories c
     JOIN expense_tracker_v1.expenses e ON e.category_id = c.id`
  );
  for (const cat of dbCategoryNames) {
    await expect(page.getByText(cat.name, { exact: true }).first()).toBeVisible();
  }

  // Verify month totals are present
  const monthTotalLabels = page.getByText(/Month Total: \$/);
  await expect(monthTotalLabels).toHaveCount(await monthHeadings.count());

  // Verify expense rows match DB count
  const dbExpenses = await queryDatabase('SELECT * FROM expense_tracker_v1.expenses');
  const expenseAmounts = page.getByText(/^\$\d+\.\d{2}$/);
  await expect(expenseAmounts).toHaveCount(dbExpenses.length);
});

test('step 8: new expense form renders with category dropdown and validation', async ({ page }) => {
  await completePriorSteps(page, { through: 5 });

  // Navigate to /expenses/new
  await page.goto('/expenses/new');
  await expect(page.getByRole('heading', { name: 'Add Expense', level: 1 })).toBeVisible();

  // Verify category dropdown is populated with real categories from DB
  const dbCategories = await queryDatabase('SELECT name FROM expense_tracker_v1.categories ORDER BY name');
  for (const cat of dbCategories) {
    await expect(page.locator('select[name="category_id"]').locator('option', { hasText: cat.name })).toHaveCount(1);
  }

  // Verify date defaults to today
  const today = new Date().toISOString().split('T')[0];
  await expect(page.locator('input[name="occurred_on"]')).toHaveValue(today);

  // Submit empty form to trigger validation
  await page.getByRole('button', { name: 'Save Expense' }).click();

  // Verify validation errors appear
  await expect(page.getByText('Amount must be greater than 0')).toBeVisible();
  await expect(page.getByText('Please select a category')).toBeVisible();

  // Fill form with valid data and submit — should create expense and redirect
  await page.fill('input[name="amount"]', '25.50');
  await page.selectOption('select[name="category_id"]', { label: 'Food' });
  await page.fill('textarea[name="note"]', 'Lunch with team');
  await page.getByRole('button', { name: 'Save Expense' }).click();

  // Verify redirect to /expenses and new expense is visible
  await expect(page).toHaveURL('/expenses');
  await expect(page.getByRole('heading', { name: 'Expenses', level: 1 })).toBeVisible();
  await expect(page.getByText('$25.50')).toBeVisible();
  await expect(page.getByText('Lunch with team')).toBeVisible();

  // Verify Cancel link works from a fresh /expenses/new page
  await page.goto('/expenses/new');
  await page.getByRole('link', { name: 'Cancel' }).first().click();
  await expect(page).toHaveURL('/expenses');
  await expect(page.getByRole('heading', { name: 'Expenses', level: 1 })).toBeVisible();
});

test('step 9: create expense via server action, redirect, and verify in list', async ({ page }) => {
  // Count expenses before (step 8 may have created one in serial mode)
  const beforeExpenses = await queryDatabase('SELECT COUNT(*) AS count FROM expense_tracker_v1.expenses');
  const beforeCount = Number(beforeExpenses[0].count);

  // Navigate to /expenses/new
  await page.goto('/expenses/new');
  await expect(page.getByRole('heading', { name: 'Add Expense', level: 1 })).toBeVisible();

  // Fill form with unique identifiable data
  await page.fill('input[name="amount"]', '42.99');
  await page.selectOption('select[name="category_id"]', { label: 'Travel' });
  await page.fill('textarea[name="note"]', 'Taxi to airport — step 9 test');

  // Submit
  await page.getByRole('button', { name: 'Save Expense' }).click();

  // Verify redirect to /expenses
  await expect(page).toHaveURL('/expenses');
  await expect(page.getByRole('heading', { name: 'Expenses', level: 1 })).toBeVisible();

  // Verify the new expense appears in the list
  await expect(page.getByText('$42.99')).toBeVisible();
  await expect(page.getByText('Taxi to airport — step 9 test')).toBeVisible();
  await expect(page.getByText('Travel', { exact: true }).first()).toBeVisible();

  // Verify DB count increased
  const afterExpenses = await queryDatabase('SELECT COUNT(*) AS count FROM expense_tracker_v1.expenses');
  const afterCount = Number(afterExpenses[0].count);
  expect(afterCount).toBe(beforeCount + 1);
});

test('step 10: summary page shows current-month totals grouped by category', async ({ page }) => {
  // Navigate to /summary
  await page.goto('/summary');

  // Verify heading includes current month/year
  const now = new Date();
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  await expect(page.getByRole('heading', { name: new RegExp(`Summary for ${monthLabel}`), level: 1 })).toBeVisible();

  // Verify "Back to Expenses" link is present
  const backLink = page.getByRole('link', { name: 'Back to Expenses' });
  await expect(backLink).toBeVisible();
  await expect(backLink).toHaveAttribute('href', '/expenses');

  // Compute expected totals from database using SQL aggregation
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthStart = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const monthEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

  const dbTotals = await queryDatabase(
    `SELECT c.name, c.color, SUM(e.amount_cents) AS total_cents
     FROM expense_tracker_v1.categories c
     LEFT JOIN expense_tracker_v1.expenses e
       ON e.category_id = c.id
       AND e.occurred_on >= $1
       AND e.occurred_on <= $2
     GROUP BY c.id, c.name, c.color
     HAVING SUM(e.amount_cents) > 0
     ORDER BY total_cents DESC`,
    [monthStart, monthEnd]
  );

  if (dbTotals.length === 0) {
    // Seeded data is within 60 days, so it's possible some falls in current month
    await expect(page.getByText('No expenses recorded this month.')).toBeVisible();
  } else {
    // Verify table has category badges and totals
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Verify each category from DB appears in the table
    for (const row of dbTotals) {
      await expect(page.getByText(row.name, { exact: true }).first()).toBeVisible();
      await expect(page.getByText(formatCents(Number(row.total_cents)))).toBeVisible();
    }

    // Verify grand total row
    const grandTotal = dbTotals.reduce((sum: number, r: any) => sum + Number(r.total_cents), 0);
    await expect(page.getByText('Grand Total')).toBeVisible();
    await expect(page.getByText(formatCents(grandTotal))).toBeVisible();
  }

  // Verify navigation back to /expenses works
  await page.getByRole('link', { name: 'Back to Expenses' }).click();
  await expect(page).toHaveURL('/expenses');
  await expect(page.getByRole('heading', { name: 'Expenses', level: 1 })).toBeVisible();
});

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
