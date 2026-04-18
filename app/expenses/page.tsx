import Link from 'next/link';
import { Client } from 'pg';

type ExpenseRow = {
  id: string;
  amount_cents: number;
  category_id: string;
  occurred_on: Date;
  note: string | null;
  created_at: Date;
  category_name: string | null;
  category_color: string | null;
};

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

async function fetchExpenses(): Promise<ExpenseRow[]> {
  const client = new Client({ connectionString: buildConnectionString() });
  await client.connect();

  const result = await client.query<ExpenseRow>(`
    SELECT
      e.id,
      e.amount_cents,
      e.category_id,
      e.occurred_on,
      e.note,
      e.created_at,
      c.name AS category_name,
      c.color AS category_color
    FROM expense_tracker_v1.expenses e
    LEFT JOIN expense_tracker_v1.categories c ON e.category_id = c.id
    ORDER BY e.occurred_on DESC
  `);

  await client.end();
  return result.rows;
}

function formatMonthHeading(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(occurredOn: Date): string {
  const date = new Date(occurredOn);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getMonthKey(occurredOn: Date): string {
  const date = new Date(occurredOn);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export default async function ExpensesPage() {
  const expenses = await fetchExpenses();

  // Group expenses by YYYY-MM using a Map
  const groups = new Map<string, ExpenseRow[]>();
  for (const expense of expenses) {
    const monthKey = getMonthKey(expense.occurred_on);
    if (!groups.has(monthKey)) {
      groups.set(monthKey, []);
    }
    groups.get(monthKey)!.push(expense);
  }

  return (
    <div className="min-h-full bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Expenses
          </h1>
          <Link
            href="/expenses/new"
            className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Add Expense
          </Link>
        </div>

        {groups.size === 0 && (
          <div className="rounded-lg bg-white p-8 text-center shadow-sm">
            <p className="text-zinc-500">No expenses yet.</p>
          </div>
        )}

        {Array.from(groups.entries()).map(([monthKey, monthExpenses]) => {
          const monthTotal = monthExpenses.reduce(
            (sum, e) => sum + e.amount_cents,
            0
          );

          return (
            <div
              key={monthKey}
              className="mb-6 rounded-lg bg-white p-6 shadow-sm"
            >
              <h2 className="mb-4 text-lg font-semibold text-zinc-800">
                {formatMonthHeading(monthKey)}
              </h2>

              <ul className="divide-y divide-zinc-100">
                {monthExpenses.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-zinc-500">
                        {formatDate(expense.occurred_on)}
                      </span>
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                        style={{
                          backgroundColor:
                            expense.category_color || '#6b7280',
                        }}
                      >
                        {expense.category_name || 'Unknown'}
                      </span>
                      {expense.note && (
                        <span className="text-sm text-zinc-600">
                          {expense.note}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-zinc-900">
                      {formatCents(expense.amount_cents)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex justify-end border-t border-zinc-100 pt-4">
                <span className="text-sm font-semibold text-zinc-900">
                  Month Total: {formatCents(monthTotal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
