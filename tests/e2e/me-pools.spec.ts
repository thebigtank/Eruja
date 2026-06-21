import { test, expect, type Page } from '@playwright/test';

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !/Failed to load resource/i.test(msg.text()))
      errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function reset(page: Page) {
  const r = await page.request.post('/api/test/reset');
  expect(r.ok()).toBeTruthy();
}

async function login(page: Page) {
  const res = await page.request.post('/api/auth/login', {
    data: { email: 'ada@eruja.app', password: 'whatever' },
  });
  expect(res.ok()).toBeTruthy();
}

test.describe('My pools list (/me/pools)', () => {
  test.beforeEach(async ({ page }) => {
    await reset(page);
    await login(page);
  });

  test('renders title, sub, bucket tabs (2/1/4), and Awaiting cards linking to the tracker', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto('/me/pools');
    await page.waitForSelector('[data-testid="me-pools-web"]', { timeout: 10_000 });

    const web = page.getByTestId('me-pools-web');
    await expect(web.getByRole('heading', { name: 'My pools' })).toBeVisible();
    await expect(web.getByText('7 pools in motion')).toBeVisible();

    // Tab counts reflect Ada's seeded 2 / 1 / 4 buckets
    await expect(web.getByTestId('tab-awaiting')).toContainText('Awaiting · 2');
    await expect(web.getByTestId('tab-in_transit')).toContainText('In transit · 1');
    await expect(web.getByTestId('tab-delivered')).toContainText('Delivered · 4');

    // Default Awaiting bucket → 2 ticket cards, each linking to its tracker
    const links = web.locator('a[href^="/me/pools/"]');
    await expect(links).toHaveCount(2);
    await expect(web.locator('a[href="/me/pools/t_4821"]')).toBeVisible();
    await expect(web.locator('a[href="/me/pools/t_4844"]')).toBeVisible();
    // Pack price joined from the pool ($95/$38 for Honey Beans)
    await expect(web.locator('a[href="/me/pools/t_4821"]')).toContainText('$38');
    await expect(web.locator('a[href="/me/pools/t_4821"]')).toContainText('ticket #4821');

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('tab switch: Delivered shows 4 cards, In transit shows the 1 crayfish ticket', async ({
    page,
  }) => {
    await page.goto('/me/pools');
    await page.waitForSelector('[data-testid="me-pools-web"]', { timeout: 10_000 });
    const web = page.getByTestId('me-pools-web');

    await web.getByTestId('tab-delivered').click();
    await expect(web.locator('a[href^="/me/pools/"]')).toHaveCount(4);

    await web.getByTestId('tab-in_transit').click();
    await expect(web.locator('a[href^="/me/pools/"]')).toHaveCount(1);
    await expect(web.locator('a[href="/me/pools/t_4801"]')).toBeVisible();
  });

  test('a list card navigates into the tracker', async ({ page }) => {
    await page.goto('/me/pools');
    await page.waitForSelector('[data-testid="me-pools-web"]', { timeout: 10_000 });
    await page.getByTestId('me-pools-web').locator('a[href="/me/pools/t_4821"]').click();
    await expect(page).toHaveURL(/\/me\/pools\/t_4821$/);
  });
});
