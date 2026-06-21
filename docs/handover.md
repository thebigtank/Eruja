# Eruja Frontend — Handover

Snapshot for a fresh session. Pair with `CLAUDE.md` (conventions) and
`docs/content-brief.md` (copy/voice/per-screen intent).

## Current state

- Scaffold, design-system port, reference API + contract: **done**.
- Auth screens (Register + Login): **done**, wired to `/api/auth/*`.
- IA locked; responsive `(app)` shell + auth guard: **done**.
- Navigable route skeleton for every `(app)` route: **done**.
- **Screens built so far:** Home (H0) ✓ · Discover (H1) ✓ · Pool detail + seat selector
  (H2) ✓ · Cart + wallet checkout (H3) ✓ · My-pools list ✓ · **order tracker COMPLETE —
  all 4 visual states real (H4 waiting · H5 cargo · H6 last-mile · H7 delivered) ✓**. Every
  `OrderStatus` now resolves to a real view; no placeholder remains. Rating (H7) wired via
  `store.setTicketRating`. **Pending:** Suggest (H8), Wallet, Notifications.
- **48 Playwright tests green.** Quality gate green (typecheck/lint/format/build/e2e).
- **Test isolation:** a gated `POST /api/test/reset` re-seeds the shared in-memory backend;
  mutating specs `reset → login` in setup. Use it in every new mutating spec.
- **Seed note:** Ada now has a `last_mile` ticket (`t_4790`, Ofada Rice, charged) added in
  Phase 8 so H6 is exercisable. Canonical bucket counts are **2 / 2 / 4** (8 tickets):
  awaiting `t_4821`,`t_4844` · in-transit `t_4801` (cargo) + `t_4790` (last-mile) ·
  delivered `t_4780`,`t_4762`,`t_4740`,`t_4715`.
- Next work: **Suggest & vote (H8)** — `/suggest`, backed by `/suggestions?hubId&sort`
  (list/create/vote already in the contract + client seam).

## What each phase delivered

- **Phase 0 — scaffold + design system + contract.** Next 16/React 19/TS strict; palm
  design system in `globals.css` + next/font; SVG primitives; Zod schemas + inferred
  types; reference backend (`app/api/**` + in-memory store + mock session); typed client
  seam (`lib/api/client.ts`); Zustand store; `docs/api-contract.md`; Playwright smoke.
- **Phase 1 — auth screens.** `eye`/`eyeOff` icons; `AuthFrame` + `PasswordField`;
  Register + Login wired (session + hub → store), auth guards, validation, show-hide;
  e2e for render/flow/validation/show-hide.
- **Phase 2 — IA, shell, route skeleton.** Locked the route map; fleshed the responsive
  shell (tab bar / top nav / wallet pill / hub chip / cart badge / active state / auth
  guard); skeleton pages for all routes; `lib/ticket-state.ts` state machine; env-gated
  the `__eruja` test seam; these three handover docs.
- **Phase 3 — Home (H0).** Wallet card + top-up chips; my-pools tabs backed by
  `/me/tickets?status`; discover teaser `PoolCard` grid; wired to store.
- **Phase 4 — Discover (H1).** Hub-switch `PoolCard` grid + category filter; featured-pool
  hero; empty state; Discover nav highlight; wired to store.
- **Phase 5 — Pool detail (H2).** Full pool header + signature seat selector (PoolPeople /
  stepper / live math); savings card; Add to cart / Buy now → `store.addToCart`; closed
  state; `Stepper` component.
- **Phase 6 — Cart + wallet checkout (H3).** `CartLineItem` (mobile 2-row / web single-row
  responsive, `data-testid="cart-line-web"` for scoping); `Cart.module.css` two-column web
  layout; cart page states (loading / normal / short-funds / success / empty); `short-funds-card`
  (always visible web right column; `data-testid="short-funds-card"` for test scoping);
  `mobileTopUp` section (hidden on web via `.mobileTopUp { display:none }`); `liveBalance`
  derived from `wallet?.balance ?? cart?.walletBalance` so topUp reflects without refetch;
  `store.updateCartLine` / `removeCartLine` / `checkout`; POST `/api/checkout` → success card
  → badge cleared; hold model (`wallet.held` += subtotal, `wallet.balance` unchanged).
- **Phase 7 — My-pools list + tracker shell + WAITING (H4).** Real `/me/pools` (bucket tabs
  reusing Home's `ticketCard` pool-join pattern, mobile-stack / web-grid). Real
  `/me/pools/[ticket]` shell: fetch ticket + pool, `ticketVisualState` → back row + status
  badge + state body; WAITING is real (people grid + legend, progress, seat add/release →
  `store.setTicketSeats` PATCHes seats and resyncs the wallet hold, `Timeline` primitive,
  disabled 501 leave); cargo/last-mile/delivered → `tracker-placeholder`. `Timeline`
  primitive ported. `Stepper` gained a `busy` prop (disables mid-commit). **Test isolation:**
  `resetStore()` + gated `POST /api/test/reset`; mutating specs now `reset → login`.
- **Phase 8 — tracker states CARGO (H5) + LAST-MILE (H6) + DELIVERED (H7).** Filled the three
  remaining state bodies in `/me/pools/[ticket]` (shell/back-row/badge/resolver unchanged).
  H5: card.ink charge line, `HSteps` pipeline (ported primitive), cargo route card
  (SceneCargo + from→to/flight/eta), Timeline, deferred "Track cargo". H6: arrival window,
  accent-soft delivery-window card, portion card, Timeline, deferred Track-courier/Reschedule.
  H7: SceneDoorstep celebration, green-soft per-ticket savings, **interactive `Stars`
  (ported)** rating → `store.setTicketRating` (POST `/me/tickets/:id/rating`, persists),
  wallet stats, real "Find your next pool"/"Suggest an item" links + open-pool suggestions.
  Additive seed: `t_4790` last_mile ticket (counts → 2/2/4). Deferred actions are disabled,
  flagged stubs (no backing endpoint); real Links only to /discover, /suggest, /pool/:id.

## Route → stage → API map

See the table in `CLAUDE.md` (Route map & nav model). Key calls:

- `/` → `GET /auth/session`, `/wallet`, `/me/tickets?status`, `/pools` (teaser)
- `/discover` → `/hubs`, `/pools?hubId&category&sort`
- `/pool/[id]` → `/pools/:id`
- `/cart` → `/cart`
- `/me/pools` + `/me/pools/[ticket]` → `/me/tickets`, `/me/tickets/:id`
- `/suggest` → `/suggestions?hubId&sort`
- `/wallet` → `/wallet`; `/notifications` → `/notifications`

## Important caveats

- **Per-unit price is seed data, not a rule.** All seeded pools share `$12/$6.50` per
  "cup" — that mirrors the storyboard constants. `retailUnitPrice`/`groupUnitPrice` are
  **per-Pool fields**; the real backend sets them per product. (Pack prices `$95/$38`
  etc. are per-pool and intentionally do not reconcile with `perUnit × seats`.)
- **`/wallet` has no full storyboard mockup** — only the H0 wallet card + the stats
  sidebar (savedTotal/poolsJoined/referred). Built as a skeleton; its real design needs
  director direction in its own phase. Do not invent a full screen.
- **`/me/pools` (Pool[]) is redundant** in the client IA (no ticket id, no per-stage
  fields). `/me/tickets` backs both the list and the tracker. Kept in the contract; flag
  for the backend whether to drop or repurpose it.
- **Seed store resets on server restart** (in-memory). Seed user: `ada@eruja.app` (any
  password). Houston/Toronto `poolsLive` are filler; only London is detailed.

## Open TODOs

- `register → /discover` once `/discover` is a real screen (currently pushes `/`; TODO in
  `app/(auth)/register/page.tsx`).
- `/how-it-works` — deferred static content (desktop nav item only).
- **Forgot-password** — rendered no-op stub on `/login`; no flow built.
- **Leave-pool** — `DELETE /me/tickets/:id` returns `501 feature_disabled` by design
  (refund logic not shipped). The tracker renders the disabled "Leave pool · coming soon"
  button + caption; the 501 is asserted at the API level.
- **My-pools list empty-state is not browser-exercised** — Ada's seed fills all three
  buckets (2/2/4), so there is no fixture path to an empty bucket. The empty branch +
  Browse-pools CTA exist and mirror the already-tested cart/discover empty CTAs; revisit
  if a fresh-user fixture lands.
- **Tracker deferred actions** — "Track cargo", "Track courier", "Reschedule delivery" are
  disabled, flagged stubs (no backing endpoint in the contract). Wire them when tracking/
  reschedule endpoints ship.
- **No desktop entry point for `/notifications`** — the storyboard WebNav has no bell;
  recommend adding a desktop bell in a shell follow-up. Reachable on mobile + by URL now.
- **Remote / push** — `origin` = `github.com/thebigtank/Eruja` (CLAUDE.md now corrected).
  History is one continuous line; local is ahead of `origin/main` by the unpushed
  Phase-7/8 commits. Push when convenient (no force-push).
- Deferred backend endpoints noted in `docs/api-contract.md` (reschedule delivery,
  referral/share, standalone receipt).

## Recommended next phase

**Suggest & vote (H8)** — `/suggest` is still a placeholder; it's the last interactive
screen before the extrapolated Wallet/Notifications. Backed by `/suggestions?hubId&sort`
with `create` + `vote` already in the contract and the client seam (`api.suggestions.*`).

Pieces: a suggestion list (per active hub, sortable `trending|closest|newest`) of
`SuggestionCard`s with a vote control (toggle → `POST /suggestions/:id/vote`, optimistic via
a `store.voteSuggestion` action mirroring `setTicketRating`); a vote `threshold` progress
(`votes/threshold`, `graduated` state at the line); a "Suggest an item" form
(`POST /suggestions`, fields name/hubId/category/note). The tracker's H7 "Suggest an item"
link already points here.

Then the extrapolated screens — **Wallet** (`/wallet`, no full storyboard — keep minimal,
needs director input) and **Notifications** (`/notifications`, grid exists in the DS). Follow
the recon-first relay loop; any new mutating spec must `reset → login`.
