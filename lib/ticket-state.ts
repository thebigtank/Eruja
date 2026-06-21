import type { OrderStatus } from './types';

/**
 * The 8 OrderStatus values collapse into 4 visual tracking states. This is the
 * /me/pools/[ticket] state machine, shared by the skeleton and the real screens:
 *   waiting   (H4) ← awaiting | filling
 *   cargo     (H5) ← full_charged | sourced | in_transit | customs
 *   last-mile (H6) ← last_mile
 *   delivered (H7) ← delivered
 */
export type TicketVisualState = 'waiting' | 'cargo' | 'last-mile' | 'delivered';

export function ticketVisualState(status: OrderStatus): TicketVisualState {
  switch (status) {
    case 'awaiting':
    case 'filling':
      return 'waiting';
    case 'full_charged':
    case 'sourced':
    case 'in_transit':
    case 'customs':
      return 'cargo';
    case 'last_mile':
      return 'last-mile';
    case 'delivered':
      return 'delivered';
  }
}

export const VISUAL_STATE_LABEL: Record<TicketVisualState, string> = {
  waiting: 'Waiting room',
  cargo: 'Cargo in transit',
  'last-mile': 'Last mile',
  delivered: 'Delivered',
};
