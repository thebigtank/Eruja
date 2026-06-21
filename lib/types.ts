import type { z } from 'zod';
import type {
  CategorySchema,
  ProductKindSchema,
  OrderStatusSchema,
  PoolBucketSchema,
  PoolSortSchema,
  SuggestionSortSchema,
  NotificationIconSchema,
  HubSchema,
  UserSchema,
  PoolSchema,
  WalletStateSchema,
  CartLineSchema,
  CartSchema,
  TimelineEventSchema,
  CargoRouteSchema,
  DeliveryWindowSchema,
  PortionSchema,
  HStepsSchema,
  OrderTicketSchema,
  SuggestionSchema,
  NotificationSchema,
  RegisterBodySchema,
  LoginBodySchema,
  CartAddBodySchema,
  CartPatchBodySchema,
  TopupBodySchema,
  SeatsPatchBodySchema,
  RatingBodySchema,
  SuggestionCreateBodySchema,
  PoolsQuerySchema,
  MePoolsQuerySchema,
  TicketsQuerySchema,
  SuggestionsQuerySchema,
  CheckoutResponseSchema,
  ErrorResponseSchema,
} from './schemas';

/* Inferred types — the schemas are the single source of truth. No hand-written duplicates. */

export type Category = z.infer<typeof CategorySchema>;
export type ProductKind = z.infer<typeof ProductKindSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type PoolBucket = z.infer<typeof PoolBucketSchema>;
export type PoolSort = z.infer<typeof PoolSortSchema>;
export type SuggestionSort = z.infer<typeof SuggestionSortSchema>;
export type NotificationIcon = z.infer<typeof NotificationIconSchema>;

export type Hub = z.infer<typeof HubSchema>;
export type User = z.infer<typeof UserSchema>;
export type Pool = z.infer<typeof PoolSchema>;
export type WalletState = z.infer<typeof WalletStateSchema>;
export type CartLine = z.infer<typeof CartLineSchema>;
export type Cart = z.infer<typeof CartSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type CargoRoute = z.infer<typeof CargoRouteSchema>;
export type DeliveryWindow = z.infer<typeof DeliveryWindowSchema>;
export type Portion = z.infer<typeof PortionSchema>;
export type HSteps = z.infer<typeof HStepsSchema>;
export type OrderTicket = z.infer<typeof OrderTicketSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;
export type Notification = z.infer<typeof NotificationSchema>;

export type RegisterBody = z.infer<typeof RegisterBodySchema>;
export type LoginBody = z.infer<typeof LoginBodySchema>;
export type CartAddBody = z.infer<typeof CartAddBodySchema>;
export type CartPatchBody = z.infer<typeof CartPatchBodySchema>;
export type TopupBody = z.infer<typeof TopupBodySchema>;
export type SeatsPatchBody = z.infer<typeof SeatsPatchBodySchema>;
export type RatingBody = z.infer<typeof RatingBodySchema>;
export type SuggestionCreateBody = z.infer<typeof SuggestionCreateBodySchema>;

export type PoolsQuery = z.infer<typeof PoolsQuerySchema>;
export type MePoolsQuery = z.infer<typeof MePoolsQuerySchema>;
export type TicketsQuery = z.infer<typeof TicketsQuerySchema>;
export type SuggestionsQuery = z.infer<typeof SuggestionsQuerySchema>;

export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
