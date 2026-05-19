-- M3: Bets & Positions

create type public.bet_status as enum ('open', 'closed', 'resolved', 'refunded');
create type public.bet_side as enum ('yes', 'no');

create table public.bets (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  creator_id  uuid not null references public.users(id) on delete cascade,
  title       text not null,
  description text not null default '',
  closes_at   timestamptz not null,
  status      public.bet_status not null default 'open',
  created_at  timestamptz not null default now()
);

create table public.bet_positions (
  id         uuid primary key default gen_random_uuid(),
  bet_id     uuid not null references public.bets(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  side       public.bet_side not null,
  amount     integer not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (bet_id, user_id)
);

-- RLS
alter table public.bets enable row level security;
alter table public.bet_positions enable row level security;

-- bets: readable by group members
create policy "bets: read as group member"
  on public.bets for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = bets.group_id
        and group_members.user_id = auth.uid()
    )
  );

-- bets: insertable by group members
create policy "bets: insert as group member"
  on public.bets for insert
  with check (
    auth.uid() = creator_id
    and exists (
      select 1 from public.group_members
      where group_members.group_id = bets.group_id
        and group_members.user_id = auth.uid()
    )
  );

-- bet_positions: readable by group members of the bet's group
create policy "bet_positions: read as group member"
  on public.bet_positions for select
  using (
    exists (
      select 1 from public.bets
      join public.group_members on group_members.group_id = bets.group_id
      where bets.id = bet_positions.bet_id
        and group_members.user_id = auth.uid()
    )
  );

-- RPC: create a bet (avoids client-side auth.uid() JWT issues, same pattern as create_group)
create or replace function public.create_bet(
  p_group_id    uuid,
  p_title       text,
  p_description text,
  p_closes_at   timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_bet_id uuid;
begin
  if not exists (
    select 1 from group_members
    where group_id = p_group_id and user_id = auth.uid()
  ) then
    raise exception 'not a member of this group';
  end if;

  insert into public.bets (group_id, creator_id, title, description, closes_at)
  values (p_group_id, auth.uid(), p_title, p_description, p_closes_at)
  returning id into new_bet_id;

  return new_bet_id;
end;
$$;
