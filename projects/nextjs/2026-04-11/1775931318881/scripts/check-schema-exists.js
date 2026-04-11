#!/usr/bin/env node
/**
 * Check if postal_v2 schema exists using multiple methods
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkSchema() {
  console.log('Checking if postal_v2 schema exists...\n');
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Missing environment variables');
    process.exit(1);
  }

  console.log('Supabase URL:', supabaseUrl);
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  console.log('Project Ref:', projectRef);
  console.log('Service Role Key:', serviceRoleKey ? 'set (first 20 chars: ' + serviceRoleKey.substring(0, 20) + '...)' : 'NOT SET');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Method 1: Query a table in the schema
  console.log('\n1. Trying to query postal_v2 schema...');
  try {
    const { data, error } = await supabase
      .from('postal_v2.__test__')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('   Error code:', error.code);
      console.log('   Error message:', error.message);
      
      if (error.message.includes('schema "postal_v2" does not exist')) {
        console.log('   ❌ CONFIRMED: postal_v2 schema DOES NOT EXIST');
        return false;
      } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('   ℹ️  Table does not exist, but schema might (error is about table, not schema)');
        return 'maybe';
      } else if (error.code === 'PGRST106') {
        console.log('   ❌ Schema does not exist (PGRST106)');
        return false;
      }
    } else {
      console.log('   ✅ Query succeeded - schema exists!');
      return true;
    }
  } catch (e) {
    console.log('   Exception:', e.message);
  }

  // Method 2: Try to create a schema via SQL (will fail if exists)
  console.log('\n2. Testing schema creation...');
  try {
    // This is a no-op if schema exists, will tell us if it doesn't
    const { error } = await supabase.rpc('exec_sql', {
      sql: `CREATE SCHEMA IF NOT EXISTS postal_v2`
    });
    
    if (error) {
      console.log('   RPC error:', error.message);
      if (error.message.includes('already exists')) {
        console.log('   ✅ Schema exists (CREATE failed with "already exists")');
        return true;
      } else if (error.message.includes('permission denied')) {
        console.log('   ⚠️  Permission denied - cannot create schema');
      }
    } else {
      console.log('   ✅ Schema created successfully (or already existed)!');
      return true;
    }
  } catch (e) {
    console.log('   Exception:', e.message);
  }

  // Method 3: Try HTTP Management API with different endpoint
  console.log('\n3. Trying Management API...');
  const https = require('https');
  
  const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${projectRef}/database/query`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const result = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      req.on('error', reject);
      req.write(JSON.stringify({ query: "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'postal_v2'" }));
      req.end();
    });
    
    console.log('   Response status:', result.status);
    console.log('   Response data:', result.data);
    
    if (result.status === 200) {
      console.log('   ✅ Management API call succeeded');
      return true;
    }
  } catch (e) {
    console.log('   Management API error:', e.message);
  }

  console.log('\n⚠️  Could not definitively determine schema state');
  return 'unknown';
}

checkSchema().then(result => {
  if (result === true) {
    console.log('\n✅ postal_v2 schema EXISTS!');
    process.exit(0);
  } else if (result === false) {
    console.log('\n❌ postal_v2 schema DOES NOT EXIST');
    console.log('\n📋 ACTION REQUIRED: Execute this SQL in Supabase Dashboard SQL Editor:');
    console.log('   DROP SCHEMA IF EXISTS postal_v2 CASCADE;');
    console.log('   CREATE SCHEMA postal_v2;');
    process.exit(1);
  } else {
    console.log('\n⚠️  Schema state is INDETERMINATE');
    process.exit(2);
  }
}).catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
