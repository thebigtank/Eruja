import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import type { User } from '@/lib/types';
import { getStore, nextId } from './db';

/**
 * Mock session: an httpOnly cookie `eruja_session` holds an opaque token that
 * maps to a userId in an in-memory map. No real auth. A cross-origin backend
 * must reproduce this cookie contract (httpOnly, SameSite=Lax) + CORS creds.
 */
export const SESSION_COOKIE = 'eruja_session';

export function createSession(userId: string): string {
  const store = getStore();
  const token = nextId('sess');
  store.sessions.set(token, userId);
  return token;
}

export function destroySession(token: string | undefined): void {
  if (!token) return;
  getStore().sessions.delete(token);
}

/** Read the current user from the request cookie, or null if unauthenticated. */
export async function getSessionUser(): Promise<User | null> {
  const store = getStore();
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = store.sessions.get(token);
  if (!userId) return null;
  return store.users.get(userId) ?? null;
}

/** Read the raw session token from the request cookie. */
export async function getSessionToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
} as const;

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(SESSION_COOKIE, token, cookieOptions);
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
}
