# Polymates Discord Bot — Implementation Plan

> AI-powered Discord bot that watches group chats for bet-shaped messages, parses them, asks for confirmation, and commits to Polymates. Verdicts post back to the channel.

---

## Architecture

```
Discord channel
   │  (1) every message → Discord Gateway
   ▼
Discord App (HTTP interactions + Gateway listener)
   │  (2) classifier prefilter → Anthropic API (Haiku) for extraction
   ▼
Supabase Edge Function: discord-bot
   │  (3) verify signature, look up linked user/group, call existing RPCs
   ▼
Supabase Postgres
   │  (4) Realtime trigger on verdicts INSERT
   ▼
Edge Function: discord-notify
   │  (5) POST to Discord webhook → channel
   ▼
Discord channel (verdict embed)
```

Two Edge Functions, one Discord app, two new tables. Everything else reuses what Polymates already has (`create_bet`, `place_bet`, `resolve_bet`, the arbiter).

---

## Why this split

Discord has two interaction models:

1. **HTTP interactions** (slash commands, buttons, reactions) — Discord POSTs to your URL with a signed payload. **Stateless. Perfect for Edge Functions.**
2. **Gateway connection** (read every message in a channel) — long-lived WebSocket. **Requires a persistent process.** Edge Functions can't host this.

**Decision:**
- **Slash commands + reaction confirmations**: Supabase Edge Function (`discord-bot`).
- **Passive message-reading AI listener**: a small Node process on Fly.io / Railway / Render (~$5/mo). Posts to the same Edge Function for any actions it takes. Keeps the Edge Function as the single write-path to Polymates.

This way, even the listener has no DB access of its own — it only calls the Edge Function with a service token.

---

## New Supabase Schema

### `discord_links`
Maps Discord identities to Polymates identities.

```sql
create table public.discord_links (
  discord_user_id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  linked_at timestamptz not null default now()
);

create table public.discord_guild_links (
  discord_guild_id text not null,
  discord_channel_id text not null,
  group_id uuid not null references public.groups(id) on delete cascade,
  linked_by uuid not null references public.users(id),
  linked_at timestamptz not null default now(),
  primary key (discord_guild_id, discord_channel_id)
);

grant select, insert, delete on public.discord_links to authenticated;
grant select, insert, delete on public.discord_guild_links to authenticated;

alter table public.discord_links enable row level security;
alter table public.discord_guild_links enable row level security;

-- Read your own link
create policy discord_links_self_read on public.discord_links
  for select using (user_id = auth.uid());

-- Read guild links for groups you belong to
create policy discord_guild_links_member_read on public.discord_guild_links
  for select using (
    exists (
      select 1 from public.group_members
      where group_id = discord_guild_links.group_id
        and user_id = auth.uid()
    )
  );
```

### `discord_link_codes` (one-time)
For OAuth-free linking: user types `/link` in Discord → bot DMs a short code → user enters it on the Polymates site while logged in.

```sql
create table public.discord_link_codes (
  code text primary key,
  discord_user_id text not null,
  discord_username text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  consumed_at timestamptz
);
```

Cleanup job (pg_cron, daily): delete rows where `expires_at < now() - interval '1 day'`.

### RPC: `consume_discord_link_code`
Security-definer function that the (already authenticated) Polymates user calls to claim a code.

```sql
create or replace function public.consume_discord_link_code(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link discord_link_codes;
begin
  select * into v_link from discord_link_codes
   where code = p_code and consumed_at is null and expires_at > now()
   for update;
  if not found then
    raise exception 'Invalid or expired code';
  end if;

  insert into discord_links (discord_user_id, user_id)
  values (v_link.discord_user_id, auth.uid())
  on conflict (discord_user_id) do update set user_id = excluded.user_id;

  update discord_link_codes set consumed_at = now() where code = p_code;
end;
$$;

grant execute on function public.consume_discord_link_code(text) to authenticated;
```

---

## Discord App Setup

1. **discord.com/developers/applications** → New Application → "Polymates".
2. **Bot** tab → Add Bot → copy bot token (secret).
3. **OAuth2 → URL Generator** → scopes: `bot`, `applications.commands`. Permissions: `Send Messages`, `Embed Links`, `Read Message History`, `Add Reactions`, `Attach Files`.
4. **Bot → Privileged Gateway Intents** → enable `Message Content Intent` (required for the AI listener).
5. **General Information → Public Key** → copy (used to verify HTTP interactions).
6. **Interactions Endpoint URL** → point at your Supabase Edge Function URL (set this *after* the function is deployed and replies to PING).

### Slash commands to register

```jsonc
[
  { "name": "link", "description": "Link this Discord account to your Polymates account" },
  { "name": "connect", "description": "Link this channel to a Polymates group",
    "options": [{ "name": "group_id", "type": 3, "description": "Polymates group ID", "required": true }] },
  { "name": "new",  "description": "Create a new bet",
    "options": [
      { "name": "question",  "type": 3, "description": "The yes/no question", "required": true },
      { "name": "closes_in", "type": 3, "description": "e.g. 24h, 3d, friday-9pm", "required": true }
    ] },
  { "name": "bet",  "description": "Place a stake on an open bet",
    "options": [
      { "name": "amount", "type": 4, "description": "Points to stake", "required": true },
      { "name": "side",   "type": 3, "description": "yes or no", "required": true,
        "choices": [{ "name": "YES", "value": "yes" }, { "name": "NO", "value": "no" }] },
      { "name": "bet_id", "type": 3, "description": "Bet ID (omit for newest)", "required": false }
    ] },
  { "name": "bets", "description": "List open bets in this channel" }
]
```

Register them via the Discord REST API once at deploy time. Stored in a `scripts/register-commands.ts` one-shot.

---

## Edge Function 1 — `discord-bot`

Handles all HTTP interactions: slash commands, button clicks, reaction events forwarded by the listener.

### Responsibilities
- Verify Ed25519 signature from `X-Signature-Ed25519` / `X-Signature-Timestamp`. **Reject anything unsigned.**
- Respond to `PING` (Discord verifies the endpoint).
- Dispatch on command name.
- Look up `(discord_user_id → user_id)` and `(discord_channel_id → group_id)`.
- Call Polymates RPCs with a service-role Supabase client.
- Return Discord-formatted message JSON.

### File layout
```
supabase/functions/discord-bot/
  index.ts          // entry, signature verify, dispatch
  verify.ts         // ed25519 verification (uses tweetnacl or Web Crypto)
  handlers/
    link.ts
    connect.ts
    new.ts
    bet.ts
    bets.ts
    component.ts    // button + reaction callbacks
  lib/
    supabase.ts     // service-role client
    discord.ts      // embed builders, response helpers
    parse.ts        // "24h" / "3d" / "friday-9pm" → ISO timestamp
```

### Critical flow: `/bet`
1. Verify signature.
2. Look up `discord_user_id` → fail with link-prompt if missing.
3. Look up `discord_channel_id` → fail with "channel not connected" if missing.
4. If `bet_id` omitted: query newest open bet in the group, fail if >1 ambiguously close.
5. Call `place_bet(p_bet_id, p_side, p_amount)` via service-role client **impersonating the linked user** (set `auth.uid()` by minting a JWT for that user, or accept that this function bypasses RLS and trust the lookup).
6. Reply with a public embed: "Alice placed 50 on YES · pool now 67% YES · balance 950".

### The 3-second rule
Discord requires a response within 3 seconds. For anything that might be slow (AI parse, file upload), return:
```ts
{ type: 5 } // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
```
Then PATCH `/webhooks/{app_id}/{token}/messages/@original` with the real content within 15 minutes. All slow handlers should defer first.

### Service-role client
```ts
// lib/supabase.ts
import { createClient } from 'npm:@supabase/supabase-js@2'

export const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
```
**Never expose this client to the Discord listener.** The listener only talks to this Edge Function over HTTPS with a shared secret.

---

## The AI Listener (small Node service)

Lives outside Supabase because it needs a Gateway WebSocket.

### Stack
- **discord.js v14** — handles the Gateway connection, intents, reactions.
- **@anthropic-ai/sdk** — for the classifier + extractor.
- **node-fetch** — to call back into the Edge Function.
- Deployed to **Fly.io** (free tier) or **Railway** (~$5/mo). Single-process is fine; one bot connection can serve all guilds.

### Flow per message

```
on('messageCreate', async msg => {
  if (msg.author.bot) return

  // 1. Cheap prefilter — must contain a number AND a betting verb
  if (!/(\bbet\b|\bsays?\b|\bwager\b).*\b\d+\b|\b\d+\b.*(\byes\b|\bno\b)/i.test(msg.content)) return

  // 2. Classifier (Haiku, ~$0.0003/call)
  const intent = await classify(msg.content)
  if (intent === 'unrelated') return

  // 3. Extract structured bet
  if (intent === 'proposal') {
    const parsed = await extractBet(msg.content, msg.channel.recentMessages)
    if (!parsed) return
    await postConfirmation(msg.channel, parsed, msg.author)
  }

  if (intent === 'stake') {
    const parsed = await extractStake(msg.content, await getOpenBets(msg.channel.id))
    if (!parsed) return
    await postStakeConfirmation(msg, parsed)
  }
})
```

### Anthropic prompts

**Classifier** (Haiku, single call, max 16 tokens):
```
You are classifying chat messages from a group chat that has a betting bot.
Return one of: proposal, stake, evidence, unrelated.
- proposal: someone is suggesting a yes/no bet with stakes ("bet you 50 X won't happen")
- stake: someone is placing money on an existing bet ("100 on yes", "I'm in for 50")
- evidence: someone is providing proof for a bet ("here's the screenshot")
- unrelated: anything else, including figurative uses of "bet"
Message: """{content}"""
Classification:
```

**Extractor** (Sonnet, tool use):
```ts
tools: [{
  name: 'propose_bet',
  description: 'Extract a yes/no bet proposal from a chat message',
  input_schema: {
    type: 'object',
    required: ['title', 'closes_at_hint'],
    properties: {
      title: { type: 'string', description: 'Yes/no question, neutrally phrased' },
      closes_at_hint: { type: 'string', description: 'Natural-language deadline as said in the message' },
      proposer_side: { type: 'string', enum: ['yes', 'no', 'unknown'] },
      proposer_amount: { type: 'number' },
      counter_amount: { type: 'number' },
      mentioned_users: { type: 'array', items: { type: 'string' } }
    }
  }
}],
tool_choice: { type: 'tool', name: 'propose_bet' }
```

Force tool use → structured output → no JSON parsing failures.

### The confirmation rule

**Never auto-commit.** The bot posts an embed:

```
📋 New bet proposal
"Will Yamac finish the deck by Friday?"
Alice 50 NO · Bob 100 YES · closes Fri 11:59pm

React ✅ to confirm · ❌ to cancel · ✏️ to edit
```

When Alice and Bob both react ✅, the listener calls the Edge Function's `/confirm-bet` route, which atomically:
1. Creates the bet via `create_bet`.
2. Places both stakes via `place_bet`.
3. Posts a "Bet is live" embed and pins it.

If either reacts ❌, cancel and delete the embed. Timeout after 10 minutes.

---

## Edge Function 2 — `discord-notify`

Triggered by a database webhook on `verdicts INSERT`. Posts the ruling to the linked channel.

```sql
-- supabase: Database → Webhooks → Create
-- Event: INSERT on public.verdicts
-- HTTP POST to: https://<project>.functions.supabase.co/discord-notify
-- Header: Authorization: Bearer <shared secret>
```

```ts
// supabase/functions/discord-notify/index.ts
Deno.serve(async (req) => {
  // shared-secret auth
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${Deno.env.get('NOTIFY_SECRET')}`) return new Response('', { status: 401 })

  const { record } = await req.json()  // verdict row
  const { data: bet } = await sb
    .from('bets')
    .select('id, title, group_id')
    .eq('id', record.bet_id)
    .single()

  const { data: link } = await sb
    .from('discord_guild_links')
    .select('discord_channel_id')
    .eq('group_id', bet.group_id)
    .maybeSingle()
  if (!link) return new Response('', { status: 200 })

  await fetch(`https://discord.com/api/v10/channels/${link.discord_channel_id}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${Deno.env.get('DISCORD_BOT_TOKEN')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      embeds: [{
        title: `⚖️ ${bet.title}`,
        description: `**Verdict: ${record.outcome.toUpperCase()}**\n\n_${record.reasoning}_`,
        color: record.outcome === 'yes' ? 0x27ae60 : 0xe64556,
      }],
    }),
  })

  return new Response('', { status: 200 })
})
```

---

## Secrets

Set in Supabase: **Project Settings → Edge Functions → Secrets**.

| Name | Where used |
|---|---|
| `DISCORD_BOT_TOKEN` | both functions, listener |
| `DISCORD_PUBLIC_KEY` | `discord-bot` (signature verify) |
| `DISCORD_APP_ID` | command registration |
| `ANTHROPIC_API_KEY` | listener |
| `NOTIFY_SECRET` | `discord-notify` (webhook auth) |
| `LISTENER_SHARED_SECRET` | `discord-bot` route the listener calls |
| `SUPABASE_SERVICE_ROLE_KEY` | both functions (already set) |

---

## Linking flow (no OAuth)

1. **In Discord**: user types `/link` → bot generates random 6-char code, stores row in `discord_link_codes`, DMs the code: "Go to polymates.app/link and enter `4F2K9X`."
2. **In Polymates web app**: route `/link` shows a text input. On submit, calls `consume_discord_link_code(code)`.
3. **Done**: future Discord messages from that user resolve to their Polymates user_id.

For channels: `/connect group_id:<uuid>` — must be sent by someone already in that Polymates group (the function checks `group_members` for the linked user). Stores `(guild_id, channel_id) → group_id`.

---

## Build order (concrete checklist)

### Day 1 — Plumbing (~6h)
- [ ] Create Discord app, bot, copy keys
- [ ] Create `discord_links`, `discord_guild_links`, `discord_link_codes` tables + policies
- [ ] Write `consume_discord_link_code` RPC
- [ ] Scaffold `discord-bot` Edge Function: signature verify, PING/PONG, deploy
- [ ] Point Discord Interactions URL at the function, verify it accepts
- [ ] Register slash commands via one-shot script

### Day 2 — Commands (~6h)
- [ ] `/link` handler (generate code, DM user)
- [ ] `/link` web page on the Polymates frontend (single TextField → calls RPC)
- [ ] `/connect` handler (guild→group mapping with membership check)
- [ ] `/new` handler (parse `closes_in`, call `create_bet`, reply with embed)
- [ ] `/bet` handler (resolve target bet, call `place_bet`, reply with updated pool)
- [ ] `/bets` handler (list open bets in channel as embed)

### Day 3 — Verdicts + Listener (~6h)
- [ ] `discord-notify` Edge Function
- [ ] Supabase database webhook on `verdicts` → `discord-notify`
- [ ] Test full loop: create bet, both stake, deadline passes, judge rules, embed appears
- [ ] Stand up Node listener on Fly.io / Railway
- [ ] Classifier + extractor + confirmation flow
- [ ] False-positive tuning on a real chat log

### Day 4+ — Polish
- [ ] Image attachments → Storage (download from Discord CDN, re-upload, insert into `evidence`)
- [ ] Sell-out preview in `/bets` listing (when you add dynamic odds)
- [ ] `/leaderboard` command
- [ ] DM digest of resolved bets

---

## Failure modes & guardrails

| Risk | Mitigation |
|---|---|
| Bot misreads message → wrong bet committed | **Always require ✅ from both proposer and counter-party before commit.** No exceptions. |
| Same message classified twice (Discord retry) | Use `interaction.id` / `message.id` as idempotency key in `place_bet` calls; reject duplicates at RPC level. |
| User unlinked between message and confirm | Re-check `discord_links` at commit time, post error if missing. |
| Listener crashes mid-confirmation | Confirmation state stored in `discord_pending_bets` table with TTL, not in memory. |
| Cost runaway on chatty servers | Regex prefilter catches >95% before any AI call. Cap Haiku spend per guild per day in code. |
| Privacy concern from members | On `/connect`, bot posts a one-time disclosure embed: "I read messages in this channel to detect bet proposals. I never store messages I don't act on." |

---

## Out of scope for v1

- Voice channel commands
- DM-based betting (group context matters)
- Multi-group routing per channel (one channel = one group)
- Real-time probability bar updates in the embed (edit-loop is rate-limited; do batched 5-second updates max)
- Auto-suggesting bets from arguments (high false-positive risk; ship explicit-only first)

---

## What you reuse from Polymates

Everything that matters:

- `create_bet`, `place_bet`, `resolve_bet` RPCs — unchanged
- The arbiter Edge Function — unchanged
- `users`, `groups`, `group_members`, `bets`, `bet_positions`, `evidence`, `verdicts` — unchanged

The bot is purely a new **input/output surface** over the existing API. No business logic moves into Discord land. If the bot dies, Polymates keeps working; if the web app dies, the bot stops too (which is fine).

---

## File deliverables when done

```
supabase/
  migrations/
    m7_discord_bot.sql           // tables + RPC
  functions/
    discord-bot/                 // HTTP interactions
    discord-notify/              // verdict webhook → channel
discord-listener/                // separate repo, deployed to Fly.io
  src/
    index.ts
    classifier.ts
    extractor.ts
    confirmations.ts
  Dockerfile
  fly.toml
scripts/
  register-commands.ts           // one-shot to register slash commands
```
