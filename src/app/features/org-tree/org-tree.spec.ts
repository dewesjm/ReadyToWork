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
import { ReadinessQueryService } from '../readiness/readiness-query-service';
import { TreeModel } from '../readiness/tree-model';

@Component({ template: 'person' })
class PersonStub {}

describe('OrgTree', () => {
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
    TestBed.inject(SettingsService).updatePreferences({ layout: 'drilldown' });
  });

  const fakeOrg = () => (TestBed.inject(DATA_SOURCE) as MockDataSource).fakeOrg();
  const readiness = () => TestBed.inject(ReadinessService).result();

  async function open(url: string, persona = 'director') {
    TestBed.inject(ViewerService).setPersona(persona);
    const harness = await RouterTestingHarness.create(url);
    const el = () => harness.routeNativeElement as HTMLElement;
    const injector = harness.routeDebugElement!.injector;
    const stable = () => harness.fixture.whenStable();
    const rows = () => [...el().querySelectorAll<HTMLElement>('[role="treeitem"]')];
    const row = (id: string) => el().querySelector<HTMLElement>(`[role="treeitem"][data-id="${id}"]`);
    return {
      harness,
      el,
      stable,
      rows,
      row,
      query: injector.get(ReadinessQueryService),
      tree: injector.get(TreeModel),
      router: TestBed.inject(Router),
    };
  }

  it('renders the whole fake org with Issues only off and everything expanded', async () => {
    const { rows, tree, stable } = await open('/readiness?issues=all');
    tree.expandAll();
    await stable();
    expect(rows().length).toBe(fakeOrg().people.length);
    expect(rows()[0].getAttribute('aria-level')).toBe('1');
  });

  it('opens down to the crew leads at first, with crews collapsed', async () => {
    const { rows } = await open('/readiness?issues=all');
    const org = readiness().org;
    const shown = rows().map((r) => r.dataset['id']!);
    const leads = fakeOrg().people.filter(
      (p) => org.childrenOf(p.id).length > 0 && org.childrenOf(p.id).every((k) => org.childrenOf(k.id).length === 0),
    );
    expect(leads.length).toBeGreaterThan(10);
    for (const lead of leads) {
      expect(shown).toContain(lead.id);
      expect(shown).not.toContain(org.childrenOf(lead.id)[0].id);
    }
  });

  it('shows only people with issues plus their manager path, all open', async () => {
    const { rows, query } = await open('/readiness');
    const statuses = readiness().statusByPerson;
    const own = rows().filter((r) => !r.dataset['context']);
    const context = rows().filter((r) => r.dataset['context']);
    expect(own.length).toBe(query.result().shownCount);
    expect(rows().length).toBe(query.result().rows.length);
    for (const r of own) expect(statuses.get(r.dataset['id']!)).not.toBe('ready');
    expect(context.length).toBeGreaterThan(0);
    expect(context[0].className).toContain('opacity-60');
  });

  it('shows the planted tool crew in red for the Foreman', async () => {
    const { row, rows } = await open('/readiness', 'foreman');
    const foremanId = fakeOrg().scenarios.toolCrewForemanId;
    expect(rows()[0].dataset['id']).toBe(foremanId);
    expect(row(foremanId)!.querySelector('rtw-rollup-badge [data-status="not-ready"]')).not.toBeNull();
    expect(rows().some((r) => r.querySelector('rtw-category-chip [data-category="tool"][data-status="not-ready"]'))).toBe(true);
  });

  it('shows the SAP crew yellow for the director', async () => {
    const { row } = await open('/readiness?issues=all');
    const { sapCrewForemanId } = fakeOrg().scenarios;
    const rollups = readiness().rollups;
    expect(rollups.get(sapCrewForemanId)!.worst).toBe('expiring');
    expect(row(sapCrewForemanId)!.querySelector('rtw-rollup-badge [data-status="expiring"]')).not.toBeNull();
  });

  it('expands the path to a keyword match and highlights it', async () => {
    const crew = fakeOrg().people.at(-1)!;
    const { row, el } = await open(`/readiness?issues=all&q=${encodeURIComponent(crew.name)}`);
    const match = row(crew.id)!;
    expect(match).not.toBeNull();
    expect(match.querySelector('[data-testid="name"] mark')!.textContent).toBe(crew.name);
    expect(el().querySelectorAll('[role="treeitem"]:not([data-context])').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the employee ID when the keyword matches it', async () => {
    const crew = fakeOrg().people.at(-1)!;
    const { row } = await open(`/readiness?issues=all&q=${crew.employeeId}`);
    expect(row(crew.id)!.querySelector('[data-testid="employee-id"] mark')!.textContent).toBe(crew.employeeId);
  });

  it('expands and collapses all, and toggles a row when it is clicked', async () => {
    const { rows, tree, stable, row, router } = await open('/readiness?issues=all');
    tree.collapseAll();
    await stable();
    expect(rows().length).toBe(1);
    const rootId = rows()[0].dataset['id']!;
    expect(rows()[0].getAttribute('aria-expanded')).toBe('false');

    row(rootId)!.click();
    await stable();
    expect(rows().length).toBe(1 + readiness().org.childrenOf(rootId).length);
    expect(router.url).toBe('/readiness?issues=all'); // the row click doesn't open the person

    row(rootId)!.click();
    await stable();
    expect(rows().length).toBe(1);

    tree.expandAll();
    await stable();
    expect(rows().length).toBe(fakeOrg().people.length);
  });

  it('shows true roll-up counts for managers', async () => {
    const { row } = await open('/readiness?issues=all');
    const directorId = fakeOrg().people[0].id;
    const rollup = readiness().rollups.get(directorId)!;
    const text = row(directorId)!.querySelector('rtw-rollup-badge')!.textContent!.replace(/\s+/g, ' ');
    expect(text).toContain(`${rollup.total} people:`);
    expect(text).toContain(`${rollup.counts.ready} ready`);
  });

  it('shows an empty state with Clear filters when nothing matches', async () => {
    const { el, stable, rows } = await open('/readiness?q=zzzz-nobody');
    expect(el().querySelector('[data-testid="empty"]')!.textContent).toContain('No one matches these filters');
    [...el().querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Clear filters' && b.closest('[data-testid="empty"]'))!.click();
    await stable();
    expect(rows().length).toBeGreaterThan(0);
  });

  it('opens a person with the Details button, without toggling the row', async () => {
    const { row, stable, router } = await open('/readiness');
    const id = fakeOrg().scenarios.sapCrewForemanId;
    const expanded = row(id)!.getAttribute('aria-expanded');
    row(id)!.querySelector<HTMLButtonElement>('[data-testid="details"]')!.click();
    await stable();
    expect(router.url).toBe(`/person/${id}`);
    expect(readiness().org.childrenOf(id).length).toBeGreaterThan(0);
    expect(expanded).not.toBeNull();
  });

  it('does not open a person with no one under them when their row is clicked', async () => {
    const { rows, row, tree, stable, router } = await open('/readiness?issues=all');
    tree.expandAll();
    await stable();
    const leaf = rows().find((r) => !r.hasAttribute('aria-expanded'))!.dataset['id']!;
    row(leaf)!.click();
    await stable();
    expect(router.url).toBe('/readiness?issues=all'); // only the Details button opens a person
  });

  describe("a person's items in place", () => {
    const items = (el: HTMLElement, id: string) =>
      el.querySelector<HTMLElement>(`[data-testid="person-items"][data-person="${id}"]`);

    it('opens issues under the row from the chips, shows all on request, and closes again', async () => {
      const { el, row, tree, stable, router } = await open('/readiness?issues=all');
      tree.expandAll();
      await stable();
      const { checksByPerson } = readiness();
      const id = fakeOrg().people.find(
        (p) =>
          readiness().org.childrenOf(p.id).length === 0 &&
          (checksByPerson.get(p.id) ?? []).some((c) => c.status !== 'ready'),
      )!.id;
      const checks = checksByPerson.get(id)!;
      const toggle = () => row(id)!.querySelector<HTMLButtonElement>('[data-testid="items-toggle"]')!;
      expect(toggle().getAttribute('aria-expanded')).toBe('false');
      expect(items(el(), id)).toBeNull();

      toggle().click();
      await stable();
      expect(router.url).toBe('/readiness?issues=all'); // it doesn't open the person
      expect(toggle().getAttribute('aria-expanded')).toBe('true');
      const shown = () => [...items(el(), id)!.querySelectorAll('[data-item]')];
      expect(shown().length).toBe(checks.filter((c) => c.status !== 'ready').length);
      expect(shown()[0].querySelector('rtw-status-badge [data-status]')!.getAttribute('data-status')).not.toBe('ready');

      items(el(), id)!.querySelector<HTMLButtonElement>('[data-testid="show-all-items"]')!.click();
      await stable();
      expect(shown().length).toBe(checks.length);

      toggle().click();
      await stable();
      expect(items(el(), id)).toBeNull();
    });

    it("opens a manager's own items without opening or closing their team", async () => {
      const { el, row, tree, stable } = await open('/readiness?issues=all');
      const manager = fakeOrg().scenarios.toolCrewForemanId;
      tree.expandAll();
      await stable();
      const expandedBefore = row(manager)!.getAttribute('aria-expanded');
      row(manager)!.querySelector<HTMLButtonElement>('[data-testid="items-toggle"]')!.click();
      await stable();
      expect(row(manager)!.getAttribute('aria-expanded')).toBe(expandedBefore);
      expect(items(el(), manager)).not.toBeNull();
    });
  });
});
