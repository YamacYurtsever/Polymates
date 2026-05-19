-- M8: Auto-Resolution Cron Job
--
-- Prerequisites (run once in Supabase dashboard → SQL editor before this migration):
--
--   1. Enable extensions:
--        create extension if not exists pg_net;
--        create extension if not exists pg_cron;
--
--   2. Store secrets in vault:
--        select vault.create_secret('https://<your-project-ref>.supabase.co', 'supabase_url', 'Supabase project URL');
--        select vault.create_secret('<your-service-role-key>', 'service_role_key', 'Service role key for edge function calls');

-- Function: find all open bets past their deadline and call resolve-bet for each
create or replace function public.resolve_overdue_bets()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bet_id uuid;
  v_url    text;
  v_key    text;
begin
  select decrypted_secret into v_url
  from vault.decrypted_secrets
  where name = 'supabase_url'
  limit 1;

  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'service_role_key'
  limit 1;

  if v_url is null or v_key is null then
    raise exception 'Missing vault secrets: supabase_url or service_role_key';
  end if;

  for v_bet_id in
    select id
    from public.bets
    where closes_at < now()
      and status = 'open'
  loop
    perform net.http_post(
      url     := v_url || '/functions/v1/resolve-bet',
      body    := jsonb_build_object('bet_id', v_bet_id),
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || v_key
      )
    );
  end loop;
end;
$$;

grant execute on function public.resolve_overdue_bets() to postgres;

-- Schedule: run every minute (idempotent — unschedules first if it already exists)
do $$
begin
  perform cron.unschedule('resolve-overdue-bets');
exception when others then null;
end;
$$;

select cron.schedule(
  'resolve-overdue-bets',
  '* * * * *',
  'select public.resolve_overdue_bets()'
);
