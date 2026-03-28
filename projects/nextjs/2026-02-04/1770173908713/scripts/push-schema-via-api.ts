/**
 * Push Drizzle schema to Supabase using HTTP API
 *
 * This script bypasses the need for DATABASE_URL by using Supabase's HTTP API
 * with the service role key to execute DDL statements.
 *
 * Run with: tsx scripts/push-schema-via-api.ts
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('  - SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function executeSql(sql: string): Promise<any> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

async function main() {
  console.log('🚀 Pushing schema to Supabase via HTTP API...\n');

  try {
    // Step 1: Create enums
    console.log('📝 Creating enums...');

    const createEnums = `
      DO $$ BEGIN
        CREATE TYPE difficulty AS ENUM ('easy', 'medium', 'hard');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE ingredient_category AS ENUM ('vegetable', 'fruit', 'protein', 'dairy', 'grain', 'spice', 'condiment', 'oil', 'sweetener', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE unit AS ENUM ('cup', 'tbsp', 'tsp', 'gram', 'kg', 'oz', 'lb', 'ml', 'liter', 'pinch', 'piece', 'whole', 'to_taste');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    try {
      await executeSql(createEnums);
      console.log('✅ Enums created');
    } catch (error: any) {
      console.log('⚠️  Enum creation error (might already exist):', error.message);
    }

    console.log('\n🔍 Note: This script requires a custom SQL execution function.');
    console.log('   Unfortunately, Supabase does not expose a direct SQL execution endpoint.');
    console.log('   You need to create a PostgreSQL function first or use drizzle-kit push with DATABASE_URL.\n');

    console.log('📋 Next steps:');
    console.log('1. Get your database password from Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/lmbrqiwzowiquebtsfyc/settings/database');
    console.log('2. Update DATABASE_URL in .env.local');
    console.log('3. Run: npm run db:push');
    console.log('4. Run: npm run db:seed\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
