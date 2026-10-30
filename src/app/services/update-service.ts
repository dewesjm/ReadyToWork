import { DOCUMENT, DestroyRef, Injectable, InjectionToken, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

/** Tunable values for new-version checks. */
export const UPDATE_CONFIG = {
  /** While the app is open, ask the server for a new version this often. */
  checkEveryMs: 15 * 60_000,
};

/** Reloads the page. A token so tests can watch it instead of reloading. */
export const RELOAD_PAGE = new InjectionToken<() => void>('RELOAD_PAGE', {
  providedIn: 'root',
  factory: () => {
    const document = inject(DOCUMENT);
    return () => document.location.reload();
  },
});

/**
 * Notices when a newer build of the app has been downloaded by the service worker, so the shell
 * can offer a refresh. Does nothing where the service worker is off (dev server, tests).
 */
@Injectable({ providedIn: 'root' })
export class UpdateService {
  /** A new version is ready; refreshing the page loads it. */
  readonly available = signal(false);
  /** The viewer chose "Later"; the prompt stays hidden until the next new version. */
  readonly dismissed = signal(false);

  private readonly reloadPage = inject(RELOAD_PAGE);

  constructor() {
    const sw = inject(SwUpdate, { optional: true });
    if (!sw?.isEnabled) return;

    const ready = sw.versionUpdates.subscribe((e) => {
      if (e.type !== 'VERSION_READY') return;
      this.available.set(true);
      this.dismissed.set(false);
    });
    // The cached app is broken (files gone from the server): only a reload fixes it.
    const broken = sw.unrecoverable.subscribe(() => {
      this.available.set(true);
      this.dismissed.set(false);
    });

    const check = () => sw.checkForUpdate().catch(() => undefined);
    const timer = setInterval(check, UPDATE_CONFIG.checkEveryMs);
    const document = inject(DOCUMENT);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);

    inject(DestroyRef).onDestroy(() => {
      ready.unsubscribe();
      broken.unsubscribe();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    });
  }

  refresh(): void {
    this.reloadPage();
  }

  dismiss(): void {
    this.dismissed.set(true);
  }
}
