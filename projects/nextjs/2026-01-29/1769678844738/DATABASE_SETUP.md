# Database Setup Guide

This guide explains how to set up and use the PostgreSQL database with Drizzle ORM for the Retro Analytics Dashboard.

---

## Overview

- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Migration Tool:** Drizzle Kit
- **Schema Version:** 1.0

---

## Prerequisites

You need a PostgreSQL database. Choose one of the following options:

### Option 1: Vercel Postgres (Recommended for Production)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new Postgres database
3. Copy the `DATABASE_URL` connection string

### Option 2: Neon (Serverless PostgreSQL)
1. Go to [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string

### Option 3: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database: `createdb retro_analytics`
3. Connection string: `postgresql://postgres:password@localhost:5432/retro_analytics`

---

## Setup Instructions

### 1. Configure Environment Variables

Copy `.env.example` to `.env` and update the `DATABASE_URL`:

```bash
cp .env.example .env
```

Update `.env`:
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

### 2. Run Migrations

Apply the database schema to your PostgreSQL database:

```bash
npm run db:push
```

Or use migrations (for production):

```bash
npm run db:migrate
```

### 3. Seed Sample Data (Optional)

Populate the database with sample data for development:

```bash
npm run db:seed
```

This creates:
- 2 sample users
- 100 analytics events (over past 30 days)
- 28 aggregated metrics (7 days × 4 metric types)
- 3 saved reports

### 4. Explore Data with Drizzle Studio

Launch Drizzle Studio to visually explore your database:

```bash
npm run db:studio
```

Opens at `https://local.drizzle.studio`

---

## Database Schema

### Tables

#### Authentication Tables
- **users** - User accounts
- **accounts** - OAuth provider accounts
- **sessions** - User sessions
- **verification_tokens** - Email verification and password reset tokens

#### Analytics Tables
- **analytics_events** - Raw analytics events (page views, clicks, etc.)
- **analytics_metrics** - Pre-aggregated metrics for dashboard performance
- **saved_reports** - User-saved custom reports and dashboard configurations

### Relationships

```
users (1) ─── (M) accounts
users (1) ─── (M) sessions
users (1) ─── (M) analytics_events
users (1) ─── (M) saved_reports
```

See `DATABASE_SCHEMA.md` for detailed schema documentation.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run db:generate` | Generate migration files from schema changes |
| `npm run db:migrate` | Apply migrations to database |
| `npm run db:push` | Push schema changes directly (dev only) |
| `npm run db:studio` | Launch Drizzle Studio |
| `npm run db:seed` | Seed database with sample data |

---

## Usage Examples

### Importing the Database Client

```typescript
import { db } from '@/lib/db'
import { users, analyticsEvents } from '@/lib/db/schema'
```

### Querying Data

```typescript
// Get all users
const allUsers = await db.select().from(users)

// Get user by email
const user = await db.select()
  .from(users)
  .where(eq(users.email, 'admin@retrodash.dev'))
  .limit(1)

// Get analytics events for the past 7 days
const recentEvents = await db.select()
  .from(analyticsEvents)
  .where(gte(analyticsEvents.timestamp, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
  .orderBy(desc(analyticsEvents.timestamp))
```

### Inserting Data

```typescript
// Create a new user
const newUser = await db.insert(users).values({
  email: 'newuser@example.com',
  name: 'New User',
}).returning()

// Track an analytics event
await db.insert(analyticsEvents).values({
  userId: user.id,
  eventType: 'page_view',
  eventName: 'Dashboard View',
  path: '/dashboard',
  metadata: { browser: 'chrome' },
  timestamp: new Date(),
})
```

### Updating Data

```typescript
import { eq } from 'drizzle-orm'

// Update user name
await db.update(users)
  .set({ name: 'Updated Name' })
  .where(eq(users.id, userId))
```

### Deleting Data

```typescript
// Delete old analytics events (older than 90 days)
await db.delete(analyticsEvents)
  .where(lt(analyticsEvents.timestamp, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)))
```

---

## Migration Workflow

### Making Schema Changes

1. Edit `lib/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review the generated SQL in `drizzle/` directory
4. Apply migration: `npm run db:migrate`

### Development vs Production

**Development:**
- Use `npm run db:push` for rapid iteration
- Pushes schema changes directly without migration files

**Production:**
- Always use migrations: `npm run db:generate` → `npm run db:migrate`
- Track migration files in version control
- Never use `db:push` in production

---

## Performance Considerations

### Indexes

The schema includes indexes on:
- User lookup: `email`
- Analytics queries: `event_type`, `timestamp`, `user_id`
- Metrics queries: `metric_type`, `start_time`
- Reports: `user_id`, `is_public`

### Data Retention

Consider implementing:
- Archive old events after 90 days
- Pre-aggregate raw events into metrics
- Partition large tables by date

### Connection Pooling

The database client is configured with:
- Maximum 10 connections
- 20-second idle timeout
- 10-second connect timeout

For high-traffic production, consider:
- Connection pooling with PgBouncer
- Read replicas for analytics queries
- Caching layer (Redis)

---

## Troubleshooting

### "Cannot connect to database"
- Verify `DATABASE_URL` in `.env`
- Check database is running
- Verify network access (firewalls, IP whitelisting)

### "Table does not exist"
- Run migrations: `npm run db:migrate` or `npm run db:push`

### "Type errors in schema"
- Run `npm run type-check`
- Ensure Drizzle ORM version matches schema syntax

### Build fails
- Database connection is optional during build
- Ensure `DATABASE_URL` is set for runtime, not required for build

---

## Next Steps

1. ✅ Database schema designed and implemented
2. ⏭️ **Step 4:** Implement authentication system (Auth.js integration)
3. **Step 5:** Build core API endpoints using the database
4. **Step 6:** Create UI components to display analytics data
5. **Step 7:** Connect everything together
6. **Step 8:** Testing and quality assurance

---

## Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- [Vercel Postgres Guide](https://vercel.com/docs/storage/vercel-postgres)
- [Drizzle Kit CLI Reference](https://orm.drizzle.team/kit-docs/overview)

---

**Last Updated:** January 29, 2026
**Schema Version:** 1.0
