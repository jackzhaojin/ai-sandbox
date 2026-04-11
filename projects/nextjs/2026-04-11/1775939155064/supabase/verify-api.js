#!/usr/bin/env node
/**
 * Verify Supabase REST API access with postal_v2 schema
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifyApi() {
  console.log('=== Supabase REST API Verification ===\n');
  
  // Test 1: Basic connectivity
  console.log('1. Testing basic connectivity...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    console.log(`   ✅ API responds (status: ${response.status})`);
  } catch (error) {
    console.error('   ❌ API connection failed:', error.message);
    return;
  }
  
  // Test 2: Schema access with service role
  console.log('\n2. Testing postal_v2 schema access (service role)...');
  const serverClient = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: 'postal_v2' },
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  try {
    const { data: carriers, error } = await serverClient
      .from('carriers')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    console.log(`   ✅ Carriers table accessible (${carriers.length} rows)`);
  } catch (error) {
    console.error('   ❌ Schema access failed:', error.message);
  }
  
  // Test 3: Test key tables
  console.log('\n3. Testing key tables...');
  const tablesToTest = [
    'organizations',
    'users',
    'addresses', 
    'shipments',
    'quotes',
    'payments',
    'pickup_slots',
    'pickup_details',
    'payment_info'
  ];
  
  for (const table of tablesToTest) {
    try {
      const { data, error } = await serverClient
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ⚠️  ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: accessible`);
      }
    } catch (error) {
      console.error(`   ❌ ${table}: ${error.message}`);
    }
  }
  
  // Test 4: Test enums
  console.log('\n4. Verifying enum types...');
  try {
    const { data, error } = await serverClient.rpc('exec_sql', {
      sql_query: `
        SELECT t.typname AS enum_name
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'postal_v2' AND t.typtype = 'e'
      `
    });
    
    if (error) {
      console.log('   ℹ️  Enum verification skipped (exec_sql not available)');
    } else {
      console.log(`   ✅ ${data?.length || 0} enum types in postal_v2`);
    }
  } catch (error) {
    console.log('   ℹ️  Enum verification skipped');
  }
  
  // Test 5: Verify RLS policies are in place
  console.log('\n5. Checking RLS policies...');
  try {
    const { data, error } = await serverClient.rpc('exec_sql', {
      sql_query: `
        SELECT tablename, count(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'postal_v2'
        GROUP BY tablename
      `
    });
    
    if (error) {
      console.log('   ℹ️  RLS verification skipped (exec_sql not available)');
    } else {
      console.log(`   ✅ ${data?.length || 0} tables with RLS policies`);
    }
  } catch (error) {
    console.log('   ℹ️  RLS verification skipped');
  }
  
  console.log('\n=== Verification Complete ===');
}

verifyApi().catch(console.error);
