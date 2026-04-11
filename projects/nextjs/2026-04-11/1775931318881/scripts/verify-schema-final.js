#!/usr/bin/env node
/**
 * Final verification that postal_v2 schema exists
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifySchemaFinal() {
  console.log('Final verification of postal_v2 schema...\n');
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // The definitive test: Can we create a table in the postal_v2 schema?
  console.log('Testing schema by attempting operations...');
  
  // Method 1: Try to create a table using the REST API
  // The REST API doesn't support CREATE TABLE, but we can try to detect schema existence
  // by the error message we get
  
  console.log('\n1. Analyzing error messages for schema clues...');
  const testTableName = `_schema_verify_${Date.now()}`;
  
  try {
    // This will fail, but the error tells us if schema exists
    const { error } = await supabase
      .from(`postal_v2.${testTableName}`)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('   Error code:', error.code);
      console.log('   Error message:', error.message);
      
      // Parse error message for clues
      const msg = error.message.toLowerCase();
      
      if (msg.includes('schema') && msg.includes('does not exist')) {
        console.log('\n   ❌ CONFIRMED: postal_v2 schema DOES NOT EXIST');
        return false;
      }
      
      if (msg.includes('relation') && msg.includes('does not exist')) {
        // This means the schema exists but table doesn't - this is expected!
        if (msg.includes('postal_v2')) {
          console.log('\n   ✅ Schema likely EXISTS (error is about missing table, not missing schema)');
          return true;
        }
      }
      
      if (error.code === 'PGRST106') {
        console.log('\n   ❌ Schema does not exist (PGRST106)');
        return false;
      }
      
      if (error.code === 'PGRST205') {
        console.log('\n   ℹ️  PGRST205: Could not find table in schema cache');
        console.log('   This usually means the schema exists but is empty/no tables');
        return 'maybe';
      }
    }
  } catch (e) {
    console.log('   Exception:', e.message);
  }

  // Method 2: Try to use the SQL API (if available on this project)
  console.log('\n2. Trying direct SQL execution...');
  try {
    const sqlTest = await new Promise((resolve) => {
      const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
      const options = {
        hostname: `${projectRef}.supabase.co`,
        path: '/rest/v1/rpc/exec_sql',
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, data });
        });
      });
      
      req.on('error', () => resolve({ status: 0, data: null }));
      req.write(JSON.stringify({ sql: "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'postal_v2'" }));
      req.end();
    });
    
    console.log('   SQL API status:', sqlTest.status);
    if (sqlTest.status === 200) {
      console.log('   SQL API response:', sqlTest.data);
    }
  } catch (e) {
    console.log('   SQL API error:', e.message);
  }

  console.log('\n⚠️  Could not definitively verify schema state');
  return 'unknown';
}

verifySchemaFinal().then(result => {
  if (result === true) {
    console.log('\n✅ postal_v2 schema EXISTS');
    process.exit(0);
  } else if (result === false) {
    console.log('\n❌ postal_v2 schema DOES NOT EXIST');
    console.log('\nThe migration was applied but schema creation may have been skipped.');
    console.log('Please execute the following SQL in Supabase Dashboard:');
    console.log('  DROP SCHEMA IF EXISTS postal_v2 CASCADE;');
    console.log('  CREATE SCHEMA postal_v2;');
    process.exit(1);
  } else {
    console.log('\n⚠️  Schema state UNKNOWN - manual verification needed');
    process.exit(2);
  }
}).catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
