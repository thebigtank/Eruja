import { MePoolsQuerySchema } from '@/lib/schemas';
import { listMyPools } from '@/lib/server/services';
import { json, readQuery, requireUser } from '@/lib/server/http';

export async function GET(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const parsed = readQuery(req, MePoolsQuerySchema);
  if (!parsed.ok) return parsed.response;
  return json(listMyPools(auth.user.id, parsed.data.status));
}
