import { Component, computed, input } from '@angular/core';
import { Rollup, STATUSES, STATUS_META } from '../../../core';
import { Icon } from '../icon/icon';
import { textClass } from './status-classes';

/** "23 people: 2 not ready, 3 expiring, 18 ready". Zero counts are left out; the total never is. */
@Component({
  selector: 'rtw-rollup-badge',
  imports: [Icon],
  template: `
    <span class="inline-flex flex-wrap items-center gap-x-2 text-xs">
      <span class="font-medium">{{ peopleLabel() }}:</span>
      @for (p of parts(); track p.status; let last = $last) {
        <span class="inline-flex items-center gap-0.5 whitespace-nowrap" [attr.data-status]="p.status">
          <rtw-icon [name]="p.icon" class="size-3" [class]="p.color" />
          {{ p.count }} {{ p.label }}<span class="sr-only">{{ last ? '' : ',' }}</span>
        </span>
      }
    </span>
  `,
})
export class RollupBadge {
  readonly rollup = input.required<Rollup>();

  protected readonly peopleLabel = computed(() => {
    const n = this.rollup().total;
    return `${n} ${n === 1 ? 'person' : 'people'}`;
  });

  protected readonly parts = computed(() =>
    STATUSES.filter((s) => this.rollup().counts[s] > 0).map((s) => ({
      status: s,
      count: this.rollup().counts[s],
      label: STATUS_META[s].label.toLowerCase(),
      icon: STATUS_META[s].icon,
      color: textClass(s),
    })),
  );
}
