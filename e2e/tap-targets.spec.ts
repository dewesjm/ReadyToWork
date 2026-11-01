import { expect, test } from '@playwright/test';

/** On phones, the controls people tap most are at least this many pixels each way. */
const MIN = 44;

/** Pages, and the controls on them that people tap most. */
const PAGES = [
  {
    path: '/readiness',
    controls: 'header a, header button, rtw-readiness-toolbar :is(button, .input, select, label:has(.toggle)), [data-testid=tree-row] button',
  },
  {
    path: '/readiness?view=list',
    controls: 'rtw-issues-list button',
  },
  {
    path: '/person/p002',
    controls: 'main a, rtw-announcement-banner button',
  },
];

test.describe('tap targets', () => {
  test.skip(({ isMobile }) => !isMobile, 'phones only');

  for (const page of PAGES) {
    test(`${page.path} has tap targets at least ${MIN}px`, async ({ page: tab }) => {
      await tab.addInitScript(() => localStorage.setItem('rtw.settings', JSON.stringify({ schemaVersion: 3, preferences: { personaId: 'admin' } })));
      await tab.goto(page.path);
      await expect(tab.getByRole('heading', { level: 1 })).toBeVisible();
      const small = await tab.locator(page.controls).evaluateAll((els, min) => {
        const out = new Set<string>();
        for (const el of els) {
          const box = el.getBoundingClientRect();
          if (!box.width || getComputedStyle(el).visibility === 'hidden') continue;
          if (box.width < min || box.height < min) {
            const name = el.getAttribute('aria-label') ?? el.textContent ?? el.tagName;
            out.add(`${el.tagName.toLowerCase()} "${name.trim().replace(/\s+/g, ' ').slice(0, 30)}" ${Math.round(box.width)}×${Math.round(box.height)}`);
          }
        }
        return [...out];
      }, MIN);
      expect(small).toEqual([]);
    });
  }
});
