# Eruja API Contract

This is the **executable API contract** for Eruja. Today it is implemented as Next.js
Route Handlers under `app/api/` (a "reference backend") that return mock data from an
in-memory store. The real Go/Python backend reimplements these endpoints **exactly**;
the client talks to them over HTTP via `NEXT_PUBLIC_API_BASE_URL` (default `''` =
same-origin), so swapping backends is a single env-var change and these routes can be
deleted.

- **Single source of truth:** [`lib/schemas.ts`](../lib/schemas.ts) (Zod). Types are
  `z.infer` re-exports in [`lib/types.ts`](../lib/types.ts). This document is derived
  from those schemas — keep all three in sync.
- **Base path:** `/api`. All requests/responses are JSON.
- **Validation:** request bodies and query params are validated with Zod. Invalid →
  `400`. Unauthenticated → `401`. Missing resource → `404`. Gated features → `409`/`501`.

## Authentication & sessions

Mock auth via an **httpOnly cookie `eruja_session`** holding an opaque token that maps to
a userId in an in-memory session map. There is **no password verification** and **no real
DB** — prototype only. The store **resets on every server restart**.

> **Backend requirements.** A real cross-origin backend MUST:
>
> - Enable **CORS** for the web origin with `Access-Control-Allow-Credentials: true`
>   (and the client must send `credentials: 'include'`, which `lib/api/client.ts` does).
> - Reproduce the **`eruja_session` cookie contract**: `httpOnly`, `SameSite=Lax`,
>   `Path=/`. For cross-site usage it must be `SameSite=None; Secure`.
> - Actually verify credentials (the mock does not).

Seeded demo user: **Ada** — `ada@eruja.app` (any password). Login as Ada to exercise the
authenticated endpoints.

## Conventions

- **Money** is a number in USD (e.g. `6.5`, `120`). `WalletState.currency` is always
  `"USD"`.
- **Error shape** (any non-2xx): `{ "error": string, "message": string }`.
- **Auth-required** endpoints return `401 {error:"unauthenticated"}` without a valid
  session cookie.

### Pricing model (important)

Pools carry **two** price pairs (both are real, derived from the storyboard):

- **Pack prices** (`retailPackPrice` / `groupPackPrice`) — the whole-pack price on pool
  **cards**, e.g. `$120 / $45`. Per-pool.
- **Per-unit prices** (`retailUnitPrice` / `groupUnitPrice`) — the price per seat/"cup"
  in the **seat selector** and cart, e.g. `$12 / $6.50`. These are **per-Pool fields**
  (`PoolSchema.retailUnitPrice` / `groupUnitPrice`), not a global constant. `unitLabel`
  is `"cups"`.

> **Seed note:** the uniform `$12 / $6.50` per-unit price across all seeded pools is
> **demo seed data**, not a system pricing rule — it merely mirrors the storyboard's
> `RETAIL_PER` / `GROUP_PER` constants. The real backend sets the per-unit price **per
> product**; the field is and must remain per-Pool.

Pack price and `perUnit × seats` intentionally do **not** reconcile — they are
independent display values.

### Hold vs. charge

Checkout **does not charge** the wallet. It places a **hold** (`WalletState.held +=
lineTotal`) and creates one queue ticket per cart line with `chargedAmount: null`. The
charge happens later, when the pool fills (`status` → `full_charged`); only then does
`chargedAmount` become non-null. Adjusting seats in the waiting room rebalances the hold;
once charged, seats are locked (`409`).

### Home-tab status buckets

`OrderTicket.status` / `Pool.status` is an 8-state enum. The Home tabs and the
`?status=` filter on `/me/pools` and `/me/tickets` use 3 coarse **buckets**:

| Bucket       | Maps to ticket statuses                                         |
| ------------ | --------------------------------------------------------------- |
| `awaiting`   | `awaiting`, `filling`                                           |
| `in_transit` | `full_charged`, `sourced`, `in_transit`, `customs`, `last_mile` |
| `delivered`  | `delivered`                                                     |

### Suggestion graduation

A suggestion is `open` until its `votes` reach `threshold` (40), at which point `status`
flips to `graduated`. `POST /suggestions/:id/vote` **toggles** the caller's vote
(`youVoted`) and recomputes `status`.

### Feature flag: `leavePool`

`FEATURES.leavePool = false` (intentional). `DELETE /me/tickets/:id` returns **`501`**
`{error:"feature_disabled", message:"Leaving a pool is disabled until refund logic
ships."}` until refund logic ships. Documented for the backend — keep returning 501.

---

## Entities

```jsonc
Hub          { id, name, country, poolsLive }
User         { id, name, email, hubId }
Pool         { id, productKind, name, hubId, category,
               retailPackPrice, groupPackPrice, retailUnitPrice, groupUnitPrice,
               unitLabel, totalSeats, takenSeats, status,
               urgency?, etaNote?, sourcingNote?, description? }
WalletState  { balance, currency:"USD", held, savedTotal, poolsJoined, referred }
CartLine     { id, poolId, name, productKind, sub, quantity, unitPrice, unitLabel, lineTotal }
Cart         { lines: CartLine[], subtotal, walletBalance, balanceAfter }
TimelineEvent{ state:"done"|"active"|"", title, desc?, when }
OrderTicket  { id, poolId, name, productKind, status, mySeats, holdAmount, chargedAmount|null,
               fill:{filled,total}, hsteps:{steps[],active}, timeline: TimelineEvent[],
               cargoRoute?:{from,to,state,flight?,eta?},
               deliveryWindow?:{date,slot,courier,driver,van,hubOut?},
               portion?:{units,kg,packaging}, savings?, rating? }
Suggestion   { id, name, productKind, hubId, category, votes, threshold, youVoted, status:"open"|"graduated" }
Notification { id, icon, title, body, when, read }
```

**Enums.** `category`: `grains|spices|soup|oils`. `OrderStatus` (Pool/ticket):
`awaiting|filling|full_charged|sourced|in_transit|customs|last_mile|delivered`.
`productKind`: the 16 ProductIllo kinds. `Notification.icon`:
`receipt|users|flame|check|leaf|plane|box|sparkle`. Pools sort: `filling-fastest`.
Suggestions sort: `trending|closest|newest`.

---

## Endpoints

### Auth

#### `POST /api/auth/register`

Body `{ name, email, password, hubId }` → `201 { user }`, sets `eruja_session`.
`409 email_taken` if the email exists.

```json
// → { "user": { "id": "u_2", "name": "Bola", "email": "bola@x.com", "hubId": "london" } }
```

#### `POST /api/auth/login`

Body `{ email, password }` → `200 { user }`, sets cookie. Password **not** verified.
`401 invalid_credentials` if the email is unknown.

```json
// req { "email": "ada@eruja.app", "password": "anything" }
// → { "user": { "id": "u_ada", "name": "Ada", "email": "ada@eruja.app", "hubId": "london" } }
```

#### `POST /api/auth/logout`

→ `200 { ok: true }`, clears the cookie.

#### `GET /api/auth/session`

→ `200 { user }` or `401`.

### Hubs

#### `GET /api/hubs`

→ `200 Hub[]`.

```json
[{ "id": "london", "name": "London", "country": "United Kingdom", "poolsLive": 12 }]
```

### Pools

#### `GET /api/pools?hubId&category&sort&status`

Filters by `hubId`, `category`, `status`; `sort=filling-fastest` orders by fill ratio
desc. → `200 Pool[]`.

```json
// GET /api/pools?category=grains&sort=filling-fastest
[
  {
    "id": "p_honeybeans",
    "productKind": "honeybeans",
    "name": "Honey Beans · 50kg",
    "hubId": "london",
    "category": "grains",
    "retailPackPrice": 95,
    "groupPackPrice": 38,
    "retailUnitPrice": 12,
    "groupUnitPrice": 6.5,
    "unitLabel": "cups",
    "totalSeats": 64,
    "takenSeats": 48,
    "status": "filling",
    "urgency": "16 seats to ship",
    "etaNote": "Arrives ~6 weeks after the pool fills.",
    "sourcingNote": "From a co-operative of farmers in Ibadan.",
    "description": "Sweet, brown, the kind your aunty actually approves of …"
  }
]
```

#### `GET /api/pools/:id`

→ `200 Pool` or `404`.

#### `GET /api/me/pools?status=awaiting|in_transit|delivered` — _auth_

Pools the user has tickets in, each tagged with the user's **ticket** status (so one pool
can appear under multiple buckets). → `200 Pool[]`.

### Cart

#### `GET /api/cart` — _auth_

→ `200 Cart`.

```json
{
  "lines": [
    {
      "id": "cl_1",
      "poolId": "p_honeybeans",
      "name": "Honey Beans · 50kg",
      "productKind": "honeybeans",
      "sub": "London hub · pool 48/64",
      "quantity": 10,
      "unitPrice": 6.5,
      "unitLabel": "cups",
      "lineTotal": 65
    }
  ],
  "subtotal": 91,
  "walletBalance": 120,
  "balanceAfter": 29
}
```

#### `POST /api/cart/lines` — _auth_

Body `{ poolId, quantity }` → `201 Cart`. Merges into an existing line for the same pool.
`400` if the pool id is unknown.

#### `PATCH /api/cart/lines/:id` — _auth_

Body `{ quantity }` → `200 Cart`, or `404` if the line id is unknown.

#### `DELETE /api/cart/lines/:id` — _auth_

→ `200 Cart`, or `404`.

### Checkout

#### `POST /api/checkout` — _auth_

Creates one queue ticket per cart line, places a wallet **hold** now (charge deferred to
fill), and clears the cart. → `201 { tickets: OrderTicket[], wallet: WalletState }`.
`400` if the cart is empty.

```json
// → { "tickets": [ { "id": "t_9", "status": "filling", "holdAmount": 65,
//       "chargedAmount": null, "fill": { "filled": 48, "total": 64 }, … } ],
//     "wallet": { "balance": 120, "currency": "USD", "held": 156, … } }
```

### Wallet

#### `GET /api/wallet` — _auth_

→ `200 WalletState`.

```json
{
  "balance": 120,
  "currency": "USD",
  "held": 91,
  "savedTotal": 259,
  "poolsJoined": 4,
  "referred": 2
}
```

#### `POST /api/wallet/topup` — _auth_

Body `{ amount }` (positive) → `200 WalletState` with `balance` increased.

### Tickets

#### `GET /api/me/tickets?status=awaiting|in_transit|delivered` — _auth_

→ `200 OrderTicket[]` (filtered by bucket).

#### `GET /api/me/tickets/:id` — _auth_

→ `200 OrderTicket` or `404`.

#### `PATCH /api/me/tickets/:id/seats` — _auth_

Body `{ quantity }` (waiting-room add/release). Rebalances the wallet hold and the pool
fill. → `200 OrderTicket`. `404` unknown ticket; `409 already_charged` if the ticket is
already charged.

#### `DELETE /api/me/tickets/:id` — _auth_

→ **`501 feature_disabled`** (see [leavePool flag](#feature-flag-leavepool)).

#### `POST /api/me/tickets/:id/rating` — _auth_

Body `{ stars }` (1–5) → `200 OrderTicket` with `rating` set, or `404`.

### Suggestions

#### `GET /api/suggestions?hubId&sort`

`sort = trending | closest | newest` (default `trending`). → `200 Suggestion[]`.

```json
[
  {
    "id": "s_cocoyam",
    "name": "Cocoyam Flour",
    "productKind": "cocoyam",
    "hubId": "london",
    "category": "grains",
    "votes": 42,
    "threshold": 40,
    "youVoted": true,
    "status": "graduated"
  }
]
```

#### `POST /api/suggestions` — _auth_

Body `{ name, hubId, category, note? }` → `201 Suggestion` (`votes: 1`, `youVoted: true`).

#### `POST /api/suggestions/:id/vote` — _auth_

Toggles the caller's vote and recomputes `status`. → `200 Suggestion` or `404`.

### Notifications

#### `GET /api/notifications`

→ `200 Notification[]`.

```json
[
  {
    "id": "n_1",
    "icon": "receipt",
    "title": "You're in the pool!",
    "body": "10 seats of Crayfish secured. …",
    "when": "just now",
    "read": false
  }
]
```

#### `POST /api/notifications/:id/read`

→ `200 { ok: true }` or `404`.

---

## Deferred endpoints (documented, not yet implemented)

These UI affordances exist in the storyboard but have no backing endpoint this phase.
Reserve the routes:

- **Reschedule delivery** — `PATCH /me/tickets/:id/delivery` (H6 "Reschedule").
- **Referral / share link** — `POST /me/referrals` or `GET /me/referral-link` (H0 "Share
  your link"; `WalletState.referred` already tracks the count).
- **Standalone receipt** — currently satisfiable via `GET /me/tickets/:id`
  (`chargedAmount`); a dedicated `GET /me/tickets/:id/receipt` can be added if a formatted
  receipt is needed (H5 "Receipt").

## Seed data notes

- Canonical pool fills use the **Home (H0)** snapshot where stages disagree.
- `Hub.poolsLive` for **Houston (8)** and **Toronto (5)** is seed filler — the storyboard
  only details London (12).
- New suggestions default `productKind` to `flour` until a real catalog maps names → art.
