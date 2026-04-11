#!/usr/bin/env node
/**
 * Create postal_v2 schema using Supabase Management API
 * 
 * This script uses the Supabase Management API to execute SQL
 * The Management API allows DDL operations that the REST API blocks
 */

const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function makeRequest(hostname, path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createSchemaViaManagementAPI() {
  console.log('Attempting to create postal_v2 schema...\n');
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Missing environment variables');
    console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'NOT SET');
    console.error('  SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'set' : 'NOT SET');
    process.exit(1);
  }

  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  console.log('Project Ref:', projectRef);

  // First, check if schema already exists using the REST API
  console.log('\n1. Checking if postal_v2 schema exists...');
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Try to query information_schema (may not work via REST)
  try {
    // Try executing raw SQL via the sql() method if available
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'postal_v2'`
    });
    
    if (!error && data) {
      console.log('   Schema check result:', data);
      if (data.length > 0) {
        console.log('   ✅ postal_v2 schema already exists!');
        return true;
      }
    }
  } catch (e) {
    console.log('   ℹ️  Could not check via RPC (expected):', e.message);
  }

  // Try direct REST query to check schema
  console.log('\n2. Attempting to verify schema via alternative method...');
  try {
    const { data, error } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .eq('schema_name', 'postal_v2');
    
    if (!error && data && data.length > 0) {
      console.log('   ✅ postal_v2 schema exists!');
      return true;
    }
    console.log('   ℹ️  Schema not found via REST (expected - information_schema may not be exposed)');
  } catch (e) {
    console.log('   ℹ️  Could not query information_schema:', e.message);
  }

  // Try creating schema via the pg_net extension or direct SQL
  console.log('\n3. Attempting to create schema...');
  try {
    // Try using exec_sql RPC if available
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'DROP SCHEMA IF EXISTS postal_v2 CASCADE; CREATE SCHEMA postal_v2;'
    });
    
    if (error) {
      console.log('   ℹ️  exec_sql RPC not available:', error.message);
    } else {
      console.log('   ✅ Schema created via exec_sql RPC!');
      return true;
    }
  } catch (e) {
    console.log('   ℹ️  exec_sql RPC failed:', e.message);
  }

  // Final verification attempt - try to create a test table in the schema
  console.log('\n4. Testing schema access by attempting table creation...');
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS postal_v2._schema_verification (id serial PRIMARY KEY); DROP TABLE postal_v2._schema_verification;`
    });
    
    if (!error) {
      console.log('   ✅ postal_v2 schema exists and is writable!');
      return true;
    }
    console.log('   ℹ️  Could not verify schema via table test:', error.message);
  } catch (e) {
    console.log('   ℹ️  Table test failed:', e.message);
  }

  console.log('\n⚠️  Cannot automatically verify/create schema via REST API.');
  console.log('   DDL operations are blocked by Supabase REST API for security.');
  console.log('\n📋 ACTION REQUIRED: Execute this SQL in Supabase Dashboard SQL Editor:');
  console.log('   ═══════════════════════════════════════════════════════════');
  console.log('   DROP SCHEMA IF EXISTS postal_v2 CASCADE;');
  console.log('   CREATE SCHEMA postal_v2;');
  console.log('   ═══════════════════════════════════════════════════════════\n');
  
  return false;
}

createSchemaViaManagementAPI().then(success => {
  if (success) {
    console.log('\n✅ Schema verification/creation successful!');
    process.exit(0);
  } else {
    console.log('\n❌ Schema verification requires manual action.');
    console.log('   This is a known limitation of the Supabase REST API.');
    process.exit(1);
  }
}).catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
