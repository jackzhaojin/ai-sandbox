# Migration Instructions

## ⚠️ IMPORTANT: Apply Schema Migrations First

Before running the seed script, you MUST apply the database schema migrations to create all required tables.

### Option 1: Via Supabase SQL Editor (Recommended)

1. Log in to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the contents of `drizzle/migrations/0000_marvelous_sabretooth.sql`
5. Paste into the SQL Editor
6. Click **RUN** to execute
7. Repeat for `drizzle/migrations/0001_auth_trigger.sql` and `0002_rls_policies.sql`

### Option 2: Via Drizzle Push (Requires DATABASE_URL)

If you have a proper DATABASE_URL configured with the database password:

```bash
npm run db:push
```

### After Migrations Are Applied

Run the seed script to populate the database with sample data:

```bash
npm run db:seed
```

This will create:
- 3 test users (admin, author, viewer)
- 1 demo site
- 16 component definitions
- 5 page templates
- 2 content fragments
- 3 sample pages
- 2 navigation menus

##Test Credentials

After seeding, you can log in with:

- **Admin**: admin@pageforge.dev / password123
- **Author**: author@pageforge.dev / password123
- **Viewer**: viewer@pageforge.dev / password123
