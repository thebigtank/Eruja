# Eruja — Content Brief

For any session filling screens. Use canonical copy **verbatim**; match the voice for new
copy. Pair with the storyboard in `reference/` (the source of truth for layout + copy).

## Premise

Eruja (from Yoruba _eroja_, "ingredients") is community **group-buying** for diaspora
foods. You buy **seats** in a pool for a bulk item; when the pool fills, the bulk order
triggers, wallets are charged, cargo ships from the source country to your city **hub**,
gets split into individual units, and is last-mile delivered. Wholesale, not retail. The
emotional core: **the ingredients of home, pooled together** — every seat is a real
neighbour (an avatar in the "pool of people").

## Brand voice

- **Warm, specific, human.** Concrete details over generic marketing: "3 from Croydon, 2
  from Hackney", "driver Mo · van AB12 CDE", "the kind your aunty actually approves of".
- **Yoruba touches**, used naturally and verbatim: **Ẹ káàbọ̀** ("welcome"), _eroja_,
  product names (Iru, Egusi, Garri, Ofada, Suya). Never machine-paraphrase these.
- **Plain-spoken trust:** "No card to browse", "Top up only when you join", money shown
  honestly. DM Mono for prices/tickets/counts; Newsreader italics for emotional beats.
- **Momentum:** urgency is friendly, not pushy — "16 seats to ship", "closing 2d",
  "almost there".

## Canonical copy already in use (verbatim)

- Tagline: **"The ingredients of home, _pooled together._"** ("pooled together." italic,
  `--accent`).
- Register lede: "Join your city's pool, wait together, and pay wholesale on the foods of
  home."
- Login: **"Ẹ káàbọ̀ — _welcome back._"** · "Sign in to your pools, your wallet, and your
  city."
- Trust ticks: "No card to browse" · "Top up only when you join" · "Cancel a seat before
  a pool fills". Fine print: "No card needed to browse · top up only when you join a pool".
- Cosmetic social proof (NOT data): "2,300+ neighbours pooling in {hub}", "+2.3k".

## Per-screen content intent (H0–H8)

Values below are the storyboard's; treat seeded API data as the live source. Quotes are
canonical copy.

- **H0 — Home (`/`).** Returning member opens to wallet + their pools, discover feed
  below. Greeting "Ẹ káàbọ̀ — welcome back" + name. Wallet card (balance, top-up chips
  $20/$50/$100/$200, "Top up"). My-pools tabs "Awaiting · N / In transit · N /
  Delivered · N". "Saved $259 so far". PoolCards. Web adds a stats sidebar (Total saved /
  Pools joined / Friends referred) + "Discover · 12 active in London".

- **H1 — Discovery (`/discover`).** First-time browse. Hub picker chips (London/Houston/
  Toronto). Hero: "The ingredients of home, pooled together." + retail vs group price
  ("$120" struck through, "$45" accent) + "Browse pools". Category chips
  All/Grains/Spices/Soup/Oils, "sorted by · filling fastest". Full PoolCard grid.

- **H2 — Pool detail + seat selector (`/pool/[id]`).** THE signature screen. Product illo,
  "London hub · grains", name, blurb ("Sweet, brown, the kind your aunty actually approves
  of — direct from a co-operative of farmers in Ibadan."). **Pool of people** grid (yours
  glow accent, "you" tag), "{n} yours / {n} joined / {n} open". Stepper ("your seats · N
  cups"). Price compare: "Local store · N×$12" struck vs "Eruja group · N×$6.50" accent +
  "you save $X" green badge. CTAs: "Add to cart" / "Buy now". Stepper updates pool +
  savings live.

- **H3 — Cart + wallet checkout (`/cart`).** Lines stack commitments across pools into ONE
  wallet payment; each line keeps its own pool/ticket/wait. Line: thumb + name + sub
  ("London hub · pool 48/64") + "N cups · $6.50 each" + stepper + line total. Summary
  (accent-soft): "Pay from wallet", subtotal, wallet balance, balance after, "Pay $X",
  "Creates N queue tickets · charged when each pool fills". Inline top-up chips.

- **H4 — Waiting room (`/me/pools/[ticket]`, waiting).** Live fill. "{progress}/{total}
  joined", "{n} to ship", pool-of-people animating, progress bar. SlotControl (add/release
  seats; "$X held" rebalances). Transparency timeline ("You joined · 10 seats", "25 new
  pool-mates · 3 from Croydon, 2 from Hackney", "Sourcing previewed", "Bag is filling").
  **"Leave pool · coming soon"** disabled — caption "enabled at backend once refund logic
  ships".

- **H5 — Cargo (`/me/pools/[ticket]`, cargo).** Bag full, card charged; story flips to
  "waiting for the cargo". "🎊 the bag is full / We are moving." · "64/64 seats · charged
  $65 from wallet". HSteps `gather · source · freight · doorstep` (active=freight).
  SceneCargo route LAGOS→LONDON. Timeline: "Sourced & inspected", "In the air ✈️ · customs
  clearance 5–7 days", "Cargo departed Lagos · flight LX4421 · ETA London May 4". "Track
  cargo" / "Receipt".

- **H6 — Last mile (`/me/pools/[ticket]`, last-mile).** Cargo landed, hub split the bulk
  bag into units, courier window appears. "Arriving today". Delivery window "Today · 2–6pm"
  · "DPD · driver Mo · van AB12 CDE". Your portion "10 cups · ~7.8 kg", packaging
  "vacuum-sealed", "Left the hub 11:42 today". "Reschedule" / "Track courier". SceneDoorstep.

- **H7 — Delivered (`/me/pools/[ticket]`, delivered).** Payoff. "🍲 delivered / Time to
  cook." · "You saved $45 buying with the community." Star rating ("Rate the quality").
  Savings ticker (saved all-time $259 / pools joined 4 / referred 2). "Your next pool?" →
  a hot PoolCard + "Suggest an item". Turns the moment into the next commit.

- **H8 — Suggest & vote (`/suggest`).** Community-built catalog. "What should we source
  next?" Form (item / hub / category / "Why this? Where could we source it?"). "40 votes =
  pool" badge. Suggestion cards with Vote/Voted toggle + progress ("36 / 40 votes",
  "{n} to go", "opening as a pool 🎊" at threshold). Sort: Trending / Closest to opening /
  Newest. Graduating a suggestion pings every voter first.

- **Notifications (`/notifications`).** Warm, short, specific grid: "You're in the pool!",
  "A friend just joined · Kemi joined your Honey Beans pool", "Halfway there", "It's a
  match!", "Sourced & inspected", "In the air", "Ready for the last mile", "Time to cook!".

- **Design-system band (storyboard only).** Not a screen — type/palette/pool-of-people
  showcase. Do not build as a route.
