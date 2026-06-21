# Eruja Frontend — Handover

Snapshot for a fresh session. Pair with `CLAUDE.md` (conventions) and
`docs/content-brief.md` (copy/voice/per-screen intent).

## Current state

- Scaffold, design-system port, reference API + contract: **done**.
- Auth screens (Register + Login): **done**, wired to `/api/auth/*`.
- IA locked; responsive `(app)` shell + auth guard: **done**.
- Navigable route skeleton for every `(app)` route: **done**.
- **Screens built so far:** Home (H0) ✓ · Discover (H1) ✓ · Pool detail + seat selector
  (H2) ✓ · Cart + wallet checkout (H3) ✓ · **My-pools list ✓ + order-tracker shell ✓ +
  WAITING state (H4) ✓** — bucketed ticket list linking to the tracker; tracker resolves
  the visual state and renders waiting for real (people grid, progress, seat add/release
  via `store.setTicketSeats` rebalancing the wallet hold, transparency Timeline, disabled
  501 leave); cargo/last-mile/delivered render a navigable placeholder. **Pending:** the
  remaining tracker states cargo/last-mile/delivered (H5–H7), Suggest (H8), Wallet,
  Notifications.
- **44 Playwright tests green.** Quality gate green (typecheck/lint/format/build/e2e).
- **Test isolation:** a gated `POST /api/test/reset` re-seeds the shared in-memory backend;
  mutating specs `reset → login` in setup. Use it in every new mutating spec.
- Next work: the cargo tracker state (H5) — `full_charged|sourced|in_transit|customs` →
  the `.hsteps` pipeline + cargo route. `t_4801` (crayfish, in_transit) is the seed target.

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
  buckets (2/1/4), so there is no fixture path to an empty bucket. The empty branch +
  Browse-pools CTA exist and mirror the already-tested cart/discover empty CTAs; revisit
  if a fresh-user fixture lands.
- **No desktop entry point for `/notifications`** — the storyboard WebNav has no bell;
  recommend adding a desktop bell in a shell follow-up. Reachable on mobile + by URL now.
- **CLAUDE.md "Git remote" line is stale** — it names `Eruja-App/Eruja-Frontend`, but
  `origin` is `github.com/thebigtank/Eruja` (continuous history, nothing stranded; the old
  remote holds only an older ancestor snapshot). `origin/main` is at the Phase-6 tip
  (`8e2e37b`); local is ahead by the 5 unpushed Phase-7 commits. Update the doc + push when
  convenient.
- Deferred backend endpoints noted in `docs/api-contract.md` (reschedule delivery,
  referral/share, standalone receipt).

## Recommended next phase

**Remaining tracker states (H5–H7)** — the `/me/pools/[ticket]` shell already routes every
ticket to a state body; `waiting` (H4) is real, the other three render a placeholder.
Fill them in:

| Visual state | `OrderStatus` values                               | Storyboard screen     | Seed target         |
| ------------ | -------------------------------------------------- | --------------------- | ------------------- |
| `waiting` ✓  | `awaiting`, `filling`                              | H4 — seats filling    | `t_4821`, `t_4844`  |
| `cargo`      | `full_charged`, `sourced`, `in_transit`, `customs` | H5 — cargo pipeline   | `t_4801` (crayfish) |
| `last-mile`  | `last_mile`                                        | H6 — out for delivery | (no seed; add one)  |
| `delivered`  | `delivered`                                        | H7 — receipt + rate   | `t_4780`/`t_4762`/… |

Build order: **H5 cargo** next — render the `.hsteps` pipeline (`ticket.hsteps`), the
`cargoRoute` (from/to/flight/eta), and the Timeline. `t_4801` carries a full `cargoRoute`

- `hsteps.active: 2`. Then **H7 delivered** (`deliveryWindow` + `portion` + `savings` +
  star `rating` via `POST /me/tickets/:id/rating`, `RatingBody`), then **H6 last-mile** (no
  seed ticket yet — add a `last_mile` ticket to `db.ts`). `.hsteps` classes already live in
  `globals.css`; `SceneCargo`/`SceneDoorstep` primitives are ported.

Each state replaces its branch in the existing `tracker-page` switch — reuse the back row +
badge + Timeline already in place. Add browser tests per state. Follow the recon-first relay
loop; any new mutating spec must `reset → login`.
