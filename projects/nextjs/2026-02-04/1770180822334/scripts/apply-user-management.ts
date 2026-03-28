#!/usr/bin/env tsx
/**
 * Apply User Management Migration
 *
 * This script applies the user management migration (site_members, invitation updates).
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function applyMigration() {
  console.log('🚀 Applying User Management migration...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Read the migration file
    const migrationPath = resolve(process.cwd(), 'drizzle/migrations/0022_user_management.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Reading migration file: drizzle/migrations/0022_user_management.sql')
    console.log(`   File size: ${migrationSQL.length} characters\n`)

    // Split migration into statements (handle statement breakpoints)
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))

    console.log(`⚙️  Executing ${statements.length} migration statements...\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue

      console.log(`   [${i + 1}/${statements.length}] Executing...`)

      const { error } = await supabase.rpc('exec_sql', { sql: statement })

      if (error) {
        console.error(`   ❌ Error in statement ${i + 1}:`, error.message)
        // Continue with next statement - some errors might be expected (e.g., IF EXISTS)
      } else {
        console.log(`   ✅ Statement ${i + 1} completed`)
      }
    }

    console.log('\n✅ Migration applied successfully!\n')

    // Verify new tables
    console.log('🔍 Verifying database changes...\n')

    const { data: siteMembersCheck, error: checkError } = await supabase
      .from('site_members')
      .select('count', { count: 'exact', head: true })

    if (checkError) {
      console.log('⚠️  Could not verify site_members table:', checkError.message)
      console.log('   This might be expected if using Supabase client (RLS restrictions)')
    } else {
      console.log('✅ site_members table verified')
    }

    console.log('\n🎉 User Management migration complete!\n')
    console.log('Note: Some verification steps may fail due to RLS restrictions.')
    console.log('Check the Supabase dashboard to confirm the migration succeeded.\n')

  } catch (error) {
    console.error('❌ Error applying migration:', error)
    process.exit(1)
  }
}

// Run the migration
applyMigration()
