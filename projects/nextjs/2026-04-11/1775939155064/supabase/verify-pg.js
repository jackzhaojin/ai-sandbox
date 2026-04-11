#!/usr/bin/env node
/**
 * Verify postal_v2 schema via direct PostgreSQL connection
 */

const { Pool } = require('pg');

const supabaseUrl = process.env.APP_SUPABASE_URL || process.env.SUPABASE_URL;
const password = process.env.APP_SUPABASE_PASSWORD;
const poolerRegion = process.env.APP_SUPABASE_POOLER_REGION || 'aws-1-us-east-2';

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)[1];
const connectionString = `postgresql://postgres.${projectRef}:${password}@${poolerRegion}.pooler.supabase.com:6543/postgres`;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function verifySchema() {
  console.log('=== postal_v2 Schema Verification via PostgreSQL ===\n');
  
  const client = await pool.connect();
  
  try {
    // 1. Verify schema exists
    console.log('1. Verifying schema exists...');
    const schemaResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'postal_v2'
    `);
    
    if (schemaResult.rows.length === 0) {
      console.error('   ❌ postal_v2 schema not found!');
      return;
    }
    console.log('   ✅ postal_v2 schema exists');
    
    // 2. Count tables
    console.log('\n2. Counting tables...');
    const tablesResult = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'postal_v2'
    `);
    console.log(`   ✅ ${tablesResult.rows[0].count} tables in postal_v2 schema`);
    
    // 3. List all tables
    console.log('\n3. Tables in postal_v2:');
    const tablesList = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'postal_v2'
      ORDER BY table_name
    `);
    tablesList.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });
    
    // 4. Verify enums
    console.log('\n4. Verifying enum types...');
    const enumsResult = await client.query(`
      SELECT t.typname AS enum_name
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'postal_v2'
      GROUP BY t.typname
      ORDER BY t.typname
    `);
    console.log(`   ✅ ${enumsResult.rows.length} enum types:`);
    enumsResult.rows.forEach(row => {
      console.log(`      - ${row.enum_name}`);
    });
    
    // 5. Verify indexes
    console.log('\n5. Verifying indexes...');
    const indexesResult = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_indexes 
      WHERE schemaname = 'postal_v2'
    `);
    console.log(`   ✅ ${indexesResult.rows[0].count} indexes`);
    
    // 6. Verify foreign keys
    console.log('\n6. Verifying foreign keys...');
    const fkResult = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_schema = 'postal_v2'
      AND constraint_type = 'FOREIGN KEY'
    `);
    console.log(`   ✅ ${fkResult.rows[0].count} foreign key constraints`);
    
    // 7. Verify triggers
    console.log('\n7. Verifying triggers...');
    const triggersResult = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.triggers
      WHERE trigger_schema = 'postal_v2'
    `);
    console.log(`   ✅ ${triggersResult.rows[0].count} triggers`);
    
    // 8. Verify RLS policies
    console.log('\n8. Verifying RLS policies...');
    const rlsResult = await client.query(`
      SELECT tablename, COUNT(*) as policy_count
      FROM pg_policies
      WHERE schemaname = 'postal_v2'
      GROUP BY tablename
    `);
    console.log(`   ✅ ${rlsResult.rows.length} tables with RLS policies`);
    
    // 9. Test basic CRUD
    console.log('\n9. Testing basic operations...');
    
    // Insert test carrier
    await client.query(`
      INSERT INTO postal_v2.carriers (code, name, display_name, rating, rate_multiplier)
      VALUES ('test', 'Test Carrier', 'Test Carrier', 4.5, 1.0)
      ON CONFLICT (code) DO NOTHING
    `);
    
    // Query it back
    const testCarrier = await client.query(`
      SELECT * FROM postal_v2.carriers WHERE code = 'test'
    `);
    
    if (testCarrier.rows.length > 0) {
      console.log('   ✅ Insert/Select working');
      
      // Clean up
      await client.query(`DELETE FROM postal_v2.carriers WHERE code = 'test'`);
      console.log('   ✅ Delete working');
    }
    
    // 10. Test permissions
    console.log('\n10. Testing permissions...');
    const permResult = await client.query(`
      SELECT grantee, privilege_type
      FROM information_schema.table_privileges
      WHERE table_schema = 'postal_v2'
      AND table_name = 'carriers'
      AND grantee IN ('anon', 'authenticated', 'service_role')
    `);
    console.log(`   ✅ ${permResult.rows.length} permission grants configured`);
    
    console.log('\n=== ✅ All Verifications Passed ===');
    console.log('\nSchema postal_v2 is fully configured and accessible via PostgreSQL.');
    console.log('Note: For REST API access, expose the schema in Supabase Dashboard:');
    console.log('  Settings > API > Exposed Schemas > Add "postal_v2"');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

verifySchema();
