#!/usr/bin/env node
/**
 * Create postal_v2 schema in cloud Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lmbrqiwzowiquebtsfyc.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtYnJxaXd6b3dpcXVlYnRzZnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE1NzE0MSwiZXhwIjoyMDg1NzMzMTQxfQ.qChh00-7bA2FrK_VTdC5QH9pILiUH9OpQQe8PE2IaKg';

async function createSchema() {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('Connecting to Supabase...');
  console.log('URL:', supabaseUrl);

  // Check if postal_v2 schema exists
  const { data: schemas, error: schemaError } = await supabase
    .from('information_schema.schemata')
    .select('schema_name')
    .eq('schema_name', 'postal_v2');

  if (schemaError) {
    console.log('Note: Could not query information_schema:', schemaError.message);
  } else if (schemas && schemas.length > 0) {
    console.log('✅ postal_v2 schema already exists!');
    return;
  }

  console.log('postal_v2 schema does not exist, attempting to create...');

  // Try using Supabase's PostgreSQL function if available
  const { error: rpcError } = await supabase.rpc('exec_sql', {
    sql: 'DROP SCHEMA IF EXISTS postal_v2 CASCADE; CREATE SCHEMA postal_v2;'
  });

  if (rpcError) {
    console.log('RPC exec_sql not available:', rpcError.message);
    
    // Try alternative: create a temporary function
    const { error: createFuncError } = await supabase.rpc('create_postal_v2_schema');
    
    if (createFuncError) {
      console.log('create_postal_v2_schema function not available:', createFuncError.message);
      
      console.log('\n⚠️  Automatic schema creation not possible via REST API.');
      console.log('The Supabase REST API does not allow arbitrary SQL execution for security.');
      console.log('\n📋 ACTION REQUIRED: Run this SQL in Supabase Dashboard SQL Editor:');
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('DROP SCHEMA IF EXISTS postal_v2 CASCADE;');
      console.log('CREATE SCHEMA postal_v2;');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      console.log('Or use the Supabase CLI if installed:');
      console.log('  supabase sql -f - <<< "CREATE SCHEMA postal_v2;"\n');
      
      process.exit(1);
    } else {
      console.log('✅ postal_v2 schema created via helper function!');
    }
  } else {
    console.log('✅ postal_v2 schema created successfully!');
  }
}

createSchema().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
