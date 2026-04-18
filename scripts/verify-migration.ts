import { Client } from 'pg';

async function main() {
  const url = process.env.APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const password = process.env.APP_SUPABASE_PASSWORD;
  const region = process.env.APP_SUPABASE_POOLER_REGION;

  if (!url || !password) {
    console.error('Missing APP_SUPABASE_URL or APP_SUPABASE_PASSWORD');
    process.exit(1);
  }

  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    console.error('Could not parse Supabase project ref from URL');
    process.exit(1);
  }
  const ref = match[1];

  const conn = region
    ? `postgresql://postgres.${ref}:${password}@${region}.pooler.supabase.com:5432/postgres`
    : `postgresql://postgres:${password}@db.${ref}.supabase.co:5432/postgres`;

  const client = new Client({ connectionString: conn });
  await client.connect();

  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'expense_tracker_v1' ORDER BY table_name"
  );
  console.log('Tables in expense_tracker_v1 schema:', tables.rows.map((r) => r.table_name));

  const catCols = await client.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'expense_tracker_v1' AND table_name = 'categories' ORDER BY ordinal_position"
  );
  console.log('categories columns:', catCols.rows.map((r) => `${r.column_name}(${r.data_type})`));

  const expCols = await client.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'expense_tracker_v1' AND table_name = 'expenses' ORDER BY ordinal_position"
  );
  console.log('expenses columns:', expCols.rows.map((r) => `${r.column_name}(${r.data_type})`));

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
