-- M1: Auth & User Setup

create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  username    text
);

-- Grants
grant select, update on public.users to authenticated;

-- RLS
alter table public.users enable row level security;

drop policy if exists "users: read own row" on public.users;
create policy "users: read own row"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "users: update own row" on public.users;
create policy "users: update own row"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger: auto-insert into public.users when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, username)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
