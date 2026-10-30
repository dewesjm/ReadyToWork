import { Injectable, computed, signal } from '@angular/core';
import { initials } from '../../core/names';

export interface Viewer {
  name: string;
  title: string;
}

/**
 * Who is "logged in". A fixed placeholder until the fake org (M2) and view-as (M7) exist.
 */
@Injectable({ providedIn: 'root' })
export class ViewerService {
  private readonly current = signal<Viewer>({ name: 'Demo Admin', title: 'Administrator' });

  readonly viewer = this.current.asReadonly();
  readonly initials = computed(() => initials(this.current().name));
}
