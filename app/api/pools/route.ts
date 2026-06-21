import { PoolsQuerySchema } from '@/lib/schemas';
import { listPools } from '@/lib/server/services';
import { json, readQuery } from '@/lib/server/http';

export async function GET(req: Request) {
  const parsed = readQuery(req, PoolsQuerySchema);
  if (!parsed.ok) return parsed.response;
  return json(listPools(parsed.data));
}
