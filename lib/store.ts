import { create } from 'zustand';
import { api } from './api/client';
import type { Cart, Hub, RegisterBody, User, WalletState } from './types';

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
  loadCart: () => Promise<void>;
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

  loadCart: async () => {
    try {
      set({ cart: await api.cart.get() });
    } catch {
      set({ cart: null });
    }
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
