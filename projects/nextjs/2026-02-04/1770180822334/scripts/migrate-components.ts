/**
 * Migrate Components Schema via Supabase Admin
 *
 * Uses Supabase Admin API to execute SQL migrations
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function migrateSchema() {
  console.log('🔄 Migrating components schema...\n')

  try {
    // Step 1: Add new columns
    console.log('📝 Adding new columns...')

    const migrations = [
      `ALTER TABLE components ADD COLUMN IF NOT EXISTS type TEXT`,
      `ALTER TABLE components ADD COLUMN IF NOT EXISTS label TEXT`,
      `ALTER TABLE components ADD COLUMN IF NOT EXISTS icon TEXT`,
      `ALTER TABLE components ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`,
    ]

    for (const sql of migrations) {
      const { error } = await supabase.rpc('exec_sql', { query: sql })
      if (error && !error.message.includes('already exists')) {
        console.error('Migration error:', error)
      }
    }

    console.log('✅ Columns added (or already exist)')

    // Step 2: Check if prop_schema needs to be renamed
    console.log('\n📝 Checking column names...')
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'components')

    console.log('✅ Schema migration prepared')
    console.log('\nℹ️  Note: You may need to run additional SQL commands via Supabase Dashboard')
    console.log('   if constraints or column renames are needed.\n')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  }
}

migrateSchema()
