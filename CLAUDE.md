# CLAUDE.md — Eruja Frontend

Working guide for any session picking up this repo. Read this first.

## What Eruja is

A community **group-buying** app for diaspora foods (Yoruba _eroja_ = ingredients).
Members buy **seats** in a pool for a bulk item; when every seat fills, the bulk order
triggers, wallets are charged, cargo ships from a source country to a city **hub**, is
split into individual units, and last-mile delivered. Wholesale instead of retail.
Signature mechanic: **"the pool of people"** — every seat is an avatar.

## Stack & tooling

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript strict**
  (+ `noUncheckedIndexedAccess`).
- **pnpm** (Node 22). **Zustand** (UI/session state). **Zod** (single source of truth for
  API schemas + types via `z.infer`).
- **ESLint 9** flat config (`eslint-config-next`) + **Prettier**. **Playwright** e2e.
- Scripts: `pnpm dev` · `build` · `start` · `lint` · `typecheck` · `format` /
  `format:check` · `test:e2e`.
- Quality gate (must pass before every commit boundary): **typecheck, lint,
  format:check, build, test:e2e**.

## Locked decisions (do not re-litigate)

- One palette only — **Palm & Terracotta**, collapsed into `:root`. No theme toggle.
  Shadows re-tinted to palm ink `rgb(33,40,29)`.
- Fonts via `next/font/google`: Newsreader (display, incl. italic), Hanken Grotesk (UI),
  DM Mono (mono) → `--font-display` / `--font-ui` / `--font-mono` on `<html>`.
- Single mobile-first responsive codebase (not separate mobile/web builds).
- API base via `NEXT_PUBLIC_API_BASE_URL` (default `''` = same-origin Next routes).
- Allowed runtime deps: `next, react, react-dom, zustand, zod`. New runtime dep → STOP
  and flag.

## API as contract

`app/api/**` Route Handlers are a **reference backend** returning mock data from an
in-memory store — and double as the **executable API contract** the real Go/Python
backend reimplements, then these routes are deleted.

- **`lib/schemas.ts`** (Zod) is the single source of truth. **`lib/types.ts`** =
  `z.infer` re-exports only (no hand-written duplicate types).
- **`lib/api/client.ts`** is the ONLY module screens import to reach the API. Swapping
  backends = change the env var.
- `lib/server/{db,session,services,http}.ts` = seeded store + mock `eruja_session`
  cookie + mutations + validation helpers. Store **resets on server restart**.
- Full contract + semantics: **`docs/api-contract.md`** (keep in sync with schemas).

## Route map & nav model

Route groups: `(auth)` (shell-less) and `(app)` (shell + auth guard).

| Route                | Screen (storyboard)                  | Primary data read                                |
| -------------------- | ------------------------------------ | ------------------------------------------------ |
| `/login` `/register` | Auth (built)                         | `/auth/login` `/auth/register` `/hubs`           |
| `/`                  | Home — wallet + my pools + teaser H0 | `/auth/session` `/wallet` `/me/tickets` `/pools` |
| `/discover`          | Discovery H1                         | `/hubs` `/pools?hubId&category&sort`             |
| `/pool/[id]`         | Pool detail + seat selector H2       | `/pools/:id`                                     |
| `/cart`              | Cart + wallet checkout H3            | `/cart`                                          |
| `/me/pools`          | My pools list                        | `/me/tickets?status`                             |
| `/me/pools/[ticket]` | ONE status-driven tracker H4–H7      | `/me/tickets/:id`                                |
| `/suggest`           | Suggest & vote H8                    | `/suggestions?hubId&sort`                        |
| `/wallet`            | Wallet (extrapolated, no full mock)  | `/wallet`                                        |
| `/notifications`     | Notifications grid                   | `/notifications`                                 |
| `/how-it-works`      | Deferred static stub                 | none                                             |

- **Tracking state machine** (`lib/ticket-state.ts`): 8 `OrderStatus` → 4 visual states.
  `waiting` ← awaiting|filling (H4); `cargo` ← full_charged|sourced|in_transit|customs
  (H5); `last-mile` ← last_mile (H6); `delivered` ← delivered (H7).
- **My-pools list + tracking detail are backed by `/me/tickets`** (carries ticket ids +
  per-stage fields). `/me/pools` (Pool[]) is redundant in the client IA — kept in the
  contract, flagged for the backend.
- **Mobile** bottom tab bar: Home `/` · My pools `/me/pools` · Suggest `/suggest` ·
  Wallet `/wallet`. Mobile top bar: logo→`/`, bell→`/notifications`, cart→`/cart`.
- **Desktop** top nav: Discover · My pools · Suggest · How it works. Right: wallet pill
  →`/wallet` · hub chip · cart→`/cart`. (No desktop bell — see handover open items.)
- Active nav state derives from `usePathname()`; the active item carries
  `aria-current="page"`.

## Design-system port rules

- The storyboard bundle in `reference/` is **canonical** for tokens, class names, SVG art,
  and API data shapes. **Port/derive verbatim, don't reinterpret.** Ambiguous value →
  surface it, don't invent.
- `app/globals.css` holds the ported design system (palm `:root`, paper-grain overlay,
  aso-oke `.motif`, and verbatim app classes: `.btn`/`.chip`/`.card`/`.pool`/`.people`/
  `.seat`/`.bar`/`.timeline`/`.hsteps`/`.notif`/`.badge`/`.stars`/`.fld`/`.wallet-pill`/
  `.stepper`/`.kv`/type & layout helpers/`.appbar`/`.tabbar`/`.web-nav`). Reuse these;
  **invent no new visual system.**
- Pure SVG primitives in `components/primitives/` (Icon, Avatar, Seat/PoolPeople/
  AvatarStack, Logo, ProductIllo, Scenes) are deterministic ports — do not redesign.
- UI/shell primitives from the bundle (`asset_4`) are **not** all ported; port one
  verbatim only when a phase needs it.

## Relay-loop conventions

This project runs as a **director ↔ builder relay**. Each phase:

1. **Recon-first / STEP-0 gate.** Validate the spec against the decoded storyboard +
   schemas before building. Proceed only if no genuine conflict; a real conflict → STOP
   and report. A preference → note it and proceed.
2. **Small staged commits**, suite green at every boundary.
3. **Browser tests mandatory** for any UI-affecting change — a render not exercised in a
   real browser doesn't count.
4. End every phase with the **structured report block** (files touched, decisions,
   test-count delta, commit SHAs, deviations).
5. **Anti-hallucination:** canonical copy is verbatim (incl. Yoruba "Ẹ káàbọ̀"); cosmetic
   copy (e.g. "2,300+ neighbours") is flagged, never wired to a fake data field.

## Test seam

`window.__eruja` exposes the Zustand store for e2e assertions. It is **env-gated** and
statically dead-code-eliminated from real prod builds: present only in dev or when
`NEXT_PUBLIC_E2E=1` (set by Playwright's webServer; defaulted to `'0'` in `next.config.ts`).

## Git

Remote: `github.com/thebigtank/Eruja` (private; `origin`). Author identity
`theBigTank <support@raymanthis.com>`; commits keep a `Co-Authored-By: Claude` trailer.
Commit in small staged steps; do not force-push history.
