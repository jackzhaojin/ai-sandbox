import Link from 'next/link';
import { Client } from 'pg';

type SummaryRow = {
  category_id: string;
  category_name: string;
  category_color: string;
  total_cents: number;
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

async function fetchMonthlySummary(
  monthStart: string,
  monthEnd: string
): Promise<SummaryRow[]> {
  const client = new Client({ connectionString: buildConnectionString() });
  await client.connect();

  const result = await client.query<SummaryRow>(
    `
    SELECT
      c.id AS category_id,
      c.name AS category_name,
      c.color AS category_color,
      COALESCE(SUM(e.amount_cents), 0) AS total_cents
    FROM expense_tracker_v1.categories c
    LEFT JOIN expense_tracker_v1.expenses e
      ON e.category_id = c.id
      AND e.occurred_on >= $1
      AND e.occurred_on <= $2
    GROUP BY c.id, c.name, c.color
    HAVING SUM(e.amount_cents) > 0
    ORDER BY total_cents DESC
  `,
    [monthStart, monthEnd]
  );

  await client.end();
  return result.rows;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function getMonthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-white p-8 shadow-sm text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <svg
          className="h-6 w-6 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-zinc-900">
        Could not load summary
      </h3>
      <p className="mt-1 text-sm text-zinc-500">{message}</p>
      <p className="mt-3 text-xs text-zinc-400">
        Please check your connection and try refreshing the page.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
        <svg
          className="h-6 w-6 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-zinc-900">
        No expenses this month
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        Nothing recorded yet for this period.
      </p>
      <div className="mt-4">
        <Link
          href="/expenses/new"
          className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          Add Expense
        </Link>
      </div>
    </div>
  );
}

function SummaryTable({ rows }: { rows: SummaryRow[] }) {
  const grandTotal = rows.reduce((sum, r) => sum + Number(r.total_cents), 0);

  if (rows.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="rounded-lg bg-white shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500"
            >
              Category
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500"
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {rows.map((row) => (
            <tr key={row.category_id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: row.category_color }}
                >
                  {row.category_name}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-zinc-900">
                {formatCents(Number(row.total_cents))}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-zinc-50">
          <tr>
            <td className="px-6 py-4 text-sm font-semibold text-zinc-900">
              Grand Total
            </td>
            <td className="px-6 py-4 text-right text-sm font-semibold text-zinc-900">
              {formatCents(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default async function SummaryPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  let rows: SummaryRow[];
  let error: string | null = null;

  try {
    rows = await fetchMonthlySummary(monthStart, monthEnd);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Something went wrong.';
    rows = [];
  }

  return (
    <div className="min-h-full bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Summary for {getMonthLabel(year, month)}
          </h1>
          <Link
            href="/expenses"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Back to Expenses
          </Link>
        </div>

        {error ? <ErrorState message={error} /> : <SummaryTable rows={rows} />}
      </div>
    </div>
  );
}
