import { checkout } from '@/lib/server/services';
import { json, badRequest, requireUser } from '@/lib/server/http';

export async function POST() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const result = checkout(auth.user.id);
  if (result === 'empty') return badRequest('Your cart is empty.');
  return json(result, { status: 201 });
}
