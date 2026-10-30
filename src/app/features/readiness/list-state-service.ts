import { Injectable, signal } from '@angular/core';
import { READINESS_PAGE_CONFIG } from './readiness-page-config';

/**
 * List view state that isn't in the URL: how many rows are showing (per query, so a new filter
 * starts from one page) and the row that opened a person (to put focus back after Back).
 * Root-provided, so both survive opening a person page.
 */
@Injectable({ providedIn: 'root' })
export class ListStateService {
  private readonly limits = signal(new Map<string, number>());
  /** Row key ("personId|itemId") of the last row that opened a person. */
  readonly focusedKey = signal<string | null>(null);

  limit(queryKey: string): number {
    return this.limits().get(queryKey) ?? READINESS_PAGE_CONFIG.listPageSize;
  }

  showMore(queryKey: string): void {
    const next = this.limit(queryKey) + READINESS_PAGE_CONFIG.listPageSize;
    this.limits.update((all) => new Map(all).set(queryKey, next));
  }
}
