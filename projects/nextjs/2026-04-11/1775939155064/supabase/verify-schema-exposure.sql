-- Verify postal_v2 schema is set up for REST API access
-- Check schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'postal_v2';

-- Check tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'postal_v2' ORDER BY table_name;

-- Check grants for anon and authenticated roles
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_schema = 'postal_v2' 
AND grantee IN ('anon', 'authenticated', 'service_role')
AND table_name = 'carriers';
