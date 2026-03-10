-- Enable the pg_cron and pg_net extensions (required for scheduled HTTP calls)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage so cron can execute
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Remove any existing job with the same name to avoid duplicates
SELECT cron.unschedule('check-all-watches')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'check-all-watches'
);

-- Schedule: call check-all-watches edge function every 5 minutes
-- Uses pg_net to make an HTTP POST to the Supabase edge function
SELECT cron.schedule(
  'check-all-watches',          -- job name
  '*/5 * * * *',                -- every 5 minutes
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/check-all-watches',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
