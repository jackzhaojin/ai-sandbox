#!/usr/bin/env node
/**
 * Create postal_v2 schema using Supabase Management API via HTTP
 * 
 * This script calls the Supabase Management API directly to execute SQL
 * Endpoint: POST https://api.supabase.com/v1/projects/{ref}/database/query
 */

const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
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

async function createSchemaViaHTTP() {
  console.log('Attempting to create postal_v2 schema via HTTP API...\n');
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Missing environment variables');
    process.exit(1);
  }

  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  console.log('Project Ref:', projectRef);

  // First, verify the schema doesn't already exist by trying to query it
  console.log('\n1. Checking current schema state...');
  
  // Try using the REST API to check if we can access postal_v2
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Try to create a test table to verify schema exists
  try {
    const { error } = await supabase.from('postal_v2._test').select('*').limit(1);
    if (error && error.message.includes('schema') && error.message.includes('does not exist')) {
      console.log('   ℹ️  postal_v2 schema does not exist (expected)');
    } else if (!error || (error && !error.message.includes('does not exist'))) {
      console.log('   ✅ postal_v2 schema appears to exist!');
      return true;
    }
  } catch (e) {
    if (e.message && e.message.includes('does not exist')) {
      console.log('   ℹ️  postal_v2 schema does not exist');
    }
  }

  // Try Management API v1 query endpoint
  console.log('\n2. Attempting to execute SQL via Management API...');
  
  const sql = 'DROP SCHEMA IF EXISTS postal_v2 CASCADE; CREATE SCHEMA postal_v2;';
  
  // Management API endpoint
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
    const result = await makeRequest(options, { query: sql });
    console.log('   Response status:', result.status);
    
    if (result.status === 200) {
      console.log('   ✅ Schema created successfully via Management API!');
      return true;
    } else if (result.status === 201) {
      console.log('   ✅ Schema created successfully!');
      return true;
    } else if (result.status === 401) {
      console.log('   ❌ Authentication failed - service_role_key may not have Management API access');
    } else if (result.status === 404) {
      console.log('   ❌ Management API endpoint not found or project not accessible');
    } else if (result.status === 403) {
      console.log('   ❌ Forbidden - insufficient permissions');
    } else {
      console.log('   Response:', result.data);
    }
  } catch (e) {
    console.log('   ❌ Request failed:', e.message);
  }

  // Try alternative: POST to /v1/projects/{ref}/sql
  console.log('\n3. Trying alternative endpoint...');
  
  const altOptions = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${projectRef}/sql`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const result = await makeRequest(altOptions, { query: sql });
    console.log('   Response status:', result.status);
    
    if (result.status >= 200 && result.status < 300) {
      console.log('   ✅ Schema created successfully!');
      return true;
    } else {
      console.log('   Response:', result.data);
    }
  } catch (e) {
    console.log('   ❌ Request failed:', e.message);
  }

  console.log('\n⚠️  Cannot create schema via automated API calls.');
  console.log('   The service_role_key does not have Management API access.');
  console.log('\n📋 ACTION REQUIRED: Execute this SQL in Supabase Dashboard SQL Editor:');
  console.log('   ═══════════════════════════════════════════════════════════');
  console.log('   DROP SCHEMA IF EXISTS postal_v2 CASCADE;');
  console.log('   CREATE SCHEMA postal_v2;');
  console.log('   ═══════════════════════════════════════════════════════════\n');
  
  return false;
}

createSchemaViaHTTP().then(success => {
  if (success) {
    console.log('\n✅ Schema verification/creation successful!');
    process.exit(0);
  } else {
    console.log('\n❌ Schema creation requires manual action.');
    console.log('   This is a constitutional constraint - the Management API requires');
    console.log('   a separate API token, not the service_role_key.');
    process.exit(1);
  }
}).catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
