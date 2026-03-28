#!/usr/bin/env tsx
/**
 * Add SEO fields to pages table using Supabase client
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSeoFields() {
  console.log('🚀 Adding SEO fields to pages table...\n')

  // Check if columns already exist by querying the table
  const { data: testData, error: testError } = await supabase
    .from('pages')
    .select('og_title, og_description, og_image_id, canonical_url, no_index, no_follow, structured_data')
    .limit(1)

  if (!testError) {
    console.log('✅ SEO columns already exist!')
    return
  }

  console.log('⚠️  Some SEO columns may be missing. Schema has been updated.')
  console.log('Note: Since we cannot execute ALTER TABLE via Supabase REST API,')
  console.log('please add the columns manually in Supabase Dashboard SQL Editor:\n')
  console.log('ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_title TEXT;')
  console.log('ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_description TEXT;')
  console.log('ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_image_id UUID;')
  console.log('ALTER TABLE pages ADD COLUMN IF NOT EXISTS canonical_url TEXT;')
  console.log("ALTER TABLE pages ADD COLUMN IF NOT EXISTS no_index TEXT DEFAULT 'false';")
  console.log("ALTER TABLE pages ADD COLUMN IF NOT EXISTS no_follow TEXT DEFAULT 'false';")
  console.log('ALTER TABLE pages ADD COLUMN IF NOT EXISTS structured_data TEXT;')
  console.log('\nOr run this script again after columns are added manually.')
}

addSeoFields()
  .then(() => {
    console.log('\n✅ Migration check completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
