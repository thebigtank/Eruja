import { voteSuggestion } from '@/lib/server/services';
import { json, notFound, requireUser } from '@/lib/server/http';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const result = voteSuggestion(id);
  if (!result) return notFound('No suggestion with that id.');
  return json(result);
}
