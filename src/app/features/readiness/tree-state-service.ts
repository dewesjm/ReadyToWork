import { Injectable, signal } from '@angular/core';

/**
 * Tree expand state. Root-provided, so it survives opening a person and pressing Back. Choices
 * are remembered per query: a new filter starts from the defaults, and going back to an earlier
 * one restores what was opened there.
 */
@Injectable({ providedIn: 'root' })
export class TreeStateService {
  /** Expanded (true) or collapsed (false) by the user, per query key, per person id. */
  private readonly overrides = signal(new Map<string, ReadonlyMap<string, boolean>>());

  /** The user's choice for a row under this query, or undefined if they haven't made one. */
  choice(queryKey: string, id: string): boolean | undefined {
    return this.overrides().get(queryKey)?.get(id);
  }

  set(queryKey: string, ids: Iterable<string>, expanded: boolean): void {
    this.overrides.update((all) => {
      const next = new Map(all.get(queryKey));
      for (const id of ids) next.set(id, expanded);
      return new Map(all).set(queryKey, next);
    });
  }
}
