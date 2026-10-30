import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Check, DEFAULT_CONFIG } from '../../../core';
import { routes } from '../../app.routes';
import { ReadinessService } from '../../services/readiness-service';
import { SettingsService } from '../../services/settings-service';
import { ViewerService } from '../../services/viewer-service';
import { loadAppState } from '../../testing';
import { THRESHOLD_APPLY_MS } from './thresholds';

describe('Thresholds', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes, withComponentInputBinding())] });
    await loadAppState();
    TestBed.inject(ViewerService).setPersona('admin');
  });

  async function open() {
    const harness = await RouterTestingHarness.create('/admin/thresholds');
    const el = () => harness.routeNativeElement as HTMLElement;
    const row = (id: string) => el().querySelector<HTMLElement>(`[data-category="${id}"]`)!;
    const input = (id: string) => row(id).querySelector<HTMLInputElement>('input')!;
    const stable = () => harness.fixture.whenStable();
    const type = async (id: string, value: string) => {
      input(id).value = value;
      input(id).dispatchEvent(new Event('input'));
      await stable();
    };
    /** Types and presses Enter, which applies without waiting for the pause. */
    const enter = async (id: string, value: string) => {
      await type(id, value);
      input(id).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await stable();
    };
    const pause = async () => {
      await new Promise((resolve) => setTimeout(resolve, THRESHOLD_APPLY_MS + 50));
      await stable();
    };
    return { el, row, input, stable, type, enter, pause };
  }

  const warningDays = () => TestBed.inject(SettingsService).settings().warningDays;
  const allChecks = () => [...TestBed.inject(ReadinessService).result().checksByPerson.values()].flat();
  const find = (c: Check) => allChecks().find((x) => x.personId === c.personId && x.itemId === c.itemId)!;

  it('shows every category with its window and the default', async () => {
    const { el, input, row } = await open();
    expect(el().querySelectorAll('[data-category]').length).toBe(DEFAULT_CONFIG.categories.length);
    expect(input('sap-password').value).toBe('14');
    expect(row('sap-password').textContent).toContain('SAP password');
    expect(row('sap-password').textContent).toContain('Default');
    expect(el().querySelector('label[for="warn-tool"]')).not.toBeNull();
  });

  it('applies after a pause, and moves a check to expiring exactly at the boundary', async () => {
    const ready = allChecks().find(
      (c) => c.category === 'tool' && c.status === 'ready' && (c.daysRemaining ?? 0) > 30 && (c.daysRemaining ?? 0) < 400,
    )!;
    const days = ready.daysRemaining!;
    const { type, enter, pause, row } = await open();

    await type('tool', String(days - 1));
    expect(warningDays()['tool']).toBeUndefined();
    await pause();
    expect(warningDays()['tool']).toBe(days - 1);
    expect(find(ready).status).toBe('ready');

    await enter('tool', String(days));
    expect(find(ready).status).toBe('expiring');
    expect(row('tool').textContent).toContain('Default 30');
  });

  it('applies at once on Enter, and typing the default clears the override', async () => {
    const { type, enter, input, stable } = await open();
    await enter('training', '45');
    expect(warningDays()['training']).toBe(45);

    await type('training', '30');
    input('training').dispatchEvent(new Event('blur'));
    await stable();
    expect(warningDays()['training']).toBeUndefined();
  });

  it('Use default goes back to the config value', async () => {
    const { enter, row, input, stable } = await open();
    await enter('device', '3');
    row('device').querySelector<HTMLButtonElement>('button')!.click();
    await stable();
    expect(warningDays()['device']).toBeUndefined();
    expect(input('device').value).toBe('14');
    expect(row('device').querySelector('button')).toBeNull();
  });

  it('refuses values outside 0 to 3650 and changes nothing', async () => {
    const { enter, row, input } = await open();
    for (const bad of ['-1', '3651', '2.5', '']) {
      await enter('yubikey', bad);
      expect(warningDays()['yubikey']).toBeUndefined();
      expect(row('yubikey').textContent).toContain('Enter a whole number of days from 0 to 3650.');
      expect(input('yubikey').getAttribute('aria-invalid')).toBe('true');
    }
    await enter('yubikey', '0');
    expect(warningDays()['yubikey']).toBe(0);
    expect(input('yubikey').getAttribute('aria-invalid')).toBeNull();
  });
});
