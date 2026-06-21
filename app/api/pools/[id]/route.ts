import { getPool } from '@/lib/server/services';
import { json, notFound } from '@/lib/server/http';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pool = getPool(id);
  if (!pool) return notFound('No pool with that id.');
  return json(pool);
}
