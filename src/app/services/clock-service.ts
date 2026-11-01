import { Injectable, computed, inject } from '@angular/core';
import { IsoDate } from '../../core';
import { CLOCK } from './tokens';

/** "Today" as a signal, from the clock. */
@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly clock = inject(CLOCK);

  readonly today = computed<IsoDate>(() => this.clock.today());
}
