import { expect, test } from '@playwright/test';

test.describe('phone layout', () => {
  test.skip(({ isMobile }) => !isMobile, 'phones only');

  test.beforeEach(async ({ page }) => {
    // The Admin persona has the most in the header (Readiness and Admin links).
    await page.addInitScript(() => localStorage.setItem('rtw.settings', JSON.stringify({ schemaVersion: 3, preferences: { personaId: 'admin' } })));
  });

  for (const path of ['/readiness', '/readiness?view=list', '/person/p002', '/admin', '/changelog']) {
    test(`${path} fits the screen width, header on one line`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
      const brand = await page.getByRole('link', { name: 'Ready to Work' }).boundingBox();
      expect(brand!.height).toBeLessThanOrEqual(44);
    });
  }
});

// Phone and desktop: the director's row has the widest chips and roll-up.
test('tree rows put Details in the same place on every row', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rtw.settings', JSON.stringify({ schemaVersion: 3, preferences: { personaId: 'admin' } })));
  await page.goto('/readiness');
  await expect(page.getByTestId('details').first()).toBeVisible();
  const rights = await page.getByTestId('details').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().right)));
  expect(rights.length).toBeGreaterThan(10);
  expect(new Set(rights).size).toBe(1);
});
