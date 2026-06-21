import { RatingBodySchema } from '@/lib/schemas';
import { rateTicket } from '@/lib/server/services';
import { json, notFound, readBody, requireUser } from '@/lib/server/http';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const parsed = await readBody(req, RatingBodySchema);
  if (!parsed.ok) return parsed.response;
  const result = rateTicket(auth.user.id, id, parsed.data.stars);
  if (result === 'no_ticket') return notFound('No ticket with that id.');
  return json(result);
}
