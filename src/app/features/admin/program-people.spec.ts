import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MockDataSource } from '../../../data';
import { CRANE_PROGRAM_ID } from '../../../data/mock/fake-catalog';
import { routes } from '../../app.routes';
import { ReadinessService } from '../../services/readiness-service';
import { SettingsService } from '../../services/settings-service';
import { DATA_SOURCE } from '../../services/tokens';
import { ViewerService } from '../../services/viewer-service';
import { loadAppState, stubDialogs } from '../../testing';
import { PEOPLE_SEARCH_LIMIT } from './program-people';

describe('Program people', () => {
  beforeEach(async () => {
    stubDialogs();
    TestBed.configureTestingModule({ providers: [provideRouter(routes, withComponentInputBinding())] });
    await loadAppState();
    TestBed.inject(ViewerService).setPersona('admin');
  });

  const fake = () => (TestBed.inject(DATA_SOURCE) as MockDataSource).fakeOrg();
  const readiness = () => TestBed.inject(ReadinessService).result();
  const onCrane = (id: string) =>
    TestBed.inject(SettingsService).settings().assignments[id]?.includes(CRANE_PROGRAM_ID) ?? false;

  async function open() {
    const harness = await RouterTestingHarness.create(`/admin/programs/${CRANE_PROGRAM_ID}`);
    const el = () => harness.routeNativeElement as HTMLElement;
    const $ = <T extends Element = HTMLElement>(sel: string) => el().querySelector(sel) as T;
    const stable = () => harness.fixture.whenStable();
    const search = async (text: string) => {
      const input = $<HTMLInputElement>('[data-testid="people-search"]');
      input.value = text;
      input.dispatchEvent(new Event('input'));
      await stable();
    };
    const listed = () => [...el().querySelectorAll<HTMLElement>('[data-testid="people-list"] [data-person]')].map((li) => li.dataset['person']);
    return { el, $, stable, search, listed };
  }

  it('lists the people on the program in org order, with their status for it', async () => {
    const { $, listed } = await open();
    const ids = Object.keys(TestBed.inject(SettingsService).settings().assignments).filter(onCrane);
    expect([...listed()].sort()).toEqual([...ids].sort());
    expect($('[data-testid="people-count"]').textContent).toContain(`${ids.length} people on this program`);
    const first = $(`[data-person="${listed()[0]}"]`);
    expect(first.querySelector('a')?.getAttribute('href')).toBe(`/person/${listed()[0]}`);
    expect(first.querySelector('rtw-status-badge')).not.toBeNull();
  });

  it('adds the crane candidate by search, and they turn red at once', async () => {
    const candidate = readiness().org.get(fake().scenarios.craneCandidateId)!;
    expect(readiness().statusByPerson.get(candidate.id)).toBe('ready');
    const { $, search, stable, listed } = await open();

    await search(candidate.employeeId);
    const match = $(`[data-match="${candidate.id}"]`);
    expect(match.querySelector('mark')?.textContent).toBe(candidate.employeeId);
    match.querySelector<HTMLButtonElement>('button')!.click();
    await stable();

    expect(onCrane(candidate.id)).toBe(true);
    expect(readiness().statusByPerson.get(candidate.id)).toBe('not-ready');
    expect(listed()).toContain(candidate.id);
    expect($(`[data-person="${candidate.id}"] [data-status]`).getAttribute('data-status')).toBe('not-ready');
    // Already on it, so no longer offered.
    expect($(`[data-match="${candidate.id}"]`)).toBeNull();
    expect($('[data-testid="people-matches"]').textContent).toContain(`No one else matches "${candidate.employeeId}"`);
  });

  it('shows at most a few matches and says how many there are', async () => {
    const { el, $, search } = await open();
    await search('a');
    expect(el().querySelectorAll('[data-match]').length).toBe(PEOPLE_SEARCH_LIMIT);
    expect($('[data-testid="people-matches"]').textContent).toMatch(/Showing 8 of \d+ matches/);
  });

  it('adds everyone under a supervisor once, leaving the supervisor off', async () => {
    const { $, stable } = await open();
    const foreman = fake().scenarios.toolCrewForemanId;
    const select = $<HTMLSelectElement>('[data-testid="people-supervisor"]');
    // Nothing chosen at first, so one click can't add the whole org.
    expect(select.value).toBe('');
    expect($<HTMLButtonElement>('[data-testid="add-subtree"]').disabled).toBe(true);
    select.value = foreman;
    select.dispatchEvent(new Event('change'));
    await stable();

    const crew = readiness().org.subtree(foreman, false);
    const toAdd = crew.filter((p) => !onCrane(p.id));
    const button = $<HTMLButtonElement>('[data-testid="add-subtree"]');
    expect(button.textContent?.trim()).toBe(`Add ${toAdd.length} people`);
    button.click();
    await stable();

    expect(crew.every((p) => onCrane(p.id))).toBe(true);
    expect(onCrane(foreman)).toBe(false);
    expect(button.disabled).toBe(true);
    expect(button.textContent?.trim()).toBe('All on it');
  });

  it('removes one person', async () => {
    const { $, stable, listed } = await open();
    const id = listed()[0]!;
    $<HTMLButtonElement>(`[data-person="${id}"] button`).click();
    await stable();
    expect(onCrane(id)).toBe(false);
    expect(listed()).not.toContain(id);
    expect(readiness().checksByPerson.get(id)!.some((c) => c.requiredBy.includes(CRANE_PROGRAM_ID))).toBe(false);
  });
});
