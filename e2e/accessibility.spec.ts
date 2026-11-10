import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** The brand themes; daisyUI's other themes are its own colors and aren't checked. */
const THEMES = ['navy', 'navy-dark'];

/** Each page with the persona that can see it. */
const PAGES = [
  { name: 'tree', path: '/readiness?view=tree', persona: 'director' },
  { name: 'list', path: '/readiness?view=list', persona: 'director' },
  { name: 'person', path: '/person/p001', persona: 'director' },
  { name: 'admin', path: '/admin', persona: 'admin' },
  { name: 'changelog', path: '/changelog', persona: 'director' },
];

for (const theme of THEMES) {
  for (const page of PAGES) {
    test(`${page.name} in ${theme} has no accessibility problems`, async ({ page: tab }, testInfo) => {
      // Persona and theme are saved preferences, set before the app starts.
      const settings = { schemaVersion: 3, preferences: { theme, personaId: page.persona } };
      await tab.addInitScript((saved) => localStorage.setItem('rtw.settings', saved), JSON.stringify(settings));
      await tab.goto(page.path);
      await expect(tab.getByRole('heading', { level: 1 })).toBeVisible();

      await testInfo.attach('screenshot', { body: await tab.screenshot({ fullPage: true }), contentType: 'image/png' });
      const results = await new AxeBuilder({ page: tab })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      // One line per problem, with a few of the elements it was found on.
      const where = (n: (typeof results.violations)[number]['nodes'][number]) =>
        `${n.target.join(' ')}: ${(n.failureSummary ?? '').replace(/\s+/g, ' ')}`;
      const problems = results.violations.map(
        (v) => `${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 3).map(where).join(' | ')}`,
      );
      expect(problems).toEqual([]);
    });
  }
}

for (const theme of THEMES) {
  test(`open avatar menu and items in ${theme} have no accessibility problems`, async ({ page: tab }) => {
    const settings = { schemaVersion: 3, preferences: { theme, personaId: 'director' } };
    await tab.addInitScript((saved) => localStorage.setItem('rtw.settings', saved), JSON.stringify(settings));
    await tab.goto('/readiness?view=tree');
    await tab.getByTestId('items-toggle').first().click();
    await tab.getByRole('button', { name: /account, preferences and theme/ }).click();
    const results = await new AxeBuilder({ page: tab })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id} (${v.nodes.length}) ${v.nodes[0].target.join(' ')}`)).toEqual([]);
  });
}

for (const theme of THEMES) {
  test(`open Quick Links menu in ${theme} has no accessibility problems`, async ({ page: tab }) => {
    const settings = { schemaVersion: 3, preferences: { theme, personaId: 'director' } };
    await tab.addInitScript((saved) => localStorage.setItem('rtw.settings', saved), JSON.stringify(settings));
    await tab.goto('/readiness?view=tree');
    await tab.getByRole('button', { name: 'Quick Links' }).click();
    const results = await new AxeBuilder({ page: tab })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id} (${v.nodes.length}) ${v.nodes[0].target.join(' ')}`)).toEqual([]);
  });
}
