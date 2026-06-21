import { SuggestionsQuerySchema, SuggestionCreateBodySchema } from '@/lib/schemas';
import { listSuggestions, createSuggestion } from '@/lib/server/services';
import { json, readBody, readQuery, requireUser } from '@/lib/server/http';

export async function GET(req: Request) {
  const parsed = readQuery(req, SuggestionsQuerySchema);
  if (!parsed.ok) return parsed.response;
  return json(listSuggestions(parsed.data.hubId, parsed.data.sort));
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const parsed = await readBody(req, SuggestionCreateBodySchema);
  if (!parsed.ok) return parsed.response;
  return json(createSuggestion(parsed.data), { status: 201 });
}
