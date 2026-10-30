import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** Narrower than this, the dashboard layout opens people as full pages (no side panel). */
export const DASHBOARD_MIN_WIDTH_PX = 1024;

/** Whether the screen is wide enough for side-by-side layouts. Follows window resizes. */
@Injectable({ providedIn: 'root' })
export class ScreenService {
  readonly wide = signal(true);

  constructor() {
    // No matchMedia (tests, old browsers): treat the screen as wide.
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia(`(min-width: ${DASHBOARD_MIN_WIDTH_PX}px)`);
    this.wide.set(query.matches);
    const update = (e: MediaQueryListEvent) => this.wide.set(e.matches);
    query.addEventListener('change', update);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', update));
  }
}
