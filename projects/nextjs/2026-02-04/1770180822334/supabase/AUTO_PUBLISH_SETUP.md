# Auto-Publish Setup

This document explains how to set up the automatic publishing feature for scheduled pages.

## Overview

Pages with `status='scheduled'` and `scheduled_publish_at <= NOW()` are automatically published every 5 minutes by a Supabase Edge Function triggered by pg_cron.

## Setup Instructions

### 1. Deploy the Edge Function

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy auto-publish-pages
```

### 2. Set Up pg_cron

Execute the following SQL in your Supabase SQL Editor:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job that runs every 5 minutes
SELECT cron.schedule(
  'auto-publish-scheduled-pages',
  '*/5 * * * *', -- Every 5 minutes
  $$
    SELECT
      net.http_post(
        url := 'YOUR_SUPABASE_URL/functions/v1/auto-publish-pages',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer YOUR_SUPABASE_ANON_KEY'
        ),
        body := '{}'::jsonb
      ) as request_id;
  $$
);
```

Replace:
- `YOUR_SUPABASE_URL` with your actual Supabase project URL
- `YOUR_SUPABASE_ANON_KEY` with your anon key

### 3. Verify the Cron Job

Check if the cron job is set up correctly:

```sql
SELECT * FROM cron.job;
```

### 4. Monitor Execution

Check cron job execution history:

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-publish-scheduled-pages')
ORDER BY start_time DESC
LIMIT 10;
```

## Manual Testing

You can manually trigger the auto-publish function:

```bash
curl -X POST \
  'YOUR_SUPABASE_URL/functions/v1/auto-publish-pages' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## How It Works

1. **Cron Job**: Runs every 5 minutes via pg_cron
2. **Edge Function**: Queries for pages where `status='scheduled'` AND `scheduled_publish_at <= NOW()`
3. **Update**: Changes status to `'published'`, sets `published_at` and `updated_at`
4. **Logging**: Records the action in `activity_log` table

## Troubleshooting

### Cron job not running

1. Check if pg_cron extension is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Check cron job configuration:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'auto-publish-scheduled-pages';
   ```

### Edge function errors

Check function logs in Supabase Dashboard:
- Go to Edge Functions
- Select `auto-publish-pages`
- View Logs tab

### Pages not publishing

1. Verify page data:
   ```sql
   SELECT id, title, status, scheduled_publish_at
   FROM pages
   WHERE status = 'scheduled'
   AND scheduled_publish_at <= NOW();
   ```

2. Check activity log for auto-publish events:
   ```sql
   SELECT * FROM activity_log
   WHERE action = 'auto_published'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

## Stopping Auto-Publish

To disable auto-publishing, unschedule the cron job:

```sql
SELECT cron.unschedule('auto-publish-scheduled-pages');
```

To re-enable, run the schedule command from step 2 again.
