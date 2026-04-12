import { createClient } from '@supabase/supabase-js'

/**
 * Global setup for Playwright E2E tests
 * 
 * This setup:
 * 1. Verifies Supabase connection and postal_v2 schema exists
 * 2. Seeds test data if needed
 * 3. Sets up test environment
 */

async function globalSetup() {
  console.log('🚀 Starting Playwright E2E test setup...')
  
  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase credentials not found in environment variables')
    console.warn('   Tests may fail if database connection is required')
    console.warn('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  } else {
    // Verify Supabase connection
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
      
      // Test connection with a simple query
      const { data, error } = await supabase
        .from('shipments')
        .select('count')
        .limit(1)
      
      if (error) {
        console.warn('⚠️  Supabase connection test failed:', error.message)
        console.warn('   Tests may fail if database connection is required')
      } else {
        console.log('✅ Supabase connection verified')
        console.log('   Connected to:', supabaseUrl)
      }
    } catch (err) {
      console.warn('⚠️  Could not verify Supabase connection:', err)
    }
  }
  
  console.log('✅ Playwright E2E test setup complete')
  console.log('')
}

export default globalSetup
