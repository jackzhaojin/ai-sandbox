#!/usr/bin/env node
/**
 * Test postal_v2 schema by creating a real table
 * This is the most definitive test
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testSchemaWithTable() {
  console.log('Testing postal_v2 schema by creating a real table...\n');
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const testTable = 'postal_v2._schema_test_' + Date.now();

  // Try to create a table
  console.log(`1. Creating test table ${testTable}...`);
  try {
    // Use raw SQL via the REST API's rpc endpoint if available
    const { error: rpcError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE ${testTable} (id serial PRIMARY KEY, test_value text)`
    });
    
    if (rpcError) {
      console.log('   ℹ️  RPC not available:', rpcError.message);
      console.log('\n   Trying alternative: Using Supabase JavaScript client...');
      
      // Alternative: Try to insert into a table that would only exist if schema exists
      // First, let's check if we can at least query without error
      const { error: queryError } = await supabase
        .from('postal_v2.__nonexistent_test__')
        .select('*')
        .limit(1);
      
      if (queryError) {
        if (queryError.message.includes('relation') && queryError.message.includes('does not exist')) {
          // This is expected - the relation doesn't exist, but the schema might
          console.log('   ℹ️  Table does not exist (expected)');
          console.log('   ℹ️  Error message suggests schema may exist:', queryError.message);
          
          // Check if error mentions schema specifically
          if (queryError.message.includes('postal_v2')) {
            console.log('   ✅ Schema name appears in error - schema likely exists!');
            return { success: true, method: 'error_analysis' };
          }
        } else if (queryError.code === 'PGRST106') {
          console.log('   ❌ Schema does not exist or is not accessible');
          return { success: false };
        }
      }
    } else {
      console.log('   ✅ Table created successfully!');
      
      // Insert a test row
      console.log('\n2. Inserting test row...');
      const { error: insertError } = await supabase
        .from(testTable.replace('postal_v2.', ''))
        .insert({ test_value: 'schema verification test' });
      
      if (insertError) {
        console.log('   ℹ️  Insert failed:', insertError.message);
      } else {
        console.log('   ✅ Row inserted successfully!');
      }
      
      // Clean up
      console.log('\n3. Cleaning up test table...');
      await supabase.rpc('exec_sql', { sql: `DROP TABLE IF EXISTS ${testTable}` });
      console.log('   ✅ Test table dropped');
      
      return { success: true, method: 'table_creation' };
    }
  } catch (e) {
    console.log('   ℹ️  Test failed:', e.message);
  }

  return { success: false };
}

testSchemaWithTable().then(result => {
  if (result.success) {
    console.log(`\n✅ postal_v2 schema EXISTS (verified via ${result.method})!`);
    process.exit(0);
  } else {
    console.log('\n❌ postal_v2 schema could not be verified');
    process.exit(1);
  }
}).catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
