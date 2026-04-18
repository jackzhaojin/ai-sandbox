import { createClient, SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient<any, 'expense_tracker_v1', 'expense_tracker_v1'> | null = null;

export function createBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  browserClient = createClient<any, 'expense_tracker_v1', 'expense_tracker_v1'>(
    url,
    key,
    {
      db: { schema: 'expense_tracker_v1' },
    }
  );

  return browserClient;
}
