import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MockDataSource } from '../../../data';
import { ReadinessService } from '../../services/readiness-service';
import { ScreenService } from '../../services/screen-service';
import { SettingsService } from '../../services/settings-service';
import { DATA_SOURCE } from '../../services/tokens';
import { ViewerService } from '../../services/viewer-service';
import { loadAppState } from '../../testing';
import { Readiness } from './readiness';

@Component({ template: 'person page' })
class PersonStub {}

describe('Dashboard layout (side panel)', () => {
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
    TestBed.inject(ViewerService).setPersona('director');
  });

  const fakeOrg = () => (TestBed.inject(DATA_SOURCE) as MockDataSource).fakeOrg();
  const org = () => TestBed.inject(ReadinessService).result().org;
  const sapForeman = () => fakeOrg().scenarios.sapCrewForemanId;
  const toolForeman = () => fakeOrg().scenarios.toolCrewForemanId;

  async function start(url = '/readiness?issues=all') {
    const harness = await RouterTestingHarness.create(url);
    const el = () => harness.routeNativeElement as HTMLElement;
    const router = TestBed.inject(Router);
    const stable = () => harness.fixture.whenStable();
    const row = (id: string) => el().querySelector<HTMLElement>(`[role="treeitem"][data-id="${id}"]`)!;
    const panel = () => el().querySelector<HTMLElement>('[data-testid="person-panel"]');
    const panelPerson = () => panel()?.querySelector<HTMLElement>('[data-person]')?.dataset['person'];
    const params = () => router.parseUrl(router.url).queryParams;
    return { harness, el, router, stable, row, panel, panelPerson, params };
  }

  it('opens a clicked person in the panel and marks their row selected', async () => {
    const { row, stable, panel, panelPerson, params, router } = await start();
    expect(panel()).toBeNull();
    row(sapForeman()).click();
    await stable();
    expect(router.url.startsWith('/readiness')).toBe(true);
    expect(params()['person']).toBe(sapForeman());
    expect(panelPerson()).toBe(sapForeman());
    expect(row(sapForeman()).getAttribute('aria-selected')).toBe('true');
    expect(row(toolForeman()).getAttribute('aria-selected')).toBe('false');
  });

  it('opens with Enter and keeps focus in the tree', async () => {
    const { row, stable, panelPerson } = await start();
    row(toolForeman()).focus();
    row(toolForeman()).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await stable();
    expect(panelPerson()).toBe(toolForeman());
    expect((document.activeElement as HTMLElement).dataset['id']).toBe(toolForeman());
  });

  it('opens straight from a link, and ignores a person the viewer cannot see', async () => {
    const { panelPerson, harness, panel } = await start(`/readiness?issues=all&person=${toolForeman()}`);
    expect(panelPerson()).toBe(toolForeman());
    await harness.navigateByUrl('/readiness?issues=all&person=nobody');
    expect(panel()).toBeNull();
  });

  it('switches person without adding history entries', async () => {
    const { row, stable, panelPerson, router } = await start();
    const navigate = vi.spyOn(router, 'navigate');
    row(sapForeman()).click();
    await stable();
    row(toolForeman()).click();
    await stable();
    expect(panelPerson()).toBe(toolForeman());
    for (const call of navigate.mock.calls) expect(call[1]?.replaceUrl).toBe(true);
  });

  it('closes with the Close button or Escape and returns focus to the row', async () => {
    const { el, row, stable, panel, params } = await start(`/readiness?issues=all&person=${sapForeman()}`);
    el().querySelector<HTMLButtonElement>('[data-testid="close-panel"]')!.click();
    await stable();
    expect(panel()).toBeNull();
    expect(params()['person']).toBeUndefined();
    expect((document.activeElement as HTMLElement).dataset['id']).toBe(sapForeman());

    row(sapForeman()).click();
    await stable();
    panel()!.querySelector<HTMLElement>('rtw-category-tiles button:not([disabled])')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await stable();
    expect(panel()).toBeNull();
  });

  it('follows the manager chain inside the panel', async () => {
    const crew = org().childrenOf(toolForeman())[0];
    const { panel, panelPerson, stable } = await start(`/readiness?issues=all&person=${crew.id}`);
    panel()!.querySelector<HTMLElement>(`a[data-chain="${toolForeman()}"]`)!.click();
    await stable();
    expect(panelPerson()).toBe(toolForeman());
  });

  it('scopes the tree with "View the tree from" and keeps the panel open', async () => {
    const { panel, panelPerson, stable, params, el } = await start(`/readiness?issues=all&person=${toolForeman()}`);
    panel()!.querySelector<HTMLElement>('[data-testid="view-tree"]')!.click();
    await stable();
    expect(params()['sup']).toBe(toolForeman());
    expect(el().querySelector('[role="treeitem"]')!.getAttribute('data-id')).toBe(toolForeman());
    expect(panelPerson()).toBe(toolForeman());
  });

  it('keeps the panel through Clear filters', async () => {
    const { el, stable, panelPerson } = await start(`/readiness?issues=all&q=a&person=${toolForeman()}`);
    el().querySelector<HTMLButtonElement>('[data-testid="clear-filters"]')!.click();
    await stable();
    expect(panelPerson()).toBe(toolForeman());
  });

  it('has a link to the full page', async () => {
    const { panel } = await start(`/readiness?issues=all&person=${toolForeman()}`);
    expect(panel()!.querySelector('[data-testid="open-full-page"]')!.getAttribute('href')).toBe(`/person/${toolForeman()}`);
  });

  it('opens the full page on a narrow screen', async () => {
    TestBed.inject(ScreenService).wide.set(false);
    const { row, stable, router, panel } = await start(`/readiness?issues=all&person=${toolForeman()}`);
    expect(panel()).toBeNull();
    row(sapForeman()).click();
    await stable();
    expect(router.url).toBe(`/person/${sapForeman()}`);
  });

  it('never shows the panel in the drill-down layout', async () => {
    TestBed.inject(SettingsService).updatePreferences({ layout: 'drilldown' });
    const { row, stable, router, panel } = await start(`/readiness?issues=all&person=${toolForeman()}`);
    expect(panel()).toBeNull();
    row(sapForeman()).click();
    await stable();
    expect(router.url).toBe(`/person/${sapForeman()}`);
  });
});
