// Supabase client exports
export { createClient as createBrowserClient } from './client';
export { createClient as createServerClient } from './server';
export { updateSession } from './middleware';

// Type exports
export type { TypedSupabaseClient } from './client';
export type { TypedSupabaseServerClient } from './server';
