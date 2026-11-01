import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MockDataSource } from '../../../data';
import { ReadinessService } from '../../services/readiness-service';
import { SettingsService } from '../../services/settings-service';
import { DATA_SOURCE } from '../../services/tokens';
import { ViewerService } from '../../services/viewer-service';
import { loadAppState } from '../../testing';
import { Readiness } from '../readiness/readiness';
import { PersonPage } from './person-page';

describe('PersonPage (drill-down)', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'readiness', component: Readiness },
            { path: 'person/:id', component: PersonPage },
          ],
          withComponentInputBinding(),
        ),
      ],
    });
    await loadAppState();
    TestBed.inject(ViewerService).setPersona('director');
    TestBed.inject(SettingsService).updatePreferences({ layout: 'drilldown' });
  });

  const fakeOrg = () => (TestBed.inject(DATA_SOURCE) as MockDataSource).fakeOrg();
  const org = () => TestBed.inject(ReadinessService).result().org;

  async function start(url: string) {
    const harness = await RouterTestingHarness.create(url);
    const el = () => harness.routeNativeElement as HTMLElement;
    const router = TestBed.inject(Router);
    const click = async (sel: string) => {
      el().querySelector<HTMLElement>(sel)!.click();
      await harness.fixture.whenStable();
    };
    return { harness, el, router, click };
  }

  it('opens from the tree, and Back to readiness restores the filters and expand state', async () => {
    const sapForeman = fakeOrg().scenarios.sapCrewForemanId;
    const url = `/readiness?issues=all&q=${encodeURIComponent(org().get(sapForeman)!.name)}`;
    const { harness, el, router, click } = await start(url);
    const rowsBefore = el().querySelectorAll('[data-testid="tree-row"]').length;

    await click(`[data-testid="tree-row"][data-id="${sapForeman}"] [data-testid="details"]`);
    expect(router.url).toBe(`/person/${sapForeman}`);
    expect(el().querySelector('[data-testid="person-name"]')!.textContent!.trim()).toBe(
      org().get(sapForeman)!.name,
    );

    await click('[data-testid="back"]');
    await harness.fixture.whenStable();
    expect(router.url).toBe(url);
    expect(el().querySelectorAll('[data-testid="tree-row"]').length).toBe(rowsBefore);
  });

  it('keeps the way back after following the manager chain', async () => {
    const person = org().childrenOf(fakeOrg().scenarios.toolCrewForemanId)[0];
    const { harness, el, router, click } = await start('/readiness?view=list&issues=all');
    await harness.navigateByUrl(`/person/${person.id}`);
    const manager = org().get(person.managerId!)!;

    await click(`a[data-chain="${manager.id}"]`);
    expect(router.url).toBe(`/person/${manager.id}`);
    expect(el().querySelector('[data-testid="back"]')!.getAttribute('href')).toBe('/readiness?view=list&issues=all');
  });

  it('names the page after the person', async () => {
    const person = fakeOrg().people[3];
    await start(`/person/${person.id}`);
    expect(TestBed.inject(Title).getTitle()).toBe(`${person.name} · Ready to Work`);
  });

  it('says so for an unknown id or someone outside the viewer subtree, with a way back', async () => {
    const { harness, el } = await start('/person/nobody');
    expect(el().querySelector('[data-testid="not-available"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="back"]')!.getAttribute('href')).toBe('/readiness');

    TestBed.inject(ViewerService).setPersona('foreman');
    await harness.navigateByUrl(`/person/${fakeOrg().people[0].id}`);
    expect(el().querySelector('[data-testid="not-available"]')).not.toBeNull();
  });
});
