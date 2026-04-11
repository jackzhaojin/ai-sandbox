#!/usr/bin/env node
/**
 * Apply schema using direct PostgreSQL connection
 * Uses the Supabase pooler connection
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Get password from environment
const password = process.env.APP_SUPABASE_PASSWORD;
const poolerRegion = process.env.APP_SUPABASE_POOLER_REGION || 'aws-1-us-east-2';

if (!password) {
  console.error('Error: APP_SUPABASE_PASSWORD not found in environment');
  process.exit(1);
}

// Extract project ref from URL
const supabaseUrl = process.env.APP_SUPABASE_URL || process.env.SUPABASE_URL;
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1];

if (!projectRef) {
  console.error('Error: Could not extract project ref from URL');
  process.exit(1);
}

// Construct connection string for pooler
const connectionString = `postgresql://postgres.${projectRef}:${password}@${poolerRegion}.pooler.supabase.com:6543/postgres`;

async function applySchema() {
  const sqlFile = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');
  
  console.log('Connecting to cloud Supabase via connection pooler...');
  console.log(`Project: ${projectRef}`);
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    console.log('Connected successfully!');
    
    console.log('Applying schema...');
    await client.query(sql);
    
    console.log('\n✅ Schema applied successfully!');
    
    // Verify schema creation
    console.log('\nVerifying schema...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'postal_v2'
      ORDER BY table_name
    `);
    
    console.log(`\nTables created in postal_v2 schema (${tablesResult.rows.length} tables):`);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    const enumsResult = await client.query(`
      SELECT t.typname AS enum_name,
             array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'postal_v2'
      GROUP BY t.typname
    `);
    
    console.log(`\nEnum types created (${enumsResult.rows.length} enums):`);
    enumsResult.rows.forEach(row => {
      console.log(`  - ${row.enum_name}`);
    });
    
    const indexesResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'postal_v2'
      ORDER BY indexname
    `);
    
    console.log(`\nIndexes created (${indexesResult.rows.length} indexes):`);
    indexesResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('\n❌ Error applying schema:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\nConnection refused. Possible causes:');
      console.error('- Pooler not enabled for this project');
      console.error('- Network connectivity issue');
      console.error('- Wrong region (current:', poolerRegion + ')');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applySchema();
