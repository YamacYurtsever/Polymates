# Polymates

> *Polymarket for friend groups. Binary bets, parimutuel payouts, an AI judge.*

Polymates is a social betting app where friend groups create binary (Yes/No) bets, stake virtual points, submit evidence before the deadline, and let an AI arbiter deliver a humorous, courtroom‑themed verdict.

<!-- Screenshot: Landing page -->
<!-- ![Landing](docs/screenshots/landing.png) -->

---

## Features

- **Private friend groups** — share an invite link, every member starts with 1,000 points scoped to that group.
- **Binary bets** — create a Yes/No question with a closing deadline and parimutuel pool.
- **Wagering** — commit a side and an amount; positions are locked on submit.
- **Evidence submission** — upload images, PDFs, and captions until the deadline; client‑side image compression keeps uploads small.
- **AI arbiter** — a Supabase Edge Function ships the bet, description, and all evidence to Claude, which returns a forced YES/NO verdict with a ≤120‑word sarcastic ruling.
- **Parimutuel payouts** — losing pool is redistributed proportionally to winners; rounding remainder goes to the largest winning staker.
- **Live verdict panel** — Supabase realtime pushes the ruling to the bet page the moment it lands.
- **Share links** — public preview URL for any bet; signed‑out viewers are routed through sign up / log in and back.
- **Leaderboards** — per‑group standings with win/loss records.
- **Auto‑resolution** — `pg_cron` job sweeps overdue bets every minute so resolution doesn't depend on anyone having the page open.

<!-- Screenshot: Group page with active bets -->
<!-- ![Group page](docs/screenshots/group.png) -->

<!-- Screenshot: Bet page with wagering panel -->
<!-- ![Bet page](docs/screenshots/bet.png) -->

<!-- Screenshot: Verdict panel -->
<!-- ![Verdict](docs/screenshots/verdict.png) -->

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript |
| UI | MUI (courthouse theme) |
| Animation | GSAP |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| Arbiter | Supabase Edge Function → Anthropic API (Claude) |
| Validation | Zod |
| Scheduling | `pg_cron` + `pg_net` |
| Tooling | ESLint, Prettier |
| Hosting | Vercel (frontend) + Supabase (backend) |

---

## Data Model

- `users` — mirror of `auth.users`, holds username/email.
- `groups` — name, `invite_token`, creator.
- `group_members` — `(group_id, user_id, points)`; per‑group economy.
- `bets` — title, description, `closes_at`, status, `share_token`.
- `bet_positions` — `(bet_id, user_id, side, amount)`; locked on commit.
- `evidence` — Supabase Storage path + caption per submitter.
- `verdicts` — `outcome` + reasoning written by the arbiter.

All writes that depend on `auth.uid()` go through `security definer` RPCs (`create_group`, `create_bet`, `place_bet`, `resolve_bet`) so RLS can't be tripped by a NULL client‑side uid.

---

## Payout Logic

```
losing_pool      = sum of stakes on losing side
winner_share(u)  = stake(u) / total_winning_stakes
payout(u)        = stake(u) + floor(losing_pool × winner_share(u))
remainder        = losing_pool − Σ payouts        # rounding dust
                 → awarded to largest winning staker
```

Edge cases:
- All bets on the same side → losing pool is 0, winners get their stake back only.
- No evidence submitted → the arbiter rules on title + description alone and says so in the reasoning.

---

## Arbiter Contract

The `resolve-bet` Edge Function:

1. Loads the bet + every evidence file.
2. Builds a multimodal prompt (images/PDFs as base64, captions inline).
3. Calls the Anthropic API with a forced tool call returning:
   ```json
   { "verdict": "YES | NO", "reasoning": "string (≤120 words)" }
   ```
4. Validates with Zod, writes to `verdicts`, then calls `resolve_bet(bet_id, outcome)` to distribute points and flip the bet's status.

The arbiter never abstains.

---

## Pages

- `/` — Landing
- `/dashboard` — Your groups
- `/groups/[id]` — Group: members, points, active + resolved bets, invite link
- `/bets/new` — Create a bet
- `/bets/[id]` — Bet: positions, wager panel, evidence gallery, countdown, verdict
- `/invite/[token]` — Accept a group invite
- `/share/[token]` — Public bet preview / auth gate
- `/leaderboard/[groupId]` — Group leaderboard

---

## Local Development

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### Backend (Supabase)

1. Create a Supabase project.
2. Apply migrations in `backend/migrations/` in order.
3. Deploy the `resolve-bet` Edge Function and set `ANTHROPIC_API_KEY` in Supabase secrets.
4. (Optional) Enable `pg_cron` + `pg_net` and run `m8_cron.sql` to auto‑resolve overdue bets.

---

## Supabase Migration Rules

Every table migration must include:

1. `grant select, insert on public.<table> to authenticated;`
2. `alter table public.<table> enable row level security;`
3. `drop policy if exists` + `create policy` blocks (idempotent).

INSERT policies that depend on `auth.uid()` should be wrapped in a `security definer` RPC — direct client inserts can silently fail when `auth.uid()` is NULL.
