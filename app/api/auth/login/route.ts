import { LoginBodySchema } from '@/lib/schemas';
import { getStore } from '@/lib/server/db';
import { createSession, setSessionCookie } from '@/lib/server/session';
import { json, fail, readBody } from '@/lib/server/http';

export async function POST(req: Request) {
  const parsed = await readBody(req, LoginBodySchema);
  if (!parsed.ok) return parsed.response;
  const { email } = parsed.data;

  // Mock: password is NOT verified. The real backend must verify credentials.
  const store = getStore();
  const userId = store.emailIndex.get(email.toLowerCase());
  const user = userId ? store.users.get(userId) : undefined;
  if (!user) return fail(401, 'invalid_credentials', 'No account for that email.');

  const res = json({ user });
  setSessionCookie(res, createSession(user.id));
  return res;
}
