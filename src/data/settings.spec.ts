import { DEFAULT_CONFIG } from '../core';
import { DEFAULT_PROGRAMS } from './mock/fake-catalog';
import {
  Settings,
  SettingsError,
  createDefaultSettings,
  exportSettings,
  importSettings,
  parseSettings,
  readinessConfigFrom,
} from './settings';
import { LocalSettingsStore } from './settings-store';

const defaults = () => createDefaultSettings(DEFAULT_PROGRAMS, { p010: ['prog-crane'] });

function edited(): Settings {
  const s = defaults();
  s.programs[0].name = 'Renamed program';
  s.programs[0].requirements.push({ category: 'qualification', itemId: 'qual:forklift', itemName: 'Forklift' });
  s.assignments['p020'] = ['prog-export', 'prog-electrical'];
  s.warningDays['sap-password'] = 21;
  s.preferences = { ...s.preferences, theme: 'dracula', layout: 'drilldown', demoToday: '2026-12-01' };
  return s;
}

/** In-memory stand-in for localStorage. */
class FakeStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

describe('LocalSettingsStore', () => {
  it('returns defaults when nothing is saved', async () => {
    const store = new LocalSettingsStore(defaults, new FakeStorage());
    expect(await store.load()).toEqual(defaults());
  });

  it('round-trips settings through storage (survives a reload)', async () => {
    const storage = new FakeStorage();
    await new LocalSettingsStore(defaults, storage).save(edited());
    expect(await new LocalSettingsStore(defaults, storage).load()).toEqual(edited());
  });

  it('resets to defaults and forgets saved settings', async () => {
    const storage = new FakeStorage();
    const store = new LocalSettingsStore(defaults, storage);
    await store.save(edited());
    expect(await store.reset()).toEqual(defaults());
    expect(await new LocalSettingsStore(defaults, storage).load()).toEqual(defaults());
  });

  it('falls back to defaults when saved data is unreadable', async () => {
    const storage = new FakeStorage();
    storage.setItem('rtw.settings', '{not json');
    expect(await new LocalSettingsStore(defaults, storage).load()).toEqual(defaults());
  });

  it('keeps working in memory when storage is blocked', async () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const store = new LocalSettingsStore(defaults, blocked);
    await store.save(edited());
    expect(await store.load()).toEqual(edited());
  });

  it('does not let callers change the defaults by editing loaded settings', async () => {
    const store = new LocalSettingsStore(defaults, new FakeStorage());
    (await store.load()).programs[0].name = 'Changed';
    expect((await store.load()).programs[0].name).toBe(DEFAULT_PROGRAMS[0].name);
  });
});

describe('export and import', () => {
  it('round-trips through a settings file', () => {
    expect(importSettings(exportSettings(edited()), defaults())).toEqual(edited());
  });

  it('rejects files that are not settings, with a readable message', () => {
    const bad = (text: string, message: string) =>
      expect(() => importSettings(text, defaults())).toThrowError(new SettingsError(message));
    bad('not json', 'The file is not valid JSON.');
    bad('[1, 2]', 'Settings must be a JSON object.');
    bad('{"programs": []}', 'Settings are missing a schemaVersion number.');
    bad('{"schemaVersion": 99}', 'These settings are from a newer version (99); this app reads up to 1.');
    bad('{"schemaVersion": 1, "programs": [{"id": "x", "name": 5, "requirements": []}]}', 'programs[0].name must be text.');
    bad('{"schemaVersion": 1, "warningDays": {"tool": -5}}', 'warningDays.tool must be a whole number of days (0 to 3650).');
    bad('{"schemaVersion": 1, "preferences": {"layout": "sideways"}}', 'preferences.layout must be "dashboard" or "drilldown".');
    bad('{"schemaVersion": 1, "preferences": {"demoToday": "next week"}}', 'preferences.demoToday must be a date like 2026-10-30.');
  });

  it('fills missing sections and preferences from the defaults', () => {
    const s = importSettings('{"schemaVersion": 1, "preferences": {"theme": "nord"}}', defaults());
    expect(s.programs).toEqual(defaults().programs);
    expect(s.preferences).toEqual({ ...defaults().preferences, theme: 'nord' });
  });
});

describe('schema upgrades', () => {
  // Pretend version 2 renamed "warningDays" to "warningWindows".
  const v2Defaults = { ...defaults(), schemaVersion: 2 };
  const migrations = {
    1: (raw: Record<string, unknown>) => {
      const { warningDays, ...rest } = raw;
      return { ...rest, warningWindows: warningDays };
    },
  };

  it('upgrades settings saved by an older version', () => {
    const old = { schemaVersion: 1, warningDays: { tool: 10 } };
    const upgraded = parseSettings(old, v2Defaults, migrations, 2);
    expect(upgraded.schemaVersion).toBe(2);
  });

  it('refuses a version it has no upgrade for', () => {
    expect(() => parseSettings({ schemaVersion: 0 }, defaults())).toThrowError(
      "Can't upgrade settings from version 0.",
    );
  });
});

describe('readinessConfigFrom', () => {
  it('applies warning window overrides and leaves the rest alone', () => {
    const config = readinessConfigFrom(edited());
    const days = (id: string) => config.categories.find((c) => c.id === id)?.warningDays;
    expect(days('sap-password')).toBe(21);
    expect(days('tool')).toBe(DEFAULT_CONFIG.categories.find((c) => c.id === 'tool')?.warningDays);
  });
});
