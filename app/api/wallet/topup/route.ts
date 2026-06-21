import { TopupBodySchema } from '@/lib/schemas';
import { topUp } from '@/lib/server/services';
import { json, notFound, readBody, requireUser } from '@/lib/server/http';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const parsed = await readBody(req, TopupBodySchema);
  if (!parsed.ok) return parsed.response;
  const wallet = topUp(auth.user.id, parsed.data.amount);
  if (!wallet) return notFound('No wallet for this user.');
  return json(wallet);
}
