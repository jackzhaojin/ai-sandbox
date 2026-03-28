/**
 * Push schema directly to Supabase using the PostgREST API
 * This executes the migration SQL without needing the database password
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://lmbrqiwzowiquebtsfyc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

async function executeSql(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    // Try alternative approach: use the SQL endpoint directly
    const altResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!altResponse.ok) {
      throw new Error(`Failed to execute SQL: ${response.status} ${await response.text()}`);
    }
    return altResponse.json();
  }

  return response.json();
}

async function pushSchema() {
  console.log('🔄 Reading migration SQL...');
  const sqlPath = path.join(__dirname, '../src/lib/db/migrations/0000_moaning_retro_girl.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split into individual statements (removing the statement-breakpoint comments)
  const statements = sql
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\n/g, ' ');

    try {
      console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);
      await executeSql(statement);
      successCount++;
      console.log(`  ✅ Success`);
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Error: ${error.message}`);
      // Continue with other statements even if one fails
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Failed: ${errorCount}`);

  if (errorCount > 0) {
    console.log('\n⚠️  Some statements failed. This might be normal if tables already exist.');
  }
}

pushSchema().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
