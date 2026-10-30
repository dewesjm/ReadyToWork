import { InjectionToken, inject } from '@angular/core';
import {
  Clock,
  DataSource,
  DemoClock,
  LocalSettingsStore,
  MockDataSource,
  Settings,
  SettingsStore,
  createDefaultSettings,
} from '../../data';

/**
 * The seams to the outside world. Each defaults to the mockup's implementation; the real app
 * provides its own in app.config.ts and nothing else changes.
 */
export const DATA_SOURCE = new InjectionToken<DataSource>('DataSource', {
  providedIn: 'root',
  factory: () => new MockDataSource(),
});

/** Default settings (programs, assignments) for first load and reset. */
export const DEFAULT_SETTINGS = new InjectionToken<() => Settings>('DefaultSettings', {
  providedIn: 'root',
  factory: () => {
    const source = inject(DATA_SOURCE);
    if (!(source instanceof MockDataSource)) {
      throw new Error('Provide DEFAULT_SETTINGS when DATA_SOURCE is not the mock.');
    }
    return () => {
      const org = source.fakeOrg();
      return createDefaultSettings(org.programs, org.assignments);
    };
  },
});

export const SETTINGS_STORE = new InjectionToken<SettingsStore>('SettingsStore', {
  providedIn: 'root',
  factory: () => new LocalSettingsStore(inject(DEFAULT_SETTINGS)),
});

/** Where the real date comes from. The demo's date override lives in settings (ClockService). */
export const CLOCK = new InjectionToken<Clock>('Clock', {
  providedIn: 'root',
  factory: () => new DemoClock(),
});
