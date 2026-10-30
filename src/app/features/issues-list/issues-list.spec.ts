import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
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
    const rows = () => [...el().querySelectorAll<HTMLElement>('[data-testid="check-list"] tbody tr')];
    const headers = () => [...el().querySelectorAll('[data-testid="check-list"] th')].map((h) => h.textContent!.trim());
    const query = harness.routeDebugElement!.injector.get(ReadinessQueryService);
    const stable = () => harness.fixture.whenStable();
    return { harness, el, rows, headers, query, stable, router: TestBed.inject(Router) };
  }

  it('shows the planned columns, soonest first, with status as color, icon and text', async () => {
    const { rows, headers, query } = await open('/readiness?view=list', 'foreman');
    expect(headers()).toEqual(['Person', 'Manager', 'Category', 'Item', 'Status', 'Due', 'Days left']);
    const listed = query.listResult().rows;
    expect(rows().length).toBe(listed.length);
    // The Foreman's tool crew: expired calibrations at the top.
    expect(rows()[0].textContent).toContain('Tools');
    const badge = rows()[0].querySelector('rtw-status-badge .badge')!;
    expect(badge.className).toContain('badge-error');
    expect(badge.textContent).toContain('Not ready');
    expect(rows()[0].textContent).toContain('overdue');
  });

  it('lists ready checks too with Issues only off', async () => {
    const { rows, query } = await open('/readiness?view=list&issues=all', 'foreman');
    const statuses = query.listResult().rows.map((r) => r.check.status);
    expect(statuses).toContain('ready');
    expect(rows().some((r) => r.textContent!.includes('Ready'))).toBe(true);
  });

  it('shows 100 rows at a time with "Show more"', async () => {
    const { rows, el, stable, query } = await open('/readiness?view=list&issues=all');
    const total = query.listResult().rows.length;
    const page = READINESS_PAGE_CONFIG.listPageSize;
    expect(total).toBeGreaterThan(2 * page);
    expect(rows().length).toBe(page);
    expect(el().querySelector('[data-testid="list-more-text"]')!.textContent).toBe(
      `Showing ${page} of ${total.toLocaleString('en-US')} checks`,
    );
    el().querySelector<HTMLButtonElement>('[data-testid="show-more"]')!.click();
    await stable();
    expect(rows().length).toBe(2 * page);
  });

  it('highlights a keyword match on the person, keeping all their checks', async () => {
    const foreman = org().get(fakeOrg().scenarios.toolCrewForemanId)!;
    const { rows } = await open(`/readiness?view=list&issues=all&q=${encodeURIComponent(foreman.name)}`);
    expect(rows().length).toBeGreaterThan(1);
    expect(rows()[0].querySelector('[data-testid="open-person"] mark')!.textContent).toBe(foreman.name);
  });

  it('highlights a keyword match on the item name', async () => {
    const { rows } = await open('/readiness?view=list&issues=all&q=multimeter');
    expect(rows().length).toBeGreaterThan(0);
    for (const r of rows()) {
      expect(r.querySelectorAll('td')[3].querySelector('mark')!.textContent!.toLowerCase()).toBe('multimeter');
    }
  });

  it('opens a person as a page in the drill-down layout, by click or Enter on the name', async () => {
    TestBed.inject(SettingsService).updatePreferences({ layout: 'drilldown' });
    const { rows, router, stable } = await open('/readiness?view=list', 'foreman');
    const key = rows()[0].dataset['key']!;
    rows()[0].querySelector<HTMLButtonElement>('[data-testid="open-person"]')!.click();
    await stable();
    expect(router.url).toBe(`/person/${key.split('|')[0]}`);
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

  it('opens the side panel in the dashboard, highlights that person and folds columns', async () => {
    const { rows, el, stable, headers, router } = await open('/readiness?view=list', 'foreman');
    const personId = rows()[0].dataset['key']!.split('|')[0];
    rows()[0].click();
    await stable();
    expect(router.url).toContain(`person=${personId}`);
    expect(el().querySelector('[data-testid="person-panel"] [data-person]')!.getAttribute('data-person')).toBe(personId);
    expect(headers()).toEqual(['Person', 'Item', 'Status', 'Due', 'Days left']);
    const selected = rows().filter((r) => r.dataset['selected']);
    expect(selected.length).toBeGreaterThan(0);
    expect(selected.every((r) => r.dataset['key']!.startsWith(`${personId}|`))).toBe(true);
  });

  it('shows the shared empty state', async () => {
    const { el } = await open('/readiness?view=list&q=zzzz-nobody');
    expect(el().querySelector('[data-testid="empty"]')!.textContent).toContain('No one matches these filters');
  });
});
