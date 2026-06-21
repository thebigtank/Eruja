import type {
  Cart,
  CartAddBody,
  CartPatchBody,
  CheckoutResponse,
  Hub,
  LoginBody,
  Notification,
  OrderTicket,
  Pool,
  PoolBucket,
  PoolsQuery,
  RatingBody,
  RegisterBody,
  SeatsPatchBody,
  Suggestion,
  SuggestionCreateBody,
  SuggestionsQuery,
  TopupBody,
  User,
  WalletState,
} from '@/lib/types';

/**
 * The ONLY module screens import to reach the API. Swapping backends = change
 * NEXT_PUBLIC_API_BASE_URL ('' = same-origin Next routes). Sends credentials so
 * the eruja_session cookie rides along (a cross-origin backend must allow this).
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Query = Record<string, string | number | boolean | undefined>;

function withQuery(path: string, query?: Query): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: 'include',
    headers: init?.body ? { 'content-type': 'application/json' } : undefined,
    ...init,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload: unknown = isJson ? await res.json() : null;

  if (!res.ok) {
    const err = (payload ?? {}) as { error?: string; message?: string };
    throw new ApiError(res.status, err.error ?? 'error', err.message ?? res.statusText);
  }
  return payload as T;
}

const body = (data: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(data) });

export const api = {
  auth: {
    register: (data: RegisterBody) =>
      request<{ user: User }>('/auth/register', body(data)).then((r) => r.user),
    login: (data: LoginBody) =>
      request<{ user: User }>('/auth/login', body(data)).then((r) => r.user),
    logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
    session: () => request<{ user: User }>('/auth/session').then((r) => r.user),
  },

  hubs: {
    list: () => request<Hub[]>('/hubs'),
  },

  pools: {
    list: (query?: PoolsQuery) => request<Pool[]>(withQuery('/pools', query)),
    get: (id: string) => request<Pool>(`/pools/${id}`),
    mine: (status?: PoolBucket) => request<Pool[]>(withQuery('/me/pools', { status })),
  },

  cart: {
    get: () => request<Cart>('/cart'),
    addLine: (data: CartAddBody) => request<Cart>('/cart/lines', body(data)),
    patchLine: (id: string, data: CartPatchBody) =>
      request<Cart>(`/cart/lines/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    removeLine: (id: string) => request<Cart>(`/cart/lines/${id}`, { method: 'DELETE' }),
  },

  checkout: () => request<CheckoutResponse>('/checkout', { method: 'POST' }),

  wallet: {
    get: () => request<WalletState>('/wallet'),
    topUp: (data: TopupBody) => request<WalletState>('/wallet/topup', body(data)),
  },

  tickets: {
    list: (status?: PoolBucket) => request<OrderTicket[]>(withQuery('/me/tickets', { status })),
    get: (id: string) => request<OrderTicket>(`/me/tickets/${id}`),
    setSeats: (id: string, data: SeatsPatchBody) =>
      request<OrderTicket>(`/me/tickets/${id}/seats`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    rate: (id: string, data: RatingBody) =>
      request<OrderTicket>(`/me/tickets/${id}/rating`, body(data)),
    leave: (id: string) => request<never>(`/me/tickets/${id}`, { method: 'DELETE' }),
  },

  suggestions: {
    list: (query?: SuggestionsQuery) => request<Suggestion[]>(withQuery('/suggestions', query)),
    create: (data: SuggestionCreateBody) => request<Suggestion>('/suggestions', body(data)),
    vote: (id: string) => request<Suggestion>(`/suggestions/${id}/vote`, { method: 'POST' }),
  },

  notifications: {
    list: () => request<Notification[]>('/notifications'),
    markRead: (id: string) =>
      request<{ ok: true }>(`/notifications/${id}/read`, { method: 'POST' }),
  },
};
