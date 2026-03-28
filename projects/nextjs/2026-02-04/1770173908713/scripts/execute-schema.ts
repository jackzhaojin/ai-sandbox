import * as fs from 'fs';
import * as path from 'path';

// Read environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmbrqiwzowiquebtsfyc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

// Read the migration SQL
const migrationPath = path.join(process.cwd(), 'src/lib/db/migrations/0000_moaning_retro_girl.sql');
const sql = fs.readFileSync(migrationPath, 'utf-8');

// Split the SQL into statements (remove breakpoint comments)
const statements = sql
  .split('--> statement-breakpoint')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`🚀 Executing ${statements.length} SQL statements...`);

async function executeSQL(statement: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY!}`,
    },
    body: JSON.stringify({ query: statement }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to execute SQL: ${error}`);
  }

  return response.json();
}

async function main() {
  console.log('🔗 Connecting to Supabase...');
  console.log(`   URL: ${SUPABASE_URL}`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 80).replace(/\n/g, ' ');

    try {
      console.log(`\n[${i + 1}/${statements.length}] Executing: ${preview}...`);
      await executeSQL(statement);
      console.log('   ✅ Success');
      successCount++;
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      errorCount++;

      // Continue on certain expected errors (like "already exists")
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('   ⚠️  Continuing despite error (already exists)');
      } else {
        // Stop on unexpected errors
        throw error;
      }
    }
  }

  console.log(`\n🎉 Schema execution complete!`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
