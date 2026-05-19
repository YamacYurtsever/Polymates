# Polymates — Product Plan

> *Polymarket for friend groups. Binary bets, parimutuel payouts, an AI judge.*

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
| display_name | text | |
| avatar_url | text | |
| created_at | timestamptz | |

### `groups`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| description | text | |
| invite_token | uuid | Random UUID, shareable |
| created_by | uuid FK → users | |
| created_at | timestamptz | |

### `group_members`
| Field | Type | Notes |
|---|---|---|
| group_id | uuid FK → groups | |
| user_id | uuid FK → users | |
| role | enum: admin\|member | Creator is admin |
| points | integer | Starts at 1000 on join; scoped to this group |
| joined_at | timestamptz | |

### `bets`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| group_id | uuid FK → groups | |
| creator_id | uuid FK → users | |
| title | text | The question |
| description | text | Context and conditions |
| closes_at | timestamptz | Evidence submission deadline |
| status | enum: open\|closed\|resolved\|refunded | |
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
| file_type | text | MIME type |
| caption | text | Optional user note |
| submitted_at | timestamptz | |

### `verdicts`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| bet_id | uuid FK → bets | |
| outcome | enum: yes\|no | |
| reasoning | text | ≤120 word humorous ruling |
| resolved_at | timestamptz | |

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
- All bets on the same side → refund everyone, mark as `refunded`
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
- [x] Sign up page (email + password)
- [x] Log in page (email + password)
- [x] Protected route wrapper (redirects to login if no session)
- [x] Sign out button

### Frontend — Profile Page
- [x] `/profile` page showing display name, avatar, per-group points breakdown
- [x] Edit display name field

---

## M2 — Groups & Invite System

### Database
- [ ] Create `groups` table with all fields from schema
- [ ] Create `group_members` table with all fields from schema (including `points integer default 1000`)
- [ ] Enable RLS on `groups` table
- [ ] Enable RLS on `group_members` table
- [ ] RLS policy: users can only read groups they are a member of
- [ ] RLS policy: users can only read `group_members` rows for groups they belong to

### Frontend — Dashboard (`/dashboard`)
- [x] List all groups the current user belongs to
- [x] Each group card shows name, member count
- [x] Create group button

### Frontend — Create Group
- [ ] Modal or page with group name + description fields
- [ ] On submit: insert into `groups`, insert creator into `group_members` with role `admin`, generate `invite_token` (can use `crypto.randomUUID()`)

### Frontend — Group Page (`/groups/[id]`)
- [x] Group name and description header
- [x] Members list with display names and points
- [x] Invite link display with copy button (`/invite/[token]`)
- [x] Placeholder sections for active and resolved bets (populated in M3)

### Frontend — Join via Invite (`/invite/[token]`)
- [ ] Fetch group by `invite_token`
- [ ] Show group name and current member count
- [ ] Accept invite button → insert into `group_members` with role `member`
- [ ] Redirect to `/groups/[id]` on success

---

## M3 — Bet Creation & Bet Page

### Database
- [ ] Create `bets` table with all fields from schema
- [ ] Create `bet_positions` table with all fields from schema
- [ ] Enable RLS on `bets` table
- [ ] Enable RLS on `bet_positions` table
- [ ] RLS policy: users can only read bets belonging to groups they are a member of
- [ ] RLS policy: users can only create bets in groups they are a member of
- [ ] RLS policy: users can only read positions for bets they have access to

### Frontend — Create Bet (`/bets/new`)
- [ ] Title input (the question)
- [ ] Description input (context and conditions)
- [ ] Closing datetime picker
- [ ] Group selector (from user's groups)
- [ ] Submit → insert into `bets` with status `open`
- [ ] Redirect to `/bets/[id]` on success

### Frontend — Bet Page (`/bets/[id]`)
- [ ] Bet title and description
- [ ] Created by and closing time display
- [ ] Countdown timer to `closes_at` (updates every second)
- [ ] Positions breakdown: Yes vs No, total points staked on each side, number of bettors
- [ ] Placeholder for wagering panel (M4)
- [ ] Placeholder for evidence panel (M5)
- [ ] Placeholder for verdict panel (M6)

### Frontend — Group Page Update
- [ ] Active bets list on `/groups/[id]` (status `open`)
- [ ] Resolved bets list on `/groups/[id]` (status `resolved`)
- [ ] Create new bet button linking to `/bets/new?groupId=[id]`

---

## M4 — Wagering & Points System

### Database
- [ ] RLS policy: users can insert their own positions only
- [ ] RLS policy: users cannot update or delete positions (locked on commit)
- [ ] Postgres function `place_bet(bet_id, user_id, side, amount)` that atomically:
  - [ ] Checks user has sufficient points in `group_members` for this bet's group
  - [ ] Checks bet status is `open`
  - [ ] Checks user has no existing position on this bet
  - [ ] Inserts into `bet_positions`
  - [ ] Deducts points from `group_members` (scoped to bet's group)
- [ ] Postgres function `resolve_bet(bet_id, outcome)` that:
  - [ ] Calculates parimutuel payouts
  - [ ] Distributes points to winners via `group_members` (scoped to bet's group)
  - [ ] Awards remainder to highest staker on winning side
  - [ ] Handles zero winners edge case (refund everyone)
  - [ ] Updates bet status to `resolved` or `refunded`

### Frontend — Bet Page Wagering Panel
- [ ] Side selector (Yes / No toggle)
- [ ] Amount input with user's points balance for this group shown
- [ ] Validation: amount > 0, amount ≤ user's group points, bet still open
- [ ] Submit button → calls `place_bet` function
- [ ] Lock UI after position committed (show existing position instead)
- [ ] Optimistically update positions display after wager

### Frontend — Points Display
- [ ] Show updated group-scoped points balance on bet page and group page after wager
- [ ] Show per-group points breakdown on profile page
- [ ] Show each user's stake on the bet page positions breakdown

---

## M5 — Evidence Submission

### Supabase Storage
- [ ] Create storage bucket `evidence` (private, not public)
- [ ] Storage policy: authenticated users can upload to their own folder (`user_id/bet_id/filename`)
- [ ] Storage policy: users can read evidence for bets in their groups only

### Database
- [ ] Create `evidence` table with all fields from schema
- [ ] Enable RLS on `evidence` table
- [ ] RLS policy: users can insert their own evidence only
- [ ] RLS policy: users can read evidence for bets they have access to
- [ ] RLS policy: evidence submission blocked if `bet.closes_at` has passed (check in insert policy)

### Frontend — Evidence Submission Panel (on `/bets/[id]`)
- [ ] File upload input (images, PDFs)
- [ ] Caption text input
- [ ] Submit button → upload file to Supabase Storage, insert into `evidence` table
- [ ] Disable submission panel when countdown reaches zero
- [ ] Show upload progress indicator
- [ ] Error handling for oversized files or wrong file types

### Frontend — Evidence Gallery (on `/bets/[id]`)
- [ ] List all submitted evidence for the bet
- [ ] Show submitter display name and caption
- [ ] Render image previews inline
- [ ] PDF shows as a download link with filename
- [ ] Visible to all group members regardless of which side they bet on

---

## M6 — Arbiter Integration & Resolution

### Supabase Edge Function
- [ ] Create edge function `resolve-bet`
- [ ] Add `ANTHROPIC_API_KEY` to Supabase secrets
- [ ] Function fetches bet title, description, and all evidence for the bet
- [ ] Constructs prompt with evidence attached (images as base64, PDFs as base64, text captions inline)
- [ ] Calls Anthropic API with structured output schema
- [ ] Validates response with Zod schema
- [ ] Writes verdict to `verdicts` table
- [ ] Calls `resolve_bet(bet_id, outcome)` to trigger payout distribution
- [ ] Wraps steps above in error handling — if API call fails, bet stays `closed` and can be retried

### Trigger — Auto-close Bets
- [ ] Supabase pg_cron job that runs every minute
- [ ] Finds bets where `closes_at < now()` and `status = open`
- [ ] Updates status to `closed`
- [ ] Calls `resolve-bet` edge function for each

### Database
- [ ] Create `verdicts` table with all fields from schema
- [ ] Enable RLS on `verdicts` table
- [ ] RLS policy: verdicts readable by group members only

### Frontend — Verdict Panel (on `/bets/[id]`)
- [ ] Hidden until bet status is `resolved`
- [ ] Courtroom-themed reveal animation
- [ ] "The Honourable Judge" header
- [ ] Ruling text (reasoning from verdict)
- [ ] YES / NO outcome displayed prominently
- [ ] Winner/loser breakdown with points won and lost per user
- [ ] Confetti or gavel animation on reveal

### Frontend — Bet Status Updates
- [ ] Poll bet status every 30 seconds or use Supabase realtime subscription
- [ ] Update UI automatically when status changes from `open` → `closed` → `resolved`
