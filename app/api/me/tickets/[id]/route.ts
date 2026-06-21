import { getTicket } from '@/lib/server/services';
import { json, fail, notFound, requireUser } from '@/lib/server/http';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const ticket = getTicket(auth.user.id, id);
  if (!ticket) return notFound('No ticket with that id.');
  return json(ticket);
}

/**
 * Leaving a pool is intentionally disabled behind FEATURES.leavePool=false until
 * refund logic ships. Documented for the backend — keep returning 501.
 */
export async function DELETE() {
  return fail(501, 'feature_disabled', 'Leaving a pool is disabled until refund logic ships.');
}
