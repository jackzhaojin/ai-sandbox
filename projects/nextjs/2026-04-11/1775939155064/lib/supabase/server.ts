/**
 * Server-Side Supabase Client Configuration
 * 
 * For use in Next.js API routes and Server Components
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.APP_SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-side Supabase client with service role
 * Use with caution - bypasses RLS policies
 */
export const supabaseServer = createClient(supabaseUrl!, supabaseServiceKey!, {
  db: {
    schema: 'postal_v2'
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Create a server client with anonymous key (respects RLS)
 * Use this for user-scoped operations in API routes
 */
export function createServerClient(accessToken?: string) {
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return createClient(supabaseUrl!, anonKey!, {
    db: {
      schema: 'postal_v2'
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: accessToken ? {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    } : undefined
  });
}

export default supabaseServer;
