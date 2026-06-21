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

  test('renders title, sub, bucket tabs (2/2/4), and Awaiting cards linking to the tracker', async ({
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

  test('tab switch: Delivered shows 4 cards, In transit shows 2 (crayfish + rice)', async ({
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

  test('every bucket ticket resolves to a real state — no placeholder remains', async ({
    page,
  }) => {
    // one ticket per visual state: waiting, cargo, last-mile, delivered
    for (const id of ['t_4821', 't_4801', 't_4790', 't_4780']) {
      await page.goto(`/me/pools/${id}`);
      await page.waitForSelector('[data-testid="tracker-web"]', { timeout: 10_000 });
      await expect(page.getByTestId('tracker-placeholder')).toHaveCount(0);
    }
  });
});

test.describe('Order tracker — cargo (H5)', () => {
  test.beforeEach(async ({ page }) => {
    await reset(page);
    await login(page);
  });

  test('t_4801 cargo: charge line, hsteps pipeline, cargo route, timeline, Track cargo', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto('/me/pools/t_4801');
    await page.waitForSelector('[data-testid="tracker-web"]', { timeout: 10_000 });
    const web = page.getByTestId('tracker-web');

    await expect(web.getByTestId('tracker-badge')).toHaveText('Cargo in transit');

    // Charge line — distinct from the waiting hold; chargedAmount = 10×6.5 = $65
    await expect(web.getByTestId('cargo-header')).toContainText('the bag is full');
    await expect(web.getByTestId('cargo-header')).toContainText('Charged $65 · on its way');

    // HSteps: gather/source done, freight active, doorstep upcoming
    const hsteps = web.getByTestId('cargo-hsteps');
    await expect(hsteps.locator('.hstep.active')).toHaveText('freight');
    await expect(hsteps.locator('.hstep.done')).toHaveCount(2);

    // Cargo route — real seeded values
    await expect(web.getByTestId('cargo-route-line')).toHaveText('Lagos → London');
    await expect(web.getByTestId('cargo-route')).toContainText('LX4421');
    await expect(web.getByTestId('cargo-route')).toContainText('London May 4');

    // Transparency timeline carries the cargo events
    await expect(web.getByTestId('tracker-timeline')).toContainText('Cargo departed Lagos');

    // Deferred action present (non-functional)
    await expect(web.getByTestId('track-cargo')).toBeVisible();
    await expect(web.getByTestId('track-cargo')).toBeDisabled();

    expect(errors, errors.join('\n')).toEqual([]);
  });
});

test.describe('Order tracker — last-mile (H6)', () => {
  test.beforeEach(async ({ page }) => {
    await reset(page);
    await login(page);
  });

  test('t_4790 last-mile: arrival window, delivery card, portion, deferred actions', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto('/me/pools/t_4790');
    await page.waitForSelector('[data-testid="tracker-web"]', { timeout: 10_000 });
    const web = page.getByTestId('tracker-web');

    await expect(web.getByTestId('tracker-badge')).toHaveText('Last mile');

    // Header: "sorted for you" + arrival window
    await expect(web.getByTestId('lastmile-header')).toContainText('sorted for you');
    await expect(web.getByTestId('lastmile-header')).toContainText('Arriving Today, 2–6pm');

    // Delivery-window card — courier / driver / van / hub-out (seeded)
    const dw = web.getByTestId('delivery-window');
    await expect(dw).toContainText('DPD');
    await expect(dw).toContainText('Mo');
    await expect(dw).toContainText('AB12 CDE');
    await expect(dw).toContainText('11:42 today');

    // Portion card
    const portion = web.getByTestId('portion');
    await expect(portion).toContainText('your portion');
    await expect(portion).toContainText('10 cups · 7.8kg');
    await expect(portion).toContainText('vacuum-sealed');

    // Deferred actions present (non-functional)
    await expect(web.getByTestId('track-courier')).toBeDisabled();
    await expect(web.getByTestId('reschedule')).toBeDisabled();

    expect(errors, errors.join('\n')).toEqual([]);
  });
});

test.describe('Order tracker — delivered (H7)', () => {
  test.beforeEach(async ({ page }) => {
    await reset(page);
    await login(page);
  });

  test('t_4780 delivered: celebration, per-ticket savings, wallet stats, stars, next links', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto('/me/pools/t_4780');
    await page.waitForSelector('[data-testid="tracker-web"]', { timeout: 10_000 });
    const web = page.getByTestId('tracker-web');

    await expect(web.getByTestId('tracker-badge')).toHaveText('Delivered');
    await expect(web.getByTestId('delivered-header')).toContainText('Time to cook.');

    // Per-ticket savings ($45 for t_4780)
    await expect(web.getByTestId('delivered-savings')).toContainText('You saved');
    await expect(web.getByTestId('delivered-savings')).toContainText('$45');

    // Wallet stats (savedTotal 259 / poolsJoined 4 / referred 2)
    await expect(web.getByTestId('stat-saved')).toHaveText('$259');
    await expect(web.getByTestId('delivered-stats')).toContainText('4');
    await expect(web.getByTestId('delivered-stats')).toContainText('2');

    // Stars render (t_4780 preset rating = 5)
    await expect(web.getByTestId('stars')).toHaveAttribute('data-value', '5');

    // Real "what's next" links
    await expect(web.getByTestId('find-next')).toHaveAttribute('href', '/discover');
    await expect(web.getByTestId('suggest-item')).toHaveAttribute('href', '/suggest');

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('rating mutation: click 5 stars → PATCH persists, UI reflects it + Thanks', async ({
    page,
  }) => {
    // t_4762 starts at rating 4
    await page.goto('/me/pools/t_4762');
    await page.waitForSelector('[data-testid="tracker-web"]', { timeout: 10_000 });
    const web = page.getByTestId('tracker-web');
    const stars = web.getByTestId('stars');

    await expect(stars).toHaveAttribute('data-value', '4');

    await stars.getByRole('button', { name: 'Rate 5 stars' }).click();

    await expect(stars).toHaveAttribute('data-value', '5');
    await expect(web.getByTestId('rating-thanks')).toBeVisible();

    // Persisted server-side: a fresh GET returns rating 5
    const t = (await (await page.request.get('/api/me/tickets/t_4762')).json()) as {
      rating: number;
    };
    expect(t.rating).toBe(5);

    // And survives a reload (re-resolve from the backend)
    await page.reload();
    await page.waitForSelector('[data-testid="tracker-web"]', { timeout: 10_000 });
    await expect(page.getByTestId('tracker-web').getByTestId('stars')).toHaveAttribute(
      'data-value',
      '5',
    );
  });
});
