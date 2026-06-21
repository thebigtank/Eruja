import { markNotificationRead } from '@/lib/server/services';
import { json, notFound } from '@/lib/server/http';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!markNotificationRead(id)) return notFound('No notification with that id.');
  return json({ ok: true });
}
