# Deploy generate-weekly-insights Edge Function

## One-time deploy

```bash
supabase functions deploy generate-weekly-insights --no-verify-jwt
```

## Set secrets (one-time)

```bash
supabase secrets set ANTHROPIC_API_KEY=your_key_here
```

## Schedule weekly via pg_cron (run in Supabase SQL editor)

```sql
select cron.schedule(
  'weekly-insights',
  '0 8 * * 1',  -- every Monday at 8 AM UTC
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/generate-weekly-insights',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
  );
  $$
);
```
