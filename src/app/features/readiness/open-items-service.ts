import { Injectable, signal } from '@angular/core';

/**
 * Whose items are open in place under their row, in the tree and the list. Root-provided, so
 * they stay open when switching views or coming back from a person.
 */
@Injectable({ providedIn: 'root' })
export class OpenItemsService {
  private readonly open = signal<ReadonlySet<string>>(new Set());

  isOpen(personId: string): boolean {
    return this.open().has(personId);
  }

  toggle(personId: string): void {
    this.open.update((ids) => {
      const next = new Set(ids);
      if (!next.delete(personId)) next.add(personId);
      return next;
    });
  }
}
