import { z } from 'zod';

/* ============================================================
   ERUJA — API contract schemas (single source of truth)
   Zod schemas drive BOTH runtime validation and types (z.infer).
   Values/shapes derived from the Hi-Fi storyboard stages H0–H8.
   ============================================================ */

/* ---------- Shared enums ---------- */

/** Food categories (discover filter chips: All/Grains/Spices/Soup/Oils). */
export const CategorySchema = z.enum(['grains', 'spices', 'soup', 'oils']);

/** Product art kinds (must match components/primitives ProductIllo PRODUCTS keys). */
export const ProductKindSchema = z.enum([
  'rice',
  'beans',
  'honeybeans',
  'egusi',
  'garri',
  'crayfish',
  'yam',
  'plantain',
  'iru',
  'suya',
  'palm',
  'oil',
  'stockfish',
  'cocoyam',
  'bitterleaf',
  'flour',
]);

/**
 * The pool/order lifecycle (8 states). Shared by Pool.status and OrderTicket.status.
 * Home tabs bucket these: awaiting = awaiting|filling; in_transit =
 * full_charged|sourced|in_transit|customs|last_mile; delivered = delivered.
 */
export const OrderStatusSchema = z.enum([
  'awaiting',
  'filling',
  'full_charged',
  'sourced',
  'in_transit',
  'customs',
  'last_mile',
  'delivered',
]);

/** Coarse buckets used by the Home tabs / ?status filter on /me/pools and /me/tickets. */
export const PoolBucketSchema = z.enum(['awaiting', 'in_transit', 'delivered']);

export const PoolSortSchema = z.enum(['filling-fastest']);
export const SuggestionSortSchema = z.enum(['trending', 'closest', 'newest']);

/** Notification icons (subset of the Icon set actually used by notifications). */
export const NotificationIconSchema = z.enum([
  'receipt',
  'users',
  'flame',
  'check',
  'leaf',
  'plane',
  'box',
  'sparkle',
]);

/* ---------- Core entities ---------- */

export const HubSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  poolsLive: z.number().int().nonnegative(),
});

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  hubId: z.string(),
});

export const PoolSchema = z.object({
  id: z.string(),
  productKind: ProductKindSchema,
  name: z.string(),
  hubId: z.string(),
  category: CategorySchema,
  /** Whole-pack prices shown on pool cards (e.g. $120 / $45). */
  retailPackPrice: z.number().nonnegative(),
  groupPackPrice: z.number().nonnegative(),
  /** Per-unit prices shown in the seat selector (e.g. $12 / $6.50). */
  retailUnitPrice: z.number().nonnegative(),
  groupUnitPrice: z.number().nonnegative(),
  unitLabel: z.string(),
  totalSeats: z.number().int().positive(),
  takenSeats: z.number().int().nonnegative(),
  status: OrderStatusSchema,
  urgency: z.string().optional(),
  etaNote: z.string().optional(),
  sourcingNote: z.string().optional(),
  description: z.string().optional(),
});

export const WalletStateSchema = z.object({
  balance: z.number(),
  currency: z.literal('USD'),
  held: z.number().nonnegative(),
  savedTotal: z.number().nonnegative(),
  poolsJoined: z.number().int().nonnegative(),
  referred: z.number().int().nonnegative(),
});

export const CartLineSchema = z.object({
  id: z.string(),
  poolId: z.string(),
  name: z.string(),
  productKind: ProductKindSchema,
  sub: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  unitLabel: z.string(),
  lineTotal: z.number().nonnegative(),
});

export const CartSchema = z.object({
  lines: z.array(CartLineSchema),
  subtotal: z.number().nonnegative(),
  walletBalance: z.number(),
  balanceAfter: z.number(),
});

export const TimelineEventSchema = z.object({
  state: z.enum(['done', 'active', '']),
  title: z.string(),
  desc: z.string().optional(),
  when: z.string(),
});

export const CargoRouteSchema = z.object({
  from: z.string(),
  to: z.string(),
  state: z.string(),
  flight: z.string().optional(),
  eta: z.string().optional(),
});

export const DeliveryWindowSchema = z.object({
  date: z.string(),
  slot: z.string(),
  courier: z.string(),
  driver: z.string(),
  van: z.string(),
  hubOut: z.string().optional(),
});

export const PortionSchema = z.object({
  units: z.string(),
  kg: z.number().nonnegative(),
  packaging: z.string(),
});

export const HStepsSchema = z.object({
  steps: z.array(z.string()),
  active: z.number().int().nonnegative(),
});

export const OrderTicketSchema = z.object({
  id: z.string(),
  poolId: z.string(),
  name: z.string(),
  productKind: ProductKindSchema,
  status: OrderStatusSchema,
  mySeats: z.number().int().nonnegative(),
  holdAmount: z.number().nonnegative(),
  chargedAmount: z.number().nonnegative().nullable(),
  fill: z.object({
    filled: z.number().int().nonnegative(),
    total: z.number().int().positive(),
  }),
  hsteps: HStepsSchema,
  timeline: z.array(TimelineEventSchema),
  cargoRoute: CargoRouteSchema.optional(),
  deliveryWindow: DeliveryWindowSchema.optional(),
  portion: PortionSchema.optional(),
  savings: z.number().nonnegative().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export const SuggestionSchema = z.object({
  id: z.string(),
  name: z.string(),
  productKind: ProductKindSchema,
  hubId: z.string(),
  category: CategorySchema,
  votes: z.number().int().nonnegative(),
  threshold: z.number().int().positive(),
  youVoted: z.boolean(),
  status: z.enum(['open', 'graduated']),
});

export const NotificationSchema = z.object({
  id: z.string(),
  icon: NotificationIconSchema,
  title: z.string(),
  body: z.string(),
  when: z.string(),
  read: z.boolean(),
});

/* ---------- Request bodies ---------- */

export const RegisterBodySchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(1),
  hubId: z.string().min(1),
});

export const LoginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const CartAddBodySchema = z.object({
  poolId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const CartPatchBodySchema = z.object({
  quantity: z.number().int().positive(),
});

export const TopupBodySchema = z.object({
  amount: z.number().positive(),
});

export const SeatsPatchBodySchema = z.object({
  quantity: z.number().int().nonnegative(),
});

export const RatingBodySchema = z.object({
  stars: z.number().int().min(1).max(5),
});

export const SuggestionCreateBodySchema = z.object({
  name: z.string().min(1),
  hubId: z.string().min(1),
  category: CategorySchema,
  note: z.string().optional(),
});

/* ---------- Query params ---------- */

export const PoolsQuerySchema = z.object({
  hubId: z.string().optional(),
  category: CategorySchema.optional(),
  sort: PoolSortSchema.optional(),
  status: OrderStatusSchema.optional(),
});

export const MePoolsQuerySchema = z.object({
  status: PoolBucketSchema.optional(),
});

export const TicketsQuerySchema = z.object({
  status: PoolBucketSchema.optional(),
});

export const SuggestionsQuerySchema = z.object({
  hubId: z.string().optional(),
  sort: SuggestionSortSchema.optional(),
});

/* ---------- Response envelopes ---------- */

export const SessionResponseSchema = z.object({ user: UserSchema });
export const AuthResponseSchema = z.object({ user: UserSchema });
export const OkResponseSchema = z.object({ ok: z.literal(true) });
export const CheckoutResponseSchema = z.object({
  tickets: z.array(OrderTicketSchema),
  wallet: WalletStateSchema,
});
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});
