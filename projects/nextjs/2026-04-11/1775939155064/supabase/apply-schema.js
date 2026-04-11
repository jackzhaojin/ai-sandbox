#!/usr/bin/env node
/**
 * Apply schema to cloud Supabase instance
 * Uses the REST API to execute SQL
 */

const SUPABASE_URL = process.env.APP_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Supabase credentials not found in environment');
  console.error('Expected: APP_SUPABASE_URL and APP_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

async function applySchema() {
  const sqlFile = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');
  
  console.log('Applying schema to cloud Supabase...');
  console.log(`URL: ${SUPABASE_URL}`);
  
  // Split SQL into statements (rough split for PostgreSQL)
  // We'll use the rpc/exec_sql approach or pg_execute
  
  try {
    // Try using the PostgreSQL extension endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to apply schema via REST API:', error);
      console.log('\nTrying alternative approach: SQL Editor via Management API...');
      
      // Fall back to the SQL endpoint
      await applyViaSqlEndpoint(sql);
    } else {
      console.log('Schema applied successfully!');
    }
  } catch (error) {
    console.error('Error applying schema:', error.message);
    process.exit(1);
  }
}

async function applyViaSqlEndpoint(sql) {
  // Use the PostgreSQL RPC endpoint if available
  try {
    // Execute SQL via pg_execute or similar
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql_query: sql })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('RPC method failed:', error);
      console.log('\nPlease apply schema manually via Supabase SQL Editor:');
      console.log(`1. Go to ${SUPABASE_URL.replace('.co', '.co/project/_/sql')}`);
      console.log('2. Copy contents of supabase/schema.sql');
      console.log('3. Run the SQL');
      process.exit(1);
    }
    
    const result = await response.json();
    console.log('Schema applied via RPC:', result);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Alternative: Use Supabase client
async function applyWithClient() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    const sqlFile = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');
    
    console.log('Applying schema using Supabase client...');
    
    // Try to execute SQL via rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('RPC error:', error);
      return false;
    }
    
    console.log('Schema applied successfully:', data);
    return true;
  } catch (err) {
    console.error('Client error:', err.message);
    return false;
  }
}

// Main execution
async function main() {
  // First try with direct fetch
  try {
    await applySchema();
  } catch (e) {
    console.log('Direct fetch failed, trying with Supabase client...');
    const success = await applyWithClient();
    if (!success) {
      console.log('\n========================================');
      console.log('MANUAL APPLICATION REQUIRED');
      console.log('========================================');
      console.log('Please apply schema manually:');
      console.log(`1. Open ${SUPABASE_URL}/project/_/sql`);
      console.log('2. Create a new query');
      console.log('3. Paste contents of supabase/schema.sql');
      console.log('4. Run the query');
      console.log('========================================');
      process.exit(1);
    }
  }
}

main();
