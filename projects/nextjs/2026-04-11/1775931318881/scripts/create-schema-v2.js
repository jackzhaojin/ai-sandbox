#!/usr/bin/env node
/**
 * Create postal_v2 schema in cloud Supabase using REST API
 */

const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lmbrqiwzowiquebtsfyc.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtYnJxaXd6b3dpcXVlYnRzZnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE1NzE0MSwiZXhwIjoyMDg1NzMzMTQxfQ.qChh00-7bA2FrK_VTdC5QH9pILiUH9OpQQe8PE2IaKg';

async function makeRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, supabaseUrl);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createSchema() {
  console.log('Connecting to Supabase...');
  console.log('URL:', supabaseUrl);

  // Try creating schema via pg REST API
  const createSchemaSQL = 'DROP SCHEMA IF EXISTS postal_v2 CASCADE; CREATE SCHEMA postal_v2;';
  
  try {
    // First check if we can query information_schema
    const checkResult = await makeRequest('/rest/v1/' + encodeURIComponent('information_schema.schemata') + '?select=schema_name&schema_name=eq.postal_v2'), 'GET');
    console.log('Schema check result:', checkResult.status, checkResult.data);
    
    // Try to create the schema using the pg_execute function if available
    const result = await makeRequest('/rest/v1/rpc/pg_execute', 'POST', {
      command: createSchemaSQL
    });
    console.log('pg_execute result:', result.status, result.data);
    
    if (result.status === 200) {
      console.log('✅ postal_v2 schema created successfully!');
    } else {
      console.log('pg_execute not available, trying alternative methods...');
      
      // Check what RPC functions are available
      const rpcResult = await makeRequest('/rest/v1/rpc/', 'GET');
      console.log('Available RPC:', rpcResult.data.substring(0, 500));
      
      console.log('\n⚠️  Automatic schema creation requires pg_execute RPC function.');
      console.log('Please run the following SQL in Supabase Dashboard SQL Editor:');
      console.log('\n---');
      console.log(createSchemaSQL);
      console.log('---\n');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createSchema().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
