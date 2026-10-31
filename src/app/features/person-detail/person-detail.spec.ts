import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockDataSource } from '../../../data';
import { CRANE_PROGRAM_ID } from '../../../data/mock/fake-catalog';
import { ReadinessService } from '../../services/readiness-service';
import { SettingsService } from '../../services/settings-service';
import { DATA_SOURCE } from '../../services/tokens';
import { ViewerService } from '../../services/viewer-service';
import { loadAppState } from '../../testing';
import { PersonDetail, PersonDetailMode } from './person-detail';

describe('PersonDetail', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    await loadAppState();
  });

  const fakeOrg = () => (TestBed.inject(DATA_SOURCE) as MockDataSource).fakeOrg();
  const org = () => TestBed.inject(ReadinessService).result().org;
  /** A tool-crew member with an expired tool. */
  const toolCrewMember = () => {
    const { checksByPerson } = TestBed.inject(ReadinessService).result();
    return org()
      .childrenOf(fakeOrg().scenarios.toolCrewForemanId)
      .find((p) => checksByPerson.get(p.id)!.some((c) => c.category === 'tool' && c.status === 'not-ready'))!;
  };

  async function render(personId: string, persona = 'director', mode: PersonDetailMode = 'page') {
    TestBed.inject(ViewerService).setPersona(persona);
    const fixture = TestBed.createComponent(PersonDetail);
    fixture.componentRef.setInput('personId', personId);
    fixture.componentRef.setInput('mode', mode);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const text = (sel: string) => el.querySelector(sel)?.textContent?.replace(/\s+/g, ' ').trim();
    return { fixture, el, text, stable: () => fixture.whenStable() };
  }

  it('shows the header: name, status as color, icon and text, title and employee ID', async () => {
    const person = toolCrewMember();
    const { el, text } = await render(person.id);
    expect(text('[data-testid="person-name"]')).toBe(person.name);
    expect(el.querySelector('[data-testid="person-name"]')!.getAttribute('aria-level')).toBe('1');
    const badge = el.querySelector('header rtw-status-badge .badge')!;
    expect(badge.className).toContain('badge-error');
    expect(badge.textContent).toContain('Not ready');
    expect(el.textContent).toContain(`${person.title} · ${person.employeeId}`);
  });

  it('links every manager in the chain for the director', async () => {
    const person = toolCrewMember();
    const { el } = await render(person.id);
    const chain = [...el.querySelectorAll<HTMLElement>('[data-chain]')];
    expect(chain.map((c) => c.dataset['chain'])).toEqual(org().managerChain(person.id).map((m) => m.id));
    expect(chain.every((c) => c.tagName === 'A')).toBe(true);
    expect(chain.at(-1)!.getAttribute('href')).toBe(`/person/${fakeOrg().scenarios.toolCrewForemanId}`);
  });

  it('shows managers above the viewer as plain text', async () => {
    const person = toolCrewMember();
    const { el } = await render(person.id, 'foreman');
    const chain = [...el.querySelectorAll<HTMLElement>('[data-chain]')];
    expect(chain.at(-1)!.tagName).toBe('A'); // the foreman themselves
    expect(chain.slice(0, -1).every((c) => c.tagName === 'SPAN')).toBe(true);
  });

  it('shows a tile for every category, with nothing tracked greyed out and not clickable', async () => {
    const { el } = await render(fakeOrg().people[0].id);
    const tiles = [...el.querySelectorAll<HTMLButtonElement>('rtw-category-tiles button')];
    expect(tiles.length).toBe(8);
    const qual = el.querySelector<HTMLButtonElement>('button[data-category="qualification"]')!;
    expect(qual.textContent).toContain('Nothing tracked'); // leaders hold no qualifications
    expect(qual.disabled).toBe(true);
  });

  it('lists checks worst first and filters them by tile', async () => {
    const person = toolCrewMember();
    const { el, stable, text } = await render(person.id);
    const rows = () => [...el.querySelectorAll('[data-testid="check-table"] tbody tr')];
    const total = rows().length;
    expect(rows()[0].querySelector('rtw-status-badge')!.textContent).toContain('Not ready');
    expect(rows()[0].textContent).toContain('Asset management');

    el.querySelector<HTMLButtonElement>('button[data-category="tool"]')!.click();
    await stable();
    expect(el.querySelector('button[data-category="tool"]')!.getAttribute('aria-pressed')).toBe('true');
    expect(rows().length).toBeLessThan(total);
    expect(rows().every((r) => r.textContent!.includes('Tools'))).toBe(true);
    expect(text('section div[role="heading"]')).toContain('Tools checks');

    el.querySelector<HTMLButtonElement>('button[data-category="tool"]')!.click();
    await stable();
    expect(rows().length).toBe(total);
  });

  it('shows what a manager is responsible for, with a link to their tree', async () => {
    const foremanId = fakeOrg().scenarios.toolCrewForemanId;
    const { el, text } = await render(foremanId);
    const rollup = TestBed.inject(ReadinessService).result().rollups.get(foremanId)!;
    expect(text('[data-testid="responsible-for"]')).toContain(`${rollup.total} people in total`);
    expect(el.querySelector('[data-testid="view-tree"]')!.getAttribute('href')).toBe(`/readiness?sup=${foremanId}`);
  });

  it('has no "Responsible for" for crew', async () => {
    const { el } = await render(toolCrewMember().id);
    expect(el.querySelector('[data-testid="responsible-for"]')).toBeNull();
  });

  it('shows programs with their status, and "required by" on the checks', async () => {
    const id = fakeOrg().scenarios.craneCandidateId;
    const settings = TestBed.inject(SettingsService);
    settings.update((s) => ({ ...s, assignments: { ...s.assignments, [id]: [CRANE_PROGRAM_ID] } }));
    const { el, text } = await render(id);
    const badge = el.querySelector(`[data-program="${CRANE_PROGRAM_ID}"]`)!;
    expect(badge.className).toContain('badge-error');
    expect(badge.textContent!.replace(/\s+/g, ' ').trim()).toBe('Ridgeline R-01 (supply ship): Not ready');
    // The missing crane qualification is the worst check, so it comes first.
    expect(text('[data-testid="check-table"] tbody tr')).toContain('Ridgeline R-01 (supply ship)');
  });

  it('shows the course or qual ID under the item name, not for devices', async () => {
    const id = fakeOrg().scenarios.craneCandidateId;
    const { el } = await render(id);
    const row = (itemId: string) => el.querySelector(`[data-testid="check-table"] tr[data-item="${itemId}"]`);
    expect(row('SAF-100')!.querySelector('[data-testid="item-id"]')!.textContent).toBe('SAF-100');
    expect(row('NET-DOMAIN')!.querySelector('[data-testid="item-id"]')!.textContent).toBe('NET-DOMAIN');
    const device = el.querySelector('[data-testid="check-table"] tr[data-item^="dev:"]');
    if (device) expect(device.querySelector('[data-testid="item-id"]')).toBeNull();
  });

  it('says so for someone outside the viewer subtree', async () => {
    const { el } = await render(fakeOrg().people[0].id, 'foreman');
    expect(el.querySelector('[data-testid="not-available"]')).not.toBeNull();
  });

  it('in the panel, uses cards, a smaller heading and links that stay on the Readiness page', async () => {
    const person = toolCrewMember();
    const { el } = await render(person.id, 'director', 'panel');
    expect(el.querySelector('[data-testid="check-table"]')).toBeNull();
    expect(el.querySelectorAll('[data-testid="check-cards"] li').length).toBeGreaterThan(0);
    expect(el.querySelector('[data-testid="person-name"]')!.getAttribute('aria-level')).toBe('2');
    const foremanId = fakeOrg().scenarios.toolCrewForemanId;
    expect(el.querySelector(`a[data-chain="${foremanId}"]`)!.getAttribute('href')).toBe(`/readiness?person=${foremanId}`);
  });

  it('does not repeat the date on cards when the reason already names it', async () => {
    const { el } = await render(fakeOrg().scenarios.toolCrewForemanId, 'director', 'panel');
    const cards = [...el.querySelectorAll('[data-testid="check-cards"] li')].map((c) => c.textContent!);
    const valid = cards.find((t) => t.includes('Valid through'))!;
    expect(valid).toMatch(/\d+ days? left|Today/);
    expect(valid).not.toContain('Due ');
  });
});
