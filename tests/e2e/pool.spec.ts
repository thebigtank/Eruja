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

const cartLen = (page: Page) =>
  page.evaluate(() => window.__eruja?.getState().cart?.lines.length ?? 0);

test.describe('Pool detail (H2)', () => {
  test('renders an open pool with header, selector, savings, and actions', async ({ page }) => {
    const errors = trackErrors(page);
    await login(page);
    await page.goto('/pool/p_honeybeans');
    const web = page.getByTestId('pool-web');

    await expect(web.getByText('London hub · grains')).toBeVisible();
    await expect(web.getByText('Honey Beans · 50kg')).toBeVisible();
    await expect(web.getByText(/aunty actually approves/)).toBeVisible();
    await expect(web.getByText('The pool · 64 seats')).toBeVisible();
    await expect(web.getByText('16 seats to ship')).toBeVisible();
    await expect(web.getByTestId('legend-yours')).toContainText('10 yours'); // default mine
    await expect(web.getByTestId('save-local')).toBeVisible();
    await expect(web.getByTestId('save-group')).toBeVisible();
    await expect(web.getByTestId('save-amount')).toBeVisible();
    await expect(web.getByTestId('add-to-cart')).toBeVisible();
    await expect(web.getByRole('button', { name: 'Buy now' })).toBeVisible();

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('selector live math + stepper min/max', async ({ page }) => {
    await login(page);
    await page.goto('/pool/p_honeybeans');
    const web = page.getByTestId('pool-web');
    const inc = web.getByRole('button', { name: 'Increase' });
    const dec = web.getByRole('button', { name: 'Decrease' });

    await expect(web.getByTestId('legend-yours')).toContainText('10 yours');
    // 10 -> 12: local 12×12=144, group 12×6.5=78.00, save 12×5.5=66, open 16−12=4
    await inc.click();
    await inc.click();
    await expect(web.getByTestId('legend-yours')).toContainText('12 yours');
    await expect(web.getByTestId('save-local')).toHaveText('$144');
    await expect(web.getByTestId('save-group')).toHaveText('$78.00');
    await expect(web.getByTestId('save-amount')).toHaveText('you save $66');
    await expect(web.getByText('○ 4 open')).toBeVisible();

    // max = open seats (16): click up until disabled
    while (await inc.isEnabled()) await inc.click();
    await expect(web.getByTestId('legend-yours')).toContainText('16 yours');
    await expect(inc).toBeDisabled();

    // min = 1: click down until disabled
    while (await dec.isEnabled()) await dec.click();
    await expect(web.getByTestId('legend-yours')).toContainText('1 yours');
    await expect(dec).toBeDisabled();
  });

  test('Add to cart updates the shell badge + shows Added', async ({ page }) => {
    await login(page);
    await page.goto('/pool/p_palm'); // open, NOT in the seeded cart
    const web = page.getByTestId('pool-web');

    // wait for the seeded cart to hydrate, then read the badge count
    const badge = page.getByTestId('cart-badge').first();
    await expect(badge).toBeVisible();
    const before = Number(await badge.textContent());

    await web.getByTestId('add-to-cart').click();
    await expect(web.getByTestId('add-to-cart')).toContainText('Added');
    await expect(badge).toHaveText(String(before + 1));
    expect(await cartLen(page)).toBe(before + 1);
  });

  test('Buy now adds the line and navigates to /cart', async ({ page }) => {
    await login(page);
    await page.goto('/pool/p_egusi'); // open, not in the seeded cart
    const badge = page.getByTestId('cart-badge').first();
    await expect(badge).toBeVisible(); // seeded cart hydrated
    const before = await cartLen(page);
    await page.getByTestId('pool-web').getByRole('button', { name: 'Buy now' }).click();
    await expect(page).toHaveURL(/\/cart$/);
    expect(await cartLen(page)).toBe(before + 1);
  });

  test('closed pool shows the filled notice, no selector', async ({ page }) => {
    await login(page);
    await page.goto('/pool/p_crayfish'); // 48/48, in_transit
    const web = page.getByTestId('pool-web');

    await expect(web.getByTestId('pool-closed')).toBeVisible();
    await expect(web.getByText('This pool has filled and is on its way.')).toBeVisible();
    await expect(web.getByRole('link', { name: 'Browse pools' })).toBeVisible();
    await expect(web.getByTestId('add-to-cart')).toHaveCount(0);
  });
});
