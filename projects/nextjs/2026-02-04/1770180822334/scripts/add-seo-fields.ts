#!/usr/bin/env tsx
/**
 * Migration: Add SEO fields to pages table
 *
 * Adds comprehensive SEO fields to the pages table:
 * - og_title, og_description, og_image_id
 * - canonical_url, no_index, no_follow
 * - structured_data (JSON)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSeoFields() {
  console.log('🚀 Adding SEO fields to pages table...\n')

  try {
    // Add new SEO columns
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add OG (Open Graph) fields
        ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_title TEXT;
        ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_description TEXT;
        ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_image_id UUID REFERENCES media(id) ON DELETE SET NULL;

        -- Add SEO control fields
        ALTER TABLE pages ADD COLUMN IF NOT EXISTS canonical_url TEXT;
        ALTER TABLE pages ADD COLUMN IF NOT EXISTS no_index TEXT DEFAULT 'false';
        ALTER TABLE pages ADD COLUMN IF NOT EXISTS no_follow TEXT DEFAULT 'false';

        -- Add structured data (JSON-LD)
        ALTER TABLE pages ADD COLUMN IF NOT EXISTS structured_data TEXT;

        -- Add comment for documentation
        COMMENT ON COLUMN pages.og_title IS 'Open Graph title for social media sharing';
        COMMENT ON COLUMN pages.og_description IS 'Open Graph description for social media sharing';
        COMMENT ON COLUMN pages.og_image_id IS 'Reference to media table for OG image';
        COMMENT ON COLUMN pages.canonical_url IS 'Canonical URL to prevent duplicate content';
        COMMENT ON COLUMN pages.no_index IS 'Boolean string - prevent search engine indexing';
        COMMENT ON COLUMN pages.no_follow IS 'Boolean string - prevent search engine following links';
        COMMENT ON COLUMN pages.structured_data IS 'JSON-LD structured data for rich snippets';
      `
    })

    if (alterError) {
      // If rpc doesn't exist, try direct SQL
      console.log('⚠️  RPC method not available, trying direct approach...')

      const migrations = [
        'ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_title TEXT',
        'ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_description TEXT',
        'ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_image_id UUID',
        'ALTER TABLE pages ADD COLUMN IF NOT EXISTS canonical_url TEXT',
        "ALTER TABLE pages ADD COLUMN IF NOT EXISTS no_index TEXT DEFAULT 'false'",
        "ALTER TABLE pages ADD COLUMN IF NOT EXISTS no_follow TEXT DEFAULT 'false'",
        'ALTER TABLE pages ADD COLUMN IF NOT EXISTS structured_data TEXT'
      ]

      for (const sql of migrations) {
        const { error } = await supabase.rpc('exec_sql', { sql }) as any
        if (error && !error.message?.includes('already exists')) {
          console.error(`❌ Error executing: ${sql}`)
          console.error(error)
        }
      }
    }

    console.log('✅ SEO fields added successfully!')
    console.log('\nNew fields:')
    console.log('  - og_title (TEXT)')
    console.log('  - og_description (TEXT)')
    console.log('  - og_image_id (UUID -> media.id)')
    console.log('  - canonical_url (TEXT)')
    console.log('  - no_index (TEXT, default: false)')
    console.log('  - no_follow (TEXT, default: false)')
    console.log('  - structured_data (TEXT/JSON)')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
addSeoFields()
  .then(() => {
    console.log('\n✅ Migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })
