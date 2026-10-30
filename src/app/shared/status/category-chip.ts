import { Component, computed, input } from '@angular/core';
import { CategoryId, DEFAULT_CONFIG, STATUS_META, Status } from '../../../core';
import { Icon } from '../icon/icon';
import { badgeClass } from './status-classes';

/**
 * A category with its worst status: category icon and label, the status icon, and the status
 * text for screen readers and as a tooltip.
 */
@Component({
  selector: 'rtw-category-chip',
  imports: [Icon],
  template: `
    <span
      class="badge badge-sm gap-1 whitespace-nowrap"
      [class]="color()"
      [attr.title]="label() + ': ' + meta().label"
      [attr.data-category]="category()"
      [attr.data-status]="status()"
    >
      <rtw-icon [name]="icon()" class="size-3" />
      {{ label() }}
      <rtw-icon [name]="meta().icon" class="size-3" />
      <span class="sr-only">: {{ meta().label }}</span>
    </span>
  `,
})
export class CategoryChip {
  readonly category = input.required<CategoryId>();
  readonly status = input.required<Status>();

  private readonly config = computed(() =>
    DEFAULT_CONFIG.categories.find((c) => c.id === this.category()),
  );
  protected readonly label = computed(() => this.config()?.label ?? this.category());
  protected readonly icon = computed(() => this.config()?.icon ?? 'info');
  protected readonly meta = computed(() => STATUS_META[this.status()]);
  protected readonly color = computed(() => badgeClass(this.status()));
}
