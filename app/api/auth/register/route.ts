import type { User } from '@/lib/types';
import { RegisterBodySchema } from '@/lib/schemas';
import { getStore, nextId } from '@/lib/server/db';
import { createSession, setSessionCookie } from '@/lib/server/session';
import { json, fail, readBody } from '@/lib/server/http';

export async function POST(req: Request) {
  const parsed = await readBody(req, RegisterBodySchema);
  if (!parsed.ok) return parsed.response;
  const { name, email, hubId } = parsed.data;

  const store = getStore();
  if (store.emailIndex.has(email.toLowerCase())) {
    return fail(409, 'email_taken', 'An account already exists for that email.');
  }

  const user: User = { id: nextId('u'), name, email, hubId };
  store.users.set(user.id, user);
  store.emailIndex.set(email.toLowerCase(), user.id);
  store.wallets.set(user.id, {
    balance: 0,
    currency: 'USD',
    held: 0,
    savedTotal: 0,
    poolsJoined: 0,
    referred: 0,
  });
  store.carts.set(user.id, []);
  store.tickets.set(user.id, []);

  const res = json({ user }, { status: 201 });
  setSessionCookie(res, createSession(user.id));
  return res;
}
