import { getCart } from '@/lib/server/services';
import { json, requireUser } from '@/lib/server/http';

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  return json(getCart(auth.user.id));
}
