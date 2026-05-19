-- M7: Bet Share Links

-- Add share token to bets
alter table public.bets
  add column if not exists share_token uuid not null default gen_random_uuid();

alter table public.bets
  drop constraint if exists bets_share_token_key;
alter table public.bets
  add constraint bets_share_token_key unique (share_token);

-- RPC: look up a bet by share token — no auth required, bypasses RLS
create or replace function public.get_bet_by_share_token(p_token uuid)
returns table (
  id          uuid,
  title       text,
  description text,
  closes_at   timestamptz,
  status      public.bet_status,
  group_id    uuid,
  group_name  text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    b.id,
    b.title,
    b.description,
    b.closes_at,
    b.status,
    b.group_id,
    g.name as group_name
  from public.bets b
  join public.groups g on g.id = b.group_id
  where b.share_token = p_token;
end;
$$;

grant execute on function public.get_bet_by_share_token(uuid) to anon, authenticated;
