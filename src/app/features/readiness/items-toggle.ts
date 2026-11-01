import { Component, input, output } from '@angular/core';
import { CategoryIssue } from '../../../core';
import { Icon } from '../../shared/icon/icon';
import { CategoryChip } from '../../shared/status/category-chip';

/**
 * The button that opens a person's items under their row: their issue chips (or a label such
 * as "2 issues", or "Items" when there is nothing to show) and a chevron. Used by the tree, the
 * list table and the phone cards, only for people with issues; a click never reaches the row.
 */
@Component({
  selector: 'rtw-items-toggle',
  imports: [Icon, CategoryChip],
  template: `
    <button
      type="button"
      class="flex flex-wrap items-center gap-1 rounded-field px-1 text-left hover:bg-base-300 max-sm:min-h-11"
      data-testid="items-toggle"
      [attr.aria-expanded]="open()"
      (click)="toggle.emit(); $event.stopPropagation()"
    >
      <span class="sr-only">{{ open() ? 'Hide' : 'Show' }} items for {{ name() }}: </span>
      @if (label(); as text) {
        <span class="text-xs" data-testid="items-label">{{ text }}</span>
      } @else {
        @for (c of chips(); track c.category) {
          <rtw-category-chip [category]="c.category" [status]="c.status" />
        } @empty {
          <span class="text-xs opacity-70">Items</span>
        }
      }
      <rtw-icon [name]="open() ? 'chevron-down' : 'chevron-right'" class="size-3 opacity-70" />
    </button>
  `,
})
export class ItemsToggle {
  /** The person's name, for screen readers. */
  readonly name = input.required<string>();
  readonly open = input.required<boolean>();
  readonly chips = input<readonly CategoryIssue[]>([]);
  /** Shown instead of the chips when set. */
  readonly label = input<string | null>(null);
  readonly toggle = output<void>();
}
