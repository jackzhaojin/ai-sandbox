#!/usr/bin/env node
/**
 * Final verification of postal_v2 schema
 */

const { Pool } = require('pg');

const connectionString = 'postgresql://postgres.lmbrqiwzowiquebtsfyc:miwha4fPanQZ6BL9@aws-1-us-east-2.pooler.supabase.com:6543/postgres';
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function finalCheck() {
  const client = await pool.connect();
  try {
    console.log('=== FINAL SCHEMA VERIFICATION ===\n');
    
    // Check all required tables from task spec
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
    
    console.log('Checking required tables from task spec:');
    let allFound = true;
    for (const table of requiredTables) {
      const result = await client.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'postal_v2' AND table_name = '${table}')`);
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
      if (!exists) allFound = false;
    }
    
    // Summary counts
    const tables = await client.query("SELECT COUNT(*) as c FROM information_schema.tables WHERE table_schema = 'postal_v2'");
    const indexes = await client.query("SELECT COUNT(*) as c FROM pg_indexes WHERE schemaname = 'postal_v2'");
    const fks = await client.query("SELECT COUNT(*) as c FROM information_schema.table_constraints WHERE constraint_schema = 'postal_v2' AND constraint_type = 'FOREIGN KEY'");
    const rls = await client.query("SELECT COUNT(*) as c FROM pg_policies WHERE schemaname = 'postal_v2'");
    
    console.log('\n=== SUMMARY ===');
    console.log(`Tables: ${tables.rows[0].c}`);
    console.log(`Indexes: ${indexes.rows[0].c}`);
    console.log(`Foreign Keys: ${fks.rows[0].c}`);
    console.log(`RLS Policies: ${rls.rows[0].c}`);
    console.log(`\n${allFound ? '✅ All required tables present - Schema setup complete' : '❌ Some tables missing'}`);
    
    process.exit(allFound ? 0 : 1);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

finalCheck();
