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
