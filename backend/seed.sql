-- Polymates Demo Seed v2
-- Users: alice, bob, charlie, diana, evan, fiona @demo.com (password: demo1234)
-- Groups: "Weekend Warriors", "The Tech Desk"
-- After running, add yourself with the snippet at the bottom.

do $$
declare
  u_alice   uuid := '11111111-1111-1111-1111-111111111111';
  u_bob     uuid := '22222222-2222-2222-2222-222222222222';
  u_charlie uuid := '33333333-3333-3333-3333-333333333333';
  u_diana   uuid := '44444444-4444-4444-4444-444444444444';
  u_evan    uuid := '55555555-5555-5555-5555-555555555555';
  u_fiona   uuid := '66666666-6666-6666-6666-666666666666';

  g1 uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; -- Weekend Warriors
  g2 uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'; -- The Tech Desk

  -- g1 bets
  b1 uuid := 'b1111111-1111-1111-1111-111111111111';
  b2 uuid := 'b2222222-2222-2222-2222-222222222222';
  b3 uuid := 'b3333333-3333-3333-3333-333333333333';
  b4 uuid := 'b4444444-4444-4444-4444-444444444444';
  b5 uuid := 'b5555555-5555-5555-5555-555555555555';

  -- g2 bets
  b6  uuid := 'b6666666-6666-6666-6666-666666666666';
  b7  uuid := 'b7777777-7777-7777-7777-777777777777';
  b8  uuid := 'b8888888-8888-8888-8888-888888888888';
  b9  uuid := 'b9999999-9999-9999-9999-999999999999';
  b10 uuid := 'ba000000-0000-0000-0000-000000000000';
  b11 uuid := 'bb000000-0000-0000-0000-000000000000';
begin
  if exists (select 1 from public.groups where id = g1) then
    raise notice 'Seed already exists, skipping.';
    return;
  end if;

  -- ── Auth users ──────────────────────────────────────────────────────────────
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
  values
    (u_alice,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alice@demo.com',   crypt('demo1234', gen_salt('bf')), now(), '{"username":"alice"}'::jsonb,   now() - interval '30 days', now()),
    (u_bob,     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bob@demo.com',     crypt('demo1234', gen_salt('bf')), now(), '{"username":"bob"}'::jsonb,     now() - interval '28 days', now()),
    (u_charlie, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'charlie@demo.com', crypt('demo1234', gen_salt('bf')), now(), '{"username":"charlie"}'::jsonb, now() - interval '25 days', now()),
    (u_diana,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'diana@demo.com',   crypt('demo1234', gen_salt('bf')), now(), '{"username":"diana"}'::jsonb,   now() - interval '25 days', now()),
    (u_evan,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'evan@demo.com',    crypt('demo1234', gen_salt('bf')), now(), '{"username":"evan"}'::jsonb,    now() - interval '20 days', now()),
    (u_fiona,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fiona@demo.com',   crypt('demo1234', gen_salt('bf')), now(), '{"username":"fiona"}'::jsonb,   now() - interval '20 days', now())
  on conflict (id) do nothing;

  -- ── Group 1: Weekend Warriors ───────────────────────────────────────────────

  insert into public.groups (id, name, invite_token, created_by)
  values (g1, 'Weekend Warriors', gen_random_uuid(), u_alice);

  insert into public.group_members (group_id, user_id, points)
  values
    (g1, u_alice,   1420),
    (g1, u_bob,      880),
    (g1, u_charlie,  750),
    (g1, u_diana,   1180),
    (g1, u_evan,     670);

  -- B1: resolved YES — ski trip
  insert into public.bets (id, group_id, creator_id, title, description, closes_at, status, created_at)
  values (b1, g1, u_alice,
    'Will the group ski trip actually happen this January?',
    'Every year we talk about going to Whistler. Every year something comes up. This year we have a group chat with 12 confirmed "I''m in"s. Does it happen before February?',
    now() - interval '14 days', 'closed', now() - interval '35 days');

  insert into public.bet_positions (bet_id, user_id, side, amount)
  values
    (b1, u_alice,   'yes', 300),
    (b1, u_bob,     'no',  200),
    (b1, u_charlie, 'no',  150),
    (b1, u_diana,   'yes', 250),
    (b1, u_evan,    'no',  100);

  insert into public.verdicts (bet_id, outcome, reasoning)
  values (b1, 'yes',
    'Against all historical precedent and the laws of probability, the ski trip did in fact occur. This court has reviewed photographic evidence of actual snow and actual skiing. Bob and Charlie, your cynicism has been overruled by a lift ticket and a broken binding. Alice and Diana collect from the sceptics'' pool. The court recommends the group immediately start betting on whether anyone will book flights for next year.');

  -- B2: resolved NO — marathon
  insert into public.bets (id, group_id, creator_id, title, description, closes_at, status, created_at)
  values (b2, g1, u_bob,
    'Will Evan finish a half marathon before June?',
    'Evan announced at New Year''s that he''s "finally doing it this year." He bought new shoes. He has a training app. Will he cross a finish line before June 1st?',
    now() - interval '20 days', 'closed', now() - interval '50 days');

  insert into public.bet_positions (bet_id, user_id, side, amount)
  values
    (b2, u_alice,   'yes', 150),
    (b2, u_bob,     'no',  300),
    (b2, u_charlie, 'yes', 200),
    (b2, u_diana,   'no',  150),
    (b2, u_evan,    'yes', 400);

  insert into public.verdicts (bet_id, outcome, reasoning)
  values (b2, 'no',
    'The training app in question has not been opened since January 14th. The new shoes have logged a total of 2.3 miles, all of them to a coffee shop. Evan bet on himself, which this court finds both admirable and deeply misguided. Bob and Diana collect the winnings. The defendant is ordered to either run the race or stop telling people about the training plan.');

  -- B3: resolved YES — punctuality
  insert into public.bets (id, group_id, creator_id, title, description, closes_at, status, created_at)
  values (b3, g1, u_diana,
    'Will Charlie show up on time to the dinner reservation?',
    'Charlie is chronically 20+ minutes late to everything. We have an 8pm reservation at a restaurant that does not hold tables. Will he be there by 8:10pm?',
    now() - interval '10 days', 'closed', now() - interval '15 days');

  insert into public.bet_positions (bet_id, user_id, side, amount)
  values
    (b3, u_alice,   'no',  200),
    (b3, u_bob,     'no',  250),
    (b3, u_charlie, 'yes', 300),
    (b3, u_diana,   'no',  200);

  insert into public.verdicts (bet_id, outcome, reasoning)
  values (b3, 'yes',
    'In a stunning upset that has shaken this court to its foundations, Charlie arrived at 8:07pm — three full minutes inside the grace period. Eyewitness testimony confirms he was sweating and slightly out of breath, suggesting he ran from the parking garage. Alice, Bob, and Diana: your confidence in historical patterns has been punished. Charlie collects everything and is advised to maintain this energy for literally every future commitment.');

  -- B4: open, closes in 3 days
  insert into public.bets (id, group_id, creator_id, title, description, closes_at, status, created_at)
  values (b4, g1, u_evan,
    'Will Alice beat her personal best at the 5k this weekend?',
    'Alice''s current PB is 24:12. She''s been training for 8 weeks and says she''s "feeling good." Race is Saturday morning.',
    now() + interval '3 days', 'open', now() - interval '4 days');

  insert into public.bet_positions (bet_id, user_id, side, amount)
  values
    (b4, u_alice,   'yes', 200),
    (b4, u_bob,     'yes', 150),
    (b4, u_diana,   'yes', 100),
    (b4, u_evan,    'no',  200);

  insert into public.comments (bet_id, user_id, body, created_at)
  values
    (b4, u_bob,   'I''ve seen her training. She''s locked in.', now() - interval '3 days'),
    (b4, u_evan,  'Wind is forecasted at 18km/h on Saturday. PBs don''t like headwinds.', now() - interval '2 days'),
    (b4, u_alice, 'Wind is coming from behind for the first half. Nice try Evan.', now() - interval '1 day'),
    (b4, u_diana, 'This is giving me anxiety and I''m not even running.', now() - interval '6 hours');

  -- B5: open, closes in 6 days
  insert into public.bets (id, group_id, creator_id, title, description, closes_at, status, created_at)
  values (b5, g1, u_charlie,
    'Will the group chat stay active every day for all of February?',
    'The Weekend Warriors chat has gone silent for 48+ hours at least twice this year. Will there be at least one message every single day throughout February?',
    now() + interval '6 days', 'open', now() - interval '2 days');

  insert into public.bet_positions (bet_id, user_id, side, amount)
  values
    (b5, u_charlie, 'yes', 100),
    (b5, u_diana,   'no',  150),
    (b5, u_evan,    'no',  100);

  insert into public.comments (bet_id, user_id, body, created_at)
  values
    (b5, u_charlie, 'I will personally send a message every day if I have to. This bet is winnable.', now() - interval '1 day'),
    (b5, u_diana,   'That''s just you keeping it alive artificially. Does that count?', now() - interval '20 hours'),
    (b5, u_charlie, 'The bet says "one message." It does not specify from whom.', now() - interval '18 hours'),
    (b5, u_evan,    'I''m going camping Feb 12–14 with no signal. Just noting that.', now() - interval '10 hours');

  -- ── Group 2: The Tech Desk ──────────────────────────────────────────────────

  insert into public.groups (id, name, invite_token, created_by)
  values (g2, 'The Tech Desk', gen_random_uuid(), u_bob);

  insert into public.group_members (group_id, user_id, points)
  values
    (g2, u_alice,   1050),
    (g2, u_bob,     1350),
    (g2, u_charlie,  620),
    (g2, u_diana,    900),
    (g2, u_fiona,   1280);

  -- B6: resolved NO — GPT-5
  insert into public.bets (id, group_id, creator_id, title, description, closes_at, status, created_at)
  values (b6, g2, u_fiona,
    'Will GPT-5 be announced before the end of Q1?',
    'OpenAI has been quiet. Rumours are everywhere. Will there be an official GPT-5 announcement (not just a blog post about o-series models) before April 1st?',
    now() - interval '10 days', 'closed', now() - interval '30 days');

  insert into public.bet_positions (bet_id, user_id, side, amount)
  values
    (b6, u_alice,   'yes', 200),
    (b6, u_bob,     'no',  300),
    (b6, u_charlie, 'yes', 150),
    (b6, u_diana,   'no',  200),
    (b6, u_fiona,   'yes', 250);

  insert into public.verdicts (bet_id, outcome, reasoning)
  values (b6, 'no',
    'Q1 has concluded. GPT-5 has not been announced. The submitted evidence consists largely of tweets from accounts with robot avatars and one Medium post titled "GPT-5 Is DEFINITELY Coming This Month (Here''s Why)." Bob and Diana win. Alice, Charlie, and Fiona: the AI hype machine has failed you again. The court strongly suggests the group develop more sceptical priors about launch timelines.');

  -- B7: resolved YES — acquisition
  insert into public.bets (id, group_id, creator_id, title, description, closes_at, status, created_at)
  values (b7, g2, u_alice,
    'Will Figma get acquired by someone else before the year ends?',
    'Adobe deal fell through. Figma is valuable, profitable, and independent again. Will another acquirer — Apple, Google, Microsoft, Salesforce — close a deal before December 31st?',
    now() - interval '5 days', 'closed', now() - interval '25 days');

  insert into public.bet_positions (bet_id, user_id, side, amount)
  values
    (b7, u_alice,   'no',  200),
    (b7, u_bob,     'yes', 300),
    (b7, u_charlie, 'no',  100),
    (b7, u_diana,   'yes', 150),
    (b7, u_fiona,   'yes', 200);

  insert into public.verdicts (bet_id, outcome, reasoning)
  values (b7, 'yes',
    'A deal was signed. Bob, Diana, and Fiona had the correct read on the market. Alice and Charlie, the op-ed you submitted — "Figma Doesn''t Need an Acquirer" — has been noted and disregarded. The acquirer''s press release, which uses the word "synergy" four times in two paragraphs, has been entered as Exhibit A for Why Corporate Announcements Are Terrible.');

  -- B8: resolved NO — production outage
  insert into public.bets (id, group_id, creator_id, title, description, closes_at, status, created_at)
  values (b8, g2, u_charlie,
    'Will we get through the product launch without a P0 incident?',
    'Launch is next Thursday. There are three known tech debt bombs in the payment flow, a cache bug that only appears under load, and a new intern who pushed directly to main twice last week.',
    now() - interval '8 days', 'closed', now() - interval '14 days');

  insert into public.bet_positions (bet_id, user_id, side, amount)
  values
    (b8, u_alice,   'no',  250),
    (b8, u_bob,     'no',  200),
    (b8, u_charlie, 'yes', 300),
    (b8, u_diana,   'no',  150),
    (b8, u_fiona,   'yes', 200);

  insert into public.verdicts (bet_id, outcome, reasoning)
  values (b8, 'no',
    'The cache bug appeared at 11:47am on launch day, 23 minutes after the first real traffic spike. The court has reviewed the incident report, the Slack thread (94 messages, including one from the intern that reads "is this bad?"), and the postmortem. It was bad. Charlie and Fiona, your optimism is noted and fined. Alice, Bob, and Diana collect. The intern has been reassigned to documentation.');

  -- B9: open, closes in 2 days
  insert into public.bets (id, group_id, creator_id, title, description, closes_at, status, created_at)
  values (b9, g2, u_diana,
    'Will the new feature ship before end of sprint?',
    'The PM says 80% done. The engineer says "one more day." It has needed one more day for two weeks. Sprint ends Friday. Same story, different sprint.',
    now() + interval '2 days', 'open', now() - interval '5 days');

  insert into public.bet_positions (bet_id, user_id, side, amount)
  values
    (b9, u_alice,  'no',  200),
    (b9, u_bob,    'no',  150),
    (b9, u_fiona,  'yes', 250),
    (b9, u_diana,  'yes', 100);

  insert into public.comments (bet_id, user_id, body, created_at)
  values
    (b9, u_alice,  'I have a spreadsheet. We''re 0 for 4 on sprint commitments this quarter.', now() - interval '4 days'),
    (b9, u_bob,    'The PM just sent "almost there 🚀". Emoji usage in status updates is not a good sign.', now() - interval '3 days'),
    (b9, u_fiona,  'I saw the PR. It''s actually close this time. I''m not joking.', now() - interval '2 days'),
    (b9, u_diana,  'Fiona said this last sprint too.', now() - interval '1 day'),
    (b9, u_fiona,  'That was different. That PR was a mess. This one is clean.', now() - interval '12 hours');

  -- B10: open, closes in 4 days
  insert into public.bets (id, group_id, creator_id, title, description, closes_at, status, created_at)
  values (b10, g2, u_bob,
    'Will Claude 4 Opus beat o3 on the next AIME benchmark release?',
    'Anthropic has been closing the gap on math reasoning. The next AIME results are expected this month. Will Claude 4 Opus score higher than o3 on AIME 2025?',
    now() + interval '4 days', 'open', now() - interval '3 days');

  insert into public.bet_positions (bet_id, user_id, side, amount)
  values
    (b10, u_alice,   'yes', 300),
    (b10, u_bob,     'yes', 200),
    (b10, u_charlie, 'no',  150),
    (b10, u_diana,   'no',  200),
    (b10, u_fiona,   'yes', 150);

  insert into public.comments (bet_id, user_id, body, created_at)
  values
    (b10, u_charlie, 'OpenAI has a 6-month head start on RLHF for math. I''m not buying the optimism.', now() - interval '2 days'),
    (b10, u_alice,   'Have you seen the Claude 4 evals on the easier AMC problems? The curve is steep.', now() - interval '1 day'),
    (b10, u_bob,     'The benchmark is partially gamed at this point. Both of them.', now() - interval '20 hours'),
    (b10, u_diana,   'So we''re betting on which company games the benchmark better?', now() - interval '10 hours'),
    (b10, u_alice,   'Welcome to AI forecasting.', now() - interval '8 hours');

  -- B11: open, closes in 7 days
  insert into public.bets (id, group_id, creator_id, title, description, closes_at, status, created_at)
  values (b11, g2, u_alice,
    'Will we hit 500 signups before the end of the month?',
    'Currently at 312. The launch post goes out Thursday. Can we add 188 users in the next two weeks? Marketing says yes. Engineering is not sure.',
    now() + interval '7 days', 'open', now() - interval '1 day');

  insert into public.bet_positions (bet_id, user_id, side, amount)
  values
    (b11, u_alice,   'yes', 200),
    (b11, u_bob,     'no',  100),
    (b11, u_charlie, 'yes', 150),
    (b11, u_fiona,   'no',  200);

  insert into public.comments (bet_id, user_id, body, created_at)
  values
    (b11, u_bob,     'Our week-1 retention is 34%. Even if we hit 500, the real number is 170 actives.', now() - interval '20 hours'),
    (b11, u_charlie, 'Bob is right but also not the point of this bet.', now() - interval '18 hours'),
    (b11, u_alice,   'The post is going on HN. If it hits the front page we get there easily.', now() - interval '15 hours'),
    (b11, u_fiona,   'Last three HN submissions from this company got 3, 7, and 2 points. Just noting that.', now() - interval '10 hours');

  raise notice 'Seed complete.';
  raise notice 'Credentials: alice/bob/charlie/diana/evan/fiona @demo.com — password: demo1234';
  raise notice 'Groups: Weekend Warriors, The Tech Desk';
end;
$$;

-- ── Add yourself to the demo groups ────────────────────────────────────────────
-- Sign up first, then run this with your email:
--
-- insert into public.group_members (group_id, user_id, points)
-- select g.id, u.id, 1000
-- from public.groups g
-- cross join public.users u
-- where u.email = 'YOUR_EMAIL'
-- and g.id in (
--   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
--   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
-- )
-- on conflict do nothing;
