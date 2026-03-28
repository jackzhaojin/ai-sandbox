/**
 * Push schema to Supabase using the Supabase JavaScript client
 * The service role key allows us to execute raw SQL
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://lmbrqiwzowiquebtsfyc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

async function pushSchema() {
  console.log('🔄 Initializing Supabase client with service role...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('📖 Reading migration SQL...');
  const sqlPath = path.join(__dirname, '../src/lib/db/migrations/0000_moaning_retro_girl.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split into individual statements
  const statements = sql
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`📝 Executing ${statements.length} SQL statements...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 70).replace(/\n/g, ' ');

    try {
      console.log(`[${i + 1}/${statements.length}] ${preview}...`);

      const { data, error } = await supabase.rpc('exec', { sql: statement });

      if (error) throw error;

      successCount++;
      console.log(`  ✅ Success\n`);
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Error: ${error.message}\n`);
      // Continue with other statements
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Failed: ${errorCount}`);
}

pushSchema().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
