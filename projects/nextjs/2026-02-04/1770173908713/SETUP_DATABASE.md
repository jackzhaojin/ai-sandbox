# Database Setup Instructions

This document provides step-by-step instructions for pushing the schema and seed data to Supabase.

## Prerequisites

✅ **Already completed:**
- Drizzle ORM installed (v0.45.1)
- Database schema files copied (`src/lib/db/schema.ts`)
- Seed script ready (`src/lib/db/seed.ts`)
- SQL migrations generated (`src/lib/db/migrations/0000_moaning_retro_girl.sql`)
- Drizzle config created (`drizzle.config.ts`)
- npm scripts added to `package.json`

## Step 1: Get Your Database Password

You need to retrieve your Supabase database password to complete the migration:

### Option A: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/lmbrqiwzowiquebtsfyc
2. Click "Project Settings" (gear icon in bottom left)
3. Click "Database" under the Configuration section
4. Scroll to "Connection string"
5. Select the **"Transaction"** tab (important for serverless compatibility)
6. Click "**Reveal**" to show the connection string with the password

The connection string will look like:
```
postgresql://postgres.lmbrqiwzowiquebtsfyc:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Option B: Reset Password (If you don't have it)

1. Go to the same Database settings page
2. Click "Reset database password"
3. Enter a new secure password (use a password manager)
4. Click "Reset" - note that existing connections will need to be updated

## Step 2: Update `.env.local`

Open `.env.local` and replace `[REPLACE-WITH-YOUR-DB-PASSWORD]` with your actual database password:

```bash
DATABASE_URL="postgresql://postgres.lmbrqiwzowiquebtsfyc:YOUR_ACTUAL_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

**Important:** Make sure to use the **Transaction mode** connection string (port 6543) as shown above.

## Step 3: Push Schema to Supabase

Run the following command to create all tables and indexes in your Supabase database:

```bash
npm run db:push
```

This command will:
- Connect to Supabase using your DATABASE_URL
- Create 3 PostgreSQL enums (difficulty, ingredient_category, unit)
- Create 9 tables (users, recipes, ingredients, instructions, etc.)
- Create 13 indexes for query performance
- Set up all foreign key constraints

**Expected output:**
```
[✓] Your SQL migration file ➜ src/lib/db/migrations/0000_moaning_retro_girl.sql 🚀
[✓] Pushing schema to database...
[✓] Schema pushed successfully
```

## Step 4: Seed the Database

After the schema is created, populate it with sample data:

```bash
npm run db:seed
```

This will create:
- **2 users** (chef@example.com, baker@example.com)
- **30+ ingredients** (vegetables, proteins, grains, spices, etc.)
- **5 dietary tags** (Vegetarian, Vegan, Gluten-Free, Dairy-Free, Keto)
- **3 sample recipes** with full instructions and ingredient lists

**Test credentials:**
- Email: `chef@example.com`
- Email: `baker@example.com`
- Password: `password123`

**Expected output:**
```
🌱 Starting database seed...
Creating users...
✅ Users created
Creating dietary tags...
✅ Dietary tags created
Creating ingredients...
✅ Ingredients created
Creating recipes...
✅ Recipes created

🎉 Database seeding completed successfully!

📊 Summary:
- Users: 2
- Ingredients: 30+
- Dietary Tags: 5
- Recipes: 3
```

## Step 5: Verify in Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/lmbrqiwzowiquebtsfyc/editor
2. Click on the "Table Editor" tab
3. You should see all 9 tables listed
4. Click on "users" - you should see 2 users
5. Click on "recipes" - you should see 3 recipes
6. Click on "ingredients" - you should see 30+ ingredients

## Troubleshooting

### Error: "prepared statement does not exist"

This means you're using the wrong connection mode. Make sure you're using **Transaction mode** (port 6543) with `prepare: false` in the connection config. This is already configured in `src/lib/db/index.ts`.

### Error: "password authentication failed"

Your database password in `.env.local` is incorrect. Go back to Step 1 and retrieve the correct password from the dashboard.

### Error: "relation already exists"

Some tables already exist in your database. You can either:
- Drop all tables manually in the Supabase SQL editor
- Or use a different Supabase project

### Connection timeout

Check that your DATABASE_URL is correct and that you have internet connectivity. The Supabase pooler endpoint should be accessible.

## Alternative: Manual Migration via SQL Editor

If you prefer not to use DATABASE_URL, you can manually execute the migration SQL:

1. Open `src/lib/db/migrations/0000_moaning_retro_girl.sql`
2. Copy the entire contents
3. Go to https://supabase.com/dashboard/project/lmbrqiwzowiquebtsfyc/sql/new
4. Paste the SQL
5. Click "Run"
6. Then manually run the seed script after updating .env.local

## Summary

Once you complete these steps:

✅ Schema created (9 tables, 13 indexes)
✅ Data seeded (2 users, 30+ ingredients, 5 tags, 3 recipes)
✅ Ready for application development

Next step: Validate the application works against Supabase (Step 4 of the migration plan).
