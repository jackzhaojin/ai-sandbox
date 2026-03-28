#!/usr/bin/env tsx
/**
 * Apply Row Level Security (RLS) Policies
 *
 * This script reads the RLS migration file and applies it to the Supabase database.
 */

import postgres from 'postgres'
import dotenv from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL environment variable')
  process.exit(1)
}

async function applyRLS() {
  console.log('🚀 Applying Row Level Security (RLS) policies...\n')

  const sql = postgres(databaseUrl, { max: 1 })

  try {
    // Read the RLS migration file
    const migrationPath = resolve(process.cwd(), 'drizzle/migrations/0002_rls_policies.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Reading migration file: drizzle/migrations/0002_rls_policies.sql')
    console.log(`   File size: ${migrationSQL.length} characters\n`)

    // Execute the migration
    console.log('⚙️  Executing RLS policies migration...')
    await sql.unsafe(migrationSQL)

    console.log('✅ RLS policies applied successfully!\n')

    // Verify RLS is enabled on key tables
    console.log('🔍 Verifying RLS is enabled on tables...\n')

    const result = await sql`
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN (
        'profiles', 'sites', 'pages', 'page_versions', 'media',
        'templates', 'components', 'content_fragments', 'menus',
        'api_keys', 'webhooks', 'invitations', 'notifications'
      )
      ORDER BY tablename;
    `

    console.log('📊 RLS Status:')
    console.log('─'.repeat(60))
    result.forEach(row => {
      const status = row.rowsecurity ? '✅ ENABLED' : '❌ DISABLED'
      console.log(`   ${row.tablename.padEnd(25)} ${status}`)
    })
    console.log('─'.repeat(60))
    console.log('')

    // Count policies created
    const policies = await sql`
      SELECT schemaname, tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `

    console.log(`📝 Total policies created: ${policies.length}\n`)

    const tableGroups = policies.reduce((acc, policy) => {
      if (!acc[policy.tablename]) {
        acc[policy.tablename] = []
      }
      acc[policy.tablename].push(policy.policyname)
      return acc
    }, {} as Record<string, string[]>)

    console.log('📋 Policies by table:')
    Object.entries(tableGroups).forEach(([table, policyNames]) => {
      console.log(`\n   ${table} (${policyNames.length} policies):`)
      policyNames.forEach(name => {
        console.log(`     • ${name}`)
      })
    })

    console.log('\n🎉 RLS setup complete!\n')
    console.log('Next steps:')
    console.log('1. Test policies with different user roles')
    console.log('2. Verify access control works as expected')
    console.log('3. Run integration tests\n')

  } catch (error) {
    console.error('❌ Error applying RLS policies:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

// Run the migration
applyRLS()
