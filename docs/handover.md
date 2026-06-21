# Eruja Frontend — Handover

Snapshot for a fresh session. Pair with `CLAUDE.md` (conventions) and
`docs/content-brief.md` (copy/voice/per-screen intent).

## Current state

- Scaffold, design-system port, reference API + contract: **done**.
- Auth screens (Register + Login): **done**, wired to `/api/auth/*`.
- IA locked; responsive `(app)` shell + auth guard: **done**.
- Navigable route skeleton for every `(app)` route: **done**.
- **Screens built so far:** Home (H0) ✓ · Discover (H1) ✓ · Pool detail + seat selector
  (H2) ✓ · **Cart + wallet checkout (H3) ✓** — lines, qty-edit, remove, short-funds
  top-up chips, checkout → success card, empty state; store has `updateCartLine`,
  `removeCartLine`, `checkout` actions. **Pending:** ticket tracker (H4–H7), Suggest
  (H8), Wallet, Notifications.
- **36 Playwright tests green.** Quality gate green (typecheck/lint/format/build/e2e).
- Next work: the ticket-tracker family (H4–H7) — status-driven view for `/me/pools/[ticket]`
  (visual states: waiting / cargo / last-mile / delivered).

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
  (refund logic not shipped).
- **No desktop entry point for `/notifications`** — the storyboard WebNav has no bell;
  recommend adding a desktop bell in a shell follow-up. Reachable on mobile + by URL now.
- Deferred backend endpoints noted in `docs/api-contract.md` (reschedule delivery,
  referral/share, standalone receipt).

## Recommended next phase

**Ticket tracker (H4–H7)** — `/me/pools/[ticket]` is the status-driven tracker for an
individual order. Four visual states driven by `lib/ticket-state.ts`:

| Visual state | `OrderStatus` values                               | Storyboard screen                  |
| ------------ | -------------------------------------------------- | ---------------------------------- |
| `waiting`    | `awaiting`, `filling`                              | H4 — "queue ticket", seats filling |
| `cargo`      | `full_charged`, `sourced`, `in_transit`, `customs` | H5 — cargo pipeline                |
| `last-mile`  | `last_mile`                                        | H6 — "out for delivery"            |
| `delivered`  | `delivered`                                        | H7 — receipt + rate                |

The `/me/pools` list (`/me/pools` route) that precedes it is a simple TicketCard list
backed by `GET /me/tickets`.

Build order: list first (H → /me/pools), then the tracker detail (H4 → /me/pools/[ticket]).
Port `.timeline` / `.hsteps` classes from `globals.css` verbatim (already in the DS).

Each screen phase should: port the relevant UI primitives from `reference/` (asset_4)
verbatim as needed, build the screen from `globals.css` classes, wire to the client seam,
and add browser tests. Follow the recon-first relay loop.
