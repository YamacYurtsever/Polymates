# PolyMates — Product Plan

> *Polymarket for friend groups. Binary bets, parimutuel payouts, an AI judge, and a courtroom that takes your money but never itself.*

---

## Concept

PolyMates is a social betting app for friend groups. Members create binary (Yes/No) bets, stake virtual points, submit evidence before the deadline, and an AI arbiter delivers a humorous verdict. The UI and tone are themed around a courtroom — bets are cases, evidence is exhibits, the arbiter is The Honourable Judge, and every resolution is a ruling.

---

## Core Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Bet type | Binary only (Yes / No) | Simplest payout math, cleanest arbiter output |
| Odds system | Parimutuel | Losing pool distributed proportionally among winners |
| Resolution | AI arbiter, forced verdict | No abstain — submitted evidence is your case, make it count |
| Evidence | Any input the API accepts | Images, PDFs, text — context window is the only limit |
| Arbiter tone | Sarcastic judge | Defuses losing, creates a consistent character |
| Backend | Supabase (no Express) | Auth + DB + Storage + Edge Functions covers all needs |
| Arbiter runtime | Supabase Edge Function | Server-side secret, direct DB access, no separate server |

---

## Theme & Identity

The entire product is framed as a courtroom.

| App concept | Court framing |
|---|---|
| App name | The Court of PolyMates |
| Bet | Case |
| Create a bet | File a case |
| Evidence submission | Submit exhibits |
| Resolution timer | Court date |
| AI arbiter | The Honourable Judge |
| Verdict screen | The Ruling |
| Leaderboard | Court record / docket |
| Group | Courtroom / chambers |
| Points | Credits |

**Visual direction:** Dark navy and gold accents. Serif font (e.g. Playfair Display) for verdict text only — gives it an official document feel. Rest of the UI clean MUI. Gavel iconography used sparingly.

**Arbiter prompt tone:** "You are a sarcastic, witty judge presiding over petty disputes between friends. You take the evidence seriously but never yourself. Roast the situation, not the individual."

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
| Data fetching | TanStack Query |
| Testing | Vitest + React Testing Library |
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
| credits | integer | Starts at 1000 on signup |
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
losing_pool = sum of credits staked by losing side
winner_share(user) = user_stake / total_winning_stakes
payout(user) = user_stake + floor(losing_pool × winner_share)
remainder = losing_pool - sum of all payouts (rounding)
→ remainder awarded to highest staker on winning side
```

**Edge cases:**
- All bets on the same side → refund everyone, mark as `refunded`
- No evidence submitted → arbiter rules on title + description alone, reasoning states this explicitly
- Bet creator is the only participant → disallow resolution or refund

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
- App pitch, court theme intro
- Sign up / log in CTA

### `/dashboard` — Your chambers
- List of groups the user belongs to
- Recent activity feed (recent verdicts, new bets)
- Create group button

### `/groups/[id]` — Courtroom
- Active cases (open bets)
- Past rulings (resolved bets)
- Members list with credits
- Invite link with copy button
- File a new case button

### `/bets/[id]` — Case file
- Bet title and description
- Current positions breakdown (yes vs no, total credits at stake)
- Wager input (commit side + amount, irreversible)
- Evidence submission panel (upload files + caption)
- Court date countdown timer
- Verdict panel (post-resolution): ruling text in serif, winner/loser breakdown

### `/bets/new` — File a case
- Title (the question)
- Description (context and conditions)
- Court date (closes_at datetime picker)
- Submit

### `/invite/[token]` — Join courtroom
- Group name and member count
- Accept invite → join group

### `/leaderboard/[groupId]` — Court docket
- Ranked by credits
- Win/loss record per member
- Recent verdicts

---

## Milestones

### M1 — Auth & user setup
Supabase Auth (email + Google OAuth). New user trigger sets credits to 1000. Basic profile page.

### M2 — Groups & invite system
Create group, generate invite token, join via `/invite/[token]`, member list, admin role.

### M3 — Bet creation & case file page
File a case form, bet detail page, countdown timer, positions display.

### M4 — Wagering & credits system
Commit side + amount, lock position on submit, credits deducted immediately, payout math on resolution.

### M5 — Evidence submission
File upload to Supabase Storage, caption input, evidence gallery on case file page, submission closes with the timer.

### M6 — Arbiter integration & resolution
Edge Function, Anthropic API call with structured output, verdict written to DB, payout distribution triggered, verdict screen with sarcastic ruling in serif font.

### M7 — Leaderboard & profile
Court docket per group, win/loss record, credits history, profile page.

### M8 — Polish & edge cases
Refund logic, empty states, no-evidence warning, one-sided bet handling, MUI court theme (navy + gold), mobile responsiveness.

---

## Key Edge Cases

| Scenario | Handling |
|---|---|
| All bets on one side | Refund all, status → refunded |
| No evidence submitted | Arbiter rules on description, states this in reasoning |
| Only one participant | Disallow closing, prompt creator to cancel |
| Rounding remainder | Award to highest staker on winning side |
| Bet creator goes AWOL | Timer triggers auto-resolution regardless |
| Contradictory evidence | Arbiter weighs and rules, states conflict in reasoning |

---

## Out of Scope (MVP)

- Real money
- Dispute / appeal window
- Push notifications
- Native mobile app
- Public groups
- Bet templates# PolyMates — Product Plan

> *Polymarket for friend groups. Binary bets, parimutuel payouts, an AI judge, and a courtroom that takes your money but never itself.*

---

## Concept

PolyMates is a social betting app for friend groups. Members create binary (Yes/No) bets, stake virtual points, submit evidence before the deadline, and an AI arbiter delivers a humorous verdict. The UI and tone are themed around a courtroom — bets are cases, evidence is exhibits, the arbiter is The Honourable Judge, and every resolution is a ruling.

---

## Core Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Bet type | Binary only (Yes / No) | Simplest payout math, cleanest arbiter output |
| Odds system | Parimutuel | Losing pool distributed proportionally among winners |
| Resolution | AI arbiter, forced verdict | No abstain — submitted evidence is your case, make it count |
| Evidence | Any input the API accepts | Images, PDFs, text — context window is the only limit |
| Arbiter tone | Sarcastic judge | Defuses losing, creates a consistent character |
| Backend | Supabase (no Express) | Auth + DB + Storage + Edge Functions covers all needs |
| Arbiter runtime | Supabase Edge Function | Server-side secret, direct DB access, no separate server |

---

## Theme & Identity

The entire product is framed as a courtroom.

| App concept | Court framing |
|---|---|
| App name | The Court of PolyMates |
| Bet | Case |
| Create a bet | File a case |
| Evidence submission | Submit exhibits |
| Resolution timer | Court date |
| AI arbiter | The Honourable Judge |
| Verdict screen | The Ruling |
| Leaderboard | Court record / docket |
| Group | Courtroom / chambers |
| Points | Credits |

**Visual direction:** Dark navy and gold accents. Serif font (e.g. Playfair Display) for verdict text only — gives it an official document feel. Rest of the UI clean MUI. Gavel iconography used sparingly.

**Arbiter prompt tone:** "You are a sarcastic, witty judge presiding over petty disputes between friends. You take the evidence seriously but never yourself. Roast the situation, not the individual."

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
| Data fetching | TanStack Query |
| Testing | Vitest + React Testing Library |
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
| credits | integer | Starts at 1000 on signup |
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
losing_pool = sum of credits staked by losing side
winner_share(user) = user_stake / total_winning_stakes
payout(user) = user_stake + floor(losing_pool × winner_share)
remainder = losing_pool - sum of all payouts (rounding)
→ remainder awarded to highest staker on winning side
```

**Edge cases:**
- All bets on the same side → refund everyone, mark as `refunded`
- No evidence submitted → arbiter rules on title + description alone, reasoning states this explicitly
- Bet creator is the only participant → disallow resolution or refund

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
- App pitch, court theme intro
- Sign up / log in CTA

### `/dashboard` — Your chambers
- List of groups the user belongs to
- Recent activity feed (recent verdicts, new bets)
- Create group button

### `/groups/[id]` — Courtroom
- Active cases (open bets)
- Past rulings (resolved bets)
- Members list with credits
- Invite link with copy button
- File a new case button

### `/bets/[id]` — Case file
- Bet title and description
- Current positions breakdown (yes vs no, total credits at stake)
- Wager input (commit side + amount, irreversible)
- Evidence submission panel (upload files + caption)
- Court date countdown timer
- Verdict panel (post-resolution): ruling text in serif, winner/loser breakdown

### `/bets/new` — File a case
- Title (the question)
- Description (context and conditions)
- Court date (closes_at datetime picker)
- Submit

### `/invite/[token]` — Join courtroom
- Group name and member count
- Accept invite → join group

### `/leaderboard/[groupId]` — Court docket
- Ranked by credits
- Win/loss record per member
- Recent verdicts

---

## Milestones

### M1 — Auth & user setup
Supabase Auth (email + Google OAuth). New user trigger sets credits to 1000. Basic profile page.

### M2 — Groups & invite system
Create group, generate invite token, join via `/invite/[token]`, member list, admin role.

### M3 — Bet creation & case file page
File a case form, bet detail page, countdown timer, positions display.

### M4 — Wagering & credits system
Commit side + amount, lock position on submit, credits deducted immediately, payout math on resolution.

### M5 — Evidence submission
File upload to Supabase Storage, caption input, evidence gallery on case file page, submission closes with the timer.

### M6 — Arbiter integration & resolution
Edge Function, Anthropic API call with structured output, verdict written to DB, payout distribution triggered, verdict screen with sarcastic ruling in serif font.

### M7 — Leaderboard & profile
Court docket per group, win/loss record, credits history, profile page.

### M8 — Polish & edge cases
Refund logic, empty states, no-evidence warning, one-sided bet handling, MUI court theme (navy + gold), mobile responsiveness.

---

## Key Edge Cases

| Scenario | Handling |
|---|---|
| All bets on one side | Refund all, status → refunded |
| No evidence submitted | Arbiter rules on description, states this in reasoning |
| Only one participant | Disallow closing, prompt creator to cancel |
| Rounding remainder | Award to highest staker on winning side |
| Bet creator goes AWOL | Timer triggers auto-resolution regardless |
| Contradictory evidence | Arbiter weighs and rules, states conflict in reasoning |

---

## Out of Scope (MVP)

- Real money
- Dispute / appeal window
- Push notifications
- Native mobile app
- Public groups
- Bet templates