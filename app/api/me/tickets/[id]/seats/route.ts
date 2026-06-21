import { SeatsPatchBodySchema } from '@/lib/schemas';
import { setTicketSeats } from '@/lib/server/services';
import { json, fail, notFound, readBody, requireUser } from '@/lib/server/http';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const parsed = await readBody(req, SeatsPatchBodySchema);
  if (!parsed.ok) return parsed.response;
  const result = setTicketSeats(auth.user.id, id, parsed.data.quantity);
  if (result === 'no_ticket') return notFound('No ticket with that id.');
  if (result === 'charged') {
    return fail(409, 'already_charged', 'Seats are locked once the pool is charged.');
  }
  return json(result);
}
