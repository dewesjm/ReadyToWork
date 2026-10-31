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
    expect(card.textContent).toContain('Ridgeline R-01 (supply ship)');
    expect(card.textContent).toContain(
      'Requires: Crane Operator (QL-CRN-01); Qualified Rigger (QL-RIG-01); Hot Work and Fire Watch (HW-210)',
    );
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

    await type('[data-testid="new-program-name"]', 'ridgeline r-01 (supply ship)');
    await submit();
    expect($('#new-program-problem').textContent).toContain('There is already a program called "Ridgeline R-01 (supply ship)".');
    expect(settings().programs.length).toBe(6);

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
    expect(crane().name).toBe('Ridgeline R-01 (supply ship)');

    await type('[data-testid="program-name"]', 'kestrel class (patrol boat)');
    await key('[data-testid="program-name"]', 'Enter');
    expect($('#program-name-problem').textContent).toContain('already a program called "Kestrel class (patrol boat)"');

    await key('[data-testid="program-name"]', 'Escape');
    expect($<HTMLInputElement>('[data-testid="program-name"]').value).toBe('Ridgeline R-01 (supply ship)');
    expect($('#program-name-problem')).toBeNull();

    await type('[data-testid="program-name"]', 'Ridgeline R-01 (heavy lift ship)');
    await key('[data-testid="program-name"]', 'Enter');
    expect(crane().name).toBe('Ridgeline R-01 (heavy lift ship)');
    expect(crane().id).toBe(CRANE_PROGRAM_ID);
    expect($('[data-testid="program-name"]').closest('rtw-admin')?.querySelector('[data-testid="saved-note"]')?.textContent).toContain('Saved');
  });

  /** Fills in the Add requirement form: an optional name and one or more [type, ID] rows. */
  async function addTyped(
    page: Awaited<ReturnType<typeof open>>,
    options: [string, string][],
    name = '',
  ) {
    const { $, el, stable, type } = page;
    $<HTMLButtonElement>('[data-testid="add-requirement"]').click();
    await stable();
    expect(document.activeElement).toBe($('[data-testid="requirement-name"]'));
    if (name) await type('[data-testid="requirement-name"]', name);
    for (let i = 0; i < options.length; i++) {
      if (i > 0) {
        $<HTMLButtonElement>('[data-testid="add-option"]').click();
        await stable();
      }
      const row = el().querySelectorAll('[data-testid="option"]')[i];
      const select = row.querySelector<HTMLSelectElement>('[data-testid="option-type"]')!;
      select.value = options[i][0];
      select.dispatchEvent(new Event('change'));
      const input = row.querySelector<HTMLInputElement>('[data-testid="option-id"]')!;
      input.value = options[i][1];
      input.dispatchEvent(new Event('input'));
      await stable();
    }
    $<HTMLButtonElement>('[data-testid="save-requirement"]').click();
    await stable();
  }

  it('adds a typed ID as a requirement and the summary updates at once', async () => {
    const page = await open(`/admin/programs/${CRANE_PROGRAM_ID}`);
    const before = TestBed.inject(AdminService).summaries().get(CRANE_PROGRAM_ID)!.rollup;

    // Case doesn't matter: the course is HC-260 in the learning system.
    await addTyped(page, [['training', 'hc-260']]);

    const added = crane().requirements.at(-1)!;
    expect(added).toEqual({ id: `req-${crane().requirements.length}`, anyOf: [{ category: 'training', itemId: 'hc-260' }] });
    expect(page.$('[data-testid="requirement-form"]')).toBeNull();
    expect(page.$(`[data-requirement="${added.id}"]`).textContent).toContain('Hearing Conservation (hc-260)');
    const after = TestBed.inject(AdminService).summaries().get(CRANE_PROGRAM_ID)!.rollup;
    expect(after.total).toBe(before.total);
    expect(after.counts['not-ready']).toBeGreaterThan(before.counts['not-ready']);
    expect(page.$('[data-testid="program-summary"]').textContent).toContain(`${after.counts['not-ready']} not ready`);
  });

  it('adds an "any of" requirement mixing types, with a name', async () => {
    const page = await open(`/admin/programs/${CRANE_PROGRAM_ID}`);
    await addTyped(page, [['training', 'ELEC-101'], ['qualification', 'QL-MEL-01']], 'Electrical safety');

    const added = crane().requirements.at(-1)!;
    expect(added).toEqual({
      id: added.id,
      name: 'Electrical safety',
      anyOf: [
        { category: 'training', itemId: 'ELEC-101' },
        { category: 'qualification', itemId: 'QL-MEL-01' },
      ],
    });
    const row = page.$(`[data-requirement="${added.id}"]`).textContent!.replace(/\s+/g, ' ');
    expect(row).toContain('Electrical safety: any of ELEC-101, QL-MEL-01');
    expect(row).toContain('Electrical Safety Basics (ELEC-101) · Training');
    expect(row).toContain('Marine Electrician (QL-MEL-01) · Qualifications');
  });

  it('explains a missing ID or a repeat, and keeps the form open', async () => {
    const page = await open(`/admin/programs/${CRANE_PROGRAM_ID}`);
    const count = crane().requirements.length;
    await addTyped(page, [['training', '  ']]);
    expect(page.$('[data-testid="requirement-problem"]').textContent).toContain('Enter an ID.');

    // Fix the same form: the crane qualification is already required (case doesn't matter).
    const select = page.$<HTMLSelectElement>('[data-testid="option-type"]');
    select.value = 'qualification';
    select.dispatchEvent(new Event('change'));
    await page.type('[data-testid="option-id"]', 'ql-crn-01');
    expect(page.$('[data-testid="requirement-problem"]')).toBeNull();
    page.$<HTMLButtonElement>('[data-testid="save-requirement"]').click();
    await page.stable();
    expect(page.$('[data-testid="requirement-problem"]').textContent).toContain('The program already has this requirement.');
    expect(crane().requirements.length).toBe(count);
  });

  it('allows an ID no one holds yet, with a note to check it', async () => {
    const page = await open(`/admin/programs/${CRANE_PROGRAM_ID}`);
    expect(page.el().querySelectorAll('[data-testid="unknown-id"]').length).toBe(0);
    await addTyped(page, [['training', 'HW-999']]);
    expect(page.$('[data-testid="unknown-id"]').textContent).toContain('No records with ID HW-999 yet. Check the ID.');
  });

  it('removes a requirement', async () => {
    const { $, stable } = await open(`/admin/programs/${CRANE_PROGRAM_ID}`);
    $<HTMLButtonElement>('[data-requirement="req-2"] button').click();
    await stable();
    expect(crane().requirements.map((r) => r.id)).toEqual(['req-1', 'req-3', 'req-4', 'req-5']);
    expect($('[data-requirement="req-2"]')).toBeNull();
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
      expect(dialog.textContent).toContain(`Ridgeline R-01 (supply ship) is assigned to ${assigned} people`);
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
