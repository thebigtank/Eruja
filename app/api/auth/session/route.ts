import { getSessionUser } from '@/lib/server/session';
import { json, unauthorized } from '@/lib/server/http';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  return json({ user });
}
