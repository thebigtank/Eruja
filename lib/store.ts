import { create } from 'zustand';
import { api } from './api/client';
import type {
  Cart,
  CheckoutResponse,
  Hub,
  OrderTicket,
  RegisterBody,
  User,
  WalletState,
} from './types';

/**
 * Session / hub / wallet / cart UI state, hydrated from the client seam (lib/api/client).
 * This is the app's client-side state seam — screens read from here and call the
 * load/* actions to refresh from the API. Deeper per-screen state is added later.
 */
interface ErujaState {
  user: User | null;
  hubs: Hub[];
  activeHubId: string | null;
  wallet: WalletState | null;
  cart: Cart | null;
  hydrated: boolean;

  cartCount: () => number;

  loadSession: () => Promise<void>;
  loadHubs: () => Promise<void>;
  loadWallet: () => Promise<void>;
  topUp: (amount: number) => Promise<WalletState>;
  loadCart: () => Promise<void>;
  addToCart: (poolId: string, quantity: number) => Promise<Cart>;
  updateCartLine: (id: string, quantity: number) => Promise<Cart>;
  removeCartLine: (id: string) => Promise<Cart>;
  checkout: () => Promise<CheckoutResponse>;
  /** Waiting-room add/release seats. Rebalances the wallet HOLD; resyncs the store wallet. */
  setTicketSeats: (id: string, quantity: number) => Promise<OrderTicket>;
  /** Rate a delivered ticket (H7). Returns the updated ticket; no wallet impact. */
  setTicketRating: (id: string, stars: number) => Promise<OrderTicket>;
  setActiveHub: (hubId: string) => void;

  login: (email: string, password: string) => Promise<User>;
  register: (body: RegisterBody) => Promise<User>;
  logout: () => Promise<void>;
  /** Hydrate everything the shell needs after auth. */
  bootstrap: () => Promise<void>;
}

export const useEruja = create<ErujaState>((set, get) => ({
  user: null,
  hubs: [],
  activeHubId: null,
  wallet: null,
  cart: null,
  hydrated: false,

  cartCount: () => get().cart?.lines.reduce((n, l) => n + l.quantity, 0) ?? 0,

  loadSession: async () => {
    try {
      const user = await api.auth.session();
      set({ user, activeHubId: get().activeHubId ?? user.hubId });
    } catch {
      set({ user: null });
    }
  },

  loadHubs: async () => {
    set({ hubs: await api.hubs.list() });
  },

  loadWallet: async () => {
    try {
      set({ wallet: await api.wallet.get() });
    } catch {
      set({ wallet: null });
    }
  },

  topUp: async (amount) => {
    const wallet = await api.wallet.topUp({ amount });
    set({ wallet }); // propagates to the shell wallet pill
    return wallet;
  },

  loadCart: async () => {
    try {
      set({ cart: await api.cart.get() });
    } catch {
      set({ cart: null });
    }
  },

  addToCart: async (poolId, quantity) => {
    const cart = await api.cart.addLine({ poolId, quantity });
    set({ cart }); // propagates to the shell cart badge
    return cart;
  },

  updateCartLine: async (id, quantity) => {
    const cart = await api.cart.patchLine(id, { quantity });
    set({ cart });
    return cart;
  },

  removeCartLine: async (id) => {
    const cart = await api.cart.removeLine(id);
    set({ cart });
    return cart;
  },

  checkout: async () => {
    const result = await api.checkout();
    // Cart cleared server-side; reflect empty state + updated wallet hold locally.
    set({
      wallet: result.wallet,
      cart: {
        lines: [],
        subtotal: 0,
        walletBalance: result.wallet.balance,
        balanceAfter: result.wallet.balance,
      },
    });
    return result;
  },

  setTicketSeats: async (id, quantity) => {
    const ticket = await api.tickets.setSeats(id, { quantity });
    // The seats response carries the ticket only; the hold lives on the wallet,
    // so resync it to keep the shell (held) in sync.
    await get().loadWallet();
    return ticket;
  },

  setTicketRating: async (id, stars) => {
    return api.tickets.rate(id, { stars });
  },

  setActiveHub: (hubId) => set({ activeHubId: hubId }),

  login: async (email, password) => {
    const user = await api.auth.login({ email, password });
    set({ user, activeHubId: user.hubId });
    await get().bootstrap();
    return user;
  },

  register: async (body) => {
    const user = await api.auth.register(body);
    set({ user, activeHubId: body.hubId });
    await get().bootstrap();
    return user;
  },

  logout: async () => {
    await api.auth.logout();
    set({ user: null, wallet: null, cart: null });
  },

  bootstrap: async () => {
    await Promise.all([get().loadHubs(), get().loadSession()]);
    if (get().user) await Promise.all([get().loadWallet(), get().loadCart()]);
    set({ hydrated: true });
  },
}));

/**
 * Expose the store for e2e assertions. Gated so it NEVER ships in a real production
 * build: attached only in dev, or when the e2e build sets NEXT_PUBLIC_E2E=1
 * (Playwright's webServer does; real `next build` does not).
 */
declare global {
  interface Window {
    __eruja?: typeof useEruja;
  }
}
const E2E_SEAM = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_E2E === '1';
if (typeof window !== 'undefined' && E2E_SEAM) {
  window.__eruja = useEruja;
}
