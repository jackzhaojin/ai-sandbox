import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Supabase requires prepare: false for transaction pooling mode
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Configure postgres client for Supabase
const queryClient = postgres(connectionString, {
  prepare: false, // Required for Supabase transaction pooling
});

export const db = drizzle(queryClient, { schema });

// Type export
export type Database = typeof db;
