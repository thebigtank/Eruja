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

const count = (loc: ReturnType<Page['locator']>) => loc.getByTestId('vote-count');

test.describe('Suggest & vote (H8)', () => {
  test.beforeEach(async ({ page }) => {
    await reset(page);
    await login(page);
  });

  test('renders intro (real threshold), form, sort chips, seeded suggestions, graduated Cocoyam', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto('/suggest');
    await page.waitForSelector('[data-testid="suggest-web"]', { timeout: 10_000 });
    const web = page.getByTestId('suggest-web');

    // Intro binds the real threshold (40)
    await expect(web.getByTestId('suggest-intro')).toContainText('Suggest & vote');
    await expect(web.getByTestId('suggest-intro')).toContainText(
      'At 40 votes it becomes a real pool',
    );

    // Form: name, hub chips, category chips, why, submit (disabled until name+category)
    await expect(web.getByTestId('suggest-name')).toBeVisible();
    await expect(web.getByTestId('hub-london')).toBeVisible();
    await expect(web.getByTestId('cat-grains')).toBeVisible();
    await expect(web.getByTestId('suggest-why')).toBeVisible();
    await expect(web.getByTestId('suggest-submit')).toBeDisabled();

    // Sort chips
    await expect(web.getByTestId('sort-trending')).toBeVisible();
    await expect(web.getByTestId('sort-closest')).toBeVisible();
    await expect(web.getByTestId('sort-newest')).toBeVisible();

    // Seeded suggestions with real vote counts + progress
    await expect(count(web.getByTestId('suggestion-s_suya'))).toHaveText('24');
    await expect(count(web.getByTestId('suggestion-s_garri'))).toHaveText('11');
    await expect(web.getByTestId('suggestion-s_suya').getByTestId('vote-meta')).toContainText(
      '24/40 votes · 16 to a pool',
    );

    // Already-graduated Cocoyam shows "Now a pool" (no vote control)
    const cocoyam = web.getByTestId('suggestion-s_cocoyam');
    await expect(cocoyam.getByTestId('graduated-badge')).toHaveText('Now a pool');
    await expect(cocoyam.getByTestId('vote-btn')).toHaveCount(0);

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('vote toggle: Garri 11 → 12 (voted) → 11 (cleared)', async ({ page }) => {
    await page.goto('/suggest');
    await page.waitForSelector('[data-testid="suggest-web"]', { timeout: 10_000 });
    const card = page.getByTestId('suggest-web').getByTestId('suggestion-s_garri');
    const btn = card.getByTestId('vote-btn');

    await expect(count(card)).toHaveText('11');
    await expect(btn).toHaveAttribute('data-voted', 'false');

    await btn.click();
    await expect(count(card)).toHaveText('12');
    await expect(btn).toHaveAttribute('data-voted', 'true');

    await btn.click();
    await expect(count(card)).toHaveText('11');
    await expect(btn).toHaveAttribute('data-voted', 'false');
  });

  test('graduation: voting Plantain 39 → 40 flips it to "Now a pool" with a Browse-pools link', async ({
    page,
  }) => {
    await page.goto('/suggest');
    await page.waitForSelector('[data-testid="suggest-web"]', { timeout: 10_000 });
    const card = page.getByTestId('suggest-web').getByTestId('suggestion-s_flour');

    await expect(count(card)).toHaveText('39');
    await card.getByTestId('vote-btn').click();

    // Crossed the threshold → graduated state replaces the vote control
    await expect(card.getByTestId('graduated-badge')).toHaveText('Now a pool');
    await expect(card.getByTestId('vote-btn')).toHaveCount(0);
    await expect(card.getByTestId('graduated-footer')).toContainText(
      'Graduated — your city is pooling this.',
    );
    // Links to a real destination (graduation creates no pool id)
    await expect(card.getByTestId('graduated-link')).toHaveAttribute('href', '/discover');

    // Persisted server-side as graduated
    const items = (await (await page.request.get('/api/suggestions')).json()) as {
      id: string;
      status: string;
    }[];
    expect(items.find((s) => s.id === 's_flour')?.status).toBe('graduated');
  });

  test('create: name + category + why → Suggest it → new card on top, form resets', async ({
    page,
  }) => {
    await page.goto('/suggest');
    await page.waitForSelector('[data-testid="suggest-web"]', { timeout: 10_000 });
    const web = page.getByTestId('suggest-web');

    await web.getByTestId('suggest-name').fill('Ogbono · 2kg');
    await web.getByTestId('cat-soup').click();
    await web.getByTestId('suggest-why').fill('My whole street wants it.');
    await expect(web.getByTestId('suggest-submit')).toBeEnabled();
    await web.getByTestId('suggest-submit').click();

    // New card lands at the top of the list with the created vote (1)
    const first = web.getByTestId('suggest-list').locator('[data-testid^="suggestion-"]').first();
    await expect(first).toContainText('Ogbono · 2kg');
    await expect(first.getByTestId('vote-count')).toHaveText('1');

    // Form reset + transient confirmation
    await expect(web.getByTestId('suggest-name')).toHaveValue('');
    await expect(web.getByTestId('suggest-added')).toBeVisible();
  });

  test('empty state: switching the hub to one with no suggestions renders the empty card', async ({
    page,
  }) => {
    await page.goto('/suggest');
    await page.waitForSelector('[data-testid="suggest-web"]', { timeout: 10_000 });
    const web = page.getByTestId('suggest-web');

    await expect(web.getByTestId('suggestion-s_suya')).toBeVisible();
    await web.getByTestId('hub-houston').click();

    await expect(web.getByTestId('suggest-empty')).toContainText('No suggestions for Houston yet');
    await expect(web.getByTestId('suggestion-s_suya')).toHaveCount(0);
  });
});
