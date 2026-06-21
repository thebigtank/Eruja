import type {
  Hub,
  User,
  Pool,
  WalletState,
  CartLine,
  OrderTicket,
  Suggestion,
  Notification,
} from '@/lib/types';

/* ============================================================
   ERUJA reference backend — in-memory seeded store.

   Module-level singleton (kept on globalThis so it survives dev HMR).
   IT RESETS on every server (re)start — intentional for the prototype.
   The real Go/Python backend reimplements this against a real DB.

   Seed values are derived from the storyboard stages H0–H8. Where stages
   disagree on a pool's fill, the HOME (H0) snapshot is canonical.

   Pricing model (canonical): per-unit price is UNIVERSAL across pools
   ($12 retail / $6.50 group per "cup" — the H2/H3/H4 module constants
   RETAIL_PER/GROUP_PER). Pack prices are per-pool. Both are carried.
   ============================================================ */

const RETAIL_UNIT = 12;
const GROUP_UNIT = 6.5;
const UNIT_LABEL = 'cups';
const VOTE_THRESHOLD = 40;

export const round2 = (n: number) => Math.round(n * 100) / 100;

export interface Store {
  hubs: Hub[];
  users: Map<string, User>;
  /** mock auth: email (lowercased) -> userId */
  emailIndex: Map<string, string>;
  pools: Map<string, Pool>;
  suggestions: Map<string, Suggestion>;
  notifications: Notification[];
  wallets: Map<string, WalletState>;
  carts: Map<string, CartLine[]>;
  tickets: Map<string, OrderTicket[]>;
  /** session token -> userId */
  sessions: Map<string, string>;
  /** monotonic counter for generated ids (no Math.random — deterministic) */
  seq: number;
}

function pool(
  id: string,
  productKind: Pool['productKind'],
  name: string,
  category: Pool['category'],
  retailPackPrice: number,
  groupPackPrice: number,
  totalSeats: number,
  takenSeats: number,
  status: Pool['status'],
  extra: Partial<Pool> = {},
): Pool {
  return {
    id,
    productKind,
    name,
    hubId: 'london',
    category,
    retailPackPrice,
    groupPackPrice,
    retailUnitPrice: RETAIL_UNIT,
    groupUnitPrice: GROUP_UNIT,
    unitLabel: UNIT_LABEL,
    totalSeats,
    takenSeats,
    status,
    ...extra,
  };
}

function suggestion(
  id: string,
  name: string,
  productKind: Suggestion['productKind'],
  category: Suggestion['category'],
  votes: number,
  youVoted: boolean,
): Suggestion {
  return {
    id,
    name,
    productKind,
    hubId: 'london',
    category,
    votes,
    threshold: VOTE_THRESHOLD,
    youVoted,
    status: votes >= VOTE_THRESHOLD ? 'graduated' : 'open',
  };
}

function seed(): Store {
  const hubs: Hub[] = [
    { id: 'london', name: 'London', country: 'United Kingdom', poolsLive: 12 },
    // poolsLive for Houston/Toronto are seed filler — storyboard only details London.
    { id: 'houston', name: 'Houston', country: 'United States', poolsLive: 8 },
    { id: 'toronto', name: 'Toronto', country: 'Canada', poolsLive: 5 },
  ];

  const ada: User = { id: 'u_ada', name: 'Ada', email: 'ada@eruja.app', hubId: 'london' };

  const pools: Pool[] = [
    pool('p_honeybeans', 'honeybeans', 'Honey Beans · 50kg', 'grains', 95, 38, 64, 48, 'filling', {
      urgency: '16 seats to ship',
      etaNote: 'Arrives ~6 weeks after the pool fills.',
      sourcingNote: 'From a co-operative of farmers in Ibadan.',
      description:
        'Sweet, brown, the kind your aunty actually approves of — direct from a co-operative of farmers in Ibadan.',
    }),
    pool('p_rice', 'rice', 'Ofada Rice · 50kg', 'grains', 120, 45, 64, 48, 'filling', {
      urgency: '16 seats left',
    }),
    pool('p_iru', 'iru', 'Iru / Locust Bean', 'soup', 60, 18, 48, 42, 'filling', {
      urgency: 'closing 2d',
    }),
    pool('p_crayfish', 'crayfish', 'Dried Crayfish · 5kg', 'soup', 80, 22, 48, 48, 'in_transit', {
      urgency: 'ETA may 11',
    }),
    pool('p_palm', 'palm', 'Palm Oil · 25L', 'oils', 140, 58, 32, 20, 'filling'),
    pool('p_egusi', 'egusi', 'Egusi · 10kg', 'soup', 70, 26, 32, 6, 'awaiting'),
  ];

  const suggestions: Suggestion[] = [
    // Phase-9 tweak: 39 (threshold − 1) so a single live vote graduates it (H8 demo moment).
    suggestion('s_flour', 'Plantain Flour · 5kg', 'flour', 'grains', 39, false),
    suggestion('s_cocoyam', 'Cocoyam Flour', 'cocoyam', 'grains', 42, true),
    suggestion('s_suya', 'Suya Spice · 1kg', 'suya', 'spices', 24, true),
    suggestion('s_garri', 'Garri Ijebu · 25kg', 'garri', 'grains', 11, false),
    suggestion('s_bitterleaf', 'Bitter Leaf · dried', 'bitterleaf', 'soup', 9, false),
    suggestion('s_stockfish', 'Stockfish · 2kg', 'stockfish', 'soup', 5, false),
  ];

  const notifications: Notification[] = [
    {
      id: 'n_1',
      icon: 'receipt',
      title: "You're in the pool!",
      body: '10 seats of Crayfish secured. Share your link to fill it faster.',
      when: 'just now',
      read: false,
    },
    {
      id: 'n_2',
      icon: 'users',
      title: 'A friend just joined',
      body: 'Kemi joined your Honey Beans pool. 4 seats to trigger shipping.',
      when: '2h ago',
      read: false,
    },
    {
      id: 'n_3',
      icon: 'flame',
      title: 'Halfway there',
      body: 'The Honey Beans bag is 50% full. Almost at the bulk buy.',
      when: '1d ago',
      read: false,
    },
    {
      id: 'n_4',
      icon: 'check',
      title: "It's a match!",
      body: "Iru pool is 100% filled. We're prepping for shipping.",
      when: '2d ago',
      read: false,
    },
    {
      id: 'n_5',
      icon: 'leaf',
      title: 'Sourced & inspected',
      body: 'Picked up the rice in Abakaliki. Quality check passed.',
      when: '3d ago',
      read: false,
    },
    {
      id: 'n_6',
      icon: 'plane',
      title: 'In the air',
      body: 'Cargo departed Lagos. UK customs: 5–7 days.',
      when: '5d ago',
      read: false,
    },
    {
      id: 'n_7',
      icon: 'box',
      title: 'Ready for the last mile',
      body: 'Your 10 units are sorted. Courier hand-off today.',
      when: '11d ago',
      read: false,
    },
    {
      id: 'n_8',
      icon: 'sparkle',
      title: 'Time to cook!',
      body: 'Delivered. You saved $45. Rate it and join your next pool.',
      when: '12d ago',
      read: false,
    },
  ];

  // Ada's cart (H3): two lines, universal per-unit price $6.50.
  const adaCart: CartLine[] = [
    {
      id: 'cl_1',
      poolId: 'p_honeybeans',
      name: 'Honey Beans · 50kg',
      productKind: 'honeybeans',
      sub: 'London hub · pool 48/64',
      quantity: 10,
      unitPrice: GROUP_UNIT,
      unitLabel: UNIT_LABEL,
      lineTotal: round2(10 * GROUP_UNIT),
    },
    {
      id: 'cl_2',
      poolId: 'p_iru',
      name: 'Iru / Locust Bean',
      productKind: 'iru',
      sub: 'London hub · pool 42/48',
      quantity: 4,
      unitPrice: GROUP_UNIT,
      unitLabel: UNIT_LABEL,
      lineTotal: round2(4 * GROUP_UNIT),
    },
  ];

  // Ada's tickets: 2 awaiting + 2 in transit (cargo + last-mile) + 4 delivered (Home tabs 2/2/4).
  const adaTickets: OrderTicket[] = [
    {
      id: 't_4821',
      poolId: 'p_honeybeans',
      name: 'Honey Beans · 50kg',
      productKind: 'honeybeans',
      status: 'filling',
      mySeats: 10,
      holdAmount: round2(10 * GROUP_UNIT),
      chargedAmount: null,
      fill: { filled: 48, total: 64 },
      hsteps: { steps: ['gather', 'source', 'freight', 'doorstep'], active: 0 },
      timeline: [
        { state: 'done', title: 'You joined', desc: '10 seats · 6 days ago', when: 'apr 20' },
        {
          state: 'done',
          title: '25 new pool-mates',
          desc: '3 from Croydon, 2 from Hackney',
          when: 'apr 22',
        },
        { state: 'active', title: 'Bag is filling', desc: '75% — almost there', when: 'live' },
      ],
    },
    {
      id: 't_4844',
      poolId: 'p_iru',
      name: 'Iru / Locust Bean',
      productKind: 'iru',
      status: 'filling',
      mySeats: 4,
      holdAmount: round2(4 * GROUP_UNIT),
      chargedAmount: null,
      fill: { filled: 42, total: 48 },
      hsteps: { steps: ['gather', 'source', 'freight', 'doorstep'], active: 0 },
      timeline: [
        { state: 'done', title: 'You joined', desc: '4 seats', when: 'apr 24' },
        { state: 'active', title: 'Bag is filling', desc: '6 seats to ship', when: 'live' },
      ],
    },
    {
      id: 't_4801',
      poolId: 'p_crayfish',
      name: 'Dried Crayfish · 5kg',
      productKind: 'crayfish',
      status: 'in_transit',
      mySeats: 10,
      holdAmount: round2(10 * GROUP_UNIT),
      chargedAmount: round2(10 * GROUP_UNIT),
      fill: { filled: 48, total: 48 },
      hsteps: { steps: ['gather', 'source', 'freight', 'doorstep'], active: 2 },
      timeline: [
        { state: 'done', title: 'Bag filled', desc: 'all 48 seats committed', when: 'apr 26' },
        {
          state: 'done',
          title: 'Sourced & inspected',
          desc: 'Quality check passed',
          when: 'apr 28',
        },
        {
          state: 'active',
          title: 'Cargo departed Lagos',
          desc: 'flight LX4421 · ETA London May 4',
          when: 'live',
        },
        {
          state: '',
          title: 'Customs clearance',
          desc: '5–7 days at the UK border',
          when: 'est may 09',
        },
      ],
      cargoRoute: {
        from: 'Lagos',
        to: 'London',
        state: 'in_transit',
        flight: 'LX4421',
        eta: 'London May 4',
      },
    },
    // Phase-8 additive seed: a last_mile (H6) ticket so the out-for-delivery state
    // can be exercised. Charged; delivery-window/portion mirror the storyboard's
    // canonical values (DPD · Mo · AB12 CDE · 2–6pm · vacuum-sealed · 7.8kg).
    {
      id: 't_4790',
      poolId: 'p_rice',
      name: 'Ofada Rice · 50kg',
      productKind: 'rice',
      status: 'last_mile',
      mySeats: 10,
      holdAmount: round2(10 * GROUP_UNIT),
      chargedAmount: round2(10 * GROUP_UNIT),
      fill: { filled: 64, total: 64 },
      hsteps: { steps: ['gather', 'source', 'freight', 'doorstep'], active: 3 },
      timeline: [
        { state: 'done', title: 'Bag filled', desc: 'all 64 seats committed', when: 'apr 26' },
        {
          state: 'done',
          title: 'Sourced & inspected',
          desc: 'Quality check passed',
          when: 'apr 28',
        },
        {
          state: 'done',
          title: 'Cleared customs',
          desc: 'arrived at the London hub',
          when: 'may 09',
        },
        { state: 'active', title: 'Out for delivery', desc: 'DPD · driver Mo', when: 'today' },
      ],
      cargoRoute: {
        from: 'Lagos',
        to: 'London',
        state: 'last_mile',
        flight: 'LX4421',
        eta: 'arrived London',
      },
      deliveryWindow: {
        date: 'Today',
        slot: '2–6pm',
        courier: 'DPD',
        driver: 'Mo',
        van: 'AB12 CDE',
        hubOut: '11:42 today',
      },
      portion: { units: '10 cups', kg: round2(10 * 0.78), packaging: 'vacuum-sealed' },
    },
    delivered('t_4780', 'p_honeybeans', 'honeybeans', 'Honey Beans · 50kg', 10, 64, 45, 5),
    delivered('t_4762', 'p_rice', 'rice', 'Ofada Rice · 50kg', 8, 64, 38, 4),
    delivered('t_4740', 'p_egusi', 'egusi', 'Egusi · 10kg', 6, 32, 22, 4),
    delivered('t_4715', 'p_palm', 'palm', 'Palm Oil · 25L', 5, 32, 30, 5),
  ];

  const held = adaTickets
    .filter((t) => t.chargedAmount === null)
    .reduce((sum, t) => sum + t.holdAmount, 0);

  const adaWallet: WalletState = {
    balance: 120,
    currency: 'USD',
    held: round2(held),
    savedTotal: 259,
    poolsJoined: 4,
    referred: 2,
  };

  return {
    hubs,
    users: new Map([[ada.id, ada]]),
    emailIndex: new Map([[ada.email.toLowerCase(), ada.id]]),
    pools: new Map(pools.map((p) => [p.id, p])),
    suggestions: new Map(suggestions.map((s) => [s.id, s])),
    notifications,
    wallets: new Map([[ada.id, adaWallet]]),
    carts: new Map([[ada.id, adaCart]]),
    tickets: new Map([[ada.id, adaTickets]]),
    sessions: new Map(),
    seq: 1,
  };
}

/** A delivered ticket (H7-shaped). The first carries full portion/delivery detail. */
function delivered(
  id: string,
  poolId: string,
  productKind: OrderTicket['productKind'],
  name: string,
  mySeats: number,
  total: number,
  savings: number,
  rating: 1 | 2 | 3 | 4 | 5,
): OrderTicket {
  const charged = round2(mySeats * GROUP_UNIT);
  return {
    id,
    poolId,
    name,
    productKind,
    status: 'delivered',
    mySeats,
    holdAmount: charged,
    chargedAmount: charged,
    fill: { filled: total, total },
    hsteps: { steps: ['gather', 'source', 'freight', 'doorstep'], active: 4 },
    timeline: [
      { state: 'done', title: 'Bag filled', desc: `all ${total} seats committed`, when: 'apr 26' },
      { state: 'done', title: 'Sourced & inspected', desc: 'Quality check passed', when: 'apr 28' },
      { state: 'done', title: 'Delivered', desc: 'last-mile courier', when: 'may 11' },
    ],
    deliveryWindow: {
      date: 'Today',
      slot: '2–6pm',
      courier: 'DPD',
      driver: 'Mo',
      van: 'AB12 CDE',
      hubOut: '11:42 today',
    },
    portion: { units: `${mySeats} cups`, kg: round2(mySeats * 0.78), packaging: 'vacuum-sealed' },
    savings,
    rating,
  };
}

/* ---------- Singleton accessor ---------- */

const GLOBAL_KEY = Symbol.for('eruja.store');
type GlobalWithStore = typeof globalThis & { [GLOBAL_KEY]?: Store };

export function getStore(): Store {
  const g = globalThis as GlobalWithStore;
  g[GLOBAL_KEY] ??= seed();
  return g[GLOBAL_KEY];
}

/**
 * Re-seed the store to its initial state. TEST-ONLY: exposed via the gated
 * POST /api/test/reset route so e2e specs can isolate the shared in-memory
 * backend between tests. Wipes sessions too — callers must re-authenticate.
 */
export function resetStore(): void {
  (globalThis as GlobalWithStore)[GLOBAL_KEY] = seed();
}

/** Generate a deterministic, monotonic id (no Math.random — keeps tests stable). */
export function nextId(prefix: string): string {
  const store = getStore();
  store.seq += 1;
  return `${prefix}_${store.seq}`;
}

/* ---------- Constants other server modules reuse ---------- */
export const PRICING = { RETAIL_UNIT, GROUP_UNIT, UNIT_LABEL, VOTE_THRESHOLD } as const;
