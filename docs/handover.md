# Eruja Frontend — Handover

Snapshot for a fresh session. Pair with `CLAUDE.md` (conventions) and
`docs/content-brief.md` (copy/voice/per-screen intent).

## Current state

- Scaffold, design-system port, reference API + contract: **done**.
- Auth screens (Register + Login): **done**, wired to `/api/auth/*`.
- IA locked; responsive `(app)` shell + auth guard: **done**.
- Navigable route skeleton for every `(app)` route: **done** (placeholders that read
  their primary data — no screen content yet).
- **16 Playwright tests green.** Quality gate green (typecheck/lint/format/build/e2e).
- Not started: the nine **screen contents** (H0–H8 internals). That is the next work.

## What each phase delivered

- **Phase 0 — scaffold + design system + contract.** Next 16/React 19/TS strict; palm
  design system in `globals.css` + next/font; SVG primitives; Zod schemas + inferred
  types; reference backend (`app/api/**` + in-memory store + mock session); typed client
  seam (`lib/api/client.ts`); Zustand store; `docs/api-contract.md`; Playwright smoke.
- **Phase 1 — auth screens.** `eye`/`eyeOff` icons; `AuthFrame` + `PasswordField`;
  Register + Login wired (session + hub → store), auth guards, validation, show-hide;
  e2e for render/flow/validation/show-hide.
- **Phase 2 — IA, shell, route skeleton (this phase).** Locked the route map; fleshed the
  responsive shell (tab bar / top nav / wallet pill / hub chip / cart badge / active
  state / auth guard); skeleton pages for all routes; `lib/ticket-state.ts` state machine;
  env-gated the `__eruja` test seam; these three handover docs.

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

**Build the first real screen.** Strong candidates, in order:

1. **`/` Home (H0)** — highest-traffic landing; exercises wallet card, my-pools tabs
   (tickets), discover teaser (PoolCard), and most UI primitives. Good template for the
   rest.
2. **`/discover` (H1)** then **`/pool/[id]` (H2)** — the core browse → join funnel; H2 is
   the signature "pool of people" seat selector (interactive, already has live data).

Each screen phase should: port the relevant UI primitives from `reference/` (asset_4)
verbatim as needed, build the screen from `globals.css` classes, wire to the client seam,
and add browser tests. Follow the recon-first relay loop.
