-- M5: Evidence Submission

-- NOTE: The 'evidence' storage bucket must be created manually in the Supabase
-- dashboard (Storage → New bucket, name: evidence, private). These policies can
-- then be applied here or pasted in the SQL editor.

-- Storage policies (on storage.objects, not a user table — cannot be auto-applied)

-- Allow authenticated users to upload to their own folder: {user_id}/{bet_id}/{filename}
drop policy if exists "evidence: upload own" on storage.objects;
create policy "evidence: upload own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'evidence'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow group members to read evidence for bets in their groups
drop policy if exists "evidence: read as group member" on storage.objects;
create policy "evidence: read as group member"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'evidence'
    and exists (
      select 1
      from public.group_members gm
      join public.bets b on b.group_id = gm.group_id
      where gm.user_id = auth.uid()
        and b.id::text = (storage.foldername(name))[2]
    )
  );

-- Evidence table
create table if not exists public.evidence (
  id           uuid primary key default gen_random_uuid(),
  bet_id       uuid not null references public.bets(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  storage_path text not null,
  caption      text,
  created_at   timestamptz not null default now()
);

-- Grants
grant select, insert on public.evidence to authenticated;

-- RLS
alter table public.evidence enable row level security;

drop policy if exists "evidence: read as group member" on public.evidence;
create policy "evidence: read as group member"
  on public.evidence for select
  using (public.is_group_member((select group_id from public.bets where id = bet_id)));

drop policy if exists "evidence: insert own" on public.evidence;
create policy "evidence: insert own"
  on public.evidence for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.bets
      where id = bet_id
        and closes_at > now()
        and status = 'open'
    )
  );
