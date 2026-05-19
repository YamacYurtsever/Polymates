-- Polymates Demo Seed
-- Creates: 4 demo users, 1 group, 2 resolved bets, 2 open bets, positions, verdicts, comments
-- Credentials: alice@demo.com / bob@demo.com / charlie@demo.com / diana@demo.com  password: demo1234
-- Idempotent: skips if group already exists

do $$
declare
  u_alice   uuid := '11111111-1111-1111-1111-111111111111';
  u_bob     uuid := '22222222-2222-2222-2222-222222222222';
  u_charlie uuid := '33333333-3333-3333-3333-333333333333';
  u_diana   uuid := '44444444-4444-4444-4444-444444444444';
  g1        uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  b1        uuid := 'b1111111-1111-1111-1111-111111111111';
  b2        uuid := 'b2222222-2222-2222-2222-222222222222';
  b3        uuid := 'b3333333-3333-3333-3333-333333333333';
  b4        uuid := 'b4444444-4444-4444-4444-444444444444';
begin
  if exists (select 1 from public.groups where id = g1) then
    raise notice 'Seed data already exists, skipping.';
    return;
  end if;

  -- Auth users (trigger auto-creates public.users entries)
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
  values
    (u_alice,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alice@demo.com',   crypt('demo1234', gen_salt('bf')), now(), '{"username":"alice"}'::jsonb,   now() - interval '30 days', now()),
    (u_bob,     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bob@demo.com',     crypt('demo1234', gen_salt('bf')), now(), '{"username":"bob"}'::jsonb,     now() - interval '30 days', now()),
    (u_charlie, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'charlie@demo.com', crypt('demo1234', gen_salt('bf')), now(), '{"username":"charlie"}'::jsonb, now() - interval '30 days', now()),
    (u_diana,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'diana@demo.com',   crypt('demo1234', gen_salt('bf')), now(), '{"username":"diana"}'::jsonb,   now() - interval '30 days', now())
  on conflict (id) do nothing;

  -- Group
  insert into public.groups (id, name, invite_token, created_by)
  values (g1, 'The Forecasters', gen_random_uuid(), u_alice);

  -- Members — balances reflect resolved payouts minus open bet stakes
  -- alice: +467 (b1) +200 (b2) −150 (b3) −200 (b4) = 1317
  -- bob:   −300 (b1) +400 (b2) −100 (b3)             = 1000
  -- charlie: +233 (b1) −500 (b2) −100 (b4)           = 633
  -- diana:  −400 (b1) −100 (b2) −80 (b3) −100 (b4)   = 320
  insert into public.group_members (group_id, user_id, points)
  values
    (g1, u_alice,   1317),
    (g1, u_bob,     1000),
    (g1, u_charlie,  633),
    (g1, u_diana,    320);

  -- Bet 1: resolved YES — "Will Claude 4 score above 90% on the bar exam?"
  insert into public.bets (id, group_id, creator_id, title, description, closes_at, status, created_at)
  values (b1, g1, u_alice,
    'Will Claude 4 score above 90% on the bar exam?',
    'Claude 3 Opus scored at the 74th percentile. With the next release, will Anthropic crack 90%? Judged on any credible benchmark published before the deadline.',
    now() - interval '3 days', 'closed', now() - interval '18 days');

  insert into public.bet_positions (bet_id, user_id, side, amount)
  values
    (b1, u_alice,   'yes', 400),
    (b1, u_bob,     'no',  300),
    (b1, u_charlie, 'yes', 200),
    (b1, u_diana,   'no',  400);

  insert into public.verdicts (bet_id, outcome, reasoning)
  values (b1, 'yes',
    'After reviewing the submitted evidence — or rather, the complete lack of counter-evidence — this court rules YES. Claude 4 did indeed pass the bar with honours, leaving human lawyers nervously updating their LinkedIn profiles. Bob and Diana, your scepticism has been noted, appreciated, and summarily overruled. The bill for these proceedings will be settled by the losing pool. Court adjourned.');

  -- Bet 2: resolved NO — "Will Charlie actually read the book he recommended?"
  insert into public.bets (id, group_id, creator_id, title, description, closes_at, status, created_at)
  values (b2, g1, u_bob,
    'Will Charlie actually read the book he recommended?',
    'Charlie has recommended "The Pragmatic Programmer" to every engineer he has met this year. Has he read it himself? Evidence: receipts, Goodreads activity, or a live quiz.',
    now() - interval '7 days', 'closed', now() - interval '21 days');

  insert into public.bet_positions (bet_id, user_id, side, amount)
  values
    (b2, u_alice,   'no',  200),
    (b2, u_bob,     'no',  400),
    (b2, u_charlie, 'yes', 500),
    (b2, u_diana,   'yes', 100);

  insert into public.verdicts (bet_id, outcome, reasoning)
  values (b2, 'no',
    'The court has reviewed the evidence: Charlie''s Goodreads profile (zero updates since 2019), a screenshot of him asking "what chapter does it get good?", and a bookshelf photo where the spine is conspicuously uncracked. The verdict is NO. Charlie, your recommended reading list has been entered as Exhibit A against you. Alice and Bob split the winnings. The defendant is sentenced to actually finishing chapter one.');

  -- Bet 3: open, closes in 2 days
  insert into public.bets (id, group_id, creator_id, title, description, closes_at, status, created_at)
  values (b3, g1, u_charlie,
    'Will the new feature ship before end of sprint?',
    'The PM says it is 80% done. The engineer says it needs one more day. It has needed one more day for two weeks now. Sprint ends Friday.',
    now() + interval '2 days', 'open', now() - interval '5 days');

  insert into public.bet_positions (bet_id, user_id, side, amount)
  values
    (b3, u_alice, 'no',  150),
    (b3, u_bob,   'no',  100),
    (b3, u_diana, 'yes',  80);

  -- Bet 4: open, closes in 5 days
  insert into public.bets (id, group_id, creator_id, title, description, closes_at, status, created_at)
  values (b4, g1, u_diana,
    'Will we hit 500 signups before the end of the month?',
    'We are currently at 312. The launch post goes out Thursday. Can we add 188 more users in the next two weeks?',
    now() + interval '5 days', 'open', now() - interval '2 days');

  insert into public.bet_positions (bet_id, user_id, side, amount)
  values
    (b4, u_alice,   'yes', 200),
    (b4, u_charlie, 'yes', 100),
    (b4, u_diana,   'no',  100);

  -- Comments on bet 3
  insert into public.comments (bet_id, user_id, body, created_at)
  values
    (b3, u_alice,   'Voting no based on 3 years of empirical data', now() - interval '4 days'),
    (b3, u_bob,     'The "one more day" streak is at 14 days and counting. I have screenshots.', now() - interval '3 days'),
    (b3, u_diana,   'I believe in you! This is the sprint. I can feel it.', now() - interval '1 day'),
    (b3, u_charlie, 'It is basically done I just need to write the tests and do a quick refactor', now() - interval '2 hours');

  -- Comments on bet 4
  insert into public.comments (bet_id, user_id, body, created_at)
  values
    (b4, u_bob,     'What even is our current conversion rate from the landing page?', now() - interval '1 day'),
    (b4, u_alice,   'Around 4%. The Thursday post should move the needle if we nail the copy.', now() - interval '20 hours'),
    (b4, u_charlie, 'I am writing the post. No pressure from this bet at all.', now() - interval '18 hours');

  raise notice 'Seed complete. Users: alice@demo.com, bob@demo.com, charlie@demo.com, diana@demo.com (password: demo1234)';
end;
$$;
