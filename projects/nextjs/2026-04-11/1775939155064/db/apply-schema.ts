/**
 * Apply postal_v2 schema to cloud Supabase using direct SQL execution
 * Uses the Supabase REST API with proper authentication
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.app
dotenv.config({ path: path.resolve(__dirname, '../.env.app') });

const supabaseUrl = process.env.APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Ensure APP_SUPABASE_URL and APP_SUPABASE_SERVICE_ROLE_KEY are set in .env.app');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read schema SQL
const schemaPath = path.resolve(__dirname, '../migrations/001_create_postal_v2_schema.sql');
const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

async function applySchema() {
  console.log('🗄️  Applying postal_v2 schema to cloud Supabase...');
  console.log(`   URL: ${supabaseUrl}\n`);

  // Split SQL into statements and execute one by one
  // This is a simplified approach - splitting by semicolons outside of quoted strings
  const statements = splitSQLStatements(schemaSQL);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
      continue;
    }

    try {
      // Try to execute via RPC if available
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // If RPC fails, try using the SQL API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'tx=commit'
          },
          body: JSON.stringify({ query: statement })
        });

        if (!response.ok) {
          const errorText = await response.text();
          // Some errors are expected (e.g., DROP IF EXISTS on non-existent objects)
          if (!errorText.includes('does not exist') && !errorText.includes('already exists')) {
            console.error(`   ⚠️  Statement ${i + 1}: ${errorText.substring(0, 100)}`);
            errorCount++;
          }
        } else {
          successCount++;
        }
      } else {
        successCount++;
      }
    } catch (err: any) {
      // Ignore certain expected errors
      if (!err.message?.includes('does not exist') && !err.message?.includes('already exists')) {
        console.error(`   ⚠️  Statement ${i + 1}: ${err.message?.substring(0, 100)}`);
        errorCount++;
      }
    }
  }

  console.log(`\n   ✅ ${successCount} statements applied`);
  if (errorCount > 0) {
    console.log(`   ⚠️  ${errorCount} statements had errors (some may be expected)`);
  }

  // Verify schema exists
  const { data, error } = await supabase
    .from('carriers')
    .select('id')
    .limit(1);

  if (error && error.message.includes('does not exist')) {
    console.error('\n❌ Schema verification failed: postal_v2 schema may not be created');
    console.log('\n⚠️  Please apply schema manually via Supabase SQL Editor:');
    console.log(`   1. Go to ${supabaseUrl}/project/_/sql`);
    console.log('   2. Create a new query');
    console.log('   3. Paste contents of migrations/001_create_postal_v2_schema.sql');
    console.log('   4. Run the query');
    return false;
  }

  console.log('\n✅ Schema verification passed!');
  return true;
}

function splitSQLStatements(sql: string): string[] {
  const statements: string[] = [];
  let currentStatement = '';
  let inQuote = false;
  let quoteChar = '';
  let inDollarQuote = false;
  let dollarQuoteTag = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    // Handle dollar-quoted strings ($$ ... $$ or $tag$ ... $tag$)
    if (char === '$' && !inQuote) {
      if (!inDollarQuote) {
        // Start of dollar quote
        const match = sql.substring(i).match(/^\$(\w*)\$/);
        if (match) {
          inDollarQuote = true;
          dollarQuoteTag = match[1];
          currentStatement += match[0];
          i += match[0].length - 1;
          continue;
        }
      } else {
        // Check for end of dollar quote
        const endTag = `$${dollarQuoteTag}$`;
        if (sql.substring(i, i + endTag.length) === endTag) {
          inDollarQuote = false;
          dollarQuoteTag = '';
          currentStatement += endTag;
          i += endTag.length - 1;
          continue;
        }
      }
    }

    // Handle regular quotes
    if (!inDollarQuote && (char === "'" || char === '"')) {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        // Check for escaped quote
        if (nextChar === quoteChar) {
          currentStatement += char;
          i++;
        } else {
          inQuote = false;
          quoteChar = '';
        }
      }
    }

    currentStatement += char;

    // Statement terminator (only outside of quotes)
    if (char === ';' && !inQuote && !inDollarQuote) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }

  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  return statements;
}

applySchema()
  .then(success => {
    if (success) {
      console.log('\n🎉 Schema application complete!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
