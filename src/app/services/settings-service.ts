import { Injectable, computed, inject, signal } from '@angular/core';
import { Settings, exportSettings, importSettings } from '../../data';
import { DEFAULT_SETTINGS, SETTINGS_STORE } from './tokens';

/** Current settings as a signal. Every change is saved through the SettingsStore. */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly store = inject(SETTINGS_STORE);
  private readonly defaults = inject(DEFAULT_SETTINGS);
  private readonly current = signal<Settings>(this.defaults());

  readonly settings = this.current.asReadonly();
  readonly preferences = computed(() => this.current().preferences);

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

  async reset(): Promise<void> {
    this.current.set(await this.store.reset());
  }

  exportJson(): string {
    return exportSettings(this.current());
  }

  /** Replaces settings from an exported file. Throws SettingsError on a bad file. */
  importJson(text: string): void {
    const imported = importSettings(text, this.defaults());
    this.update(() => imported);
  }
}
