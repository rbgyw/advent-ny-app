-- MANUAL ONLY, AFTER all rollout checks. This file is NOT a migration.
-- Requires enabled pg_cron, pg_net and Vault. First create Vault secrets:
-- future_letter_function_url = https://<project-ref>.supabase.co/functions/v1/send-future-letters
-- future_letter_cron_secret = exactly the Edge secret FUTURE_LETTER_CRON_SECRET
-- Check for an existing job with this name before running; keep only one job.
select cron.schedule(
    'send-future-letters-every-minute',
    '* * * * *',
    $job$
    select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name='future_letter_function_url'),
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-future-letter-cron-secret',
            (select decrypted_secret from vault.decrypted_secrets where name='future_letter_cron_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
    );
    $job$
);
-- To pause manually:
-- select cron.alter_job((select jobid from cron.job where jobname='send-future-letters-every-minute'), active := false);
