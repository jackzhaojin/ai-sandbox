/**
 * Supabase Client Configuration
 * 
 * Configured with postal_v2 schema for B2B Postal Checkout Flow
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

/**
 * Browser/client-side Supabase client
 * Uses the postal_v2 schema for all database operations
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'postal_v2'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export default supabaseClient;
