import { DOCUMENT, Injectable, computed, effect, inject } from '@angular/core';
import { ALL_THEMES, DEFAULT_THEME } from '../shared/themes';
import { SettingsService } from './settings-service';

/** Current daisyUI theme, kept in settings and applied as `data-theme` on <html>. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly settings = inject(SettingsService);

  readonly theme = computed(() => {
    const saved = this.settings.preferences().theme;
    return isKnownTheme(saved) ? saved : DEFAULT_THEME;
  });

  constructor() {
    effect(() => this.document.documentElement.setAttribute('data-theme', this.theme()));
  }

  set(id: string): void {
    if (isKnownTheme(id)) this.settings.updatePreferences({ theme: id });
  }
}

function isKnownTheme(id: string): boolean {
  return ALL_THEMES.some((t) => t.id === id);
}
