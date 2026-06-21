import { test, expect, type Page } from '@playwright/test';

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

async function login(page: Page) {
  const res = await page.request.post('/api/auth/login', {
    data: { email: 'ada@eruja.app', password: 'whatever' },
  });
  expect(res.ok()).toBeTruthy();
}

test.describe('Discover (H1)', () => {
  test('renders hub chips, featured-pool hero prices, and a linking grid', async ({ page }) => {
    const errors = trackErrors(page);
    // featured pool = first of the filling-fastest list
    const sorted = (await (
      await page.request.get('/api/pools?hubId=london&sort=filling-fastest')
    ).json()) as { retailPackPrice: number; groupPackPrice: number }[];
    const featured = sorted[0]!;

    await login(page);
    await page.goto('/discover');
    const web = page.getByTestId('discover-web');

    // hub picker: 3 hubs, London active
    await expect(web.getByRole('button', { name: 'London' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(web.getByRole('button', { name: 'Houston' })).toBeVisible();
    await expect(web.getByRole('button', { name: 'Toronto' })).toBeVisible();

    // hero binds the featured pool's PACK prices
    const hero = page.getByTestId('discover-hero');
    await expect(hero).toContainText(`$${featured.retailPackPrice}`);
    await expect(hero).toContainText(`$${featured.groupPackPrice}`);

    // grid cards link to /pool/{id}
    expect(await web.locator('a[href^="/pool/"]').count()).toBe(sorted.length);

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('hub switch refetches the feed AND syncs the shell hub chip', async ({ page }) => {
    await login(page);
    await page.goto('/discover');
    const web = page.getByTestId('discover-web');

    await expect(web.locator('a[href^="/pool/"]').first()).toBeVisible();
    await web.getByRole('button', { name: 'Houston' }).click();

    // Houston has no seeded pools -> empty state, and the shell chip updates
    await expect(web.getByTestId('discover-empty')).toBeVisible();
    await expect(page.getByTestId('shell-hub-chip')).toContainText('Houston');
  });

  test('web category filter narrows the grid; All restores it', async ({ page }) => {
    await login(page);
    await page.goto('/discover');
    const web = page.getByTestId('discover-web');

    // wait for the full feed to load (seed: London has 6 pools)
    await expect(web.locator('a[href^="/pool/"]')).toHaveCount(6);
    await web.getByRole('button', { name: 'Grains' }).click();
    await expect(web.locator('a[href^="/pool/"]')).toHaveCount(2); // seed: 2 grains pools
    await web.getByRole('button', { name: 'All' }).click();
    await expect(web.locator('a[href^="/pool/"]')).toHaveCount(6);
  });

  test('empty category (Spices) shows the empty state + Suggest link', async ({ page }) => {
    await login(page);
    await page.goto('/discover');
    const web = page.getByTestId('discover-web');

    await web.getByRole('button', { name: 'Spices' }).click();
    await expect(web.getByTestId('discover-empty')).toBeVisible();
    await expect(web.getByRole('link', { name: /Suggest one/ })).toHaveAttribute(
      'href',
      '/suggest',
    );
  });
});
