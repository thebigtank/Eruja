import { TicketsQuerySchema } from '@/lib/schemas';
import { listTickets } from '@/lib/server/services';
import { json, readQuery, requireUser } from '@/lib/server/http';

export async function GET(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const parsed = readQuery(req, TicketsQuerySchema);
  if (!parsed.ok) return parsed.response;
  return json(listTickets(auth.user.id, parsed.data.status));
}
