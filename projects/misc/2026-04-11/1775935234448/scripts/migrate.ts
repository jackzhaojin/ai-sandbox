#!/usr/bin/env tsx
/**
 * Database Migration Script
 * Executes SQL migration against cloud Supabase using postgres client
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(process.cwd(), '.env.app') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!SUPABASE_URL) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!SERVICE_ROLE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Extract project ref from URL (format: https://<ref>.supabase.co)
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
const connectionString = `postgresql://postgres:${SERVICE_ROLE_KEY}@db.${projectRef}.supabase.co:5432/postgres`;

async function migrate() {
  console.log('🚀 B2B Postal Checkout - Database Migration');
  console.log('='.repeat(50));
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔌 Connecting to: db.${projectRef}.supabase.co:5432`);

  // Read migration file
  const migrationPath = resolve(process.cwd(), 'supabase/migrations/000001_initial_schema.sql');
  console.log(`\n📄 Reading migration: ${migrationPath}`);

  let sql: string;
  try {
    sql = readFileSync(migrationPath, 'utf-8');
  } catch (err) {
    console.error('❌ Failed to read migration file:', err);
    process.exit(1);
  }

  console.log(`📝 Migration size: ${sql.length} characters`);

  // Create postgres client
  console.log('\n⚙️ Connecting to database...');

  let sqlClient: postgres.Sql;
  try {
    sqlClient = postgres(connectionString, {
      ssl: { rejectUnauthorized: false },
      max: 1, // Single connection for migration
      timeout: 60,
    });
  } catch (err) {
    console.error('❌ Failed to create database client:', err);
    process.exit(1);
  }

  // Execute migration
  console.log('⚙️ Executing migration...');
  console.log('⏳ This may take a moment...\n');

  try {
    await sqlClient.unsafe(sql);
    console.log('✅ Migration executed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);

    // Try to provide helpful error message
    if (String(err).includes('ECONNREFUSED')) {
      console.error('\n⚠️ Could not connect to database.');
      console.error('   Please check your network connection and Supabase credentials.');
    }
    if (String(err).includes('password authentication failed')) {
      console.error('\n⚠️ Authentication failed.');
      console.error('   Please verify your SUPABASE_SERVICE_ROLE_KEY is correct.');
    }

    await sqlClient.end();
    process.exit(1);
  }

  // Verify migration
  console.log('\n🔍 Verifying schema...');

  try {
    // Check if postal_v2 schema exists by querying a table
    const result = await sqlClient`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'postal_v2' 
      AND table_name = 'carriers'
    `;

    if (result.length === 0) {
      console.error('❌ Schema verification failed: carriers table not found');
      await sqlClient.end();
      process.exit(1);
    }

    // Count tables in schema
    const tables = await sqlClient`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'postal_v2' 
      AND table_type = 'BASE TABLE'
    `;

    console.log(`✅ Schema verified: ${tables.length} tables created in postal_v2`);
    console.log(`📊 Tables: ${tables.map((t: any) => t.table_name).slice(0, 10).join(', ')}${tables.length > 10 ? '...' : ''}`);

  } catch (err) {
    console.error('❌ Schema verification failed:', err);
    await sqlClient.end();
    process.exit(1);
  }

  await sqlClient.end();

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Migration complete!');
  console.log('='.repeat(50));
  console.log('\nNext steps:');
  console.log('  npm run db:seed     # Seed sample data');
  console.log('  npm run db:verify   # Verify database setup');
}

migrate().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
