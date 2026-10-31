import { Injectable, computed, inject, signal } from '@angular/core';
import { Settings, exportSettings, importSettings, resetAdminSettings } from '../../data';
import { DEFAULT_SETTINGS, SETTINGS_STORE } from './tokens';

/** Current settings as a signal. Every change is saved through the SettingsStore. */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly store = inject(SETTINGS_STORE);
  private readonly defaults = inject(DEFAULT_SETTINGS);
  private readonly current = signal<Settings>(this.defaults());

  readonly settings = this.current.asReadonly();
  readonly preferences = computed(() => this.current().preferences);
  /** Program names by id, for "Required by" and program badges. */
  readonly programNames = computed(
    () => new Map(this.current().programs.map((p) => [p.id, p.name])),
  );

  async load(): Promise<void> {
    this.current.set(await this.store.load());
  }

  update(change: (settings: Settings) => Settings): void {
    const next = change(this.current());
    this.current.set(next);
    void this.store.save(next);
  }

  updatePreferences(change: Partial<Settings['preferences']>): void {
    this.update((s) => ({ ...s, preferences: { ...s.preferences, ...change } }));
  }

  /** Everything back to defaults, preferences included. */
  async reset(): Promise<void> {
    this.current.set(await this.store.reset());
  }

  /** Programs, assignments, warning windows and announcements back to defaults; preferences are kept. */
  resetAdmin(): void {
    this.update((s) => resetAdminSettings(s, this.defaults()));
  }

  /** The settings file: admin settings only. */
  exportJson(): string {
    return exportSettings(this.current());
  }

  /**
   * Reads a settings file without applying it: the admin settings from the file with the current
   * preferences. Throws SettingsError on a bad file.
   */
  readFile(text: string): Settings {
    return importSettings(text, this.defaults(), this.current().preferences);
  }
}
