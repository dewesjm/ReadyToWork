import { Component, ElementRef, inject, signal } from '@angular/core';
import { STATUSES } from '../../../core';
import { Icon } from '../icon/icon';
import { StatusBadge } from './status-badge';
import { STATUS_MEANING } from './status-classes';

/** "Legend" button that opens a small panel explaining the four statuses. */
@Component({
  selector: 'rtw-legend',
  imports: [Icon, StatusBadge],
  template: `
    <button
      type="button"
      class="btn btn-ghost btn-sm gap-1"
      [attr.aria-expanded]="open()"
      aria-controls="status-legend"
      (click)="open.set(!open())"
    >
      <rtw-icon name="info" />
      Legend
    </button>
    @if (open()) {
      <div
        id="status-legend"
        class="absolute right-0 z-40 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-box border border-base-300 bg-base-100 p-3 shadow-lg"
      >
        <dl class="space-y-2 text-sm">
          @for (s of statuses; track s) {
            <div>
              <dt><rtw-status-badge [status]="s" /></dt>
              <dd class="mt-0.5 opacity-80">{{ meaning[s] }}</dd>
            </div>
          }
        </dl>
      </div>
    }
  `,
  host: {
    class: 'relative',
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'open.set(false)',
  },
})
export class Legend {
  protected readonly statuses = STATUSES;
  protected readonly meaning = STATUS_MEANING;
  protected readonly open = signal(false);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }
}
