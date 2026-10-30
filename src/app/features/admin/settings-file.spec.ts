import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describeSettings } from '../../../data';
import { CRANE_PROGRAM_ID } from '../../../data/mock/fake-catalog';
import { routes } from '../../app.routes';
import { ClockService } from '../../services/clock-service';
import { SettingsService } from '../../services/settings-service';
import { ViewerService } from '../../services/viewer-service';
import { loadAppState, stubDialogs } from '../../testing';

describe('Settings file', () => {
  let downloads: { name: string; blob: Blob }[];
  let lastBlob: Blob | null;

  beforeEach(async () => {
    stubDialogs();
    downloads = [];
    lastBlob = null;
    // jsdom has no object URLs or downloads; record what would be saved.
    URL.createObjectURL = (blob: Blob) => ((lastBlob = blob), 'blob:test');
    URL.revokeObjectURL = () => undefined;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push({ name: this.download, blob: lastBlob! });
    });
    TestBed.configureTestingModule({ providers: [provideRouter(routes, withComponentInputBinding())] });
    await loadAppState();
    TestBed.inject(ViewerService).setPersona('admin');
  });
  afterEach(() => vi.restoreAllMocks());

  const service = () => TestBed.inject(SettingsService);

  async function open() {
    const harness = await RouterTestingHarness.create('/admin/file');
    const el = () => harness.routeNativeElement as HTMLElement;
    const $ = <T extends Element = HTMLElement>(sel: string) => el().querySelector(sel) as T;
    const stable = () => harness.fixture.whenStable();
    const click = async (testid: string) => {
      $<HTMLButtonElement>(`[data-testid="${testid}"]`).click();
      await stable();
    };
    /** Picks a file in the import input and waits for it to be read. */
    const pick = async (name: string, text: string) => {
      const input = $<HTMLInputElement>('[data-testid="import-input"]');
      Object.defineProperty(input, 'files', { configurable: true, value: [new File([text], name)] });
      input.dispatchEvent(new Event('change'));
      await new Promise((resolve) => setTimeout(resolve));
      await stable();
    };
    const dialog = (heading: string) =>
      [...el().querySelectorAll('dialog')].find((d) => d.textContent?.includes(heading))!;
    const answer = async (heading: string, value: 'yes' | 'no') => {
      expect(dialog(heading).hasAttribute('open')).toBe(true);
      dialog(heading).querySelector<HTMLButtonElement>(`button[value="${value}"]`)!.click();
      await stable();
    };
    return { el, $, stable, click, pick, dialog, answer };
  }

  /** Some admin edits plus a preference, so round trips have something to carry. */
  function edit() {
    service().update((s) => ({
      ...s,
      programs: s.programs.map((p) => (p.id === CRANE_PROGRAM_ID ? { ...p, name: 'Cranes' } : p)),
      warningDays: { tool: 45 },
      preferences: { ...s.preferences, theme: 'nord' },
    }));
  }

  it('exports the admin settings to a dated JSON file', async () => {
    edit();
    const { click } = await open();
    await click('export');
    expect(downloads.length).toBe(1);
    expect(downloads[0].name).toBe(`ready-to-work-settings-${TestBed.inject(ClockService).today()}.json`);
    expect(downloads[0].blob.type).toBe('application/json');
    expect(await downloads[0].blob.text()).toBe(service().exportJson());
    expect(JSON.parse(await downloads[0].blob.text()).preferences).toBeUndefined();
  });

  it('round-trips: export, reset, import gives back the same settings', async () => {
    edit();
    const edited = service().settings();
    const { $, click, pick, answer } = await open();
    await click('export');
    const text = await downloads[0].blob.text();

    await click('reset');
    await answer('Reset to defaults?', 'yes');
    expect(service().settings().programs.find((p) => p.id === CRANE_PROGRAM_ID)!.name).toBe('Crane Operations');
    expect(service().settings().warningDays).toEqual({});
    expect(service().preferences().theme).toBe('nord');

    await pick('mine.json', text);
    expect($('dialog[open]').textContent).toContain(`mine.json has ${describeSettings(edited)}`);
    await answer('Import settings?', 'yes');
    expect(service().settings()).toEqual(edited);
    expect($('[data-testid="current-summary"]').textContent).toBe(describeSettings(edited));
  });

  it('changes nothing when the import is cancelled', async () => {
    const before = service().settings();
    const { pick, answer } = await open();
    await pick('other.json', JSON.stringify({ schemaVersion: 1, programs: [] }));
    await answer('Import settings?', 'no');
    expect(service().settings()).toEqual(before);
  });

  it('shows why a bad file was not imported, and changes nothing', async () => {
    const before = service().settings();
    const { $, pick, el } = await open();
    await pick('broken.json', '{"schemaVersion": 1, "warningDays": {"tool": -5}}');
    expect($('[data-testid="import-error"]').textContent).toContain(
      'broken.json was not imported: warningDays.tool must be a whole number of days (0 to 3650). Nothing was changed.',
    );
    expect(el().querySelector('dialog[open]')).toBeNull();
    expect(service().settings()).toEqual(before);

    await pick('notjson.json', 'hello');
    expect($('[data-testid="import-error"]').textContent).toContain('The file is not valid JSON.');
  });

  it('asks before resetting, and Cancel keeps the settings', async () => {
    edit();
    const edited = service().settings();
    const { click, answer } = await open();
    await click('reset');
    await answer('Reset to defaults?', 'no');
    expect(service().settings()).toEqual(edited);
  });
});
