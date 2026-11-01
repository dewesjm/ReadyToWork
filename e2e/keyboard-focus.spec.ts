import { expect, test } from '@playwright/test';

/** Tab through each page; every stop must show a focus ring (outline or ring shadow). */
for (const [path, persona] of [['/readiness', 'admin'], ['/readiness?view=list', 'admin'], ['/person/p002', 'admin'], ['/admin', 'admin'], ['/changelog', 'admin']]) {
  for (const theme of ['navy', 'navy-dark']) {
    test(`${path} in ${theme} shows where keyboard focus is`, async ({ page }) => {
      await page.addInitScript((s) => localStorage.setItem('rtw.settings', s), JSON.stringify({ schemaVersion: 3, preferences: { theme, personaId: persona } }));
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const unmarked: string[] = [];
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press('Tab');
        const stop = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          // daisyUI draws an input's ring on its wrapping .input box.
          const cs = getComputedStyle(el.closest('.input') ?? el);
          const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
          return { ring, name: `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30)}"` };
        });
        if (stop && !stop.ring) unmarked.push(stop.name);
      }
      expect([...new Set(unmarked)]).toEqual([]);
    });
  }
}
