#!/usr/bin/env node
/**
 * Create postal_v2 schema in cloud Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

async function createSchema() {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('Connecting to Supabase...');
  console.log('URL:', supabaseUrl);

  // Try a simple health check first
  const { data: health, error: healthError } = await supabase.from('shipments').select('count', { count: 'exact', head: true });
  
  if (healthError) {
    console.log('Note: shipments table does not exist yet (expected)');
  } else {
    console.log('Connected to Supabase successfully!');
  }
  
  // Try to create schema using raw SQL via the SQL API
  const sqlQuery = 'DROP SCHEMA IF EXISTS postal_v2 CASCADE; CREATE SCHEMA postal_v2;';
  
  try {
    // Using Supabase Management API or direct SQL execution
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({ sql: sqlQuery })
    });
    
    if (response.ok) {
      console.log('✅ postal_v2 schema created successfully!');
    } else {
      const errorText = await response.text();
      console.log('RPC exec_sql not available:', errorText);
      console.log('\n⚠️  Manual schema creation required.');
      console.log('Please run the following SQL in Supabase Dashboard SQL Editor:');
      console.log('\n---');
      console.log(sqlQuery);
      console.log('---\n');
    }
  } catch (err) {
    console.error('Error:', err.message);
    console.log('\n⚠️  Could not create schema automatically.');
  }
}

createSchema().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
