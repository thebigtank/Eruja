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

/** Log in as the seeded user; page.request shares cookies with the page context. */
async function login(page: Page) {
  const res = await page.request.post('/api/auth/login', {
    data: { email: 'ada@eruja.app', password: 'whatever' },
  });
  expect(res.ok()).toBeTruthy();
}

test.describe('(app) auth guard', () => {
  test('no session on an (app) route redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/wallet');
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('shell nav — mobile tab bar', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('tabs navigate, render placeholders, and show active state', async ({ page }) => {
    const errors = trackErrors(page);
    await login(page);
    await page.goto('/');

    const tabs = [
      { name: 'My pools', url: /\/me\/pools$/, heading: 'My pools' },
      { name: 'Suggest', url: /\/suggest$/, heading: 'Suggest & vote' },
      { name: 'Wallet', url: /\/wallet$/, heading: 'Wallet' },
    ];

    for (const t of tabs) {
      await page.getByRole('link', { name: t.name }).click();
      await expect(page).toHaveURL(t.url);
      await expect(page.getByRole('heading', { name: t.heading })).toBeVisible();
      await expect(page.getByRole('link', { name: t.name })).toHaveAttribute(
        'aria-current',
        'page',
      );
    }

    expect(errors, errors.join('\n')).toEqual([]);
  });
});

test.describe('shell nav — desktop top nav', () => {
  test('Discover nav navigates and shows active state', async ({ page }) => {
    const errors = trackErrors(page);
    await login(page);
    await page.goto('/');

    await page.getByRole('link', { name: 'Discover' }).click();
    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.getByRole('heading', { name: 'Discover' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Discover' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    expect(errors, errors.join('\n')).toEqual([]);
  });
});

test.describe('dynamic routes resolve their record', () => {
  test('/pool/[id] renders the pool name', async ({ page }) => {
    await login(page);
    await page.goto('/pool/p_honeybeans');
    await expect(page.getByRole('heading', { name: /Honey Beans · 50kg/i })).toBeVisible();
  });

  test('/me/pools/[ticket] renders the resolved visual-state bucket', async ({ page }) => {
    await login(page);
    // t_4801 (crayfish) is in_transit -> cargo bucket.
    await page.goto('/me/pools/t_4801');
    await expect(page.getByText(/state: cargo/i)).toBeVisible();
  });
});
