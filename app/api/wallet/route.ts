import { getWallet } from '@/lib/server/services';
import { json, notFound, requireUser } from '@/lib/server/http';

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const wallet = getWallet(auth.user.id);
  if (!wallet) return notFound('No wallet for this user.');
  return json(wallet);
}
