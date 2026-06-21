import { CartPatchBodySchema } from '@/lib/schemas';
import { patchCartLine, deleteCartLine } from '@/lib/server/services';
import { json, notFound, readBody, requireUser } from '@/lib/server/http';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const parsed = await readBody(req, CartPatchBodySchema);
  if (!parsed.ok) return parsed.response;
  const result = patchCartLine(auth.user.id, id, parsed.data.quantity);
  if (result === 'no_line') return notFound('No cart line with that id.');
  return json(result);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const result = deleteCartLine(auth.user.id, id);
  if (result === 'no_line') return notFound('No cart line with that id.');
  return json(result);
}
