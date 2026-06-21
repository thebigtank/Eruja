import { CartAddBodySchema } from '@/lib/schemas';
import { addCartLine } from '@/lib/server/services';
import { json, badRequest, readBody, requireUser } from '@/lib/server/http';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const parsed = await readBody(req, CartAddBodySchema);
  if (!parsed.ok) return parsed.response;
  const result = addCartLine(auth.user.id, parsed.data.poolId, parsed.data.quantity);
  if (result === 'no_pool') return badRequest('No pool with that id.');
  return json(result, { status: 201 });
}
