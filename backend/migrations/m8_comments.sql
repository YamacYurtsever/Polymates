-- M8: Bet Comments

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  bet_id     uuid not null references public.bets(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  body       text not null check (char_length(body) <= 500),
  created_at timestamptz not null default now()
);

grant select, insert on public.comments to authenticated;

alter table public.comments enable row level security;

drop policy if exists "comments: read as group member" on public.comments;
create policy "comments: read as group member"
  on public.comments for select
  using (
    exists (
      select 1 from public.bets b
      join public.group_members gm on gm.group_id = b.group_id
      where b.id = bet_id
        and gm.user_id = auth.uid()
    )
  );

drop policy if exists "comments: insert own" on public.comments;
create policy "comments: insert own"
  on public.comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.bets b
      join public.group_members gm on gm.group_id = b.group_id
      where b.id = bet_id
        and gm.user_id = auth.uid()
    )
  );
