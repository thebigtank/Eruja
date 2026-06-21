import { resetStore } from '@/lib/server/db';
import { json, notFound } from '@/lib/server/http';

/**
 * TEST-ONLY reset hook. Re-seeds the in-memory store so e2e specs start from a
 * known state (the shared backend otherwise bleeds mutations across tests).
 *
 * Gated exactly like the `__eruja` test seam: available in dev, or when the e2e
 * build sets NEXT_PUBLIC_E2E=1 (Playwright's webServer does). In a real prod
 * build NEXT_PUBLIC_E2E defaults to '0' (next.config.ts) → this 404s.
 */
const ENABLED = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_E2E === '1';

export async function POST() {
  if (!ENABLED) return notFound('Not found.');
  resetStore();
  return json({ ok: true });
}
