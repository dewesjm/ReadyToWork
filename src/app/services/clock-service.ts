import { Injectable, computed, inject } from '@angular/core';
import { IsoDate, addDays } from '../../core';
import { SettingsService } from './settings-service';
import { CLOCK } from './tokens';

/**
 * "Today" as a signal: the presenter's override (kept in settings, so it survives a reload), or
 * the clock's real date.
 */
@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly clock = inject(CLOCK);
  private readonly settings = inject(SettingsService);

  readonly today = computed<IsoDate>(
    () => this.settings.preferences().demoToday ?? this.clock.today(),
  );
  readonly isOverridden = computed(() => this.settings.preferences().demoToday !== null);

  set(date: IsoDate | null): void {
    this.settings.updatePreferences({ demoToday: date });
  }

  advance(days: number): void {
    this.set(addDays(this.today(), days));
  }

  reset(): void {
    this.set(null);
  }
}
