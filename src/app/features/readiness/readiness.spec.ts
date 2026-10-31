import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MockDataSource } from '../../../data';
import { CRANE_PROGRAM_ID } from '../../../data/mock/fake-catalog';
import { DATA_SOURCE } from '../../services/tokens';
import { SettingsService } from '../../services/settings-service';
import { ViewerService } from '../../services/viewer-service';
import { SUPERVISOR_INDENT } from '../../shared/supervisor-choices';
import { loadAppState } from '../../testing';
import { READINESS_PAGE_CONFIG } from './readiness-page-config';
import { Readiness } from './readiness';
import { ReadinessQueryService } from './readiness-query-service';

describe('Readiness page and toolbar', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'readiness', component: Readiness }])],
    });
    await loadAppState();
  });

  const fakeOrg = () => (TestBed.inject(DATA_SOURCE) as MockDataSource).fakeOrg();
  const director = () => fakeOrg().people[0];
  /** A manager two levels below the director. */
  const someManager = () => fakeOrg().people.find((p) => p.managerId === fakeOrg().people[1].id)!;

  async function open(url: string, persona = 'director') {
    TestBed.inject(ViewerService).setPersona(persona);
    const harness = await RouterTestingHarness.create(url);
    const el = harness.routeNativeElement as HTMLElement;
    const query = harness.routeDebugElement!.injector.get(ReadinessQueryService);
    const router = TestBed.inject(Router);
    const stable = () => harness.fixture.whenStable();
    const button = (label: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === label)!;
    const byTestId = <T extends HTMLElement>(id: string) => el.querySelector<T>(`[data-testid="${id}"]`)!;
    const params = () => router.parseUrl(router.url).queryParams;
    return { harness, el, query, router, stable, button, byTestId, params };
  }

  it('defaults to the tree view with Issues only on, scoped to the viewer', async () => {
    const { el, button, byTestId, query } = await open('/readiness');
    expect(el.querySelector('rtw-org-tree')).not.toBeNull();
    expect(button('Tree').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId<HTMLInputElement>('issues-only').checked).toBe(true);
    expect(query.supervisorId()).toBe(director().id);
    expect(query.programId()).toBeNull();
  });

  it('switches to the list view and keeps Issues only off in the URL', async () => {
    const { el, button, stable, router } = await open('/readiness?issues=all');
    button('List').click();
    await stable();
    expect(router.url).toBe('/readiness?issues=all&view=list');
    expect(el.querySelector('rtw-issues-list')).not.toBeNull();
  });

  it('reads every parameter from the URL', async () => {
    const sup = someManager().id;
    const { query, byTestId } = await open(
      `/readiness?view=list&issues=all&sup=${sup}&prog=${CRANE_PROGRAM_ID}&cat=tool,sap-password&status=expiring,not-ready&direct=1&q=smith`,
    );
    expect(query.view()).toBe('list');
    expect(query.issuesOnly()).toBe(false);
    expect(query.supervisorId()).toBe(sup);
    expect(query.programId()).toBe(CRANE_PROGRAM_ID);
    expect(query.categories()).toEqual(['tool', 'sap-password']);
    expect(query.statuses()).toEqual(['not-ready', 'expiring']);
    expect(query.directOnly()).toBe(true);
    expect(query.keyword()).toBe('smith');
    expect(byTestId<HTMLSelectElement>('supervisor').value).toBe(sup);
    expect(byTestId<HTMLSelectElement>('program').value).toBe(CRANE_PROGRAM_ID);
    expect(byTestId<HTMLInputElement>('keyword').value).toBe('smith');
  });

  it('writes each control back to the URL', async () => {
    const sup = someManager().id;
    const { query, stable, params, byTestId, el } = await open('/readiness');

    const supervisor = byTestId<HTMLSelectElement>('supervisor');
    supervisor.value = sup;
    supervisor.dispatchEvent(new Event('change'));
    const program = byTestId<HTMLSelectElement>('program');
    program.value = CRANE_PROGRAM_ID;
    program.dispatchEvent(new Event('change'));
    await stable();
    byTestId<HTMLInputElement>('direct-only').click();
    await stable();
    el.querySelector<HTMLButtonElement>('button[data-status="expiring"]')!.click();
    await stable();
    query.toggleCategory('tool');
    await stable();

    expect(params()).toEqual({
      sup,
      prog: CRANE_PROGRAM_ID,
      direct: '1',
      status: 'expiring',
      cat: 'tool',
    });
    expect(el.querySelector('button[data-status="expiring"]')!.getAttribute('aria-pressed')).toBe('true');
  });

  it('filters on the keyword at once and writes it to the URL after a pause', async () => {
    const { query, stable, params, byTestId } = await open('/readiness?issues=all');
    const all = query.result().shownCount;
    const input = byTestId<HTMLInputElement>('keyword');
    input.value = director().name;
    input.dispatchEvent(new Event('input'));
    expect(query.result().shownCount).toBeLessThan(all);
    expect(params()['q']).toBeUndefined();
    await new Promise((r) => setTimeout(r, READINESS_PAGE_CONFIG.keywordUrlDelayMs + 50));
    await stable();
    expect(params()['q']).toBe(director().name);
  });

  it('takes the default scope from Preferences and leaves it out of the URL', async () => {
    const sup = someManager().id;
    TestBed.inject(SettingsService).updatePreferences({
      defaultSupervisorId: sup,
      defaultProgramId: CRANE_PROGRAM_ID,
    });
    const { query, stable, params } = await open('/readiness');
    expect(query.supervisorId()).toBe(sup);
    expect(query.programId()).toBe(CRANE_PROGRAM_ID);

    // Picking something other than the default has to be written, even "You" and "All".
    query.setSupervisor(director().id);
    query.setProgram(null);
    await stable();
    expect(params()).toEqual({ sup: director().id, prog: 'all' });
    expect(query.programId()).toBeNull();

    query.setSupervisor(sup);
    await stable();
    expect(params()['sup']).toBeUndefined();
  });

  it('ignores parameters the viewer cannot use', async () => {
    const outside = director().id; // above the foreman
    const { query } = await open(
      `/readiness?sup=${outside}&prog=nope&cat=bogus,tool&status=ready,expiring&view=x`,
      'foreman',
    );
    const foreman = TestBed.inject(ViewerService).viewer()!.personId;
    expect(query.supervisorId()).toBe(foreman);
    expect(query.programId()).toBeNull();
    expect(query.categories()).toEqual(['tool']);
    expect(query.statuses()).toEqual(['expiring']);
    expect(query.view()).toBe('tree');
  });

  it('lists the viewer first and the managers below, indented', async () => {
    const { byTestId } = await open('/readiness');
    const options = [...byTestId<HTMLSelectElement>('supervisor').options];
    expect(options[0].textContent).toBe(`You (${director().name})`);
    expect(options.length).toBeGreaterThan(10);
    expect(options[1].textContent!.startsWith(' '.repeat(SUPERVISOR_INDENT))).toBe(true);
  });

  it('disables the category and status filters while Issues only is off', async () => {
    const { el } = await open('/readiness?issues=all');
    expect(el.querySelector<HTMLButtonElement>('button[data-status="expiring"]')!.disabled).toBe(true);
    expect(el.querySelector<HTMLButtonElement>('rtw-category-filter button')!.disabled).toBe(true);
  });

  it('clears filters but keeps scope, view and Issues only', async () => {
    const sup = someManager().id;
    const { query, stable, params, byTestId } = await open(
      `/readiness?view=list&sup=${sup}&cat=tool&status=expiring&direct=1&q=x`,
    );
    expect(query.hasFilters()).toBe(true);
    byTestId<HTMLButtonElement>('clear-filters').click();
    await stable();
    expect(params()).toEqual({ view: 'list', sup });
    expect(query.keyword()).toBe('');
    expect(query.hasFilters()).toBe(false);
    expect(byTestId('clear-filters')).toBeNull();
  });

  it('shows how many people are shown out of the scope', async () => {
    const { byTestId, query } = await open('/readiness');
    const { shownCount, scopeCount } = query.result();
    expect(byTestId('shown-count').textContent).toBe(`${shownCount} of ${scopeCount} people shown`);
  });

  it('exports the people shown, in either view, as a CSV named for the day', async () => {
    const saved: { name: string; blob: Blob }[] = [];
    const blobs = new Map<string, Blob>();
    vi.spyOn(URL, 'createObjectURL').mockImplementation((b) => {
      blobs.set('blob:x', b as Blob);
      return 'blob:x';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      saved.push({ name: this.download, blob: blobs.get(this.href)! });
    });

    const { harness, byTestId, query, stable } = await open('/readiness');
    for (const url of ['/readiness', '/readiness?view=list']) {
      await harness.navigateByUrl(url);
      await stable();
      byTestId('export').click();
      const { name, blob } = saved.at(-1)!;
      expect(name).toMatch(/^readiness-\d{4}-\d{2}-\d{2}\.csv$/);
      const lines = splitCsv(await blob.text());
      expect(lines[0]).toMatch(/^Name,Employee ID,Title,Reports to,Overall,Network access,/);
      expect(lines.length - 1).toBe(query.result().shownCount);
      expect(lines[1]).toContain(query.listResult().rows[0].person.employeeId);
    }
    vi.restoreAllMocks();
  });

    it('counts people the same way in the list view', async () => {
    const { byTestId, query } = await open('/readiness?view=list');
    const { shownCount, scopeCount } = query.result();
    expect(query.listResult().rows.length).toBe(shownCount);
    expect(byTestId('shown-count').textContent).toBe(`${shownCount} of ${scopeCount} people shown`);
  });

  it('keeps every parameter when switching between Tree and List', async () => {
    const sup = someManager().id;
    const url = `/readiness?issues=all&sup=${sup}&prog=${CRANE_PROGRAM_ID}&cat=tool&status=expiring&direct=1&q=a`;
    const { button, stable, params } = await open(url);
    const before = params();
    button('List').click();
    await stable();
    expect(params()).toEqual({ ...before, view: 'list' });
    button('Tree').click();
    await stable();
    expect(params()).toEqual(before);
  });
});

/** A downloaded CSV's lines, without the byte-order mark and the final line break. */
function splitCsv(text: string): string[] {
  return text.replace(/^\uFEFF/, '').trimEnd().split('\r\n');
}
