# Migration Research: Local Postgres to Supabase for Recipe Discovery Platform

**Research Date:** February 4, 2026
**Migration Task:** Migrate existing Recipe Discovery Platform from local PostgreSQL to Supabase
**Project Reference:** `/Users/jackjin/dev/agent-outputs/projects/nextjs/2026-01-29/1769685367609`

---

## Executive Summary

This document outlines the research findings and recommended approach for migrating the existing Recipe Discovery Platform from local PostgreSQL (using Drizzle ORM) to Supabase's hosted PostgreSQL service. The migration is **straightforward** because:

✅ **Existing stack is compatible** - Drizzle ORM works seamlessly with Supabase PostgreSQL
✅ **Schema is portable** - PostgreSQL schema can be migrated directly to Supabase
✅ **Minimal code changes** - Only connection configuration needs updating
✅ **Authentication can continue using NextAuth.js** - No requirement to switch to Supabase Auth

---

## 1. Current Application Analysis

### 1.1 Current Technology Stack

Based on analysis of the existing application at `/Users/jackjin/dev/agent-outputs/projects/nextjs/2026-01-29/1769685367609/recipe-discovery-platform`:

| Component | Current Implementation | Notes |
|-----------|----------------------|--------|
| Framework | Next.js 16.1.6 (App Router) | Latest stable version |
| ORM | Drizzle ORM 0.45.1 | Fully compatible with Supabase |
| Database Driver | `postgres` (postgres-js) 3.4.8 | Needs configuration update for Supabase |
| Database | Local PostgreSQL | Connected via `DATABASE_URL` |
| Authentication | NextAuth.js v5 (Auth.js) | Works independently of database provider |
| Schema Management | Drizzle Kit 0.31.8 | Migration tool for schema changes |

### 1.2 Database Schema Overview

The application has a **well-structured relational schema** with 9 tables:

**Core Tables:**
- `users` - User accounts with email/password authentication
- `recipes` - Recipe metadata (title, description, times, difficulty)
- `ingredients` - Ingredient master list
- `recipe_ingredients` - Junction table linking recipes to ingredients
- `instructions` - Step-by-step cooking instructions
- `dietary_tags` - Dietary preference tags (vegan, gluten-free, etc.)
- `recipe_dietary_tags` - Junction table for recipe tags
- `favorites` - User favorite recipes
- `reviews` - Recipe ratings and comments

**Schema Features:**
- Uses PostgreSQL-specific features: `pgEnum`, `uuid`, `decimal`, `timestamp`
- Foreign key constraints with cascade deletes
- Indexed columns for performance (user_id, cuisine_type, recipe_id)
- Relational mapping with Drizzle ORM's `relations()` API

**Compatibility:** ✅ All schema features are supported by Supabase PostgreSQL (PostgreSQL 15)

### 1.3 Database Connection Pattern

**Current Configuration:**

```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || '';
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
```

**Current Drizzle Config:**

```typescript
// drizzle.config.ts
export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
} satisfies Config;
```

**Issue:** The current configuration does **not** set `prepare: false`, which is **required** for Supabase's transaction pooling mode.

### 1.4 Authentication Implementation

**Current Setup:**
- NextAuth.js v5 (Auth.js) with Credentials provider
- Password hashing with bcryptjs
- JWT-based sessions
- User data stored in PostgreSQL `users` table
- Direct database queries for user lookup

**Important Finding:** The application uses **custom credentials authentication**, not Supabase Auth. This means:
- ✅ No migration to Supabase Auth required
- ✅ Existing NextAuth.js setup continues to work
- ✅ User table remains in PostgreSQL (now Supabase)
- ⚠️ Optionally, could migrate to Supabase Auth in future for built-in features (magic links, OAuth, MFA)

### 1.5 Server Actions and API Routes

The application uses a **hybrid approach**:

**Server Actions** (`actions/` directory):
- `recipe-actions.ts` - Recipe CRUD operations
- `auth-actions.ts` - Sign up/sign in logic
- `favorite-actions.ts` - Favorite add/remove
- `ingredient-actions.ts` - Ingredient management
- `dietary-tag-actions.ts` - Dietary tag operations

**API Routes** (`app/api/` directory):
- `api/recipes/route.ts` - Public recipe listings
- `api/recipes/[id]/route.ts` - Individual recipe fetch
- `api/auth/[...nextauth]/route.ts` - NextAuth.js handler
- `api/favorites/route.ts` - Favorites API
- `api/dietary-tags/route.ts` - Dietary tags API
- `api/ingredients/route.ts` - Ingredients API

**Database Access Pattern:**
All database operations import from `@/lib/db` and use Drizzle ORM queries. **No direct SQL queries** - everything goes through Drizzle's type-safe API.

**Migration Impact:** ✅ No changes needed to Server Actions or API Routes - they all use the abstracted `db` instance from `lib/db/index.ts`.

---

## 2. Supabase Architecture Overview

### 2.1 What is Supabase?

Supabase is an **open-source Firebase alternative** built on PostgreSQL. For this migration, we're using Supabase specifically as a **hosted PostgreSQL database provider**, not necessarily adopting all Supabase features.

**Key Components (for this migration):**

| Component | Description | Relevance |
|-----------|-------------|-----------|
| PostgreSQL 15 | Fully managed PostgreSQL database | ✅ Core requirement |
| Connection Pooler (Supavisor) | PgBouncer-based connection pooling | ✅ Required for serverless |
| Dashboard | Web UI for database management | ✅ Useful for debugging |
| Drizzle Studio Support | Visual database editor | ✅ Works with Supabase |
| Supabase Auth | Built-in authentication service | ❌ Not using (keeping NextAuth.js) |
| Supabase Storage | File storage service | ❌ Not using yet |
| Supabase Realtime | WebSocket-based subscriptions | ❌ Not using yet |

### 2.2 Supabase Connection Strings

Supabase provides **two connection strings** for different use cases:

**1. Direct Connection (Session Mode)**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```
- Uses session pooling mode
- **Supports prepared statements**
- Best for long-lived connections (local development, backend servers)
- Higher connection overhead

**2. Transaction Pooler (Transaction Mode)**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```
- Uses transaction pooling mode (PgBouncer)
- **Does NOT support prepared statements**
- Best for serverless/edge functions (Next.js App Router)
- Lower latency, handles bursts of connections

**For Next.js Deployment:** Use **Transaction Pooler** with `prepare: false`

### 2.3 Available Supabase Credentials

From `.env.app` at workspace root:

```bash
APP_SUPABASE_URL="https://lmbrqiwzowiquebtsfyc.supabase.co"
APP_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
APP_SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Important:** These credentials are for **Supabase Auth API**, not direct PostgreSQL connection. We need to:
1. Navigate to Supabase Dashboard → Database Settings
2. Copy the **Connection String** (Transaction mode)
3. Replace `[YOUR-PASSWORD]` with the database password
4. Set as `DATABASE_URL` environment variable

**Note:** The database password is **separate** from the API keys above. It must be obtained from Supabase Dashboard.

---

## 3. Migration Strategy & Technical Approach

### 3.1 Migration Overview

**Migration Type:** Database provider switch (local → hosted)
**Complexity:** Low to Medium
**Downtime Required:** No (can test in parallel)
**Data Migration:** Required (export → import)

**High-Level Steps:**

```
┌─────────────────────────────────────────────┐
│ Phase 1: Supabase Setup                     │
│ - Verify Supabase project configuration     │
│ - Obtain database connection string         │
│ - Test connectivity                          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Phase 2: Schema Migration                   │
│ - Export current schema                      │
│ - Apply schema to Supabase                   │
│ - Verify tables and indexes                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Phase 3: Code Updates                       │
│ - Update database connection config          │
│ - Add prepare: false for pooler              │
│ - Update environment variables               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Phase 4: Data Migration                     │
│ - Export existing data (pg_dump)            │
│ - Import to Supabase                         │
│ - Verify data integrity                      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Phase 5: Testing & Validation               │
│ - Run application against Supabase           │
│ - Test authentication flows                  │
│ - Verify CRUD operations                     │
│ - Test Server Actions and API routes         │
└─────────────────────────────────────────────┘
```

### 3.2 Database Connection Configuration Changes

**Required Changes to `lib/db/index.ts`:**

```typescript
// BEFORE (local PostgreSQL)
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || '';
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
```

```typescript
// AFTER (Supabase with transaction pooling)
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || '';

// CRITICAL: Disable prepared statements for Supabase transaction pooler
// Transaction mode does not support prepared statements
const queryClient = postgres(connectionString, {
  prepare: false,
  // Optional: configure connection pool
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
});

export const db = drizzle(queryClient, { schema });
```

**Key Change:** `prepare: false` option

**Why Required:**
- Supabase's transaction pooler (PgBouncer) cannot maintain prepared statements across pooled connections
- Without this setting, queries will fail with errors like: `prepared statement "s1" does not exist`
- This is documented in official Drizzle + Supabase integration guides

**No Other Code Changes Needed:**
- All Server Actions continue to work unchanged
- All API routes continue to work unchanged
- Authentication logic remains the same
- Schema definitions remain the same

### 3.3 Environment Variables Update

**Current `.env.local`:**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/recipe_discovery"
AUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

**Updated for Supabase:**
```bash
# Supabase PostgreSQL Connection (Transaction Pooling)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[DB-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Authentication (unchanged)
AUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Supabase API credentials (if using Supabase Auth/Storage later)
NEXT_PUBLIC_SUPABASE_URL="https://lmbrqiwzowiquebtsfyc.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**For Production (Vercel):**
- Set `DATABASE_URL` as environment variable in Vercel dashboard
- Use Vercel's environment variable encryption
- Never commit actual database password to git

### 3.4 Schema Migration Approach

**Option 1: Drizzle Push (Recommended for fresh migration)**

```bash
# Update drizzle.config.ts with Supabase connection
# Then push schema directly to Supabase
npm run db:push
```

**Pros:**
- Fast and simple
- Drizzle handles all DDL generation
- No migration files to manage

**Cons:**
- Not recommended for production with existing data
- Can't review changes before applying

**Option 2: Drizzle Migrate (Recommended for production)**

```bash
# Generate migration files from schema
npm run db:generate

# Review generated SQL in lib/db/migrations/

# Apply migrations to Supabase
npm run db:migrate
```

**Pros:**
- Version-controlled migration history
- Can review SQL before applying
- Safe for production environments
- Rollback capability

**Cons:**
- Requires manual review of migrations
- More steps involved

**Option 3: Manual SQL Export/Import**

```bash
# Export schema from local PostgreSQL
pg_dump -h localhost -U postgres -d recipe_discovery --schema-only > schema.sql

# Import to Supabase (via Supabase SQL Editor or psql)
psql $SUPABASE_DATABASE_URL -f schema.sql
```

**Pros:**
- Direct control over SQL
- Works with any PostgreSQL version
- Can customize during migration

**Cons:**
- Manual process
- Requires PostgreSQL CLI tools
- Loses Drizzle ORM integration

**Recommendation:** Use **Option 2 (Drizzle Migrate)** for this project because:
- Already using Drizzle Kit
- Provides migration history
- Type-safe and version-controlled
- Can be reviewed before applying

### 3.5 Data Migration Approach

**Step 1: Export Data from Local PostgreSQL**

```bash
# Export data only (no schema) from all tables
pg_dump -h localhost \
  -U postgres \
  -d recipe_discovery \
  --data-only \
  --column-inserts \
  --disable-triggers \
  -f data_export.sql

# Alternative: Export specific tables in correct order
pg_dump -h localhost -U postgres -d recipe_discovery \
  --data-only \
  --column-inserts \
  -t users \
  -t ingredients \
  -t dietary_tags \
  -t recipes \
  -t recipe_ingredients \
  -t instructions \
  -t recipe_dietary_tags \
  -t favorites \
  -t reviews \
  -f data_export.sql
```

**Step 2: Import Data to Supabase**

**Via Supabase SQL Editor:**
1. Navigate to Supabase Dashboard → SQL Editor
2. Paste contents of `data_export.sql`
3. Execute query
4. Verify row counts match

**Via psql CLI:**
```bash
psql $DATABASE_URL -f data_export.sql
```

**Step 3: Verify Data Integrity**

```sql
-- Check row counts match local database
SELECT 'users' AS table_name, COUNT(*) FROM users
UNION ALL
SELECT 'recipes', COUNT(*) FROM recipes
UNION ALL
SELECT 'ingredients', COUNT(*) FROM ingredients
UNION ALL
SELECT 'recipe_ingredients', COUNT(*) FROM recipe_ingredients
UNION ALL
SELECT 'instructions', COUNT(*) FROM instructions
UNION ALL
SELECT 'dietary_tags', COUNT(*) FROM dietary_tags
UNION ALL
SELECT 'recipe_dietary_tags', COUNT(*) FROM recipe_dietary_tags
UNION ALL
SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews;
```

**Data Migration Considerations:**

⚠️ **Foreign Key Constraints:**
- Import data in dependency order: `users` → `recipes` → `ingredients` → junction tables
- Or temporarily disable triggers: `SET session_replication_role = replica;`

⚠️ **UUID Generation:**
- Existing UUIDs are preserved during export/import
- New records will use PostgreSQL `gen_random_uuid()` (Supabase supports this)

⚠️ **Password Hashes:**
- bcrypt hashes are portable (stored as strings)
- No re-hashing required

### 3.6 Testing Strategy

**Testing Phases:**

**Phase 1: Connection Test**
```typescript
// Test basic database connectivity
const testConnection = async () => {
  const result = await db.execute(sql`SELECT NOW()`);
  console.log('Database time:', result.rows[0].now);
};
```

**Phase 2: Schema Verification**
```typescript
// Verify all tables exist
const tables = await db.execute(sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
`);
console.log('Tables:', tables.rows);
```

**Phase 3: CRUD Operations Test**
- Test recipe creation (with ingredients, instructions, tags)
- Test recipe fetching (with relations)
- Test recipe updates
- Test recipe deletion (verify cascade)
- Test user authentication
- Test favorites add/remove

**Phase 4: Server Actions Test**
- Run all Server Actions against Supabase
- Verify error handling
- Check transaction rollbacks
- Validate authorization checks

**Phase 5: Full Application Test**
- Run development server: `npm run dev`
- Test all user flows:
  - Sign up / Sign in
  - Browse recipes
  - Create new recipe
  - Edit recipe
  - Delete recipe
  - Add to favorites
  - Search recipes
  - Filter by dietary tags

**Phase 6: Performance Validation**
- Measure query response times
- Compare with local PostgreSQL baseline
- Check connection pool behavior
- Monitor cold start times (serverless)

**Automated Testing:**
```bash
# Run existing test suite
npm run test

# If tests exist, they should pass with Supabase
```

---

## 4. Supabase-Specific Considerations

### 4.1 Connection Pooling Deep Dive

**Why Connection Pooling Matters for Next.js:**

Next.js App Router (and Vercel deployment) are **serverless** by default. Every request can create a new database connection. Without pooling:
- ❌ "Too many connections" errors
- ❌ Slow connection establishment
- ❌ Database resource exhaustion

**Supabase Pooler (Supavisor) Architecture:**

```
Next.js Request → Supabase Pooler → PostgreSQL
                  (Connection Pool)
```

**Two Pooling Modes:**

| Feature | Session Mode | Transaction Mode |
|---------|-------------|------------------|
| Connection String | `port: 5432` | `port: 6543` or `?pgbouncer=true` |
| Prepared Statements | ✅ Supported | ❌ Not Supported |
| Best For | Long-lived connections | Serverless/Edge Functions |
| Drizzle Config | No special config | `prepare: false` required |
| Latency | Higher (session overhead) | Lower (transaction pooling) |

**For This Migration:** Use **Transaction Mode** with `prepare: false`

### 4.2 Drizzle ORM + Supabase Best Practices

**1. Connection Configuration**
```typescript
const queryClient = postgres(connectionString, {
  prepare: false,        // REQUIRED for transaction pooler
  max: 10,               // Connection pool size
  idle_timeout: 20,      // Close idle connections
  connect_timeout: 10,   // Connection timeout
});
```

**2. Schema Compatibility**
- ✅ All Drizzle `pg-core` types are supported
- ✅ `pgEnum`, `uuid`, `decimal`, `timestamp` all work
- ✅ Foreign keys with cascade
- ✅ Indexes and constraints
- ⚠️ Custom PostgreSQL extensions may need enabling in Supabase

**3. Drizzle Studio with Supabase**
```bash
# Drizzle Studio works with Supabase
npm run db:studio

# Opens visual database editor at http://localhost:4983
```

**4. Migration Files Location**
- Store in `lib/db/migrations/` (as currently configured)
- Commit to git for version control
- Apply to Supabase via `npm run db:migrate`

### 4.3 Supabase Dashboard Features

**Useful Features for Development:**

1. **SQL Editor**
   - Run ad-hoc queries
   - View query execution plans
   - Export results as CSV/JSON

2. **Table Editor**
   - Visual table browser
   - Edit rows directly
   - View relationships

3. **Database Backups**
   - Automatic daily backups (Pro plan)
   - Point-in-time recovery (Pro plan)
   - Manual backup export

4. **Logs**
   - Query logs
   - Connection logs
   - Error logs

5. **API Documentation**
   - Auto-generated REST API (if needed)
   - GraphQL endpoint (if needed)

**Note:** We're not using Supabase's auto-generated APIs - we have our own Next.js API routes and Server Actions.

### 4.4 Security & Row Level Security (RLS)

**Supabase Row Level Security (RLS):**

Supabase strongly recommends enabling RLS for security. However, **for this migration**, we can **skip RLS** initially because:

✅ **Authentication is handled by NextAuth.js**, not Supabase Auth
✅ **Authorization checks are in Server Actions** (server-side validation)
✅ **Database is not exposed publicly** (only accessed via Next.js backend)
✅ **Service role key is not used in client code**

**If we wanted RLS (optional future enhancement):**

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid()::text = id::text);
```

**Current Approach (Recommended):** Rely on NextAuth.js + Server Actions for authorization, **skip RLS** to avoid complexity during migration.

### 4.5 Cost Considerations

**Supabase Free Tier Limits:**
- ✅ 500 MB database size (sufficient for recipe app MVP)
- ✅ Unlimited API requests
- ✅ 50,000 monthly active users
- ✅ 2 GB bandwidth
- ✅ Daily backups (7-day retention)

**Estimated Usage for Recipe App:**
- Users table: ~10 KB per user × 1000 users = 10 MB
- Recipes table: ~5 KB per recipe × 5000 recipes = 25 MB
- Ingredients: ~1 MB
- Total: ~40-50 MB (well within 500 MB limit)

**Upgrade Path:**
- Pro Plan: $25/month (8 GB database, better backups, more support)
- Team Plan: $599/month (higher limits, dedicated support)

**Constitutional Compliance:** ✅ Free tier stays within $20/month cost cap

---

## 5. Authentication Strategy Decision

### 5.1 Options Analysis

**Option 1: Keep NextAuth.js (Recommended)**

✅ **Pros:**
- No authentication migration required
- Existing code works unchanged
- Full control over auth flows
- Zero vendor lock-in

❌ **Cons:**
- No built-in OAuth providers without additional config
- Manual password reset flows
- No built-in MFA/2FA

**Option 2: Migrate to Supabase Auth**

✅ **Pros:**
- Built-in OAuth (Google, GitHub, etc.)
- Magic link authentication
- Built-in MFA/2FA
- Phone authentication
- Password reset flows

❌ **Cons:**
- Requires authentication migration
- More code changes
- User data migration complexity
- Vendor lock-in to Supabase

**Option 3: Hybrid (NextAuth.js + Supabase Auth Adapter)**

✅ **Pros:**
- Can use Supabase Auth features
- Keep NextAuth.js patterns
- Gradual migration path

❌ **Cons:**
- More complexity
- Two authentication systems
- Potential sync issues

### 5.2 Recommendation

**Keep NextAuth.js for this migration** because:

1. **Scope minimization** - Migration is already focused on database
2. **Working authentication** - No need to fix what isn't broken
3. **Lower risk** - Avoid touching critical auth flows
4. **Constitutional compliance** - Minimize changes, reduce failure points

**Future Enhancement Path:**
- **Phase 2:** Could migrate to Supabase Auth if OAuth/MFA needed
- **Phase 2:** Could add social login via NextAuth.js providers
- **Phase 2:** Could implement magic links via custom implementation

---

## 6. Migration Checklist & Implementation Plan

### 6.1 Pre-Migration Checklist

- [ ] Verify Supabase project is provisioned
- [ ] Obtain Supabase database connection string
- [ ] Obtain Supabase database password
- [ ] Test connectivity to Supabase from local machine
- [ ] Backup existing local database
- [ ] Document current row counts for validation
- [ ] Review current schema for Supabase compatibility
- [ ] Identify any custom PostgreSQL extensions used

### 6.2 Migration Execution Checklist

**Phase 1: Environment Setup**
- [ ] Copy existing project to new migration directory
- [ ] Create `.env.local` with Supabase connection string
- [ ] Install any missing dependencies
- [ ] Update `lib/db/index.ts` with `prepare: false`
- [ ] Test database connection with simple query

**Phase 2: Schema Migration**
- [ ] Generate migrations: `npm run db:generate`
- [ ] Review generated migration SQL files
- [ ] Apply migrations to Supabase: `npm run db:migrate`
- [ ] Verify all tables exist in Supabase Dashboard
- [ ] Verify indexes are created
- [ ] Verify foreign key constraints

**Phase 3: Data Migration**
- [ ] Export data from local PostgreSQL
- [ ] Import data to Supabase via SQL Editor
- [ ] Verify row counts match
- [ ] Test foreign key relationships
- [ ] Verify UUID values preserved
- [ ] Test authentication with migrated users

**Phase 4: Code Validation**
- [ ] Run application locally against Supabase
- [ ] Test user sign up
- [ ] Test user sign in
- [ ] Test recipe creation
- [ ] Test recipe listing
- [ ] Test recipe search
- [ ] Test favorites
- [ ] Test Server Actions
- [ ] Test API routes
- [ ] Run automated tests (if exist)

**Phase 5: Performance Validation**
- [ ] Measure query response times
- [ ] Test under load (concurrent requests)
- [ ] Verify connection pooling works
- [ ] Check for connection errors
- [ ] Monitor Supabase Dashboard logs

**Phase 6: Deployment Preparation**
- [ ] Update production environment variables
- [ ] Test staging deployment (if applicable)
- [ ] Document rollback plan
- [ ] Create deployment runbook

### 6.3 Post-Migration Validation

**Data Integrity Checks:**
```sql
-- Verify record counts
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM recipes;
SELECT COUNT(*) FROM recipe_ingredients;

-- Verify foreign key relationships
SELECT r.id, r.title, u.name
FROM recipes r
JOIN users u ON r.user_id = u.id
LIMIT 5;

-- Verify cascade deletes work
-- (Test in development only)
```

**Functional Checks:**
- [ ] Can create new user account
- [ ] Can sign in with existing account
- [ ] Can create new recipe
- [ ] Can edit existing recipe
- [ ] Can delete recipe (verify cascade)
- [ ] Can add/remove favorites
- [ ] Can search recipes
- [ ] Can filter by dietary tags

**Performance Checks:**
- [ ] Page load times acceptable
- [ ] API response times < 500ms
- [ ] No connection pool exhaustion
- [ ] No "too many connections" errors

---

## 7. Risk Assessment & Mitigation

### 7.1 Identified Risks

| Risk | Likelihood | Impact | Severity | Mitigation Strategy |
|------|-----------|--------|----------|---------------------|
| Data loss during migration | Low | High | 🔴 Critical | Create full database backup before migration; test import/export process in staging first |
| Connection errors due to `prepare: false` omission | Medium | High | 🔴 Critical | Follow official Drizzle + Supabase docs; test thoroughly locally before deploying |
| Foreign key constraint violations during data import | Medium | Medium | 🟡 Medium | Import data in correct dependency order; use `--disable-triggers` flag if needed |
| Authentication breaks after migration | Low | High | 🔴 Critical | NextAuth.js is database-agnostic; test auth flows before full migration |
| Performance degradation vs local database | Low | Medium | 🟡 Medium | Use connection pooling; monitor query times; optimize slow queries |
| Exceeding Supabase free tier limits | Low | Low | 🟢 Low | Monitor database size; stay well under 500 MB limit |
| Schema migration generates incorrect SQL | Low | Medium | 🟡 Medium | Review generated migration files before applying; test in development first |
| UUID generation incompatibility | Very Low | Medium | 🟡 Medium | Supabase supports `gen_random_uuid()`; existing UUIDs are preserved |

### 7.2 Rollback Plan

**If migration fails catastrophically:**

1. **Immediate Rollback:**
   ```bash
   # Revert .env.local to local database
   DATABASE_URL="postgresql://user:password@localhost:5432/recipe_discovery"

   # Restart application
   npm run dev
   ```

2. **Restore from Backup:**
   ```bash
   # If local database was corrupted
   psql -U postgres -d recipe_discovery < backup.sql
   ```

3. **Code Rollback:**
   ```bash
   # Revert database configuration changes
   git checkout lib/db/index.ts
   ```

**Success Criteria for Rollback:**
- Application runs against local database
- All data is intact
- Authentication works
- No errors in logs

**Decision Point:** If any critical functionality breaks (auth, recipe CRUD), rollback immediately and debug in isolation.

### 7.3 Contingency Plans

**Scenario 1: Supabase connection pooler issues**
- **Symptom:** "Prepared statement does not exist" errors
- **Solution:** Verify `prepare: false` is set; check connection string uses transaction mode
- **Fallback:** Use session mode pooler (port 5432) temporarily while debugging

**Scenario 2: Data import fails**
- **Symptom:** Foreign key constraint errors, unique violations
- **Solution:** Import in correct table order; check for duplicate data
- **Fallback:** Use Supabase SQL Editor to manually debug and fix constraints

**Scenario 3: Performance issues**
- **Symptom:** Slow queries, timeouts
- **Solution:** Check indexes exist; optimize N+1 queries; add database indexes
- **Fallback:** Temporarily increase connection pool size; cache frequent queries

---

## 8. Key Technical Resources

### 8.1 Official Documentation

**Drizzle ORM + Supabase:**
- [Drizzle ORM - Drizzle with Supabase Database](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase)
- [Drizzle ORM - Connect to Supabase](https://orm.drizzle.team/docs/connect-supabase)
- [Drizzle ORM - Get Started with Supabase (Existing)](https://orm.drizzle.team/docs/get-started/supabase-existing)

**Supabase:**
- [Supabase Docs - Drizzle Integration](https://supabase.com/docs/guides/database/drizzle)
- [Supabase Docs - Connect to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase Troubleshooting - Supavisor FAQ](https://supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI)

**Next.js + Drizzle:**
- [Using Drizzle ORM with Supabase in Next.js: A Complete Guide](https://makerkit.dev/blog/tutorials/drizzle-supabase)
- [Database Management Using Drizzle ORM, Supabase, and Next.js](https://blog.stackademic.com/database-management-using-drizzle-orm-supabase-and-next-js-13904b38c818)

### 8.2 Key Insights from Research

**Critical Configuration Requirement:**
> "When using connection pooling via Supabase with 'Transaction' pool mode enabled, you must turn off prepare, as prepared statements are not supported."
>
> Source: [Drizzle ORM - Get Started with Supabase](https://orm.drizzle.team/docs/get-started/supabase-existing)

**Connection Pooling Best Practice:**
> "The transaction mode connection string connects to your Postgres instance via a proxy which serves as a connection pooler. This is ideal for serverless or edge functions."
>
> Source: [Supabase Docs - Connect to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)

**Drizzle Configuration:**
> "Disable prefetch as it is not supported for 'Transaction' pool mode"
>
> Source: Multiple Drizzle + Supabase integration guides

### 8.3 Community Resources

**GitHub Examples:**
- [smallStall/drizzleorm-supabase-nextjs](https://github.com/smallStall/drizzleorm-supabase-nextjs) - Reference implementation
- [Drizzle + Supabase in Next.js API route discussion](https://github.com/orgs/supabase/discussions/19265)

**Blog Posts:**
- [Streamlining Your Next.js Projects with Supabase and Drizzle ORM](https://dev.to/musebe/streamlining-your-nextjs-projects-with-supabase-and-drizzle-orm-4gam)
- [How to Use Drizzle ORM with PostgreSQL in Next.js 15](https://strapi.io/blog/how-to-use-drizzle-orm-with-postgresql-in-a-nextjs-15-project)

---

## 9. Decision Summary

### 9.1 Final Technical Decisions

| Decision Point | Choice | Rationale |
|----------------|--------|-----------|
| **Database Provider** | Supabase PostgreSQL | Managed hosting, connection pooling, free tier, production-ready |
| **ORM** | Keep Drizzle ORM | Already in use, fully compatible with Supabase, no migration needed |
| **Connection Mode** | Transaction Pooling | Best for Next.js serverless, lower latency, handles bursts |
| **Authentication** | Keep NextAuth.js | Working solution, lower migration risk, no auth migration needed |
| **Schema Migration** | Drizzle Migrate | Version-controlled, reviewable, safe for production |
| **Data Migration** | pg_dump → SQL import | Standard approach, preserves data integrity, testable |
| **Row Level Security** | Skip for now | Not needed with NextAuth.js + Server Actions authorization |
| **Deployment** | Vercel (unchanged) | Already optimized for Next.js, works seamlessly with Supabase |

### 9.2 Code Changes Required

**Minimal Changes (1 file modified):**

1. **`lib/db/index.ts`** - Add `prepare: false` to postgres client config
2. **`.env.local`** - Update `DATABASE_URL` to Supabase connection string

**No Changes Required:**
- ❌ Schema definitions (`lib/db/schema.ts`)
- ❌ Server Actions (`actions/*.ts`)
- ❌ API Routes (`app/api/**/*.ts`)
- ❌ Authentication config (`lib/auth.ts`)
- ❌ UI Components (`components/**`)
- ❌ Drizzle config (`drizzle.config.ts` - only URL changes)

### 9.3 Migration Effort Estimate

| Phase | Estimated Time | Complexity |
|-------|---------------|------------|
| Supabase setup | 30 minutes | Low |
| Schema migration | 1 hour | Low |
| Code updates | 30 minutes | Low |
| Data migration | 1-2 hours | Medium |
| Testing | 2-3 hours | Medium |
| Documentation | 1 hour | Low |
| **Total** | **6-8 hours** | **Low-Medium** |

**Risk Level:** 🟡 **Low-Medium**

The migration is relatively straightforward because:
- Same database engine (PostgreSQL → PostgreSQL)
- Same ORM (Drizzle ORM)
- Minimal code changes
- No authentication migration
- Well-documented process

---

## 10. Next Steps (Step 2 Preview)

This research document completes **Step 1: Research existing patterns and plan approach**.

**Step 2: Initialize project with Next.js and TypeScript** will involve:

1. **Copy existing application** to new migration directory
2. **Update database connection** with Supabase credentials
3. **Configure connection pooling** with `prepare: false`
4. **Test basic connectivity** to Supabase
5. **Prepare for schema migration** (Step 3)

**Success Criteria for Step 2:**
- [ ] New project directory created
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database connection working
- [ ] Application runs locally (against Supabase)

---

## 11. Conclusion

This migration from local PostgreSQL to Supabase is **well-supported and low-risk** due to:

✅ **Technology compatibility** - Drizzle ORM officially supports Supabase
✅ **Minimal code changes** - Only database connection config needs updating
✅ **Same database engine** - PostgreSQL to PostgreSQL (no schema conversion)
✅ **No authentication migration** - NextAuth.js continues to work unchanged
✅ **Clear documentation** - Official guides from both Drizzle and Supabase
✅ **Proven pattern** - Many production Next.js apps use this stack

**Key Success Factor:** Setting `prepare: false` in the postgres client configuration for Supabase's transaction pooling mode.

**Ready to proceed with Step 2: Initialize project with Next.js and TypeScript.**

---

## Sources

**Drizzle + Supabase Integration:**
- [Drizzle ORM - Drizzle with Supabase Database](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase)
- [Drizzle ORM - Connect to Supabase](https://orm.drizzle.team/docs/connect-supabase)
- [Drizzle ORM - PostgreSQL (Supabase)](https://orm.drizzle.team/docs/get-started/supabase-existing)
- [Using Drizzle ORM with Supabase in Next.js: A Complete Guide](https://makerkit.dev/blog/tutorials/drizzle-supabase)
- [Streamlining Your Next.js Projects with Supabase and Drizzle ORM](https://dev.to/musebe/streamlining-your-nextjs-projects-with-supabase-and-drizzle-orm-4gam)

**Connection Pooling:**
- [Supabase Troubleshooting - Supavisor FAQ](https://supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI)
- [Connect to your database | Supabase Docs](https://supabase.com/docs/guides/database/connecting-to-postgres)

**Next.js + Database Integration:**
- [How to Use Drizzle ORM with PostgreSQL in Next.js 15](https://strapi.io/blog/how-to-use-drizzle-orm-with-postgresql-in-a-nextjs-15-project)
- [Database Management Using Drizzle ORM, Supabase, and Next.js](https://blog.stackademic.com/database-management-using-drizzle-orm-supabase-and-next-js-13904b38c818)

**Authentication:**
- [Supabase Auth with the Next.js App Router](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Auth.js | Supabase Adapter](https://authjs.dev/getting-started/adapters/supabase)
