import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { DEFAULT_CONFIG } from '../../../core';
import { MockDataSource } from '../../../data';
import { ReadinessService } from '../../services/readiness-service';
import { SettingsService } from '../../services/settings-service';
import { DATA_SOURCE } from '../../services/tokens';
import { ViewerService } from '../../services/viewer-service';
import { loadAppState } from '../../testing';
import { Readiness } from '../readiness/readiness';
import { READINESS_PAGE_CONFIG } from '../readiness/readiness-page-config';
import { ReadinessQueryService } from '../readiness/readiness-query-service';

@Component({ template: 'person page' })
class PersonStub {}

describe('IssuesList (list view)', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'readiness', component: Readiness },
          { path: 'person/:id', component: PersonStub },
        ]),
      ],
    });
    await loadAppState();
  });

  const fakeOrg = () => (TestBed.inject(DATA_SOURCE) as MockDataSource).fakeOrg();
  const org = () => TestBed.inject(ReadinessService).result().org;

  async function open(url: string, persona = 'director') {
    TestBed.inject(ViewerService).setPersona(persona);
    const harness = await RouterTestingHarness.create(url);
    const el = () => harness.routeNativeElement as HTMLElement;
    const rows = () => [...el().querySelectorAll<HTMLElement>('[data-testid="person-list"] tbody tr')];
    const headers = () => [...el().querySelectorAll('[data-testid="person-list"] th')].map((h) => h.textContent!.trim());
    const query = harness.routeDebugElement!.injector.get(ReadinessQueryService);
    const stable = () => harness.fixture.whenStable();
    return { harness, el, rows, headers, query, stable, router: TestBed.inject(Router) };
  }

  const categoryLabels = DEFAULT_CONFIG.categories.map((c) => c.label);

  it('shows one row per person with a column per category, worst first', async () => {
    const { rows, headers, query } = await open('/readiness?view=list', 'foreman');
    expect(headers()).toEqual(['Person', 'Manager', ...categoryLabels, 'Overall']);
    const listed = query.listResult().rows;
    expect(rows().length).toBe(listed.length);
    expect(new Set(rows().map((r) => r.dataset['key'])).size).toBe(rows().length);
    // The Foreman's tool crew: expired calibrations, so the first row is not ready on Tools.
    const tools = rows()[0].querySelector('td[data-category="tool"] rtw-status-badge .badge')!;
    expect(tools.className).toContain('badge-error');
    expect(tools.textContent).toContain('Not ready');
    expect(rows()[0].querySelector('td[data-category="tool"]')!.textContent).toContain('overdue');
  });

  it('shows ready categories as green cells and empty ones as a dash', async () => {
    const { rows, query } = await open('/readiness?view=list', 'foreman');
    const statuses = rows().flatMap((r) =>
      [...r.querySelectorAll('td[data-category] [data-status]')].map((b) => b.getAttribute('data-status')),
    );
    expect(statuses).toContain('ready');
    const empty = query.listResult().rows.flatMap((r) => r.cells).filter((c) => c === null).length;
    const dashes = rows().flatMap((r) => [...r.querySelectorAll('td[data-category]')]).filter(
      (td) => td.textContent!.trim() === '—',
    ).length;
    expect(dashes).toBe(empty);
  });

  it('shows only the picked categories as columns', async () => {
    const { headers } = await open('/readiness?view=list&cat=tool,training', 'foreman');
    expect(headers()).toEqual(['Person', 'Manager', 'Training', 'Tools', 'Overall']);
  });

  it('shows 100 rows at a time with "Show more"', async () => {
    const { rows, el, stable, query } = await open('/readiness?view=list&issues=all');
    const total = query.listResult().rows.length;
    const page = READINESS_PAGE_CONFIG.listPageSize;
    expect(total).toBeGreaterThan(page);
    expect(rows().length).toBe(page);
    expect(el().querySelector('[data-testid="list-more-text"]')!.textContent).toBe(
      `Showing ${page} of ${total.toLocaleString('en-US')} people`,
    );
    el().querySelector<HTMLButtonElement>('[data-testid="show-more"]')!.click();
    await stable();
    expect(rows().length).toBe(Math.min(total, 2 * page));
  }, 15_000); // renders 200+ rows; slow when the whole suite runs at once

  it('highlights a keyword match on the person', async () => {
    const foreman = org().get(fakeOrg().scenarios.toolCrewForemanId)!;
    const { rows } = await open(`/readiness?view=list&issues=all&q=${encodeURIComponent(foreman.name)}`);
    expect(rows().length).toBe(1);
    expect(rows()[0].querySelector('[data-testid="open-person"] mark')!.textContent).toBe(foreman.name);
  });

  it('opens a person as a page in the drill-down layout, by click or Enter on the name', async () => {
    TestBed.inject(SettingsService).updatePreferences({ layout: 'drilldown' });
    const { rows, router, stable } = await open('/readiness?view=list', 'foreman');
    const id = rows()[0].dataset['key']!;
    rows()[0].querySelector<HTMLButtonElement>('[data-testid="open-person"]')!.click();
    await stable();
    expect(router.url).toBe(`/person/${id}`);
  });

  it('puts focus back on the same row after Back', async () => {
    TestBed.inject(SettingsService).updatePreferences({ layout: 'drilldown' });
    const { harness, rows, stable } = await open('/readiness?view=list', 'foreman');
    const key = rows()[2].dataset['key']!;
    rows()[2].click();
    await stable();
    await harness.navigateByUrl('/readiness?view=list');
    await stable();
    expect((document.activeElement as HTMLElement).closest('tr')?.dataset['key']).toBe(key);
  });

  it('opens the side panel in the dashboard, highlights that person and shows icons only', async () => {
    const { rows, el, stable, headers, router } = await open('/readiness?view=list', 'foreman');
    const personId = rows()[0].dataset['key']!;
    rows()[0].click();
    await stable();
    expect(router.url).toContain(`person=${personId}`);
    expect(el().querySelector('[data-testid="person-panel"] [data-person]')!.getAttribute('data-person')).toBe(personId);
    // No Manager column; category labels stay for screen readers only.
    expect(headers()).toEqual(['Person', ...categoryLabels, 'Overall']);
    const badge = rows()[0].querySelector<HTMLElement>('td[data-category="tool"] .badge')!;
    expect(badge.title).toBe('Not ready');
    expect(badge.querySelector('.sr-only')!.textContent!.trim()).toBe('Not ready');
    expect(rows().filter((r) => r.dataset['selected']).map((r) => r.dataset['key'])).toEqual([personId]);
  });

  it('shows the shared empty state', async () => {
    const { el } = await open('/readiness?view=list&q=zzzz-nobody');
    expect(el().querySelector('[data-testid="empty"]')!.textContent).toContain('No one matches these filters');
  });

  it("opens a person's issues under their row without opening the person", async () => {
    const { rows, el, stable, router, query } = await open('/readiness?view=list', 'foreman');
    const id = rows()[0].dataset['key']!;
    const toggle = rows()[0].querySelector<HTMLButtonElement>('[data-testid="items-toggle"]')!;
    const issues = TestBed.inject(ReadinessService)
      .result()
      .checksByPerson.get(id)!
      .filter((c) => c.status !== 'ready').length;
    expect(toggle.querySelector('[data-testid="items-label"]')!.textContent!.trim()).toBe(`${issues} ${issues === 1 ? 'issue' : 'issues'}`);

    toggle.click();
    await stable();
    expect(router.url).toBe('/readiness?view=list');
    const itemsRow = el().querySelector<HTMLTableRowElement>(`[data-testid="person-list"] tr[data-items-for="${id}"]`)!;
    expect(itemsRow.cells[0].colSpan).toBe(query.listResult().columns.length + 3);
    expect(itemsRow.querySelectorAll('[data-item]').length).toBe(issues);
    // Item rows aren't people: the people rows still match the list.
    expect(rows().filter((r) => r.dataset['key']).length).toBe(query.listResult().rows.length);
  });

  it('has no items toggle for people with no issues, in the table or the cards', async () => {
    const { rows, el } = await open('/readiness?view=list&issues=all');
    const { checksByPerson } = TestBed.inject(ReadinessService).result();
    const hasIssues = (id: string) => (checksByPerson.get(id) ?? []).some((c) => c.status !== 'ready');
    const cards = [...el().querySelectorAll<HTMLElement>('[data-testid="person-list-cards"] li')];
    const people = [...rows(), ...cards];
    expect(people.some((r) => !hasIssues(r.dataset['key']!))).toBe(true);
    for (const r of people) {
      expect(!!r.querySelector('[data-testid="items-toggle"]')).toBe(hasIssues(r.dataset['key']!));
    }
  });
});
