-- M2: Groups & Invite System

create or replace function public.initial_points() returns integer language sql immutable as $$ select 1000 $$;

create table if not exists public.groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  invite_token uuid not null default gen_random_uuid(),
  created_by   uuid not null references public.users(id) on delete cascade
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id  uuid not null references public.users(id) on delete cascade,
  points   integer not null default public.initial_points(),
  primary key (group_id, user_id)
);

-- RLS
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

drop policy if exists "group_members: read own" on public.group_members;
create policy "group_members: read own"
  on public.group_members for select
  using (auth.uid() = user_id);

drop policy if exists "group_members: insert own" on public.group_members;
create policy "group_members: insert own"
  on public.group_members for insert
  with check (auth.uid() = user_id);

drop policy if exists "groups: read as member" on public.groups;
create policy "groups: read as member"
  on public.groups for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id
        and group_members.user_id = auth.uid()
    )
  );

drop policy if exists "groups: insert own" on public.groups;
create policy "groups: insert own"
  on public.groups for insert
  with check (auth.uid() = created_by);

create or replace function public.get_group_by_invite_token(token uuid)
returns table(id uuid, name text, member_count bigint)
language sql
security definer
set search_path = public
as $$
  select g.id, g.name, count(gm.user_id)::bigint
  from public.groups g
  left join public.group_members gm on gm.group_id = g.id
  where g.invite_token = token
  group by g.id, g.name;
$$;

create or replace function public.create_group(group_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group_id uuid;
begin
  insert into public.groups (name, created_by)
  values (group_name, auth.uid())
  returning id into new_group_id;

  insert into public.group_members (group_id, user_id)
  values (new_group_id, auth.uid());

  return new_group_id;
end;
$$;
