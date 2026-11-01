import { Component, input, model } from '@angular/core';
import { CategoryId, CategoryTile, STATUS_META } from '../../../core';
import { Icon } from '../../shared/icon/icon';
import { StatusBadge } from '../../shared/status/status-badge';

/**
 * One tile per category with its worst status. Clicking a tile filters the check list to it.
 * Columns follow the space available (container query), so the narrow panel gets two.
 */
@Component({
  selector: 'rtw-category-tiles',
  imports: [Icon, StatusBadge],
  template: `
    <div class="grid grid-cols-2 gap-2 @xl:grid-cols-4" role="group" aria-label="Filter checks by category">
      @for (t of tiles(); track t.category.id) {
        <button
          type="button"
          class="flex flex-col items-start gap-1 rounded-box border bg-base-100 p-2 text-left text-sm hover:bg-base-200 disabled:cursor-default disabled:hover:bg-base-100"
          [class]="t.status === null ? 'border-base-300 opacity-70' : selected() === t.category.id ? 'border-primary ring-2 ring-primary' : 'border-base-300'"
          [disabled]="t.status === null"
          [attr.aria-pressed]="t.status === null ? null : selected() === t.category.id"
          [attr.data-category]="t.category.id"
          (click)="toggle(t.category.id)"
        >
          <span class="flex items-center gap-1 font-medium">
            <rtw-icon [name]="t.category.icon" />
            {{ t.category.label }}
          </span>
          @if (t.status) {
            <rtw-status-badge [status]="t.status" [compact]="true" />
            <span class="text-xs opacity-80">{{ summary(t) }}</span>
          } @else {
            <span class="text-xs">Nothing tracked</span>
          }
        </button>
      }
    </div>
  `,
  host: { class: '@container block' },
})
export class CategoryTiles {
  readonly tiles = input.required<CategoryTile[]>();
  /** The category the check list is filtered to, or null for all. */
  readonly selected = model<CategoryId | null>(null);

  protected toggle(id: CategoryId): void {
    this.selected.set(this.selected() === id ? null : id);
  }

  /** "All 3 ready" or "2 of 5 not ready". */
  protected summary(t: CategoryTile): string {
    if (t.status === 'ready') return t.total === 1 ? '1 ready' : `All ${t.total} ready`;
    const n = t.counts[t.status!];
    return `${n} of ${t.total} ${STATUS_META[t.status!].label.toLowerCase()}`;
  }
}
