import { Component, computed, input } from '@angular/core';
import { STATUS_META, Status } from '../../../core';
import { Icon } from '../icon/icon';
import { badgeClass } from './status-classes';

/**
 * Status as color + icon + text. `compact` is the smaller size for tree rows; it keeps the text.
 * `iconOnly` hides the text visually (still read out, and shown as a tooltip) for tight tables.
 */
@Component({
  selector: 'rtw-status-badge',
  imports: [Icon],
  template: `
    <span
      class="badge gap-1 whitespace-nowrap"
      [class]="classes()"
      [attr.data-status]="status()"
      [attr.title]="iconOnly() ? meta().label : null"
    >
      <rtw-icon [name]="meta().icon" [class]="compact() || iconOnly() ? 'size-3' : 'size-4'" />
      @if (iconOnly()) {
        <span class="sr-only">{{ meta().label }}</span>
      } @else {
        {{ meta().label }}
      }
    </span>
  `,
})
export class StatusBadge {
  readonly status = input.required<Status>();
  readonly compact = input(false);
  readonly iconOnly = input(false);

  protected readonly meta = computed(() => STATUS_META[this.status()]);
  protected readonly classes = computed(
    () => `${badgeClass(this.status())} ${this.compact() || this.iconOnly() ? 'badge-sm' : ''}`,
  );
}
