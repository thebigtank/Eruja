import { listNotifications } from '@/lib/server/services';
import { json } from '@/lib/server/http';

export async function GET() {
  return json(listNotifications());
}
