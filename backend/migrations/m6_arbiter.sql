-- M6: Arbiter Integration & Resolution

-- Verdicts table
create table if not exists public.verdicts (
  id         uuid primary key default gen_random_uuid(),
  bet_id     uuid not null references public.bets(id) on delete cascade unique,
  outcome    public.bet_side not null,
  reasoning  text not null,
  created_at timestamptz not null default now()
);

-- Grants
grant select on public.verdicts to authenticated;

-- service_role grants for the resolve-bet edge function
grant select, update on public.bets to service_role;
grant select on public.bet_positions to service_role;
grant select on public.evidence to service_role;
grant select, insert on public.verdicts to service_role;
grant execute on function public.resolve_bet(uuid, public.bet_side) to service_role;

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

