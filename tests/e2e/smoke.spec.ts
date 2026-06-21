import { test, expect, type Page } from '@playwright/test';

/**
 * Phase-0 smoke: a real browser is the only thing that catches a white-screen
 * regression. Boots the production build, visits the public pages asserting
 * visible content + zero console/page errors, and checks the contract endpoints.
 */

/** Collect console + uncaught page errors, ignoring resource-load noise. */
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !/Failed to load resource/i.test(msg.text())) {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

test.describe('public pages render without errors', () => {
  test('home /', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /pooled together/i })).toBeVisible();
    await expect(page.getByText('eruja').first()).toBeVisible();
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('login /login', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('register /register', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /join your hub/i })).toBeVisible();
    expect(errors, errors.join('\n')).toEqual([]);
  });
});

test.describe('contract endpoints respond with valid JSON', () => {
  test('GET /api/hubs', async ({ request }) => {
    const res = await request.get('/api/hubs');
    expect(res.status()).toBe(200);
    const hubs = (await res.json()) as unknown[];
    expect(Array.isArray(hubs)).toBe(true);
    expect(hubs.length).toBeGreaterThan(0);
    const hub = hubs[0] as Record<string, unknown>;
    expect(hub).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      country: expect.any(String),
      poolsLive: expect.any(Number),
    });
  });

  test('GET /api/pools', async ({ request }) => {
    const res = await request.get('/api/pools');
    expect(res.status()).toBe(200);
    const pools = (await res.json()) as unknown[];
    expect(Array.isArray(pools)).toBe(true);
    expect(pools.length).toBeGreaterThan(0);
    const pool = pools[0] as Record<string, unknown>;
    expect(pool).toMatchObject({
      id: expect.any(String),
      productKind: expect.any(String),
      name: expect.any(String),
      groupPackPrice: expect.any(Number),
      groupUnitPrice: expect.any(Number),
      totalSeats: expect.any(Number),
      takenSeats: expect.any(Number),
      status: expect.any(String),
    });
  });
});
