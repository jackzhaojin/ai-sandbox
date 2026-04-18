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

const CATEGORIES = [
  { name: 'Food', color: '#FF6B6B' },
  { name: 'Travel', color: '#4ECDC4' },
  { name: 'Utilities', color: '#95E1D3' },
  { name: 'Entertainment', color: '#FFE66D' },
  { name: 'Health', color: '#A8E6CF' },
];

const EXPENSE_NOTES = [
  'Grocery run at Whole Foods',
  'Monthly electricity bill',
  'Uber to downtown meeting',
  'Movie night with friends',
  'Prescription refill at pharmacy',
  'Gas station fill-up',
  'Streaming subscription renewal',
  'Dinner at Italian restaurant',
  'Yoga class monthly pass',
  'Flight ticket for weekend trip',
  'Coffee and pastries for team',
  'Internet bill',
  'Train ticket to conference',
  'Concert tickets — indie band',
  'Dental cleaning copay',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateWithinDays(days: number): string {
  const now = new Date();
  const past = new Date(now.getTime() - randomInt(0, days) * 24 * 60 * 60 * 1000);
  return past.toISOString().split('T')[0];
}

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

async function main() {
  const connectionString = buildConnectionString();
  const client = new Client({ connectionString });
  await client.connect();

  console.log('Clearing existing data...');

  await client.query('DELETE FROM expense_tracker_v1.expenses');
  await client.query('DELETE FROM expense_tracker_v1.categories');

  console.log('Inserting categories...');

  const insertedCategories = [];
  for (const cat of CATEGORIES) {
    const res = await client.query(
      'INSERT INTO expense_tracker_v1.categories (name, color) VALUES ($1, $2) RETURNING id, name, color',
      [cat.name, cat.color]
    );
    insertedCategories.push(res.rows[0]);
  }

  console.log(`Inserted ${insertedCategories.length} categories.`);

  const expenses = [];
  for (let i = 0; i < 10; i++) {
    const category = insertedCategories[randomInt(0, insertedCategories.length - 1)];
    expenses.push({
      amount_cents: randomInt(1500, 8000),
      category_id: category.id,
      occurred_on: randomDateWithinDays(60),
      note: EXPENSE_NOTES[randomInt(0, EXPENSE_NOTES.length - 1)],
    });
  }

  console.log('Inserting expenses...');

  const insertedExpenses = [];
  for (const exp of expenses) {
    const res = await client.query(
      'INSERT INTO expense_tracker_v1.expenses (amount_cents, category_id, occurred_on, note) VALUES ($1, $2, $3, $4) RETURNING *',
      [exp.amount_cents, exp.category_id, exp.occurred_on, exp.note]
    );
    insertedExpenses.push(res.rows[0]);
  }

  console.log(`Inserted ${insertedExpenses.length} expenses.`);

  // Verify date distribution spans at least 2 months
  const months = new Set(insertedExpenses.map((e) => e.occurred_on.toISOString().slice(0, 7)));
  console.log('Expense months represented:', Array.from(months).sort().join(', '));

  // Verify category distribution
  const categoryCounts: Record<string, number> = {};
  for (const e of insertedExpenses) {
    const catName = insertedCategories.find((c) => c.id === e.category_id)?.name ?? 'unknown';
    categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
  }
  console.log('Expenses per category:', categoryCounts);

  // Verify total counts
  const catCount = await client.query('SELECT COUNT(*) FROM expense_tracker_v1.categories');
  const expCount = await client.query('SELECT COUNT(*) FROM expense_tracker_v1.expenses');
  console.log(`Verification: ${catCount.rows[0].count} categories, ${expCount.rows[0].count} expenses`);

  await client.end();

  console.log('Seed completed successfully.');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
