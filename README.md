# Polymates

Polymarket for friend groups. Binary bets, parimutuel payouts, an AI judge.

**Live app:** https://polymates.vercel.app

---

## What it is

Polymates lets friend groups bet virtual points on real-world outcomes. Members create yes/no questions, stake points, submit evidence before the deadline, and an AI arbiter delivers a humorous courtroom verdict.

- **Binary bets** — every bet is Yes or No
- **Parimutuel payouts** — the losing pool is distributed proportionally among winners
- **AI arbiter** — a Supabase Edge Function calls the Anthropic API to force a verdict; no abstaining
- **Per-group economy** — each group has its own points ledger; members start with 1 000 points

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + MUI v6 + Vite |
| Language | TypeScript |
| Backend | Supabase (Auth, Postgres, Storage, Edge Functions) |
| Arbiter | Supabase Edge Function → Anthropic API |
| Deployment | Vercel (frontend) + Supabase (backend) |

---

## Features

- **Groups** — create a group, share an invite link, and manage your friend circle
- **Bets** — create a bet with a title, description, and deadline; share a direct link
- **Wagering** — stake points on Yes or No; position is locked on commit
- **Evidence** — upload images or PDFs with a caption before the deadline; client-side image compression built in
- **Verdicts** — the AI arbiter rules and payouts are distributed automatically; verdict panel updates live via Supabase Realtime
- **Leaderboard** — group-scoped rankings by points with win/loss records

---

## Project structure

```
polymates/
├── frontend/          # React + Vite app
│   └── src/
│       ├── pages/     # Landing, Dashboard, GroupPage, BetPage, …
│       ├── components/
│       ├── contexts/  # Auth context
│       ├── hooks/
│       └── lib/       # Supabase client
└── backend/
    ├── migrations/    # Postgres migrations (m1–m8)
    └── functions/
        └── resolve-bet/   # Supabase Edge Function (Anthropic API)
```

---

## Local development

### Prerequisites

- Node.js 18+
- A Supabase project with migrations applied (see `backend/migrations/`)
- An Anthropic API key added to Supabase secrets as `ANTHROPIC_API_KEY`

### Setup

```bash
cd frontend
npm install
cp .env.example .env        # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### Database

Apply migrations in order against your Supabase project:

```
m1_auth_user_setup.sql
m2_groups.sql
m3_bets.sql
m4_wagering.sql
m5_evidence.sql
m6_arbiter.sql
m7_bet_share.sql
m8_comments.sql
```

---

## How bets work

1. A member creates a bet with a closing time
2. Members stake points on Yes or No before the deadline
3. After the deadline, anyone can submit evidence; submissions are locked when time expires
4. The AI arbiter is invoked — it reads the bet description and all evidence, then rules Yes or No with a short humorous ruling
5. Payouts are distributed: winners recover their stake plus a proportional share of the losing pool

**Edge cases handled:**
- All bets on the same side → losing pool is zero; winners get their stake back
- No evidence submitted → arbiter rules on title and description alone and says so in the reasoning
