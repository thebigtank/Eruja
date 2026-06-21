import type {
  Cart,
  CartLine,
  Hub,
  Notification,
  OrderTicket,
  Pool,
  PoolBucket,
  PoolsQuery,
  Suggestion,
  SuggestionCreateBody,
  SuggestionSort,
  WalletState,
} from '@/lib/types';
import { getStore, nextId, round2, PRICING } from './db';

/* ============================================================
   Stateful operations over the in-memory store.
   Route handlers stay thin; the mutation logic lives here.
   ============================================================ */

function hubName(hubId: string): string {
  return getStore().hubs.find((h) => h.id === hubId)?.name ?? hubId;
}

/* ---------- Hubs ---------- */

export function listHubs(): Hub[] {
  return getStore().hubs;
}

/* ---------- Pools ---------- */

const fillRatio = (p: Pool) => p.takenSeats / p.totalSeats;

export function listPools(query: PoolsQuery): Pool[] {
  let pools = [...getStore().pools.values()];
  if (query.hubId) pools = pools.filter((p) => p.hubId === query.hubId);
  if (query.category) pools = pools.filter((p) => p.category === query.category);
  if (query.status) pools = pools.filter((p) => p.status === query.status);
  if (query.sort === 'filling-fastest') {
    pools = [...pools].sort((a, b) => fillRatio(b) - fillRatio(a));
  }
  return pools;
}

export function getPool(id: string): Pool | undefined {
  return getStore().pools.get(id);
}

/* ---------- Home tab bucket mapping (8-state -> 3 buckets) ---------- */

const BUCKET: Record<PoolBucket, OrderTicket['status'][]> = {
  awaiting: ['awaiting', 'filling'],
  in_transit: ['full_charged', 'sourced', 'in_transit', 'customs', 'last_mile'],
  delivered: ['delivered'],
};

function inBucket(status: OrderTicket['status'], bucket?: PoolBucket): boolean {
  if (!bucket) return true;
  return BUCKET[bucket].includes(status);
}

/** Pools the user has tickets in, each tagged with the user's ticket status. */
export function listMyPools(userId: string, bucket?: PoolBucket): Pool[] {
  const store = getStore();
  const tickets = store.tickets.get(userId) ?? [];
  const out: Pool[] = [];
  for (const t of tickets) {
    if (!inBucket(t.status, bucket)) continue;
    const pool = store.pools.get(t.poolId);
    if (pool) out.push({ ...pool, status: t.status });
  }
  return out;
}

/* ---------- Wallet ---------- */

export function getWallet(userId: string): WalletState | undefined {
  return getStore().wallets.get(userId);
}

export function topUp(userId: string, amount: number): WalletState | undefined {
  const wallet = getStore().wallets.get(userId);
  if (!wallet) return undefined;
  wallet.balance = round2(wallet.balance + amount);
  return wallet;
}

/* ---------- Cart ---------- */

function computeCart(userId: string): Cart {
  const store = getStore();
  const lines = store.carts.get(userId) ?? [];
  const wallet = store.wallets.get(userId);
  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const walletBalance = wallet?.balance ?? 0;
  return { lines, subtotal, walletBalance, balanceAfter: round2(walletBalance - subtotal) };
}

export function getCart(userId: string): Cart {
  return computeCart(userId);
}

function lineFor(pool: Pool, quantity: number, id: string): CartLine {
  return {
    id,
    poolId: pool.id,
    name: pool.name,
    productKind: pool.productKind,
    sub: `${hubName(pool.hubId)} hub · pool ${pool.takenSeats}/${pool.totalSeats}`,
    quantity,
    unitPrice: pool.groupUnitPrice,
    unitLabel: pool.unitLabel,
    lineTotal: round2(quantity * pool.groupUnitPrice),
  };
}

export function addCartLine(userId: string, poolId: string, quantity: number): Cart | 'no_pool' {
  const store = getStore();
  const pool = store.pools.get(poolId);
  if (!pool) return 'no_pool';
  const lines = store.carts.get(userId) ?? [];
  const existing = lines.find((l) => l.poolId === poolId);
  if (existing) {
    existing.quantity += quantity;
    existing.lineTotal = round2(existing.quantity * pool.groupUnitPrice);
  } else {
    lines.push(lineFor(pool, quantity, nextId('cl')));
  }
  store.carts.set(userId, lines);
  return computeCart(userId);
}

export function patchCartLine(userId: string, lineId: string, quantity: number): Cart | 'no_line' {
  const store = getStore();
  const lines = store.carts.get(userId) ?? [];
  const line = lines.find((l) => l.id === lineId);
  if (!line) return 'no_line';
  line.quantity = quantity;
  line.lineTotal = round2(quantity * line.unitPrice);
  return computeCart(userId);
}

export function deleteCartLine(userId: string, lineId: string): Cart | 'no_line' {
  const store = getStore();
  const lines = store.carts.get(userId) ?? [];
  if (!lines.some((l) => l.id === lineId)) return 'no_line';
  store.carts.set(
    userId,
    lines.filter((l) => l.id !== lineId),
  );
  return computeCart(userId);
}

/* ---------- Checkout (places a wallet HOLD per line; charge happens on fill) ---------- */

export function checkout(
  userId: string,
): { tickets: OrderTicket[]; wallet: WalletState } | 'empty' {
  const store = getStore();
  const lines = store.carts.get(userId) ?? [];
  if (lines.length === 0) return 'empty';
  const wallet = store.wallets.get(userId);
  if (!wallet) return 'empty';

  const existing = store.tickets.get(userId) ?? [];
  const created: OrderTicket[] = [];

  for (const line of lines) {
    const pool = store.pools.get(line.poolId);
    const total = pool?.totalSeats ?? line.quantity;
    const filled = pool?.takenSeats ?? line.quantity;
    const ticket: OrderTicket = {
      id: nextId('t'),
      poolId: line.poolId,
      name: line.name,
      productKind: line.productKind,
      status: 'filling',
      mySeats: line.quantity,
      holdAmount: line.lineTotal,
      chargedAmount: null,
      fill: { filled, total },
      hsteps: { steps: ['gather', 'source', 'freight', 'doorstep'], active: 0 },
      timeline: [
        { state: 'active', title: 'You joined', desc: `${line.quantity} seats`, when: 'just now' },
      ],
    };
    created.push(ticket);
    wallet.held = round2(wallet.held + line.lineTotal);
  }

  store.tickets.set(userId, [...created, ...existing]);
  store.carts.set(userId, []); // cart cleared
  return { tickets: created, wallet };
}

/* ---------- Tickets ---------- */

export function listTickets(userId: string, bucket?: PoolBucket): OrderTicket[] {
  const tickets = getStore().tickets.get(userId) ?? [];
  return tickets.filter((t) => inBucket(t.status, bucket));
}

export function getTicket(userId: string, id: string): OrderTicket | undefined {
  return (getStore().tickets.get(userId) ?? []).find((t) => t.id === id);
}

/** Waiting-room add/release seats — rebalances the wallet hold (only while uncharged). */
export function setTicketSeats(
  userId: string,
  id: string,
  quantity: number,
): OrderTicket | 'no_ticket' | 'charged' {
  const store = getStore();
  const ticket = (store.tickets.get(userId) ?? []).find((t) => t.id === id);
  if (!ticket) return 'no_ticket';
  if (ticket.chargedAmount !== null) return 'charged';
  const wallet = store.wallets.get(userId);
  const delta = quantity - ticket.mySeats;
  ticket.fill.filled = Math.max(0, Math.min(ticket.fill.total, ticket.fill.filled + delta));
  ticket.mySeats = quantity;
  const newHold = round2(quantity * PRICING.GROUP_UNIT);
  if (wallet) wallet.held = round2(wallet.held - ticket.holdAmount + newHold);
  ticket.holdAmount = newHold;
  return ticket;
}

export function rateTicket(userId: string, id: string, stars: number): OrderTicket | 'no_ticket' {
  const ticket = (getStore().tickets.get(userId) ?? []).find((t) => t.id === id);
  if (!ticket) return 'no_ticket';
  ticket.rating = stars as OrderTicket['rating'];
  return ticket;
}

/* ---------- Suggestions ---------- */

export function listSuggestions(hubId?: string, sort?: SuggestionSort): Suggestion[] {
  let items = [...getStore().suggestions.values()];
  if (hubId) items = items.filter((s) => s.hubId === hubId);
  if (sort === 'trending' || sort === undefined)
    items = [...items].sort((a, b) => b.votes - a.votes);
  else if (sort === 'closest')
    items = [...items].sort((a, b) => b.votes / b.threshold - a.votes / a.threshold);
  else if (sort === 'newest') items = [...items].reverse();
  return items;
}

export function createSuggestion(body: SuggestionCreateBody): Suggestion {
  const store = getStore();
  const item: Suggestion = {
    id: nextId('s'),
    name: body.name,
    // No productKind in the form; default to flour art until a real catalog maps it.
    productKind: 'flour',
    hubId: body.hubId,
    category: body.category,
    votes: 1,
    threshold: PRICING.VOTE_THRESHOLD,
    youVoted: true,
    status: 'open',
  };
  store.suggestions.set(item.id, item);
  return item;
}

/** Toggle the current user's vote; crossing the threshold flips status to 'graduated'. */
export function voteSuggestion(id: string): Suggestion | undefined {
  const item = getStore().suggestions.get(id);
  if (!item) return undefined;
  if (item.youVoted) {
    item.votes = Math.max(0, item.votes - 1);
    item.youVoted = false;
  } else {
    item.votes += 1;
    item.youVoted = true;
  }
  item.status = item.votes >= item.threshold ? 'graduated' : 'open';
  return item;
}

/* ---------- Notifications ---------- */

export function listNotifications(): Notification[] {
  return getStore().notifications;
}

export function markNotificationRead(id: string): boolean {
  const n = getStore().notifications.find((x) => x.id === id);
  if (!n) return false;
  n.read = true;
  return true;
}
