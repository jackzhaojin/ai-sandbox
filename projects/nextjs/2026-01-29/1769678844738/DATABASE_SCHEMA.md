# Database Schema Design

**Project:** Full-Stack Retro Analytics Dashboard
**Database:** PostgreSQL
**ORM:** Drizzle ORM
**Date:** January 29, 2026

---

## Overview

This document describes the database schema for the retro analytics dashboard. The schema supports user management, analytics event tracking, aggregated metrics, and saved reports.

---

## Tables

### 1. `users`
Stores user account information for authentication and authorization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier |
| email | varchar(255) | UNIQUE, NOT NULL | User email address |
| name | varchar(255) | NULL | User display name |
| password_hash | varchar(255) | NULL | Hashed password (for credentials auth) |
| email_verified | timestamp | NULL | Email verification timestamp |
| image | text | NULL | Profile image URL |
| created_at | timestamp | NOT NULL, DEFAULT now() | Account creation timestamp |
| updated_at | timestamp | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`

---

### 2. `accounts`
Stores OAuth provider information (for NextAuth.js integration).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique account identifier |
| user_id | uuid | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Associated user |
| provider | varchar(255) | NOT NULL | OAuth provider (github, google, etc.) |
| provider_account_id | varchar(255) | NOT NULL | Provider's user ID |
| refresh_token | text | NULL | OAuth refresh token |
| access_token | text | NULL | OAuth access token |
| expires_at | integer | NULL | Token expiration timestamp |
| token_type | varchar(255) | NULL | Token type |
| scope | varchar(255) | NULL | OAuth scope |
| id_token | text | NULL | OpenID Connect ID token |
| session_state | varchar(255) | NULL | Session state |
| created_at | timestamp | NOT NULL, DEFAULT now() | Account creation timestamp |
| updated_at | timestamp | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `(provider, provider_account_id)`
- INDEX on `user_id`

---

### 3. `sessions`
Stores user session data (for NextAuth.js).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique session identifier |
| session_token | varchar(255) | UNIQUE, NOT NULL | Session token |
| user_id | uuid | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Associated user |
| expires | timestamp | NOT NULL | Session expiration timestamp |
| created_at | timestamp | NOT NULL, DEFAULT now() | Session creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `session_token`
- INDEX on `user_id`

---

### 4. `verification_tokens`
Stores email verification tokens and password reset tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| identifier | varchar(255) | NOT NULL | Email or user identifier |
| token | varchar(255) | UNIQUE, NOT NULL | Verification token |
| expires | timestamp | NOT NULL | Token expiration timestamp |

**Indexes:**
- UNIQUE INDEX on `(identifier, token)`

---

### 5. `analytics_events`
Stores raw analytics events for tracking user interactions, page views, etc.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique event identifier |
| user_id | uuid | NULL, REFERENCES users(id) ON DELETE SET NULL | Associated user (null for anonymous) |
| event_type | varchar(100) | NOT NULL | Event type (page_view, click, error, etc.) |
| event_name | varchar(255) | NOT NULL | Specific event name |
| path | varchar(500) | NULL | URL path where event occurred |
| metadata | jsonb | NULL | Additional event metadata |
| user_agent | text | NULL | Browser user agent |
| ip_address | varchar(45) | NULL | User IP address (IPv4 or IPv6) |
| timestamp | timestamp | NOT NULL, DEFAULT now() | Event timestamp |
| session_id | varchar(255) | NULL | Session identifier for grouping |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `event_type`
- INDEX on `timestamp DESC` (for time-based queries)
- INDEX on `(event_type, timestamp DESC)` (composite for filtered time queries)
- GIN INDEX on `metadata` (for JSONB queries)

---

### 6. `analytics_metrics`
Stores pre-aggregated analytics metrics for faster dashboard queries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique metric identifier |
| metric_type | varchar(100) | NOT NULL | Metric type (daily_views, hourly_clicks, etc.) |
| metric_name | varchar(255) | NOT NULL | Specific metric name |
| metric_value | numeric(20, 4) | NOT NULL | Aggregated metric value |
| dimensions | jsonb | NULL | Metric dimensions (e.g., {page: "/home", device: "mobile"}) |
| start_time | timestamp | NOT NULL | Metric time window start |
| end_time | timestamp | NOT NULL | Metric time window end |
| created_at | timestamp | NOT NULL, DEFAULT now() | Metric creation timestamp |
| updated_at | timestamp | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `metric_type`
- INDEX on `(metric_type, start_time DESC)`
- INDEX on `(start_time DESC, end_time DESC)`
- GIN INDEX on `dimensions`

---

### 7. `saved_reports`
Stores user-saved custom reports and dashboard configurations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique report identifier |
| user_id | uuid | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Report owner |
| name | varchar(255) | NOT NULL | Report name |
| description | text | NULL | Report description |
| config | jsonb | NOT NULL | Report configuration (filters, charts, etc.) |
| is_public | boolean | NOT NULL, DEFAULT false | Whether report is shared publicly |
| created_at | timestamp | NOT NULL, DEFAULT now() | Report creation timestamp |
| updated_at | timestamp | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `(user_id, created_at DESC)`
- INDEX on `is_public` (for public reports)

---

## Relationships

```
users (1) ─── (M) accounts
users (1) ─── (M) sessions
users (1) ─── (M) analytics_events
users (1) ─── (M) saved_reports
```

---

## Performance Considerations

### 1. Partitioning
For large-scale analytics, consider partitioning `analytics_events` by date:
```sql
-- Example: Partition by month
CREATE TABLE analytics_events_2026_01 PARTITION OF analytics_events
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

### 2. Data Retention
Implement a retention policy to archive old events:
- Keep raw `analytics_events` for 90 days
- Aggregate into `analytics_metrics` for long-term storage
- Archive old events to cold storage or delete

### 3. Pre-aggregation
Use background jobs to populate `analytics_metrics`:
- Hourly aggregation for real-time metrics
- Daily aggregation for historical trends
- Weekly/monthly rollups for long-term analysis

---

## Security Considerations

1. **Password Storage**: Always hash passwords with bcrypt (cost factor 12+)
2. **PII Protection**: IP addresses and user agents are PII - consider anonymization
3. **Row-Level Security**: Implement PostgreSQL RLS policies for multi-tenant access
4. **Encryption**: Use TLS for database connections (Vercel Postgres includes this)

---

## Migration Strategy

1. **Initial Schema**: Create all tables with indexes
2. **Seed Data**: Add sample analytics events and metrics for development
3. **Version Control**: Track schema changes with Drizzle migrations
4. **Rollback Plan**: Maintain down migrations for schema rollback

---

## Next Steps

1. Implement schema using Drizzle ORM (`lib/db/schema.ts`)
2. Create migration files with `drizzle-kit generate`
3. Run migrations with `drizzle-kit migrate`
4. Add seed data script for development
5. Set up connection pooling for production

---

**Schema Version:** 1.0
**Last Updated:** January 29, 2026
