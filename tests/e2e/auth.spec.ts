import { test, expect, type Page } from '@playwright/test';

/** Console + uncaught page errors, ignoring resource-load noise (e.g. expected 401s). */
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

test.describe('Register', () => {
  test('renders logo, headline, fields, hub chips, CTA — no console errors', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/register');

    await expect(page.getByText('eruja').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /pooled together/i })).toBeVisible();
    await expect(page.getByLabel('Full name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    // Hub chips from GET /api/hubs
    await expect(page.getByRole('button', { name: 'London' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Houston' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Toronto' })).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('CTA disabled until required fields are valid', async ({ page }) => {
    await page.goto('/register');
    const cta = page.getByRole('button', { name: /create account/i });
    await expect(cta).toBeDisabled();

    await page.getByLabel('Full name').fill('Bola A.');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Password', { exact: true }).fill('secret123');
    await expect(cta).toBeDisabled(); // email shape still invalid

    await page.getByLabel('Email').fill('bola@example.com');
    await expect(cta).toBeEnabled();
  });

  test('show-hide toggle flips the password field type', async ({ page }) => {
    await page.goto('/register');
    const pw = page.getByLabel('Password', { exact: true });
    await pw.fill('secret123');
    await expect(pw).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(pw).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(pw).toHaveAttribute('type', 'password');
  });

  test('flow: submit → navigates to /, sets cookie, store has user + hub', async ({
    page,
    context,
  }) => {
    await page.goto('/register');
    const email = `reg_${Date.now()}@eruja.app`;

    await page.getByLabel('Full name').fill('New Pooler');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('secret123');
    // London is the default-selected hub.
    await expect(page.getByRole('button', { name: 'London' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/$/);

    const cookie = (await context.cookies()).find((c) => c.name === 'eruja_session');
    expect(cookie?.value).toBeTruthy();

    const state = await page.evaluate(() => ({
      email: window.__eruja?.getState().user?.email,
      hub: window.__eruja?.getState().activeHubId,
    }));
    expect(state.email).toBe(email);
    expect(state.hub).toBe('london');
  });
});

test.describe('Login', () => {
  test('renders welcome copy and fields — no console errors', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText('Ẹ káàbọ̀')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /forgot password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('flow: submit (seeded Ada) → navigates to /, sets cookie', async ({ page, context }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('ada@eruja.app');
    await page.getByLabel('Password', { exact: true }).fill('whatever');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await expect(page).toHaveURL(/\/$/);
    const cookie = (await context.cookies()).find((c) => c.name === 'eruja_session');
    expect(cookie?.value).toBeTruthy();

    const userEmail = await page.evaluate(() => window.__eruja?.getState().user?.email);
    expect(userEmail).toBe('ada@eruja.app');
  });
});
