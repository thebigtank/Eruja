# Eruja Frontend — Handover

Snapshot for a fresh session. Pair with `CLAUDE.md` (conventions) and
`docs/content-brief.md` (copy/voice/per-screen intent).

## Current state

- Scaffold, design-system port, reference API + contract: **done**.
- Auth screens (Register + Login): **done**, wired to `/api/auth/*`.
- IA locked; responsive `(app)` shell + auth guard: **done**.
- Navigable route skeleton for every `(app)` route: **done**.
- **Screens built so far:** Home (H0) ✓ · Discover (H1) ✓ · Pool detail + seat selector
  (H2) ✓ · Cart + wallet checkout (H3) ✓ · My-pools list ✓ · order tracker COMPLETE
  (H4 waiting · H5 cargo · H6 last-mile · H7 delivered) ✓ · **Suggest & vote (H8) ✓**
  (screen-local create/vote/sort, graduated state, empty state). **Pending:** Notifications,
  `/wallet` (extrapolated — needs director input).
- **53 Playwright tests green.** Quality gate green (typecheck/lint/format/build/e2e).
- **Test isolation:** a gated `POST /api/test/reset` re-seeds the shared in-memory backend;
  mutating specs `reset → login` in setup. Use it in every new mutating spec.
- **Seed notes:** P8 added a `last_mile` ticket (`t_4790`, Ofada Rice, charged) → bucket
  counts **2 / 2 / 4** (8 tickets). P9 set Plantain suggestion (`s_flour`) to **39 votes**
  (threshold − 1) so a single vote graduates it. Threshold = 40 (`VOTE_THRESHOLD`).
- **Suggestion `note` is write-only** — `POST /suggestions` accepts a `note` but the entity/
  store don't persist it, so the "why" never renders. Flagged for the backend (add `note` to
  `SuggestionSchema` + store it to surface it on cards).
- **Graduation is non-sticky in the backend** (`status` recomputes per vote) but the UI hides
  the vote control once graduated, so it can't be un-voted from the screen. Graduation does
  not create a Pool id → graduated cards link to `/discover`.
- Next work: **Notifications** (`/notifications`, grid exists in the DS) and the extrapolated
  **`/wallet`** (no full storyboard — keep minimal, director input needed).

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
- **Phase 9 — Suggest & vote (H8).** Real `/suggest`, **screen-local** (no store/shell —
  suggestions don't touch wallet/cart/hub). Intro with data-bound threshold; create form
  (name/hub/category/why → `POST /suggestions` → prepend + reset + transient); sort chips
  (trending/closest/newest); hub-filtered list of suggestion cards with vote toggle
  (`POST /suggestions/:id/vote`, ±1, accent when voted), progress-to-threshold, graduated
  "Now a pool" state (vote control replaced; → `/discover`), empty state. Seed: Plantain → 39. Reused existing classes only (no new primitive). Last-mile delivery card → gold-soft.

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

**Notifications (`/notifications`)** — the last screen with a real storyboard. The `.notif`
grid class is already in `globals.css` and the notification icon set + seed (`n_1…n_8`) exist;
backed by `GET /notifications` + `POST /notifications/:id/read` (already in the client seam).
Likely screen-local (like Suggest) unless an unread badge should reach the shell — decide at
recon. There IS a desktop bell entry point already (P3); mobile reaches it via the top bar.

Then the extrapolated **`/wallet`** — no full storyboard mockup (only the H0 wallet card + the
stats sidebar). Keep minimal and flag for director input; do not invent a full screen. After
those two, the storyboard is fully built and the `app/api/**` reference routes can be handed to
the real backend. Follow the recon-first relay loop; any new mutating spec must `reset → login`.
