/**
 * Expose postal_v2 schema to Supabase REST API
 * Uses direct PostgreSQL connection via connection pooler
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.app
dotenv.config({ path: path.resolve(__dirname, '../.env.app') });

const supabaseUrl = process.env.APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function exposeSchema() {
  console.log('🔧 Attempting to expose postal_v2 schema to REST API...\n');

  // Try to add postal_v2 to the exposed schemas
  // In Supabase, this is typically done via the dashboard, but we can try via SQL
  const sql = `
    -- Grant usage on postal_v2 schema to anon and authenticated roles
    GRANT USAGE ON SCHEMA postal_v2 TO anon, authenticated;
    
    -- Grant select on all tables in postal_v2 schema
    GRANT SELECT ON ALL TABLES IN SCHEMA postal_v2 TO anon, authenticated;
    
    -- Grant insert, update, delete on all tables for authenticated
    GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA postal_v2 TO authenticated;
    
    -- Alter default privileges for future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA postal_v2 
      GRANT SELECT ON TABLES TO anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA postal_v2 
      GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;
  `;

  try {
    // Try to execute via RPC if available
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.log(`   ⚠️ Could not expose schema via RPC: ${error.message}`);
      console.log('\n📝 Schema exposure instructions:');
      console.log('   1. Go to https://supabase.com/dashboard/project/lmbrqiwzowiquebtsfyc');
      console.log('   2. Navigate to Project Settings > API > Exposed schemas');
      console.log('   3. Add "postal_v2" to the list of exposed schemas');
      console.log('   4. Save changes and wait a moment for propagation');
      return false;
    }
    
    console.log('✅ Schema exposed successfully!');
    return true;
  } catch (err: any) {
    console.log(`   ⚠️ Error: ${err.message}`);
    return false;
  }
}

exposeSchema()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
