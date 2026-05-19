-- M6: Arbiter Integration & Resolution

-- Verdicts table
create table if not exists public.verdicts (
  id         uuid primary key default gen_random_uuid(),
  bet_id     uuid not null references public.bets(id) on delete cascade,
  outcome    public.bet_side not null,
  reasoning  text not null,
  created_at timestamptz not null default now()
);

-- Grants
grant select on public.verdicts to authenticated;

-- RLS
alter table public.verdicts enable row level security;

drop policy if exists "verdicts: read as group member" on public.verdicts;
create policy "verdicts: read as group member"
  on public.verdicts for select
  using (
    public.is_group_member(
      (select group_id from public.bets where id = bet_id)
    )
  );

-- pg_cron: auto-close bets past their deadline and trigger the arbiter
-- NOTE: requires pg_cron extension enabled in Supabase dashboard (Database → Extensions)
-- and the resolve-bet edge function deployed.
--
-- select cron.schedule(
--   'close-expired-bets',
--   '* * * * *',
--   $$
--     select net.http_post(
--       url := current_setting('app.supabase_url') || '/functions/v1/resolve-bet',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer ' || current_setting('app.service_role_key')
--       ),
--       body := jsonb_build_object('bet_id', id)
--     )
--     from public.bets
--     where status = 'open'
--       and closes_at < now();
--   $$
-- );
