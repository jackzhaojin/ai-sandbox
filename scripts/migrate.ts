import { readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

async function runWithPsql(sql: string, connectionString: string): Promise<boolean> {
  try {
    execSync('which psql', { stdio: 'ignore' });
    execSync('psql', {
      input: sql,
      env: {
        ...process.env,
        PGPASSWORD: connectionString.match(/:(.*)@/)?.[1] || '',
      },
      stdio: 'inherit',
    });
    return true;
  } catch {
    return false;
  }
}

async function runWithPg(sql: string, connectionString: string): Promise<boolean> {
  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString });
    await client.connect();
    await client.query(sql);
    await client.end();
    return true;
  } catch (err) {
    console.error('Failed to execute via pg:', err);
    return false;
  }
}

function buildConnectionString(): string | null {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const url = process.env.APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const password = process.env.APP_SUPABASE_PASSWORD;
  const region = process.env.APP_SUPABASE_POOLER_REGION;

  if (!url || !password) {
    return null;
  }

  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) return null;
  const ref = match[1];

  if (region) {
    return `postgresql://postgres.${ref}:${password}@${region}.pooler.supabase.com:5432/postgres`;
  }

  return `postgresql://postgres:${password}@db.${ref}.supabase.co:5432/postgres`;
}

async function main() {
  const migrationPath = resolve(__dirname, '../supabase/migrations/0001_init.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  const connectionString = buildConnectionString();
  if (!connectionString) {
    console.error(
      'No database connection string found. Set DATABASE_URL or APP_SUPABASE_URL + APP_SUPABASE_PASSWORD.'
    );
    process.exit(1);
  }

  console.log('Running migration: 0001_init.sql');

  if (await runWithPsql(sql, connectionString)) {
    console.log('Migration applied successfully via psql.');
    return;
  }

  console.log('psql not available, falling back to pg (direct PostgreSQL connection)...');

  if (await runWithPg(sql, connectionString)) {
    console.log('Migration applied successfully via pg.');
    return;
  }

  console.error('Migration failed: could not execute SQL via psql or pg.');
  process.exit(1);
}

main();
