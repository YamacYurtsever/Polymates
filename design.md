# Polymates — Design Brief

## What it is

A social betting app for friend group chats. Members create binary (Yes/No) bets, stake points, submit evidence, and an AI resolves the outcome. Per-group economies, parimutuel payouts.

## Who it's for

Friend groups (3–15 people), 18–30, group-chat natives. Mobile-first usage even though it's a web app — most bets get placed mid-conversation on a phone.

## Reference

**Polymarket is the visual north star.** Clean, dense, info-first. The UI reads like a market — current odds, pools, recent positions — not like a chat app or a game. We're borrowing their clarity and their confidence; we're keeping our own (friendlier) brand on top.

What we take from Polymarket:
- Dense, scannable card layouts
- Probability/percentage as the dominant visual element
- Two-sided YES/NO buttons with prominent pricing
- Functional, near-flat aesthetic — minimal ornament
- Information hierarchy: question → odds → action → context
- Comfortable with numbers, percentages, and tickers as design elements

What we leave behind:
- Crypto/finance gravity (we're for friends, not traders)
- The grayscale-on-grayscale severity (we want a little warmth)
- Order-book complexity (we're parimutuel and binary only)

## Tone

Confident, modern, sharp. Reads like a product built by people who use Linear, Vercel, Robinhood. Friendly through copy, not through bubbly visuals. The humour comes from the *bets themselves* — the UI plays it straight so the absurdity of "will Yamac actually pull an all-nighter" lands harder.

## Aesthetic direction

- **Palette:**
  - Base: near-white background (`#FAFAFA`-ish), with a true white card surface
  - Text: near-black (`#0E0E0F` warm), grey scale for secondary
  - **YES = green** (Polymarket green, `~#27AE60` territory — confident, not neon)
  - **NO = red/pink** (`~#E64556` — Polymarket-style coral, not blood red)
  - **Primary accent = a single brand colour** that *isn't* green or red, so it doesn't compete with YES/NO. Recommend: **electric blue** (`~#2D5BFF`) or **deep violet** (`~#5B3FFF`). One, not both. Used for CTAs, links, active states, brand moments.
  - Borders: hairline `#E5E5E7`, never heavy
- **Type:**
  - **Headlines & numbers:** a geometric sans with strong numerals — **Söhne**, **Geist**, **Aeonik**, or **Inter Display**. Tight tracking. Big confident percentages.
  - **Body / UI:** **Inter** or **Geist** at 14–15px. Standard, readable, gets out of the way.
  - **Mono:** **Geist Mono** or **JetBrains Mono** for point amounts, IDs, timestamps. Light usage.
  - Single typeface family ideally, with multiple weights doing the work.
- **Density:** comfortably dense. Polymarket-tight on lists and cards. Don't waste space, but don't cram.
- **Corners:** subtle. `6–8px` radius on cards and buttons. Not pill-shaped, not sharp.
- **Shadows:** almost none. Borders and background contrast do the lifting. Maybe one soft elevation on modals.
- **Motion:** snappy and minimal. `150–200ms` ease-out on everything. No bouncy springs, no decorative animation. Numbers can count up on resolution.

## Pages to design (priority order)

1. **`/bets/[id]` — Bet page.** The core surface.
   - Top: bet question (large, bold), creator, group, time-to-close
   - **Big YES/NO panel:** two buttons showing current implied probability as a percentage (e.g. YES 67% / NO 33%), current pool size, your position if any
   - Stake input below: amount, side, "Place bet" CTA
   - Tabs or sections beneath: **Positions** (who's on which side, how much), **Evidence** (uploaded files + captions), **Activity** (chronological feed of bets placed)
   - Verdict block appears after resolution at the top, pushing the bet UI down
2. **`/` — Landing.** Modern, marketing-grade. Hero headline, one-line pitch, screenshot of a live bet card, sign-up CTA. Maybe a row of example bets ("Will Sarah actually go to the gym this week?") to communicate the vibe. Not a movie poster — a product site.
3. **`/dashboard`** — Two columns or stacked sections:
   - **Your groups** — list/cards, each with active bet count and your point balance
   - **Active bets across all your groups** — Polymarket-style market cards with the question, current YES/NO %, pool, time left
4. **`/groups/[id]` — Group page.**
   - Header: group name, member count, your balance, invite link button
   - Tabs: **Active** (open bets), **Resolved** (past rulings), **Members** (roster with points), **Leaderboard**
   - "New bet" CTA prominent
5. **`/bets/new` — Create a bet.** Single column, clean form. Question, description, closing time, group. Live preview of what the bet card will look like on the right (desktop) or below (mobile).
6. **`/invite/[token]` — Join group.** Simple. Group name, member count, big "Join group" CTA. Shows what 1000 starting points means.
7. **`/leaderboard/[groupId]`** — Ranked table. Rank, member, points, win rate, total bets. Sort columns. Top 3 visually elevated.
8. **Auth (sign up / log in)** — Minimal. Email + password, username on signup. Centered card on the landing background.

## Key components

- **Bet card** (dashboard, group page): question, YES % / NO % bar, pool size, time-to-close, status pill, your-position badge if applicable. Whole card is clickable. Hover state: subtle.
- **YES/NO probability bar:** the signature element. A horizontal split bar showing current implied probability, with the percentage numbers large and confident on either side. Updates live as bets come in.
- **Stake panel:** side selector (YES/NO buttons, the unselected one dims), amount input with quick-select chips (10, 50, 100, MAX), your current balance shown above input, "Place bet" CTA that shows potential payout calculation as you type. Locked state after commit shows the position.
- **Evidence upload:** drag-drop zone, thumbnail grid of uploads, caption field per file. Clean, fast.
- **Verdict card:** clear YES or NO outcome at the top with the colour, the AI's reasoning as a single readable paragraph below, then a table of winners/losers with point deltas. No theatrics, but the moment is unmistakable. This is what gets screenshotted.
- **Countdown:** monospaced numerals, format adapts to scale (`2d 14h` → `4h 32m` → `12:34` → `00:09`). Goes red in the final hour. Switches to **"Resolving…"** when closed and awaiting verdict.
- **Status pills:** small, lowercase, subtle. `open`, `resolving`, `resolved`, `refunded`. Each gets a colour but kept muted.
- **Activity feed:** "Yamac bet 50 on YES" with avatar, timestamp, side colour-tagged. Like a Discord/Linear feed.
- **Empty states:** dry one-liners. "No bets yet. Be the first." Don't try to be funny in the chrome.

## What to nail

1. **The YES/NO probability bar.** This is the brand element. It should be everywhere bets appear and it should look great. Get it right and the whole product looks right.
2. **Numbers as design.** Percentages, point totals, pool sizes — these should be confident, large where they matter, perfectly aligned. Tabular numerals everywhere they could change.
3. **Mobile-first.** Bet cards stack cleanly. Stake panel is thumb-reachable. Primary CTAs at the bottom of the viewport on bet pages.
4. **Speed in the visual language.** Tight transitions, no decorative motion, no spinners that linger. Feels like Linear, not like a content site.

## Out of scope

- Dark mode (post-MVP — design tokens should make it easy later)
- Custom illustrations or mascots
- Animated/lottie assets beyond basic state transitions
- Notification UI

## Stack reminder

React + MUI + Vite + TypeScript. MUI is the base — but theme it aggressively. This UI should not look like default MUI in any way: override the typography system with a custom type ramp, override Button/Card/Chip/TextField to remove default elevation and adjust radius, set the palette tokens to match the brief. Use `sx` for one-offs, but lean on the theme so the brand stays consistent. Use Box/Stack for layout, not Grid (unless genuinely tabular).