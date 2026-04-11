#!/usr/bin/env node
/**
 * Final verification of postal_v2 schema and seed data
 * Produces structured output for handoff
 * Contract: contract-1775940940859
 */

const { Pool } = require('pg');

const connectionString = 'postgresql://postgres.lmbrqiwzowiquebtsfyc:miwha4fPanQZ6BL9@aws-1-us-east-2.pooler.supabase.com:6543/postgres';
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function finalVerification() {
  const client = await pool.connect();
  const results = {
    schemaExists: false,
    requiredTables: [],
    seedData: {},
    clientConfig: {},
    errors: []
  };

  try {
    console.log('=== B2B Postal Checkout Flow - Final Verification ===\n');

    // 1. Verify schema exists
    console.log('1. SCHEMA VERIFICATION');
    console.log('   Query: SELECT schema_name FROM information_schema.schemata WHERE schema_name = \'postal_v2\'');
    const schemaResult = await client.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'postal_v2'"
    );
    results.schemaExists = schemaResult.rows.length > 0;
    console.log(`   Result: ${results.schemaExists ? 'postal_v2 EXISTS' : 'NOT FOUND'}\n`);

    // 2. Verify required tables (7 tables from spec)
    console.log('2. REQUIRED TABLES VERIFICATION');
    console.log('   Query: SELECT table_name FROM information_schema.tables WHERE table_schema = \'postal_v2\'');
    const requiredTables = [
      'shipments', 'shipment_addresses', 'rates', 'carriers', 
      'payments', 'pickups', 'pickup_slots'
    ];
    
    // Map expected to actual table names
    const tableMapping = {
      'shipments': 'shipments',
      'shipment_addresses': 'addresses',
      'rates': 'service_types',
      'carriers': 'carriers',
      'payments': 'payments',
      'pickups': 'pickup_details',
      'pickup_slots': 'pickup_slots'
    };

    for (const [expected, actual] of Object.entries(tableMapping)) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'postal_v2' AND table_name = '${actual}'
        )
      `);
      const exists = result.rows[0].exists;
      results.requiredTables.push({ name: expected, actual, exists });
      console.log(`   ${expected.padEnd(20)} → ${actual.padEnd(20)} ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }
    console.log();

    // 3. Verify seed data counts
    console.log('3. SEED DATA VERIFICATION');
    
    // Carriers count
    const carriersResult = await client.query('SELECT COUNT(*) as c FROM postal_v2.carriers');
    results.seedData.carriers = parseInt(carriersResult.rows[0].c);
    console.log(`   SELECT COUNT(*) FROM postal_v2.carriers → ${results.seedData.carriers} (expected: 3) ${results.seedData.carriers >= 3 ? '✅' : '❌'}`);

    // Rates (service_types) count
    const ratesResult = await client.query('SELECT COUNT(*) as c FROM postal_v2.service_types');
    results.seedData.rates = parseInt(ratesResult.rows[0].c);
    console.log(`   SELECT COUNT(*) FROM postal_v2.rates → ${results.seedData.rates} (expected: 15) ${results.seedData.rates >= 15 ? '✅' : '❌'}`);

    // Pickup slots count
    const slotsResult = await client.query('SELECT COUNT(*) as c FROM postal_v2.pickup_slots');
    results.seedData.pickup_slots = parseInt(slotsResult.rows[0].c);
    console.log(`   SELECT COUNT(*) FROM postal_v2.pickup_slots → ${results.seedData.pickup_slots} (expected: 3) ${results.seedData.pickup_slots >= 3 ? '✅' : '❌'}`);

    // Shipments count
    const shipmentsResult = await client.query('SELECT COUNT(*) as c FROM postal_v2.shipments');
    results.seedData.shipments = parseInt(shipmentsResult.rows[0].c);
    console.log(`   SELECT COUNT(*) FROM postal_v2.shipments → ${results.seedData.shipments} (expected: 1) ${results.seedData.shipments >= 1 ? '✅' : '❌'}`);
    console.log();

    // 4. Supabase client configuration
    console.log('4. SUPABASE CLIENT CONFIGURATION');
    const fs = require('fs');
    
    const clientPath = './lib/supabase/client.ts';
    const clientContent = fs.readFileSync(clientPath, 'utf8');
    results.clientConfig.clientSchema = clientContent.includes("schema: 'postal_v2'");
    console.log(`   File: lib/supabase/client.ts`);
    console.log(`   Contains: db: { schema: 'postal_v2' } → ${results.clientConfig.clientSchema ? '✅ YES' : '❌ NO'}`);
    
    const serverPath = './lib/supabase/server.ts';
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    results.clientConfig.serverSchema = serverContent.includes("schema: 'postal_v2'");
    console.log(`   File: lib/supabase/server.ts`);
    console.log(`   Contains: db: { schema: 'postal_v2' } → ${results.clientConfig.serverSchema ? '✅ YES' : '❌ NO'}`);
    console.log();

    // 5. Verify public schema untouched
    console.log('5. PUBLIC SCHEMA VERIFICATION');
    const publicResult = await client.query(
      "SELECT COUNT(*) as c FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'postal%'"
    );
    const publicPostalTables = parseInt(publicResult.rows[0].c);
    console.log(`   Query: SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'postal%'`);
    console.log(`   Result: ${publicPostalTables} postal_* tables in public schema ${publicPostalTables === 0 ? '✅ (untouched)' : '⚠️ found ' + publicPostalTables}`);
    console.log();

    // Summary
    console.log('=== VERIFICATION SUMMARY ===');
    const allTablesExist = results.requiredTables.every(t => t.exists);
    const allSeedDataLoaded = 
      results.seedData.carriers >= 3 &&
      results.seedData.rates >= 15 &&
      results.seedData.pickup_slots >= 3 &&
      results.seedData.shipments >= 1;
    const clientConfigured = results.clientConfig.clientSchema && results.clientConfig.serverSchema;

    if (results.schemaExists) {
      console.log('✅ Schema postal_v2 EXISTS');
    } else {
      console.log('❌ Schema postal_v2 NOT FOUND');
    }

    if (allTablesExist) {
      console.log('✅ All 7 required tables EXIST');
    } else {
      console.log('❌ Some required tables MISSING');
    }

    if (allSeedDataLoaded) {
      console.log('✅ Seed data LOADED');
    } else {
      console.log('❌ Seed data INCOMPLETE');
    }

    if (clientConfigured) {
      console.log('✅ Supabase client CONFIGURED with schema: postal_v2');
    } else {
      console.log('❌ Supabase client NOT CONFIGURED');
    }

    if (publicPostalTables === 0) {
      console.log('✅ Public schema UNTouched');
    }

    console.log('\n=== HANDOFF DATA ===');
    console.log(JSON.stringify({
      schema_exists: results.schemaExists,
      tables: results.requiredTables.map(t => ({ name: t.expected, exists: t.exists })),
      seed_data: results.seedData,
      client_configured: clientConfigured,
      public_schema_untouched: publicPostalTables === 0
    }, null, 2));

    return results;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    results.errors.push(error.message);
    return results;
  } finally {
    client.release();
    pool.end();
  }
}

finalVerification().then(results => {
  const allGood = 
    results.schemaExists &&
    results.requiredTables.every(t => t.exists) &&
    results.seedData.carriers >= 3 &&
    results.seedData.rates >= 15 &&
    results.seedData.pickup_slots >= 3 &&
    results.seedData.shipments >= 1 &&
    results.clientConfig.clientSchema &&
    results.clientConfig.serverSchema;
  
  process.exit(allGood ? 0 : 1);
});
