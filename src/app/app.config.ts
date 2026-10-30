import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { ReadinessService } from './services/readiness-service';
import { SettingsService } from './services/settings-service';
import { ThemeService } from './services/theme-service';

/**
 * DATA_SOURCE, SETTINGS_STORE and CLOCK (services/tokens.ts) default to the mockup's
 * implementations. The real app provides its own here.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideAppInitializer(async () => {
      const settings = inject(SettingsService);
      const readiness = inject(ReadinessService);
      inject(ThemeService);
      await Promise.all([settings.load(), readiness.load()]);
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
