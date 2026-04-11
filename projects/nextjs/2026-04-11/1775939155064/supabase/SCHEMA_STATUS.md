# Cloud Supabase Schema Setup Status

**Project:** B2B Postal Checkout Flow  
**Schema:** postal_v2  
**Database:** Cloud Supabase (lmbrqiwzowiquebtsfyc)  
**Contract:** contract-1775940659492

## ✅ Completed

### Schema Creation
- [x] Dropped and recreated `postal_v2` schema
- [x] Created 11 enum types (user_role, shipment_status, carrier_code, etc.)
- [x] Created 27 tables including all required tables from spec:
  - shipments, shipment_packages, shipment_special_handling
  - shipment_delivery_preferences, hazmat_details
  - carriers, service_types, quotes
  - payment_info, payment_purchase_orders, payment_bills_of_lading
  - payment_third_party, payment_net_terms, payment_net_terms_references
  - payment_corporate_accounts
  - pickup_details, pickup_contacts, pickup_access_requirements
  - pickup_equipment_needs, pickup_authorized_personnel, pickup_notifications
  - shipment_events

### Constraints & Indexes
- [x] 52 indexes created for performance
- [x] 40 foreign keys configured
- [x] Primary keys on all tables
- [x] Check constraints (e.g., net_terms term_days IN (15, 30, 60))

### Row Level Security (RLS)
- [x] RLS enabled on all 27 tables
- [x] 29 RLS policies created (permissive for development)
- [x] Policies allow authenticated users full access
- [x] Carriers and pickup_slots have read-only policies for authenticated users

### Triggers & Functions
- [x] `update_updated_at()` function for automatic timestamp updates
- [x] Triggers on 8 tables for updated_at management
- [x] `generate_tracking_number()` function for tracking number generation
- [x] Trigger on shipments for auto-generating tracking numbers

### Database Permissions
- [x] Granted USAGE on postal_v2 schema to anon, authenticated, service_role
- [x] Granted SELECT on all tables to anon, authenticated
- [x] Granted ALL privileges to service_role
- [x] Set default privileges for future tables

### Client Configuration
- [x] `lib/supabase/client.ts` - Browser client with `db: { schema: 'postal_v2' }`
- [x] `lib/supabase/server.ts` - Server client with schema configuration
- [x] Environment variables documented in `.env.local.template`

## ⚠️ Known Limitation

### REST API Schema Exposure
The `postal_v2` schema is not yet exposed to the PostgREST API. This requires either:

1. **Supabase Dashboard** (Recommended):
   - Go to: https://supabase.com/dashboard/project/lmbrqiwzowiquebtsfyc/settings/api
   - Navigate to "API Settings"
   - Under "Exposed Schemas", add `postal_v2`
   - Save changes (this will restart PostgREST)

2. **Supabase Management API** (Requires access token):
   ```bash
   curl -X PATCH "https://api.supabase.com/v1/projects/lmbrqiwzowiquebtsfyc/api" \
     -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"db_schema": "public, postal_v2, graphql_public"}'
   ```

### Workaround Until REST API is Exposed
Use direct PostgreSQL connection via the connection pooler:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const result = await pool.query('SELECT * FROM postal_v2.shipments LIMIT 10');
```

## Verification

### PostgreSQL Connection (✅ Working)
```bash
node supabase/verify-complete.js
```
Result: ✅ All 22 required tables present

### REST API (⏳ Pending Dashboard Configuration)
```bash
node supabase/verify-api.js
```
Result: ❌ Schema not exposed (expected until dashboard config)

## Next Steps

1. **Immediate**: Use PostgreSQL pooler connection for database operations
2. **Before Production**: Expose postal_v2 schema via Supabase Dashboard
3. **Future**: Replace permissive RLS policies with organization-scoped policies

## Files Created/Modified

- `supabase/schema.sql` - Complete schema definition (779 lines)
- `supabase/apply-schema.js` - Schema application via REST
- `supabase/apply-schema-pg.js` - Schema application via PostgreSQL
- `supabase/verify-api.js` - REST API verification
- `supabase/verify-complete.js` - Complete PostgreSQL verification
- `supabase/verify-pg.js` - PostgreSQL-specific verification
- `supabase/expose-schema.sql` - Schema exposure grants
- `lib/supabase/client.ts` - Browser client with schema config
- `lib/supabase/server.ts` - Server client with schema config
- `lib/supabase/README.md` - Documentation
