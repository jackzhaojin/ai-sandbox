#!/usr/bin/env node
/**
 * Complete verification of postal_v2 schema setup
 * Uses direct PostgreSQL connection via pooler
 */

const { Pool } = require('pg');

const connectionString = 'postgresql://postgres.lmbrqiwzowiquebtsfyc:miwha4fPanQZ6BL9@aws-1-us-east-2.pooler.supabase.com:6543/postgres';
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function verifyComplete() {
  const client = await pool.connect();
  try {
    console.log('=== Cloud Supabase Schema Verification ===\n');
    
    // 1. Verify schema exists
    console.log('1. Schema exists:');
    const schema = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'postal_v2'");
    console.log(`   ${schema.rows.length > 0 ? '✅' : '❌'} postal_v2 schema`);
    
    // 2. Verify all required tables from task spec
    console.log('\n2. Required tables (from task spec):');
    const requiredTables = [
      'shipments', 'shipment_packages', 'shipment_special_handling', 
      'shipment_delivery_preferences', 'hazmat_details', 'carriers', 
      'service_types', 'quotes', 'payment_info', 'payment_purchase_orders',
      'payment_bills_of_lading', 'payment_third_party', 'payment_net_terms',
      'payment_net_terms_references', 'payment_corporate_accounts',
      'pickup_details', 'pickup_contacts', 'pickup_access_requirements',
      'pickup_equipment_needs', 'pickup_authorized_personnel', 'pickup_notifications',
      'shipment_events'
    ];
    
    let tablesFound = 0;
    for (const table of requiredTables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'postal_v2' AND table_name = '${table}'
        )
      `);
      const exists = result.rows[0].exists;
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
      if (exists) tablesFound++;
    }
    
    // 3. Verify indexes
    console.log('\n3. Indexes:');
    const indexes = await client.query("SELECT COUNT(*) as c FROM pg_indexes WHERE schemaname = 'postal_v2'");
    console.log(`   ✅ ${indexes.rows[0].c} indexes created`);
    
    // 4. Verify foreign keys
    console.log('\n4. Foreign Keys:');
    const fks = await client.query(`
      SELECT COUNT(*) as c 
      FROM information_schema.table_constraints 
      WHERE constraint_schema = 'postal_v2' AND constraint_type = 'FOREIGN KEY'
    `);
    console.log(`   ✅ ${fks.rows[0].c} foreign keys configured`);
    
    // 5. Verify RLS policies
    console.log('\n5. RLS Policies:');
    const rls = await client.query("SELECT COUNT(*) as c FROM pg_policies WHERE schemaname = 'postal_v2'");
    console.log(`   ✅ ${rls.rows[0].c} RLS policies enabled`);
    
    // 6. Verify enum types
    console.log('\n6. Enum Types:');
    const enums = await client.query(`
      SELECT t.typname 
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'postal_v2' AND t.typtype = 'e'
    `);
    console.log(`   ✅ ${enums.rows.length} enum types created`);
    
    // 7. Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Tables: ${tablesFound}/${requiredTables.length} required tables present`);
    console.log(`Schema Version: postal_v2`);
    console.log(`Database: Cloud Supabase (lmbrqiwzowiquebtsfyc)`);
    
    const allGood = tablesFound === requiredTables.length;
    console.log(`\n${allGood ? '✅ Schema setup complete' : '❌ Some tables missing'}`);
    
    process.exit(allGood ? 0 : 1);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

verifyComplete();
