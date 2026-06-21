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

const money = (s: string | null) => parseFloat((s ?? '').replace(/[^0-9.]/g, ''));

test.describe('Home (H0)', () => {
  test('renders greeting, wallet, tabs with counts, and cards', async ({ page }) => {
    const errors = trackErrors(page);
    await login(page);
    await page.goto('/');

    const web = page.getByTestId('home-web');
    await expect(web.getByText('Ada', { exact: true })).toBeVisible();
    await expect(web.getByText('Ẹ káàbọ̀ — welcome back')).toBeVisible();
    await expect(web.getByTestId('wallet-balance')).toContainText('$');

    await expect(web.getByRole('button', { name: /Awaiting · \d+/ })).toBeVisible();
    await expect(web.getByRole('button', { name: /In transit · 1/ })).toBeVisible();
    await expect(web.getByRole('button', { name: /Delivered · 4/ })).toBeVisible();

    // at least one my-pools card and the discover teaser cards
    expect(await web.locator('a[href^="/me/pools/"]').count()).toBeGreaterThan(0);
    expect(await web.locator('a[href^="/pool/"]').count()).toBeGreaterThan(0);

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('top-up: $100 chip + Top up raises the wallet card AND the shell pill', async ({ page }) => {
    await login(page);
    await page.goto('/');
    const web = page.getByTestId('home-web');

    const before = money(await web.getByTestId('wallet-balance').textContent());
    await web.getByRole('button', { name: '$100', exact: true }).click();
    await web.getByRole('button', { name: /Top up \$100/ }).click();

    const expected = `$${(before + 100).toFixed(2)}`;
    await expect(web.getByTestId('wallet-balance')).toHaveText(expected);
    await expect(page.getByTestId('shell-wallet-pill')).toContainText(expected);
  });

  test('tab switch to In transit shows the in-transit ticket only', async ({ page }) => {
    await login(page);
    await page.goto('/');
    const web = page.getByTestId('home-web');

    await web.getByRole('button', { name: /In transit · 1/ }).click();
    await expect(web.locator('a[href="/me/pools/t_4801"]')).toBeVisible();
    await expect(web.locator('a[href^="/me/pools/"]')).toHaveCount(1);
  });

  test('card link targets: my-pools -> /me/pools/{id}, discover -> /pool/{id}', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/');
    const web = page.getByTestId('home-web');

    // default Awaiting tab includes ticket t_4821
    await expect(web.locator('a[href="/me/pools/t_4821"]')).toBeVisible();
    await expect(web.locator('a[href^="/pool/"]').first()).toBeVisible();
  });
});

test.describe('desktop bell', () => {
  test('nav bell navigates to /notifications and shows active state', async ({ page }) => {
    await login(page);
    await page.goto('/');

    await page.getByRole('link', { name: 'Notifications' }).click();
    await expect(page).toHaveURL(/\/notifications$/);
    await expect(page.getByRole('link', { name: 'Notifications' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
