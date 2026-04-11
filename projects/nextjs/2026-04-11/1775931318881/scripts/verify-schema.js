#!/usr/bin/env node
/**
 * Verify postal_v2 schema exists and is accessible
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifySchema() {
  console.log('Verifying postal_v2 schema...\n');
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Test 1: Try to create a table in the schema
  console.log('1. Testing schema write access...');
  try {
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS postal_v2._verification_test (id serial PRIMARY KEY, created_at timestamptz DEFAULT now())`
    });
    
    if (createError) {
      console.log('   ℹ️  exec_sql not available:', createError.message);
      console.log('   ℹ️  Trying direct table creation via REST...');
      
      // Try a different approach - just check if we can query the schema
      const { error: queryError } = await supabase
        .from('postal_v2._verification_test')
        .select('*')
        .limit(1);
      
      if (queryError && queryError.message.includes('does not exist')) {
        console.log('   ℹ️  Cannot verify - table does not exist and cannot create via RPC');
      } else if (queryError && queryError.code === 'PGRST106') {
        console.log('   ❌ Schema does not exist or is not accessible');
        return false;
      } else {
        console.log('   ✅ Schema appears to exist (query executed)');
      }
    } else {
      console.log('   ✅ Successfully created test table in postal_v2 schema!');
      
      // Clean up
      await supabase.rpc('exec_sql', {
        sql: `DROP TABLE IF EXISTS postal_v2._verification_test`
      });
      console.log('   ✅ Cleaned up test table');
      return true;
    }
  } catch (e) {
    console.log('   ℹ️  Test failed:', e.message);
  }

  // Test 2: Try to list schemas (might not work via REST)
  console.log('\n2. Checking schema via pg_catalog...');
  try {
    const { data, error } = await supabase
      .from('pg_catalog.pg_namespace')
      .select('nspname')
      .eq('nspname', 'postal_v2');
    
    if (error) {
      console.log('   ℹ️  Cannot query pg_catalog:', error.message);
    } else if (data && data.length > 0) {
      console.log('   ✅ postal_v2 schema found in pg_catalog!');
      return true;
    } else {
      console.log('   ℹ️  postal_v2 schema not found in pg_catalog');
    }
  } catch (e) {
    console.log('   ℹ️  Could not check pg_catalog:', e.message);
  }

  // Test 3: Direct SQL via a simple query that only works if schema exists
  console.log('\n3. Attempting direct schema test...');
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', { sql: `SELECT 1 FROM pg_namespace WHERE nspname = 'postal_v2'` });
    
    if (!error && data) {
      console.log('   ✅ Schema verified via SQL query!');
      return true;
    }
  } catch (e) {
    console.log('   ℹ️  Cannot execute verification SQL:', e.message);
  }

  console.log('\n⚠️  Could not definitively verify schema existence.');
  console.log('   The schema may exist but cannot be verified via REST API.');
  return null; // Unknown state
}

verifySchema().then(result => {
  if (result === true) {
    console.log('\n✅ postal_v2 schema EXISTS and is accessible!');
    process.exit(0);
  } else if (result === false) {
    console.log('\n❌ postal_v2 schema does NOT exist!');
    process.exit(1);
  } else {
    console.log('\n⚠️  Schema state UNKNOWN - requires manual verification');
    process.exit(2);
  }
}).catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
