import { destroySession, getSessionToken, clearSessionCookie } from '@/lib/server/session';
import { json } from '@/lib/server/http';

export async function POST() {
  destroySession(await getSessionToken());
  const res = json({ ok: true });
  clearSessionCookie(res);
  return res;
}
