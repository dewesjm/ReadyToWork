import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MockDataSource } from '../../../data';
import { CRANE_PROGRAM_ID } from '../../../data/mock/fake-catalog';
import { ChangelogPage } from '../../features/changelog/changelog-page';
import { Readiness } from '../../features/readiness/readiness';
import { ReadinessQueryService } from '../../features/readiness/readiness-query-service';
import { SettingsService } from '../../services/settings-service';
import { DATA_SOURCE } from '../../services/tokens';
import { ThemeService } from '../../services/theme-service';
import { ViewerService } from '../../services/viewer-service';
import { loadAppState, reloadAppState } from '../../testing';
import { ALL_THEMES } from '../themes';
import { AvatarMenu } from './avatar-menu';

describe('AvatarMenu', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'readiness', component: Readiness },
          { path: 'changelog', component: ChangelogPage },
        ]),
      ],
    });
    await loadAppState();
  });

  async function setup() {
    const fixture = TestBed.createComponent(AvatarMenu);
    await fixture.whenStable();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    // The panel opens in the CDK overlay container at the end of the page.
    const el = document.body;
    return { fixture, el, toggle };
  }

  it('shows initials and opens the theme list on click', async () => {
    const { fixture, el, toggle } = await setup();
    const viewer = TestBed.inject(ViewerService).viewer()!;
    expect(toggle.textContent?.trim()).toBe(TestBed.inject(ViewerService).initials());
    expect(toggle.textContent?.trim()).toMatch(/^[A-Z]{2}$/);
    expect(el.querySelector('[role="radiogroup"]')).toBeNull();

    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelectorAll('[role="radio"]').length).toBe(ALL_THEMES.length);
    expect(el.textContent).toContain(viewer.name);
  });

  it('picks a theme and marks it checked', async () => {
    const { fixture, el, toggle } = await setup();
    toggle.click();
    await fixture.whenStable();

    el.querySelector<HTMLButtonElement>('[data-theme-option="nord"]')!.click();
    await fixture.whenStable();
    expect(TestBed.inject(ThemeService).theme()).toBe('nord');
    expect(el.querySelector('[data-theme-option="nord"]')?.getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('closes on a click outside', async () => {
    const { fixture, el, toggle } = await setup();
    toggle.click();
    await fixture.whenStable();

    document.querySelector<HTMLElement>('.cdk-overlay-backdrop')!.click();
    await fixture.whenStable();
    expect(el.querySelector('[role="radiogroup"]')).toBeNull();
  });

  it('switches the persona with View as, and the saved choice survives a reload', async () => {
    const { fixture, el, toggle } = await setup();
    toggle.click();
    await fixture.whenStable();
    const select = el.querySelector<HTMLSelectElement>('[data-testid="persona"]')!;
    const personas = TestBed.inject(ViewerService);
    expect(select.value).toBe('superintendent');
    expect([...select.options].map((o) => o.value)).toEqual(['foreman', 'general-foreman', 'superintendent', 'director', 'admin']);

    select.value = 'admin';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(personas.isAdmin()).toBe(true);
    expect(toggle.textContent?.trim()).toBe(personas.initials());

    TestBed.resetTestingModule();
    await reloadAppState();
    expect(TestBed.inject(ViewerService).persona()?.id).toBe('admin');
  });

  async function openPreferences() {
    TestBed.inject(ViewerService).setPersona('director');
    const { fixture, el, toggle } = await setup();
    toggle.click();
    await fixture.whenStable();
    const select = (id: string) => el.querySelector<HTMLSelectElement>(`[data-testid="${id}"]`)!;
    const choose = async (id: string, value: string) => {
      select(id).value = value;
      select(id).dispatchEvent(new Event('change'));
      await fixture.whenStable();
    };
    return { select, choose };
  }

  it('saves the default supervisor and program, and the viewer as null', async () => {
    const { select, choose } = await openPreferences();
    const settings = TestBed.inject(SettingsService);
    const director = TestBed.inject(ViewerService).viewer()!;
    expect(select('default-supervisor').value).toBe(director.personId);
    expect(select('default-supervisor').options[0].textContent).toBe(`You (${director.name})`);
    expect(select('default-program').value).toBe('');

    const manager = select('default-supervisor').options[1].value;
    await choose('default-supervisor', manager);
    await choose('default-program', CRANE_PROGRAM_ID);
    expect(settings.preferences().defaultSupervisorId).toBe(manager);
    expect(settings.preferences().defaultProgramId).toBe(CRANE_PROGRAM_ID);

    await choose('default-supervisor', director.personId);
    await choose('default-program', '');
    expect(settings.preferences().defaultSupervisorId).toBeNull();
    expect(settings.preferences().defaultProgramId).toBeNull();
  });

  it('changes what the Readiness page shows with no URL parameters', async () => {
    const { choose } = await openPreferences();
    const sapForeman = (TestBed.inject(DATA_SOURCE) as MockDataSource).fakeOrg().scenarios.sapCrewForemanId;
    await choose('default-supervisor', sapForeman);

    const harness = await RouterTestingHarness.create('/readiness');
    const query = harness.routeDebugElement!.injector.get(ReadinessQueryService);
    expect(query.supervisorId()).toBe(sapForeman);
    expect(query.result().rows[0].person.id).toBe(sapForeman);
  });

  it('switches the layout, which changes where Details opens a person and survives a reload', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'readiness', component: Readiness },
          { path: 'person/:id', component: AvatarMenu },
        ]),
      ],
    });
    await loadAppState();
    const { select, choose } = await openPreferences();
    expect(select('layout').value).toBe('dashboard');
    await choose('layout', 'drilldown');
    expect(TestBed.inject(SettingsService).preferences().layout).toBe('drilldown');

    const harness = await RouterTestingHarness.create('/readiness?view=tree');
    const row = (harness.routeNativeElement as HTMLElement).querySelector<HTMLElement>('[data-testid="tree-row"]')!;
    row.querySelector<HTMLButtonElement>('[data-testid="details"]')!.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe(`/person/${row.dataset['id']}`);

    // The choice is saved: a fresh app load reads it back.
    TestBed.resetTestingModule();
    await TestBed.inject(SettingsService).load();
    expect(TestBed.inject(SettingsService).preferences().layout).toBe('drilldown');
  });

});
