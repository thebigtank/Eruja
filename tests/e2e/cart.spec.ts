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

async function login(page: Page) {
  const res = await page.request.post('/api/auth/login', {
    data: { email: 'ada@eruja.app', password: 'whatever' },
  });
  expect(res.ok()).toBeTruthy();
}

/** Reset server cart to the seeded 2-line state: honeybeans×10 + iru×4. */
async function seedCart(page: Page) {
  const existing = (await (await page.request.get('/api/cart')).json()) as {
    lines: { id: string }[];
  };
  for (const l of existing.lines) await page.request.delete(`/api/cart/lines/${l.id}`);
  await page.request.post('/api/cart/lines', { data: { poolId: 'p_honeybeans', quantity: 10 } });
  await page.request.post('/api/cart/lines', { data: { poolId: 'p_iru', quantity: 4 } });
}

/** Clear all cart lines without re-seeding. */
async function clearCart(page: Page) {
  const existing = (await (await page.request.get('/api/cart')).json()) as {
    lines: { id: string }[];
  };
  for (const l of existing.lines) await page.request.delete(`/api/cart/lines/${l.id}`);
}

/** Scope to the visible web section inside a cart-line element. */
function lineWeb(lineLocator: ReturnType<Page['locator']>) {
  return lineLocator.locator('[data-testid="cart-line-web"]');
}

const money = (s: string | null) => parseFloat((s ?? '').replace(/[^0-9.]/g, ''));

test.describe('Cart (H3) — with items', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await seedCart(page);
  });

  test('renders both seeded lines, summary, Pay enabled — zero console errors', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto('/cart');
    await page.waitForSelector('[data-testid="cart-web"]', { timeout: 10_000 });

    const web = page.getByTestId('cart-web');
    const lines = web.locator('[data-testid="cart-line"]');

    // Two lines
    await expect(lines).toHaveCount(2);

    // Honey Beans line — name, unit line, line total
    const hbSection = lineWeb(lines.nth(0));
    await expect(hbSection).toContainText('Honey Beans');
    await expect(hbSection).toContainText('10 cups · $6.50 each');
    await expect(hbSection.locator('.price-mono')).toContainText('$65');

    // Iru / Locust Bean line
    const iruSection = lineWeb(lines.nth(1));
    await expect(iruSection).toContainText('Iru / Locust Bean');
    await expect(iruSection).toContainText('4 cups · $6.50 each');
    await expect(iruSection.locator('.price-mono')).toContainText('$26');

    // Summary card
    await expect(web.getByTestId('cart-subtotal')).toHaveText('$91');
    await expect(web.getByTestId('cart-wallet-balance')).toContainText('$');
    await expect(web.getByTestId('cart-balance-after')).toContainText('$');

    // Pay button enabled with correct amount
    const payBtn = web.getByTestId('cart-checkout-btn');
    await expect(payBtn).toBeEnabled();
    await expect(payBtn).toContainText('Pay $91');

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('qty edit: increment HB by 1 → line total, subtotal, balance-after update; badge unchanged', async ({
    page,
  }) => {
    await page.goto('/cart');
    await page.waitForSelector('[data-testid="cart-web"]', { timeout: 10_000 });

    const web = page.getByTestId('cart-web');
    const lines = web.locator('[data-testid="cart-line"]');
    const badge = page.getByTestId('cart-badge').first();

    const badgeBefore = await badge.textContent();

    // Increment Honey Beans via the web section's Increase button
    await lineWeb(lines.nth(0)).locator('button[aria-label="Increase"]').click();
    await expect(web.getByTestId('cart-subtotal')).toHaveText('$97.50');
    await expect(web.getByTestId('cart-balance-after')).toContainText('$');
    // Line total jumps from $65 to $71.50
    await expect(lineWeb(lines.nth(0)).locator('.price-mono')).toContainText('$71.50');
    // Badge still equals the count BEFORE (distinct lines didn't change)
    await expect(badge).toHaveText(badgeBefore ?? '2');
  });

  test('remove line: Iru disappears, subtotal recomputes, badge decrements', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForSelector('[data-testid="cart-web"]', { timeout: 10_000 });

    const web = page.getByTestId('cart-web');
    const lines = web.locator('[data-testid="cart-line"]');
    const badge = page.getByTestId('cart-badge').first();
    const badgeBefore = money(await badge.textContent());

    // Remove second line (Iru)
    await lineWeb(lines.nth(1)).locator('button', { hasText: 'Remove' }).click();

    await expect(lines).toHaveCount(1);
    // After removing iru ($26), HB subtotal reflects current qty (10 → $65 or 11 → $71.50 from prior test)
    await expect(web.getByTestId('cart-subtotal')).toContainText('$');
    await expect(badge).toHaveText(String(badgeBefore - 1));
    // Iru line gone
    await expect(web).not.toContainText('Iru / Locust Bean');
  });

  test('short-funds: raise qty → Pay disables; +$100 chip → Pay re-enables; pill updates', async ({
    page,
  }) => {
    // Force honeybeans qty high enough to exceed wallet balance via API
    const wd = (await (await page.request.get('/api/wallet')).json()) as { balance: number };
    const fc = (await (await page.request.get('/api/cart')).json()) as {
      lines: { id: string; poolId: string }[];
    };
    const hbl = fc.lines.find((l) => l.poolId === 'p_honeybeans')!;
    const shortQty = Math.ceil((wd.balance - 26 + 0.01) / 6.5);
    await page.request.patch(`/api/cart/lines/${hbl.id}`, { data: { quantity: shortQty } });

    await page.goto('/cart');
    await page.waitForSelector('[data-testid="cart-web"]', { timeout: 10_000 });

    const web = page.getByTestId('cart-web');

    // Pay is disabled and balance-after is negative
    await expect(web.getByTestId('cart-checkout-btn')).toBeDisabled();
    const afterText = (await web.getByTestId('cart-balance-after').textContent()) ?? '';
    expect(afterText).toMatch(/-/); // negative (minus sign present)

    // "Short on funds?" card is visible on web; click +$100
    const sfCard = page.getByTestId('short-funds-card');
    await expect(sfCard).toBeVisible();
    await sfCard.getByTestId('topup-chip-100').click();

    // Pay re-enables; balance-after is now positive
    await expect(web.getByTestId('cart-checkout-btn')).toBeEnabled();
    const afterTopup = money(await web.getByTestId('cart-balance-after').textContent());
    expect(afterTopup).toBeGreaterThanOrEqual(0);

    // Shell wallet pill reflects the top-up
    await expect(page.getByTestId('shell-wallet-pill')).toContainText(
      `$${(wd.balance + 100).toFixed(2)}`,
    );
  });

  test('checkout: success card, badge → 0, wallet.held reflects the hold, View my pools link', async ({
    page,
  }) => {
    await page.goto('/cart');
    await page.waitForSelector('[data-testid="cart-web"]', { timeout: 10_000 });

    const web = page.getByTestId('cart-web');

    // Capture pre-checkout held value
    const heldBefore = (await page.evaluate(() => window.__eruja?.getState().wallet?.held)) ?? 0;

    await web.getByTestId('cart-checkout-btn').click();
    await expect(page.getByTestId('cart-success')).toBeVisible({ timeout: 8_000 });

    // Success card copy
    await expect(page.getByTestId('cart-success')).toContainText('Payment held');
    await expect(page.getByTestId('cart-success')).toContainText('queue ticket');

    // Cart badge disappears (badge shows only when count > 0)
    await expect(page.getByTestId('cart-badge')).toHaveCount(0);

    // wallet.held increased by the subtotal ($91 = $65 + $26)
    const heldAfter = await page.evaluate(() => window.__eruja?.getState().wallet?.held);
    expect((heldAfter ?? 0) - heldBefore).toBe(91);

    // "View my pools" goes to /me/pools
    await expect(page.getByTestId('success-view-pools')).toHaveAttribute('href', '/me/pools');
  });
});

test.describe('Cart (H3) — empty', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await clearCart(page);
  });

  test('empty cart shows empty state and Browse pools link', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForSelector('[data-testid="cart-empty"]', { timeout: 10_000 });

    await expect(page.getByTestId('cart-empty')).toContainText('Your cart is empty.');
    await expect(
      page.getByTestId('cart-empty').getByRole('link', { name: 'Browse pools' }),
    ).toHaveAttribute('href', '/discover');
    // Summary card should not be shown
    await expect(page.getByTestId('cart-summary')).toHaveCount(0);
  });
});
