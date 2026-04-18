import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createServerClient(): SupabaseClient<
  any,
  'expense_tracker_v1',
  'expense_tracker_v1'
> {
  const url = process.env.APP_SUPABASE_URL;
  const key = process.env.APP_SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing APP_SUPABASE_URL or APP_SUPABASE_SECRET_KEY'
    );
  }

  return createClient<any, 'expense_tracker_v1', 'expense_tracker_v1'>(
    url,
    key,
    {
      db: { schema: 'expense_tracker_v1' },
    }
  );
}
