'use server';

import { Client } from 'pg';
import { revalidatePath } from 'next/cache';

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

type CreateExpenseResult =
  | { success: true; message: string }
  | { success: false; message: string };

export async function createExpense(
  prevState: unknown,
  formData: FormData
): Promise<CreateExpenseResult> {
  const amountCentsRaw = formData.get('amount_cents');
  const categoryId = formData.get('category_id') as string | null;
  const occurredOn = formData.get('occurred_on') as string | null;
  const note = formData.get('note') as string | null;

  // Server-side validation
  if (!amountCentsRaw) {
    return { success: false, message: 'Amount is required.' };
  }

  const amountCents = Number(amountCentsRaw);
  if (Number.isNaN(amountCents) || amountCents <= 0) {
    return { success: false, message: 'Amount must be greater than 0.' };
  }

  if (!categoryId || categoryId.trim() === '') {
    return { success: false, message: 'Please select a category.' };
  }

  if (!occurredOn || occurredOn.trim() === '') {
    return { success: false, message: 'Date is required.' };
  }

  const client = new Client({ connectionString: buildConnectionString() });

  try {
    await client.connect();

    await client.query(
      `INSERT INTO expense_tracker_v1.expenses (amount_cents, category_id, occurred_on, note)
       VALUES ($1, $2, $3, $4)`,
      [
        amountCents,
        categoryId,
        occurredOn,
        note && note.trim() !== '' ? note.trim() : null,
      ]
    );

    revalidatePath('/expenses');

    return { success: true, message: 'Expense saved successfully.' };
  } catch (err) {
    console.error('Database insert error:', err);

    const pgErr = err as { code?: string; message?: string };

    // Foreign key violation
    if (pgErr.code === '23503') {
      return { success: false, message: 'Selected category is invalid.' };
    }

    // Not null violation
    if (pgErr.code === '23502') {
      return { success: false, message: 'Please fill in all required fields.' };
    }

    // Check constraint violation
    if (pgErr.code === '23514') {
      return {
        success: false,
        message: 'One or more fields have invalid values.',
      };
    }

    // Unique violation (unlikely for expenses, but handle anyway)
    if (pgErr.code === '23505') {
      return {
        success: false,
        message: 'This expense appears to already exist.',
      };
    }

    return {
      success: false,
      message: 'Something went wrong while saving the expense. Please try again.',
    };
  } finally {
    await client.end().catch(() => {});
  }
}
