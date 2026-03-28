/**
 * Apply Drizzle Migrations to Supabase
 *
 * This script reads migration files and applies them to the database
 * using Supabase's REST API for SQL execution
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigrations() {
  console.log('🚀 Applying migrations to Supabase...\n')

  const migrationsDir = join(process.cwd(), 'drizzle/migrations')

  // Read migration files in order
  const migrations = [
    '0000_marvelous_sabretooth.sql',
    '0001_auth_trigger.sql',
    '0002_rls_policies.sql',
    '0003_site_settings.sql',
    '0004_form_submissions_updates.sql'
  ]

  for (const migrationFile of migrations) {
    console.log(`📝 Applying: ${migrationFile}`)

    try {
      const sql = readFileSync(join(migrationsDir, migrationFile), 'utf-8')

      // Split by statement breakpoint
      const statements = sql
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      console.log(`   Found ${statements.length} statements`)

      // Execute each statement
      let successCount = 0
      for (const statement of statements) {
        // Skip comments
        if (statement.startsWith('--')) continue

        try {
          // Use raw SQL execution via a fetch request to Supabase REST API
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ query: statement })
          })

          if (!response.ok) {
            const error = await response.text()
            // Ignore "already exists" errors
            if (error.includes('already exists') || error.includes('does not exist')) {
              console.log(`   ⚠️  Skipping (already exists or not found)`)
            } else {
              console.error(`   ❌ Error: ${error}`)
            }
          } else {
            successCount++
          }
        } catch (error: any) {
          const errorMsg = error.message || String(error)
          if (errorMsg.includes('already exists')) {
            console.log(`   ⚠️  Skipping (already exists)`)
          } else {
            console.error(`   ❌ Statement error:`, errorMsg.substring(0, 100))
          }
        }
      }

      console.log(`   ✅ Applied ${successCount}/${statements.length} statements\n`)
    } catch (error) {
      console.error(`   ❌ Failed to read migration file:`, error)
    }
  }

  console.log('✨ Migrations completed!\n')
  console.log('💡 Note: Some errors are expected if tables already exist.')
  console.log('   Verify tables exist by running: npm run db:studio\n')
}

applyMigrations().then(() => process.exit(0)).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
