/**
 * Database Connection Test Script
 *
 * This script tests the connection to Supabase PostgreSQL using Drizzle ORM.
 *
 * Usage:
 *   npx tsx scripts/test-db-connection.ts
 *
 * Note: Requires DATABASE_URL to be set in .env.local with actual password
 */

import { db } from '../lib/db/index'
import { profiles } from '../lib/db/schema'

async function testConnection() {
  console.log('🔍 Testing database connection...\n')

  try {
    // Test 1: Simple query
    console.log('Test 1: Executing simple query...')
    const result = await db.select().from(profiles).limit(1)
    console.log('✅ Query successful!')
    console.log(`   Found ${result.length} profile(s)\n`)

    // Test 2: Check if tables exist
    console.log('Test 2: Verifying table structure...')
    const tables = await db.execute(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)
    console.log('✅ Tables found:')
    const tableList = Array.isArray(tables) ? tables : []
    if (tableList.length > 0) {
      console.log(`   ${tableList.map((r: any) => r.table_name).join(', ')}\n`)
    } else {
      console.log('   No tables found yet. Run: npm run db:push\n')
    }

    // Success summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ DATABASE CONNECTION SUCCESSFUL!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('Your Drizzle ORM setup is working correctly.')
    console.log('You can now proceed with:')
    console.log('  1. Push schema: npx drizzle-kit push')
    console.log('  2. View data: npx drizzle-kit studio\n')

    process.exit(0)
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ DATABASE CONNECTION FAILED!')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (error instanceof Error) {
      console.error('Error message:', error.message)

      // Provide helpful troubleshooting
      console.error('\n📋 Troubleshooting steps:\n')

      if (error.message.includes('password')) {
        console.error('1. ❌ Password issue detected')
        console.error('   → Check your DATABASE_URL in .env.local')
        console.error('   → Get password from: Supabase Dashboard → Settings → Database\n')
      }

      if (error.message.includes('connection') || error.message.includes('ENOTFOUND')) {
        console.error('2. ❌ Connection issue detected')
        console.error('   → Verify DATABASE_URL format:')
        console.error('     postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres')
        console.error('   → Check your internet connection\n')
      }

      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.error('3. ❌ Tables not created yet')
        console.error('   → Run: npx drizzle-kit push')
        console.error('   → This will create all tables in your Supabase database\n')
      }

      console.error('4. 📖 See DATABASE_SETUP.md for detailed setup instructions')
    } else {
      console.error('Unknown error:', error)
    }

    process.exit(1)
  }
}

// Run the test
testConnection()
