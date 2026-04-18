'use server';

import { Client } from 'pg';

function buildConnectionString(): string {
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

type CategoryRow = {
  id: string;
  name: string;
  color: string;
};

export async function fetchCategories(): Promise<CategoryRow[]> {
  const client = new Client({ connectionString: buildConnectionString() });
  await client.connect();

  const result = await client.query<CategoryRow>(
    `SELECT id, name, color FROM expense_tracker_v1.categories ORDER BY name`
  );

  await client.end();
  return result.rows;
}

export async function createExpense(
  prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  const amountCents = Number(formData.get('amount_cents'));
  const categoryId = formData.get('category_id') as string;
  const occurredOn = formData.get('occurred_on') as string;
  const note = formData.get('note') as string;

  console.log('createExpense stub called', {
    amountCents,
    categoryId,
    occurredOn,
    note,
  });

  // Stub — will be wired in Step 9
  return { message: 'Stub: expense not actually created yet' };
}
