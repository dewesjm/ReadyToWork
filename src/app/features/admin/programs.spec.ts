import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CRANE_PROGRAM_ID } from '../../../data/mock/fake-catalog';
import { routes } from '../../app.routes';
import { ReadinessService } from '../../services/readiness-service';
import { SettingsService } from '../../services/settings-service';
import { ViewerService } from '../../services/viewer-service';
import { loadAppState, stubDialogs } from '../../testing';
import { AdminService } from './admin-service';

describe('Admin programs', () => {
  beforeEach(async () => {
    stubDialogs();
    TestBed.configureTestingModule({ providers: [provideRouter(routes, withComponentInputBinding())] });
    await loadAppState();
    TestBed.inject(ViewerService).setPersona('admin');
  });

  async function open(url: string) {
    const harness = await RouterTestingHarness.create(url);
    const el = () => harness.routeNativeElement as HTMLElement;
    const $ = <T extends Element = HTMLElement>(sel: string) => el().querySelector<T & Element>(sel) as T;
    const stable = () => harness.fixture.whenStable();
    const type = async (sel: string, value: string) => {
      const input = $<HTMLInputElement>(sel);
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await stable();
      return input;
    };
    const key = async (sel: string, key: string) => {
      $(sel).dispatchEvent(new KeyboardEvent('keydown', { key }));
      await stable();
    };
    return { harness, el, $, stable, type, key };
  }

  const settings = () => TestBed.inject(SettingsService).settings();
  const crane = () => settings().programs.find((p) => p.id === CRANE_PROGRAM_ID)!;

  it('lists every program with its requirements and how ready its people are', async () => {
    const { el } = await open('/admin/programs');
    const cards = [...el().querySelectorAll<HTMLElement>('[data-program]')];
    expect(cards.map((c) => c.dataset['program'])).toEqual(settings().programs.map((p) => p.id));
    const card = el().querySelector(`[data-program="${CRANE_PROGRAM_ID}"]`)!;
    expect(card.textContent).toContain('Crane Operations');
    expect(card.textContent).toContain('Requires: Crane Operator, Qualified Rigger');
    const total = TestBed.inject(AdminService).summaries().get(CRANE_PROGRAM_ID)!.rollup.total;
    expect(total).toBeGreaterThan(0);
    expect(card.querySelector('rtw-rollup-badge')?.textContent).toContain(`${total} people:`);
  });

  it('creates a program, refusing empty and duplicate names, and opens it', async () => {
    const { $, type, stable } = await open('/admin/programs');
    const submit = async () => {
      $<HTMLButtonElement>('[data-testid="create-program"]').click();
      await stable();
    };
    await submit();
    expect($('#new-program-problem').textContent).toContain('Enter a program name.');

    await type('[data-testid="new-program-name"]', 'crane operations');
    await submit();
    expect($('#new-program-problem').textContent).toContain('There is already a program called "Crane Operations".');
    expect(settings().programs.length).toBe(5);

    await type('[data-testid="new-program-name"]', 'Night Shift');
    await submit();
    expect(TestBed.inject(Router).url).toBe('/admin/programs/prog-night-shift');
    expect(settings().programs.at(-1)).toEqual({ id: 'prog-night-shift', name: 'Night Shift', requirements: [] });
    expect($<HTMLInputElement>('[data-testid="program-name"]').value).toBe('Night Shift');
    expect($('[data-testid="program-summary"]').textContent).toContain('No one on this program yet');
  });

  it('renames on Enter, refuses bad names, and Escape puts the old name back', async () => {
    const { $, type, key } = await open(`/admin/programs/${CRANE_PROGRAM_ID}`);
    await type('[data-testid="program-name"]', '  ');
    await key('[data-testid="program-name"]', 'Enter');
    expect($('#program-name-problem').textContent).toContain('Enter a program name.');
    expect(crane().name).toBe('Crane Operations');

    await type('[data-testid="program-name"]', 'field purchasing');
    await key('[data-testid="program-name"]', 'Enter');
    expect($('#program-name-problem').textContent).toContain('already a program called "Field Purchasing"');

    await key('[data-testid="program-name"]', 'Escape');
    expect($<HTMLInputElement>('[data-testid="program-name"]').value).toBe('Crane Operations');
    expect($('#program-name-problem')).toBeNull();

    await type('[data-testid="program-name"]', 'Crane and Rigging');
    await key('[data-testid="program-name"]', 'Enter');
    expect(crane().name).toBe('Crane and Rigging');
    expect(crane().id).toBe(CRANE_PROGRAM_ID);
    expect($('[data-testid="program-name"]').closest('rtw-admin')?.querySelector('[data-testid="saved-note"]')?.textContent).toContain('Saved');
  });

  it('adds a requirement from the picker and the summary updates at once', async () => {
    const { $, el, type, stable } = await open(`/admin/programs/${CRANE_PROGRAM_ID}`);
    const before = TestBed.inject(AdminService).summaries().get(CRANE_PROGRAM_ID)!.rollup;

    $<HTMLButtonElement>('[data-testid="add-requirement"]').click();
    await stable();
    const offered = () => [...el().querySelectorAll<HTMLElement>('[data-testid="picker"] [data-item]')].map((b) => b.dataset['item']);
    expect(offered()).not.toContain('qual:crane');
    expect(offered()).toContain('trn:first-aid');
    expect(offered()).not.toContain(undefined);
    expect(document.activeElement).toBe($('[data-testid="picker-search"]'));

    await type('[data-testid="picker-search"]', 'first');
    expect(offered()).toEqual(['trn:first-aid']);
    $<HTMLButtonElement>('[data-item="trn:first-aid"]').click();
    await stable();

    expect(crane().requirements.map((r) => r.itemId)).toEqual(['qual:crane', 'qual:rigging', 'trn:first-aid']);
    expect(offered()).toEqual([]);
    expect($('[data-testid="picker"]').textContent).toContain('No items match "first".');
    const after = TestBed.inject(AdminService).summaries().get(CRANE_PROGRAM_ID)!.rollup;
    expect(after.total).toBe(before.total);
    expect(after.counts['not-ready']).toBeGreaterThan(before.counts['not-ready']);
    expect($('[data-testid="program-summary"]').textContent).toContain(`${after.counts['not-ready']} not ready`);
  });

  it('removes a requirement', async () => {
    const { $, stable } = await open(`/admin/programs/${CRANE_PROGRAM_ID}`);
    $<HTMLButtonElement>('[data-requirement="qual:rigging"] button').click();
    await stable();
    expect(crane().requirements.map((r) => r.itemId)).toEqual(['qual:crane']);
    expect($('[data-requirement="qual:rigging"]')).toBeNull();
  });

  it('asks before deleting, and deleting removes the program and its assignments', async () => {
    const { $, stable } = await open(`/admin/programs/${CRANE_PROGRAM_ID}`);
    const onCrane = () => Object.values(settings().assignments).filter((ids) => ids.includes(CRANE_PROGRAM_ID)).length;
    const assigned = onCrane();
    expect(assigned).toBeGreaterThan(0);

    const answer = async (value: 'yes' | 'no') => {
      $<HTMLButtonElement>('[data-testid="delete-program"]').click();
      await stable();
      const dialog = $<HTMLDialogElement>('dialog');
      expect(dialog.hasAttribute('open')).toBe(true);
      expect(dialog.textContent).toContain(`Crane Operations is assigned to ${assigned} people`);
      dialog.querySelector<HTMLButtonElement>(`button[value="${value}"]`)!.click();
      await stable();
    };

    await answer('no');
    expect(crane()).toBeDefined();

    await answer('yes');
    await stable();
    expect(settings().programs.some((p) => p.id === CRANE_PROGRAM_ID)).toBe(false);
    expect(onCrane()).toBe(0);
    expect(TestBed.inject(Router).url).toBe('/admin/programs');
    // Nobody's checks are "required by" the deleted program any more.
    const checks = [...TestBed.inject(ReadinessService).result().checksByPerson.values()].flat();
    expect(checks.some((c) => c.requiredBy.includes(CRANE_PROGRAM_ID))).toBe(false);
  });

  it('says so when the program does not exist', async () => {
    const { $ } = await open('/admin/programs/nope');
    expect($('[data-testid="program-not-found"]').textContent).toContain('Program not found');
    expect($('[data-testid="program-not-found"] a').getAttribute('href')).toBe('/admin/programs');
  });
});
