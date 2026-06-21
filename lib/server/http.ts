import { NextResponse } from 'next/server';
import { z, type ZodType } from 'zod';
import type { User } from '@/lib/types';
import { getSessionUser } from './session';

/* Small response + validation helpers shared by every route handler. */

export function json<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function fail(status: number, error: string, message: string): NextResponse {
  return NextResponse.json({ error, message }, { status });
}

export const badRequest = (message: string) => fail(400, 'invalid_request', message);
export const unauthorized = () => fail(401, 'unauthenticated', 'Sign in to continue.');
export const notFound = (message = 'Not found.') => fail(404, 'not_found', message);

type Parsed<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

function formatZodError(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join('.') || '(body)'}: ${i.message}`).join('; ');
}

/** Parse + validate a JSON request body against a schema. */
export async function readBody<T>(req: Request, schema: ZodType<T>): Promise<Parsed<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: badRequest('Request body must be valid JSON.') };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false, response: badRequest(formatZodError(result.error)) };
  }
  return { ok: true, data: result.data };
}

/** Parse + validate URL query params against a schema. */
export function readQuery<T>(req: Request, schema: ZodType<T>): Parsed<T> {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    return { ok: false, response: badRequest(formatZodError(result.error)) };
  }
  return { ok: true, data: result.data };
}

/** Require an authenticated user, or short-circuit with 401. */
export async function requireUser(): Promise<
  { ok: true; user: User } | { ok: false; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) return { ok: false, response: unauthorized() };
  return { ok: true, user };
}
