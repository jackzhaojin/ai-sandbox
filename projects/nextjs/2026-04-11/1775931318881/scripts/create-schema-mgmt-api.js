#!/usr/bin/env node
/**
 * Create postal_v2 schema using Supabase Management API
 */

const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lmbrqiwzowiquebtsfyc.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createSchemaViaAPI() {
  console.log('Creating postal_v2 schema via Supabase API...');
  console.log('URL:', supabaseUrl);
  
  if (!serviceRoleKey) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY not set');
    process.exit(1);
  }

  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  
  // Try to use the PostgreSQL connection string approach via direct query
  const sql = 'DROP SCHEMA IF EXISTS postal_v2 CASCADE; CREATE SCHEMA postal_v2;';
  
  // First, let's try to verify the schema doesn't exist
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Try to use pg_catalog to check schema existence
    const { data, error } = await supabase
      .from('pg_catalog.pg_namespace')
      .select('nspname')
      .eq('nspname', 'postal_v2');

    if (error) {
      console.log('Could not query pg_catalog:', error.message);
    } else if (data && data.length > 0) {
      console.log('✅ postal_v2 schema already exists!');
      return true;
    }
  } catch (e) {
    console.log('Could not check schema existence:', e.message);
  }

  console.log('\n⚠️  Cannot automatically create schema via REST API.');
  console.log('The Supabase REST API does not expose DDL operations for security.');
  console.log('\n📋 ACTION REQUIRED: Execute this SQL in Supabase Dashboard:');
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(sql);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  return false;
}

createSchemaViaAPI().then(success => {
  if (success) {
    console.log('\n✅ Schema verified/created successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Schema creation requires manual action.');
    process.exit(1);
  }
}).catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
