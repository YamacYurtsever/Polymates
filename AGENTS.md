# Polymates — Product Plan

> *Polymarket for friend groups. Binary bets, parimutuel payouts, an AI judge.*

---

## Supabase Migration Checklist

Every migration that creates a table **must** include all three:

1. **`GRANT`** — RLS and grants are orthogonal. Without it, `authenticated` has zero table access regardless of policies.
   ```sql
   grant select, insert on public.<table> to authenticated;
   ```
2. **RLS enabled** — `alter table public.<table> enable row level security;`
3. **Policies** — Use `drop policy if exists` before each `create policy` for idempotency.

**INSERT policies that check `auth.uid()`** — always use a `security definer` RPC instead of direct client inserts. `auth.uid()` can be NULL client-side, causing silent RLS failures. Established pattern: `create_group`, `create_bet`.

---

## Concept

Polymates is a social betting app for friend groups. Members create binary (Yes/No) bets, stake virtual points, submit evidence before the deadline, and an AI arbiter delivers a humorous verdict. The UI and tone are themed around a courtroom.

---

## Core Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Bet type | Binary only (Yes / No) | Simplest payout math, cleanest arbiter output |
| Odds system | Parimutuel | Losing pool distributed proportionally among winners |
| Resolution | AI arbiter, forced verdict | No abstain — submitted evidence is your case, make it count |
| Evidence | Any input the API accepts | Images, PDFs, text — context window is the only limit |
| Backend | Supabase | Auth + DB + Storage + Edge Functions covers all needs |
| Arbiter runtime | Supabase Edge Function | Server-side secret, direct DB access, no separate server |
| Points scope | Per-group | Each group is its own economy; leaderboards and balances are group-scoped |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + MUI + Vite |
| Language | TypeScript |
| Backend | Supabase (direct client) |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Storage | Supabase Storage (evidence files) |
| Arbiter | Supabase Edge Function → Anthropic API |
| Validation | Zod |
| Code quality | ESLint + Prettier |
| Deployment | Vercel (frontend) + Supabase (backend) |

---

## Data Model

### `users`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | Supabase Auth user id |
| email | text | |
| username | text | |

### `groups`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| invite_token | uuid | Random UUID, shareable |
| created_by | uuid FK → users | |

### `group_members`
| Field | Type | Notes |
|---|---|---|
| group_id | uuid FK → groups | |
| user_id | uuid FK → users | |
| points | integer | Starts at 1000 on join; scoped to this group |

### `bets`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| group_id | uuid FK → groups | |
| creator_id | uuid FK → users | |
| title | text | The question |
| description | text | Context and conditions |
| closes_at | timestamptz | Evidence submission deadline |
| status | enum: open\|closed | |
| created_at | timestamptz | |

### `bet_positions`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| bet_id | uuid FK → bets | |
| user_id | uuid FK → users | |
| side | enum: yes\|no | |
| amount | integer | Credits staked |
| created_at | timestamptz | Locked on commit |

### `evidence`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| bet_id | uuid FK → bets | |
| user_id | uuid FK → users | |
| storage_path | text | Supabase Storage path |
| caption | text | Optional user note |

### `verdicts`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| bet_id | uuid FK → bets | |
| outcome | enum: yes\|no | |
| reasoning | text | ≤120 word humorous ruling |

---

## Payout Logic
```
losing_pool = sum of points staked by losing side
winner_share(user) = user_stake / total_winning_stakes
payout(user) = user_stake + floor(losing_pool × winner_share)
remainder = losing_pool - sum of all payouts (rounding)
→ remainder awarded to highest staker on winning side
```

**Edge cases:**
- All bets on the same side → `losing_pool = 0`, winners receive their stake back only (no redistribution)
- No evidence submitted → arbiter rules on title + description alone, reasoning states this explicitly

---

## Arbiter Contract

The Edge Function calls the Anthropic API with the following structured output schema:

```json
{
  "verdict": "YES | NO",
  "reasoning": "string (max 120 words, sarcastic judge tone)"
}
```

The function:
1. Fetches bet title, description, and all evidence for the bet
2. Constructs the prompt with evidence attached (images, PDFs, text)
3. Calls Anthropic API with structured output
4. Writes verdict to `verdicts` table
5. Triggers payout distribution
6. Updates bet status to `resolved`

The arbiter **always** returns YES or NO — no abstain. If evidence is absent or ambiguous, it rules on the most probable outcome from the description and states this in the reasoning.

---

## Pages

### `/` — Landing
- App pitch and sign up / log in CTA
- Nav bar includes account menu (avatar button → sign out)

### `/dashboard` — Dashboard
- List of groups the user belongs to
- Create group button

### `/groups/[id]` — Group page
- Active bets
- Past resolved bets
- Members list with points
- Invite link with copy button
- Create new bet button

### `/bets/[id]` — Bet page
- Bet title and description
- Current positions breakdown (yes vs no, total points at stake)
- Wager input (commit side + amount, irreversible)
- Evidence submission panel (upload files + caption)
- Countdown timer to close
- Verdict panel (post-resolution): ruling text, winner/loser breakdown

### `/bets/new` — Create bet
- Title (the question)
- Description (context and conditions)
- Closing datetime picker
- Submit

### `/invite/[token]` — Join group
- Group name and member count
- Accept invite button

### `/leaderboard/[groupId]` — Leaderboard
- Ranked by points
- Win/loss record per member
- Recent verdicts

---

## PolyMates — Implementation Plan

---

## M1 — Auth & User Setup

### Supabase Setup
- [x] Create new Supabase project
- [x] Enable Email provider in Auth settings

### Database
- [x] Create `users` table with all fields from schema
- [x] Create Postgres function `handle_new_user()` that inserts into `users` on signup (no points — points live in `group_members`)
- [x] Create trigger `on_auth_user_created` that fires `handle_new_user()` after insert on `auth.users`
- [x] Enable RLS on `users` table
- [x] Add RLS policy: users can read/update their own row only

### Frontend — Project Setup
- [x] Scaffold project with Vite + React + TypeScript
- [x] Install and configure MUI
- [x] Install Supabase JS client
- [x] Set up `.env` with Supabase URL and anon key
- [x] Create Supabase client singleton (`src/lib/supabase.ts`)

### Frontend — Auth
- [x] Auth context/provider with session state
- [x] Sign up page (email + password + username)
- [x] Log in page (email + password)
- [x] Protected route wrapper (redirects to login if no session)
- [x] Avatar button in navbar opens account menu (sign out)

---

## M2 — Groups & Invite System

### Database
- [x] Create `groups` table with all fields from schema
- [x] Create `group_members` table with all fields from schema (including `points integer default 1000`)
- [x] Enable RLS on `groups` table
- [x] Enable RLS on `group_members` table
- [x] RLS policy: users can only read groups they are a member of
- [x] RLS policy: users can only read `group_members` rows for groups they belong to

### Frontend — Dashboard (`/dashboard`)
- [x] List all groups the current user belongs to
- [x] Each group card shows name, member count
- [x] Create group button

### Frontend — Create Group
- [x] Modal with group name field
- [x] On submit: insert into `groups`, insert creator into `group_members` with `points = 1000`, `invite_token` auto-generated by DB

### Frontend — Group Page (`/groups/[id]`)
- [x] Group name header
- [x] Members list with usernames and points
- [x] Invite link display with copy button (`/invite/[token]`)
- [x] Placeholder sections for active and resolved bets (populated in M3)

### Frontend — Join via Invite (`/invite/[token]`)
- [x] Fetch group by `invite_token` via RPC (bypasses RLS for non-members)
- [x] Show group name and current member count
- [x] Accept invite button → insert into `group_members` with `points = 1000`
- [x] Redirect to `/groups/[id]` on success

---

## M3 — Bet Creation & Bet Page

### Database
- [x] Create `bets` table with all fields from schema
- [x] Create `bet_positions` table with all fields from schema
- [x] Enable RLS on `bets` table
- [x] Enable RLS on `bet_positions` table
- [x] RLS policy: users can only read bets belonging to groups they are a member of
- [x] RLS policy: users can only create bets in groups they are a member of
- [x] RLS policy: users can only read positions for bets they have access to
- [x] RPC `create_bet(p_group_id, p_title, p_description, p_closes_at)` — security definer, validates group membership, avoids client-side auth.uid() issues

### Frontend — Create Bet (`/bets/new`)
- [x] Title input (the question)
- [x] Description input (context and conditions)
- [x] Closing datetime picker
- [x] Group selector (from user's groups)
- [x] Submit → calls `create_bet` RPC
- [x] Redirect to `/bets/[id]` on success

### Frontend — Bet Page (`/bets/[id]`)
- [x] Bet title and description
- [x] Created by and closing time display
- [x] Countdown timer to `closes_at` (updates every second)
- [x] Positions breakdown: Yes vs No, total points staked on each side, number of bettors
- [x] Placeholder for wagering panel (M4)
- [x] Placeholder for evidence panel (M5)
- [x] Placeholder for verdict panel (M6)

### Frontend — Group Page Update
- [x] Active bets list on `/groups/[id]` (status `open` or `closed`)
- [x] Resolved bets list on `/groups/[id]` (status `resolved` or `refunded`)
- [x] Create new bet button linking to `/bets/new?groupId=[id]`

---

## M4 — Wagering & Points System

### Database
- [x] RLS policy: users can insert their own positions only
- [x] RLS policy: users cannot update or delete positions (locked on commit)
- [x] Postgres function `place_bet(p_bet_id, p_side, p_amount)` that atomically:
  - [x] Checks user has sufficient points in `group_members` for this bet's group
  - [x] Checks bet status is `open`
  - [x] Checks user has no existing position on this bet
  - [x] Inserts into `bet_positions`
  - [x] Deducts points from `group_members` (scoped to bet's group)
- [x] Postgres function `resolve_bet(p_bet_id, p_outcome)` that:
  - [x] Calculates parimutuel payouts
  - [x] Distributes points to winners via `group_members` (scoped to bet's group)
  - [x] Awards remainder to highest staker on winning side
  - [x] Handles zero losing pool (all bets on winning side) — winners get stake back only
  - [x] Updates bet status to `closed`

### Frontend — Bet Page Wagering Panel
- [x] Side selector (Yes / No toggle)
- [x] Amount input with user's points balance for this group shown
- [x] Validation: amount > 0, amount ≤ user's group points, bet still open
- [x] Submit button → calls `place_bet` function
- [x] Lock UI after position committed (show existing position instead)
- [x] Optimistically update positions display after wager

### Frontend — Points Display
- [x] Show updated group-scoped points balance on bet page after wager
- [x] Show each user's stake on the bet page positions breakdown

---

## M5 — Evidence Submission

### Supabase Storage
- [x] Create storage bucket `evidence` (private, not public)
- [x] Storage policy: authenticated users can upload to their own folder (`user_id/bet_id/filename`)
- [x] Storage policy: users can read evidence for bets in their groups only

### Database
- [x] Create `evidence` table with all fields from schema
- [x] Enable RLS on `evidence` table
- [x] RLS policy: users can insert their own evidence only
- [x] RLS policy: users can read evidence for bets they have access to
- [x] RLS policy: evidence submission blocked if `bet.closes_at` has passed (check in insert policy)

### Frontend — Evidence Submission Panel (on `/bets/[id]`)
- [x] File upload input (images, PDFs)
- [x] Caption text input (80 char limit)
- [x] Submit button → upload file to Supabase Storage, insert into `evidence` table
- [x] Disable submission panel when countdown reaches zero or bet is closed
- [x] Show upload progress indicator (compression + upload)
- [x] Error handling for oversized files or wrong file types
- [x] Client-side image compression before upload (max 1MB / 1920px)

### Frontend — Evidence Gallery (on `/bets/[id]`)
- [x] Fixed-size card grid with thumbnail previews
- [x] Show submitter username, relative timestamp, and caption
- [x] Click card to open full-size modal
- [x] PDF shows as download link in modal
- [x] Visible to all group members regardless of which side they bet on

---

## M6 — Arbiter Integration & Resolution

### Supabase Edge Function
- [x] Create edge function `resolve-bet`
- [x] Add `ANTHROPIC_API_KEY` to Supabase secrets
- [x] Function fetches bet title, description, and all evidence for the bet
- [x] Constructs prompt with evidence attached (images as base64, PDFs as base64, text captions inline)
- [x] Calls Anthropic API with tool_choice forced verdict (structured output)
- [x] Validates response with Zod schema
- [x] Writes verdict to `verdicts` table
- [x] Calls `resolve_bet(bet_id, outcome)` to trigger payout distribution
- [x] Error handling — if API call fails, bet stays `closed` and can be retried

### Trigger — Auto-close Bets
- [ ] Supabase pg_cron job that runs every minute
- [ ] Finds bets where `closes_at < now()` and `status = open`
- [ ] Updates status to `closed` then calls `resolve-bet` edge function for each
- Note: pg_cron template provided in `m6_arbiter.sql` (commented out)

### Database
- [x] Create `verdicts` table with all fields from schema
- [x] Enable RLS on `verdicts` table
- [x] RLS policy: verdicts readable by group members only

### Frontend — Verdict Panel (on `/bets/[id]`)
- [x] Hidden until verdict exists
- [x] "The Honourable Judge" header with gavel icon
- [x] Ruling text (reasoning) in italic quote
- [x] YES / NO outcome displayed prominently with colour
- [x] Winner/loser breakdown with points won and lost per user
- [x] Shows "judge is deliberating…" when closed but no verdict yet

### Frontend — Bet Status Updates
- [x] Supabase realtime subscription on `verdicts` INSERT — verdict panel appears live
