import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { ALL_THEMES, DEFAULT_THEME, THEME_STORAGE_KEY } from '../shared/themes';

/**
 * Current daisyUI theme, applied as `data-theme` on <html> and remembered in browser storage.
 * TODO(M2): store through SettingsStore with the other demo preferences.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal(this.load());

  readonly theme = this.current.asReadonly();

  constructor() {
    this.apply(this.current());
  }

  set(id: string): void {
    if (!isKnownTheme(id)) return;
    this.current.set(id);
    this.apply(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // Storage blocked (private mode, policy): the theme still applies for this visit.
    }
  }

  private load(): string {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && isKnownTheme(saved)) return saved;
    } catch {
      // Fall through to the default.
    }
    return DEFAULT_THEME;
  }

  private apply(id: string): void {
    this.document.documentElement.setAttribute('data-theme', id);
  }
}

function isKnownTheme(id: string): boolean {
  return ALL_THEMES.some((t) => t.id === id);
}
