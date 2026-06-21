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
    await expect(web.getByText('8 pools in motion')).toBeVisible();

    // Tab counts reflect Ada's seeded 2 / 2 / 4 buckets (in_transit = crayfish cargo + rice last-mile)
    await expect(web.getByTestId('tab-awaiting')).toContainText('Awaiting · 2');
    await expect(web.getByTestId('tab-in_transit')).toContainText('In transit · 2');
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
    await expect(web.locator('a[href^="/me/pools/"]')).toHaveCount(2);
    await expect(web.locator('a[href="/me/pools/t_4801"]')).toBeVisible();
    await expect(web.locator('a[href="/me/pools/t_4790"]')).toBeVisible();
  });

  test('a list card navigates into the tracker', async ({ page }) => {
    await page.goto('/me/pools');
    await page.waitForSelector('[data-testid="me-pools-web"]', { timeout: 10_000 });
    await page.getByTestId('me-pools-web').locator('a[href="/me/pools/t_4821"]').click();
    await expect(page).toHaveURL(/\/me\/pools\/t_4821$/);
  });
});

const heldNow = (page: Page) => page.evaluate(() => window.__eruja?.getState().wallet?.held ?? 0);

test.describe('Order tracker — waiting (H4)', () => {
  test.beforeEach(async ({ page }) => {
    await reset(page);
    await login(page);
  });

  test('t_4821 waiting room: badge, status line, people legend, seats, hold, timeline, disabled leave', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto('/me/pools/t_4821');
    await page.waitForSelector('[data-testid="tracker-web"]', { timeout: 10_000 });
    const web = page.getByTestId('tracker-web');

    // Back row + waiting badge
    await expect(web.getByTestId('tracker-name')).toContainText('Honey Beans');
    await expect(web.getByTestId('tracker-badge')).toHaveText('Waiting room');

    // Status line: 64 - 48 = 16 cups to ship
    await expect(web.getByText('16 cups to ship before it moves')).toBeVisible();

    // People legend: 10 yours, others = 48 - 10 = 38 joined, open = 16
    await expect(web.getByTestId('legend-yours')).toContainText('10 yours');
    await expect(web).toContainText('38 joined');

    // Seats + hold: 10 cups, 10×6.5 = $65
    await expect(web.getByTestId('seats-value')).toContainText('10');
    await expect(web.getByTestId('tracker-hold')).toHaveText('$65');

    // Transparency feed renders the seeded timeline
    await expect(web.getByTestId('tracker-timeline')).toContainText('Bag is filling');

    // Leave is disabled
    await expect(web.getByTestId('leave-btn')).toBeDisabled();

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('add a seat: seats++ , hold rebalances ($65 → $71.50), wallet.held +6.5', async ({
    page,
  }) => {
    await page.goto('/me/pools/t_4821');
    await page.waitForSelector('[data-testid="tracker-web"]', { timeout: 10_000 });
    const web = page.getByTestId('tracker-web');

    // Wallet hold before: t_4821 ($65) + t_4844 ($26) = $91
    expect(await heldNow(page)).toBe(91);

    await web.locator('button[aria-label="Increase"]').click();

    await expect(web.getByTestId('seats-value')).toContainText('11');
    await expect(web.getByTestId('tracker-hold')).toHaveText('$71.50');
    // Hold rebalanced on the wallet: 91 - 65 + 71.50 = 97.50
    await expect.poll(() => heldNow(page)).toBe(97.5);
  });

  test('release a seat to the floor: Decrease disables at the last seat (1)', async ({ page }) => {
    await page.goto('/me/pools/t_4821');
    await page.waitForSelector('[data-testid="tracker-web"]', { timeout: 10_000 });
    const web = page.getByTestId('tracker-web');
    const dec = web.locator('button[aria-label="Decrease"]');

    // 10 -> 1 is exactly 9 decrements; each click auto-waits for the button to
    // re-enable after the async commit (Stepper is busy-disabled mid-flight).
    for (let i = 0; i < 9; i++) await dec.click();
    await expect(web.getByTestId('seats-value')).toContainText('1');
    await expect(dec).toBeDisabled();
    await expect(web.getByTestId('tracker-hold')).toHaveText('$6.50');
  });

  test('leave pool is gated: DELETE /me/tickets/:id returns 501 feature_disabled', async ({
    page,
  }) => {
    const res = await page.request.delete('/api/me/tickets/t_4821');
    expect(res.status()).toBe(501);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('feature_disabled');
  });

  test('cargo/delivered tickets render the navigable placeholder, not the waiting room', async ({
    page,
  }) => {
    // t_4780 (honey beans) is delivered
    await page.goto('/me/pools/t_4780');
    await expect(page.getByTestId('tracker-badge')).toHaveText('Delivered');
    await expect(page.getByTestId('tracker-placeholder')).toContainText(
      'Delivered view — building next phase',
    );
    await expect(page.getByTestId('tracker-web')).toHaveCount(0);
  });
});
