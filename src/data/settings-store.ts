import { Settings, parseSettings } from './settings';

/**
 * Loads and saves settings. The mockup keeps them in the browser; the real app swaps in an
 * API-backed store through dependency injection.
 */
export interface SettingsStore {
  load(): Promise<Settings>;
  save(settings: Settings): Promise<void>;
  /** Forgets saved settings and returns the defaults. */
  reset(): Promise<Settings>;
}

export const SETTINGS_STORAGE_KEY = 'rtw.settings';

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Settings in browser storage. If storage is blocked (private mode, policy) or the saved data is
 * unreadable, it falls back to defaults and keeps changes in memory for the visit.
 */
export class LocalSettingsStore implements SettingsStore {
  private memory: string | null = null;

  constructor(
    private readonly defaults: () => Settings,
    private readonly storage: KeyValueStorage | null = browserStorage(),
    private readonly key = SETTINGS_STORAGE_KEY,
  ) {}

  async load(): Promise<Settings> {
    const text = this.read();
    if (text === null) return this.defaults();
    try {
      return parseSettings(JSON.parse(text), this.defaults());
    } catch {
      return this.defaults();
    }
  }

  async save(settings: Settings): Promise<void> {
    const text = JSON.stringify(settings);
    this.memory = text;
    try {
      this.storage?.setItem(this.key, text);
    } catch {
      // Kept in memory only.
    }
  }

  async reset(): Promise<Settings> {
    this.memory = null;
    try {
      this.storage?.removeItem(this.key);
    } catch {
      // Nothing saved to remove.
    }
    return this.defaults();
  }

  private read(): string | null {
    try {
      return this.storage?.getItem(this.key) ?? this.memory;
    } catch {
      return this.memory;
    }
  }
}

function browserStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
