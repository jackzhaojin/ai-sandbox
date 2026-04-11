-- Expose postal_v2 schema to PostgREST API
-- This allows REST API access to the postal_v2 schema

-- Add postal_v2 to exposed schemas for PostgREST
-- Note: This requires ALTER SYSTEM or supabase_admin privileges
-- The schema is already created, we just need to expose it

-- Grant usage to anon and authenticated roles
GRANT USAGE ON SCHEMA postal_v2 TO anon, authenticated;

-- Grant select on all tables in postal_v2 to anon and authenticated
GRANT SELECT ON ALL TABLES IN SCHEMA postal_v2 TO anon, authenticated;

-- Grant all privileges to service_role
GRANT ALL ON ALL TABLES IN SCHEMA postal_v2 TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA postal_v2 TO service_role;

-- For future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA postal_v2
  GRANT SELECT ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA postal_v2
  GRANT ALL ON TABLES TO service_role;
